// Macht aus den Keyframes in data/animations.js zu jedem Zeitpunkt eine Haltung.
// Außerdem: Bewegungen aneinanderhängen (Kombis, Drills) und Auslage spiegeln.

import { Vector3, Quaternion } from '../../vendor/three.module.js';
import { quatAus, schulterMitte } from './skelett.js';

const GRAD = Math.PI / 180;
const HOCH = new Vector3(0, 1, 0);

// Übergangsarten zwischen zwei Keyframes
const UEBERGANG = {
  weich: (f) => f * f * (3 - 2 * f),      // sanft los, sanft an
  aus: (f) => 1 - (1 - f) ** 3,           // schnell los, bremst ab (Schlag schnellt raus)
  ein: (f) => f * f,                      // langsam los, wird schneller
  linear: (f) => f,
};

const mix = (a, b, f) => a + (b - a) * f;
const mixListe = (a, b, f) => a.map((x, i) => mix(x, b[i], f));

// Punkt [x, y, z] um die Hochachse drehen (positiv = nach links)
export function drehePunkt([x, y, z], grad) {
  const c = Math.cos(grad * GRAD);
  const s = Math.sin(grad * GRAD);
  return [x * c + z * s, y, -x * s + z * c];
}

// Sucht für einen Kanal die beiden Keyframes um den Zeitpunkt t.
// Vor dem ersten und nach dem letzten Keyframe gilt die Grundhaltung.
// { t, halt: true } bedeutet: bis hierhin bleibt alles, wie es gerade ist.
function abschnitt(spur, t, basis, dauer) {
  const keys = [{ t: 0, wert: basis }];
  for (const k of spur || []) {
    const { t: zeit, e, halt, ...rest } = k;
    const wert = halt ? keys.at(-1).wert : (Object.keys(rest).length ? { ...basis, ...rest } : basis);
    if (zeit <= 0) keys[0] = { t: 0, wert };
    else keys.push({ t: zeit, wert, e });
  }
  if (keys.at(-1).t < dauer) keys.push({ t: dauer, wert: basis });

  let i = 1;
  while (i < keys.length - 1 && keys[i].t < t) i++;
  const a = keys[i - 1];
  const b = keys[i];
  const roh = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 1;
  return { a: a.wert, b: b.wert, f: (UEBERGANG[b.e] || UEBERGANG.weich)(roh) };
}

// Hand-Ziel in Weltkoordinaten umrechnen.
//   raum 'kinn' : Deckung – bleibt vor dem Kinn, auch wenn sich der Oberkörper dreht
//   raum 'brust': dreht sich mit dem Oberkörper mit
//   raum 'stand': Punkt im Raum vor der Figur, wandert mit dem Becken mit (Schlagziel)
//   raum 'welt' : fester Punkt (Hand am Boden, an der Stange)
// blick = Richtung in Grad, in die die Figur gerade steht (nach einer Drehung auf dem Fußballen)
function handInWelt(hand, becken, brustQuat, S, blickQuat) {
  const pos = new Vector3(...hand.pos);
  const pol = new Vector3(...hand.pol);
  if (hand.raum === 'brust') {
    pos.applyQuaternion(brustQuat).add(S);
    pol.applyQuaternion(brustQuat);
  } else if (hand.raum === 'kinn') {
    pos.applyQuaternion(blickQuat).add(S);
    pol.applyQuaternion(blickQuat);
  } else if (hand.raum === 'stand') {
    const hoehe = pos.y;
    pos.applyQuaternion(blickQuat);
    pos.x += becken.pos.x;
    pos.z += becken.pos.z;
    pos.y = hoehe;
    pol.applyQuaternion(blickQuat);
  }
  return { pos, pol };
}

// Die Haltung zum Zeitpunkt t (Sekunden) – fertig für skelett.gelenke().
export function auswerten(clip, t) {
  const { basis, dauer, spuren } = clip;
  const teil = (kanal) => abschnitt(spuren[kanal], t, basis[kanal], dauer);

  let blick = 0;
  if (spuren.richtung) {
    const r = abschnitt(spuren.richtung, t, { grad: 0 }, dauer);
    blick = mix(r.a.grad, r.b.grad, r.f);
  }
  const blickQuat = new Quaternion().setFromAxisAngle(HOCH, blick * GRAD);

  const b = teil('becken');
  const becken = {
    pos: new Vector3(...mixListe(b.a.pos, b.b.pos, b.f)),
    quat: quatAus(mixListe(b.a.dreh, b.b.dreh, b.f)),
  };

  const r = teil('rumpf');
  const brustQuat = becken.quat.clone().multiply(quatAus(mixListe(r.a.dreh, r.b.dreh, r.f)));

  // Kopf: "frei" = schaut unabhängig vom Oberkörper in eine feste Richtung (zum Gegner)
  const k = teil('kopf');
  const kopfDreh = quatAus(mixListe(k.a.dreh, k.b.dreh, k.f));
  const kopfQuat = (k.b.frei ?? true) ? blickQuat.clone().multiply(kopfDreh) : brustQuat.clone().multiply(kopfDreh);

  const S = schulterMitte(becken.pos, becken.quat, brustQuat);
  const hand = {};
  const fuss = {};
  for (const seite of ['L', 'R']) {
    const h = teil('hand' + seite);
    const von = handInWelt(h.a, becken, brustQuat, S, blickQuat);
    const nach = handInWelt(h.b, becken, brustQuat, S, blickQuat);
    hand[seite] = {
      pos: von.pos.lerp(nach.pos, h.f),
      pol: von.pol.lerp(nach.pol, h.f),
      faust: mix(h.a.faust || 0, h.b.faust || 0, h.f),
    };

    const f = teil('fuss' + seite);
    fuss[seite] = {
      pos: new Vector3(...mixListe(f.a.pos, f.b.pos, f.f)),
      yaw: mix(f.a.yaw, f.b.yaw, f.f),
      ferse: mix(f.a.ferse, f.b.ferse, f.f),
      knie: f.a.knie && f.b.knie ? new Vector3(...mixListe(f.a.knie, f.b.knie, f.f)) : null,
    };
  }
  return { becken, brustQuat, kopfQuat, hand, fuss };
}

// Auslage spiegeln (für Rechtsausleger): links und rechts tauschen.
const spiegelPunkt = (v) => { v.x = -v.x; return v; };
const spiegelQuat = (q) => { q.y = -q.y; q.z = -q.z; return q; };

export function spiegeln(h) {
  const hand = (x) => ({ pos: spiegelPunkt(x.pos), pol: spiegelPunkt(x.pol), faust: x.faust });
  const fuss = (x) => ({ pos: spiegelPunkt(x.pos), yaw: -x.yaw, ferse: x.ferse, knie: x.knie ? spiegelPunkt(x.knie) : null });
  return {
    becken: { pos: spiegelPunkt(h.becken.pos), quat: spiegelQuat(h.becken.quat) },
    brustQuat: spiegelQuat(h.brustQuat),
    kopfQuat: spiegelQuat(h.kopfQuat),
    hand: { L: hand(h.hand.R), R: hand(h.hand.L) },
    fuss: { L: fuss(h.fuss.R), R: fuss(h.fuss.L) },
  };
}

// Mehrere Bewegungen hintereinander zu einer machen (Kombi, Drill).
//
// Jede Bewegung nennt mit "weiter" den Zeitpunkt, ab dem die nächste starten darf –
// meist kurz nach dem Treffer. Die nächste übernimmt dann Körper und Hand aus der
// Lage, in der sie gerade sind: So lädt z. B. der Cross den Haken auf.
//
// Bewegungen können die Figur versetzen ("versatz": Schritt) oder drehen ("dreht":
// Drehung auf dem Fußballen). Alles, was danach kommt, passiert am neuen Ort in der
// neuen Richtung. Bleibt am Ende ein Versatz übrig, geht die Figur von selbst zurück.
//
//   start        [x, z] – wo die Figur am Anfang steht
//   pauseAmEnde  Sekunden Ruhe vor der Wiederholung
//   zurueck      (dx, dz) => Bewegung für den Rückweg
export function zusammensetzen(clips, { start = [0, 0], pauseAmEnde = 0.6, zurueck = null } = {}) {
  const vorlage = clips[0].basis;
  const ort = { x: start[0], z: start[1], grad: 0 };
  const anOrt = (pos) => { const p = drehePunkt(pos, ort.grad); return [p[0] + ort.x, p[1], p[2] + ort.z]; };

  // Grundhaltung am Startort
  const basis = {
    ...vorlage,
    becken: { ...vorlage.becken, pos: anOrt(vorlage.becken.pos) },
    fussL: { ...vorlage.fussL, pos: anOrt(vorlage.fussL.pos) },
    fussR: { ...vorlage.fussR, pos: anOrt(vorlage.fussR.pos) },
  };

  const spuren = {};
  let beginn = 0;
  let ende = 0;
  let gedreht = false;

  const anhaengen = (clip) => {
    for (const [kanal, keys] of Object.entries(clip.spuren)) {
      const liste = (spuren[kanal] ??= []);
      // Was die vorige Bewegung in diesem Kanal noch vorhatte, entfällt.
      while (liste.length && liste.at(-1).t > beginn + 1e-6) liste.pop();
      for (const k of keys) {
        const { t, e, halt, ...rest } = k;
        if (halt) { liste.push({ t: t + beginn, halt: true }); continue; }
        let wert = rest;
        // Becken und Füße: an den aktuellen Ort und in die aktuelle Richtung bringen
        if (kanal === 'becken') {
          const voll = { ...vorlage.becken, ...rest };
          wert = { ...voll, pos: anOrt(voll.pos), dreh: [voll.dreh[0] + ort.grad, voll.dreh[1], voll.dreh[2]] };
        } else if (kanal === 'fussL' || kanal === 'fussR') {
          const voll = { ...vorlage[kanal], ...rest };
          wert = { ...voll, pos: anOrt(voll.pos), yaw: voll.yaw + ort.grad };
          if (voll.knie) wert.knie = drehePunkt(voll.knie, ort.grad);
        }
        liste.push({ ...wert, t: t + beginn, ...(e ? { e } : {}) });
      }
    }
    if (clip.dreht) {
      gedreht = true;
      const [von, bis] = clip.drehtZeit || [0.05, 0.35];
      const liste = (spuren.richtung ??= []);
      liste.push({ t: beginn + von, grad: ort.grad }, { t: beginn + bis, grad: ort.grad + clip.dreht });
    }
    if (clip.versatz) {
      const v = drehePunkt([clip.versatz[0], 0, clip.versatz[1]], ort.grad);
      ort.x += v[0];
      ort.z += v[2];
    }
    if (clip.dreht) ort.grad += clip.dreht;
    ende = Math.max(ende, beginn + clip.dauer);
    beginn += clip.weiter ?? clip.dauer;
  };

  clips.forEach(anhaengen);

  // Rückweg, falls die Figur nicht mehr am Start steht (nur ohne Drehung möglich)
  const dx = start[0] - ort.x;
  const dz = start[1] - ort.z;
  if (zurueck && Math.abs(ort.grad) < 0.5 && Math.hypot(dx, dz) > 0.01) {
    beginn = ende + 0.3;
    const schritte = Math.ceil(Math.hypot(dx, dz) / 0.25);
    for (let i = 0; i < schritte; i++) anhaengen(zurueck(dx / schritte, dz / schritte));
  }
  // Die Richtung bleibt bis zum Schluss stehen (kein Zurückdrehen der Hände im Leerlauf)
  if (gedreht) spuren.richtung.push({ t: ende + pauseAmEnde, grad: ort.grad });

  return { basis, dauer: ende + pauseAmEnde, spuren };
}

// Alle Stellen, an denen ein Fuß am Boden steht – für die Fußabdrücke in der Draufsicht.
export function fussabdruecke(clip) {
  const liste = [];
  for (const seite of ['L', 'R']) {
    const basis = clip.basis['fuss' + seite];
    const werte = [basis, ...(clip.spuren['fuss' + seite] || [])
      .filter((k) => k.pos && !k.halt)
      .map((k) => ({ ...basis, ...k }))];
    for (const w of werte) {
      if (w.pos[1] > 0.005) continue; // Fuß in der Luft
      const schonDa = liste.some((a) => a.seite === seite
        && Math.hypot(a.pos[0] - w.pos[0], a.pos[2] - w.pos[2]) < 0.02);
      if (!schonDa) liste.push({ seite, pos: w.pos, yaw: w.yaw });
    }
  }
  return liste;
}
