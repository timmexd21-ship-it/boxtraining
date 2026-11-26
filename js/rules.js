// ALLE REGELN DES PLANS an einer Stelle. Keine KI, nur feste Regeln.
// Diese Datei rechnet nur; sie speichert nichts und zeigt nichts an.
//
// Inhalt:
//   1. Stellschrauben (Zahlen, die du ändern kannst)
//   2. Woche und Block aus dem Datum
//   3. Kombi der Woche
//   4. Schwerpunkt aus Ziel-Gewichtung und Test
//   5. Ersatz bei Beschwerden und fehlendem Gerät
//   6. Eine Einheit bauen
//   7. Anpassung nach dem Training
//
// Die Inhalte selbst (Übungen, Einheiten, Block) stehen in js/data/.

import { EINHEITEN, PAUSE_ZWISCHEN_RUNDEN } from './data/einheiten.js';
import { BLOCK, TEST } from './data/block.js';
import { KOMBIS } from './data/kombis.js';
import { UEBUNGEN, SEIL } from './data/uebungen.js';
import { BEINARBEIT, ABWEHR, SACK_RUNDEN, SCHATTEN_ZIELE, SCHATTEN_ZIEL_KRAFT } from './data/drills.js';
import { REGIONEN } from './data/ersatz.js';

// ------------------------------------------------------------------
// 1. Stellschrauben
// ------------------------------------------------------------------

// Ab diesem Anteil (Prozent) gilt ein Ziel als Schwerpunkt und bekommt mehr Umfang.
export const SCHWERPUNKT_AB = 40;

// Was der Schwerpunkt aus der Ziel-Gewichtung bewirkt (Vorschlag von Claude):
// in welcher Einheit welcher Block wie viel dazubekommt.
export const ZIEL_ZUSCHLAG = {
  technik: { einheit: 'C', block: 'technik_sack', feld: 'runden', plus: 1 },
  schlagkraft: { einheit: 'A', block: 'power', feld: 'runden', plus: 2 },
  ausdauer: { einheit: 'B', block: 'sack_runden', feld: 'runden', plus: 1 },
};

// Was der schwächste Testbereich bewirkt ("etwas mehr Volumen", Vorschlag von Claude).
// Gilt erst ab dem zweiten Test: schwach ist der Bereich, der sich am wenigsten verbessert hat.
export const SCHWACH_ZUSCHLAG = {
  kraftausdauer: { einheit: 'C', block: 'kraftausdauer', feld: 'durchgaenge', plus: 1 },
  schlagkraft: { einheit: 'A', block: 'zirkel', feld: 'durchgaenge', plus: 1 },
  ausdauer: { einheit: 'B', block: 'seil_intervalle', feld: 'runden', plus: 2 },
};

// Worauf die Anpassung nach dem Training wirkt (Regeln 5.7: +1 Runde / +1 Durchgang / −10 Sek. Pause)
export const ANPASSUNG_ZIEL = {
  A: { runden: 'power', durchgaenge: 'zirkel', pause: 'zirkel' },
  B: { runden: 'sack_runden', durchgaenge: 'seil_intervalle', pause: 'sack_runden' },
  C: { runden: 'technik_sack', durchgaenge: 'kraftausdauer', pause: 'technik_sack' },
};
export const PAUSE_MINDESTENS = 20;      // kürzer wird keine Pause
export const HOECHSTENS_DAZU = 3;        // mehr als +3 Runden/Durchgänge kommt nie zusammen

// 30er-Version: fällt der letzte Block weg, wenn sie länger wird als 30 + so viele Minuten
export const ZEIT_TOLERANZ_MIN = 2;

// Nach hartem Sparring: am Montag nur diese Blöcke der Einheit C (Seil, Beinarbeit, Schattenboxen)
export const NACH_HARTEM_SPARRING = ['aufwaermen', 'beinarbeit', 'schatten'];

// Fehlt ein Gerät, wird so getauscht. null = Übung entfällt in diesem Block.
export const OHNE_GERAET = {
  explosiv_klimmzug: 'ausfallschritt_sprung',
  klimmzug: null,
  dips: null,
  grundsprung: 'hampelmann',
  boxer_skip: 'hampelmann',
  kniehebelauf: 'hampelmann',
  doppelsprung: 'hampelmann',
};

// ------------------------------------------------------------------
// 2. Woche und Block aus dem Datum
// ------------------------------------------------------------------

const TAG_MS = 24 * 60 * 60 * 1000;

// Montag 0 Uhr der Woche, in der das Datum liegt
export function montagVon(datum) {
  const d = new Date(datum);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Der wievielte Block und die wievielte Woche darin? Block 1, Woche 1 beginnt am Start-Montag.
export function wocheImBlock(blockStart, jetzt = new Date()) {
  const tage = Math.max(0, Math.round((montagVon(jetzt) - montagVon(blockStart)) / TAG_MS));
  const wochen = Math.floor(tage / 7);
  return { block: Math.floor(wochen / 4) + 1, woche: (wochen % 4) + 1 };
}

// ------------------------------------------------------------------
// 3. Kombi der Woche
// ------------------------------------------------------------------

// Block 1: wie im Auftrag. Ab Block 2: Kombis aus der nächsten Stufe (Block 2 = Stufe 2,
// ab Block 3 = Stufe 3), die noch nicht dran waren. Woche 4 wiederholt die drei der Wochen 1–3.
export function kombisDerWoche(block, woche) {
  if (block <= 1) return BLOCK[woche - 1].kombis;
  const schonDran = new Set(BLOCK.flatMap((w) => w.kombis));
  const stufe = Math.min(3, block);
  const auswahl = KOMBIS.filter((k) => k.stufe === stufe && !schonDran.has(k.text)).map((k) => k.text);
  const versatz = Math.max(0, block - 3) * 3;
  const drei = [0, 1, 2].map((i) => auswahl[(versatz + i) % auswahl.length]);
  return woche === 4 ? drei : [drei[woche - 1]];
}

// Höchste Stufe, die bei der Kombi-Ansage im Training dran ist
export function ansageStufe(block) {
  return Math.min(3, block);
}

// ------------------------------------------------------------------
// 4. Schwerpunkt aus Ziel-Gewichtung und Test
// ------------------------------------------------------------------

// Das Ziel mit dem größten Anteil, wenn es mindestens SCHWERPUNKT_AB Prozent hat
export function zielSchwerpunkt(ziele) {
  const summe = ziele.technik + ziele.schlagkraft + ziele.ausdauer;
  if (!summe) return null;
  const [name, wert] = Object.entries(ziele).sort((a, b) => b[1] - a[1])[0];
  return (wert / summe) * 100 >= SCHWERPUNKT_AB ? name : null;
}

// Der Bereich, der sich vom vorletzten zum letzten Test am wenigsten verbessert hat.
// Mit nur einem Test gibt es keinen Vergleich -> null.
export function schwaechsterBereich(tests) {
  if (!tests || tests.length < 2) return null;
  const neu = tests[tests.length - 1].werte;
  const alt = tests[tests.length - 2].werte;
  const proBereich = {};
  for (const t of TEST) {
    if (!(t.id in neu) || !alt[t.id]) continue;
    (proBereich[t.bereich] ??= []).push(neu[t.id] / alt[t.id] - 1);
  }
  const mittel = Object.entries(proBereich).map(([b, liste]) => [b, liste.reduce((s, x) => s + x, 0) / liste.length]);
  if (mittel.length < 2) return null;
  return mittel.sort((a, b) => a[1] - b[1])[0][0];
}

// ------------------------------------------------------------------
// 5. Ersatz bei Beschwerden und fehlendem Gerät
// ------------------------------------------------------------------

// Folgt der Ersatz-Tabelle, bis eine Übung übrig bleibt, die keine der Regionen belastet.
// null = es gibt nichts Passendes.
export function ersatzFuer(id, regionen = []) {
  let aktuell = id;
  const gesehen = new Set([id]);
  for (;;) {
    const treffer = regionen.map((r) => REGIONEN[r]?.ersatz[aktuell]).find(Boolean);
    if (!treffer) return aktuell;
    if (gesehen.has(treffer)) return null;
    gesehen.add(treffer);
    aktuell = treffer;
  }
}

const NAMEN = { schattenboxen: { name: 'Schattenboxen', hinweise: ['Locker bleiben', 'Hände am Kinn', 'Auf den Füßen bleiben'] } };
const eintrag = (id) => UEBUNGEN[id] || SEIL[id] || NAMEN[id];

// Wählt für eine Übung das, was mit Gerät und Beschwerden wirklich geht.
// -> { id, name, hinweise, statt } oder null (entfällt). statt = Name der ursprünglichen Übung.
function uebungWaehlen(id, lage) {
  let wahl = id;
  const geraet = eintrag(wahl)?.geraet;
  if (geraet && !lage.ausruestung.includes(geraet)) {
    wahl = OHNE_GERAET[wahl];
    if (!wahl) return null;
  }
  wahl = ersatzFuer(wahl, lage.regionen);
  if (!wahl) return null;
  const e = eintrag(wahl);
  return { id: wahl, name: e.name, hinweise: e.hinweise, statt: wahl === id ? null : eintrag(id).name };
}

// ------------------------------------------------------------------
// 6. Eine Einheit bauen
// ------------------------------------------------------------------

// Welche Wochen-Änderungen aus block.js gelten? Woche 2 und 3 bauen aufeinander auf,
// und jeder abgeschlossene Block bringt seine Woche 3 als neue Basis mit.
function wochenAenderungen(kurz, block, woche) {
  const liste = [];
  for (let b = 1; b < block; b++) liste.push(BLOCK[1][kurz], BLOCK[2][kurz]);
  if (woche >= 2 && woche <= 3) liste.push(BLOCK[1][kurz]);
  if (woche === 3) liste.push(BLOCK[2][kurz]);
  if (woche === 4) liste.push(BLOCK[3][kurz]);
  return liste;
}

const rundeAuf = (x) => Math.max(1, Math.ceil(x));
const mehrzahl = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
const alsDauer = (sek) => (sek % 60 === 0 ? `${sek / 60} Min` : `${sek} Sek.`);

// Baut die Einheit für heute.
//   kurz        'A' | 'B' | 'C'
//   profil      aus dem Onboarding
//   tests       alle gespeicherten Tests (ältester zuerst)
//   block,woche aus wocheImBlock()
//   platt       "heute platt" oder Schichtmüdigkeit 4–5: 30er-Version, Power halbiert, Technik bleibt
//   nurLeicht   nach hartem Sparring: nur Seil, Beinarbeit, Schattenboxen
//   anpassung   { runden, durchgaenge, pauseSek } aus den Einträgen nach dem Training
// -> { kurz, name, dauer, block, woche, wochenName, kombis, test, bloecke: [...], minuten, hinweise: [...] }
export function einheitBauen({ kurz, profil, tests = [], block = 1, woche = 1, platt = false, nurLeicht = false, anpassung = {} }) {
  const vorlage = EINHEITEN[kurz];
  const dauer = platt ? 30 : profil.dauer;
  const kombis = kombisDerWoche(block, woche);
  const lage = { ausruestung: profil.ausruestung, regionen: profil.beschwerden?.regionen || [] };
  const ohneSack = !lage.ausruestung.includes('sack');
  const letzterTest = tests.length ? tests[tests.length - 1].werte : {};
  const hinweise = [];

  const aenderungen = wochenAenderungen(kurz, block, woche);
  const kopf = { kurz, name: vorlage.name, dauer, block, woche, wochenName: BLOCK[woche - 1].name, kombis, platt, nurLeicht };
  if (aenderungen.some((a) => a.test)) return { ...kopf, test: true, bloecke: [], minuten: 0, hinweise };

  // Zuschläge sammeln: wie viel kommt bei welchem Block auf welches Feld dazu?
  const dazu = {};   // 'power.runden' -> Zahl
  const fest = {};   // 'power.arbeitSek' -> Zahl
  const plus = (blockId, feld, n) => { dazu[`${blockId}.${feld}`] = (dazu[`${blockId}.${feld}`] || 0) + n; };
  let slipMitKonter = false;
  let rundenFaktor = 1;
  for (const a of aenderungen) {
    if (a.zirkelDurchgaenge) plus('zirkel', 'durchgaenge', a.zirkelDurchgaenge);
    if (a.sackRunden) plus('sack_runden', 'runden', a.sackRunden);
    if (a.beinarbeitDrills) plus('beinarbeit', 'runden', a.beinarbeitDrills);
    if (a.powerSek) fest['power.arbeitSek'] = a.powerSek;
    if (a.pauseSek) fest['sack_runden.pauseSek'] = a.pauseSek;
    if (a.slipSeilMitKonter) slipMitKonter = true;
    if (a.rundenFaktor) rundenFaktor = a.rundenFaktor;
  }
  if (woche !== 4) {
    const ziel = ZIEL_ZUSCHLAG[zielSchwerpunkt(profil.ziele)];
    if (ziel?.einheit === kurz) plus(ziel.block, ziel.feld, ziel.plus);
    const schwach = SCHWACH_ZUSCHLAG[schwaechsterBereich(tests)];
    if (schwach?.einheit === kurz) plus(schwach.block, schwach.feld, schwach.plus);
    const ziele = ANPASSUNG_ZIEL[kurz];
    if (anpassung.runden) plus(ziele.runden, 'runden', anpassung.runden);
    if (anpassung.durchgaenge) plus(ziele.durchgaenge, ziele.durchgaenge === 'seil_intervalle' ? 'runden' : 'durchgaenge', anpassung.durchgaenge);
  }
  const mitDazu = (b, feld, wert) => {
    const zusatz = Math.max(-HOECHSTENS_DAZU, Math.min(HOECHSTENS_DAZU, dazu[`${b.id}.${feld}`] || 0));
    return Math.max(1, wert + zusatz);
  };
  const pauseVon = (b, vorgabe) => {
    let pause = fest[`${b.id}.pauseSek`] ?? vorgabe;
    if (woche !== 4 && anpassung.pauseSek && ANPASSUNG_ZIEL[kurz].pause === b.id) pause += anpassung.pauseSek;
    return Math.max(PAUSE_MINDESTENS, pause);
  };

  let bloecke = [];
  for (const b of vorlage.bloecke) {
    if (nurLeicht && !NACH_HARTEM_SPARRING.includes(b.id)) continue;
    const fertig = blockBauen(b);
    if (fertig) bloecke.push(fertig);
  }

  // Regel: Passt die 30er-Version zeitlich nicht, fällt der letzte Block weg.
  let minuten = bloecke.reduce((s, b) => s + b.minuten, 0);
  if (dauer === 30 && minuten > 30 + ZEIT_TOLERANZ_MIN && bloecke.length > 1) {
    const weg = bloecke.pop();
    hinweise.push(`„${weg.name}“ fällt heute weg, damit die Einheit in 30 Minuten passt.`);
    minuten -= weg.minuten;
  }
  if (platt) hinweise.push('Heute platt: 30 Minuten, Power-Runden halbiert, Technik bleibt.');
  if (nurLeicht) hinweise.push('Nach hartem Sparring: nur Seil, Beinarbeit und Schattenboxen.');
  if (vorlage.merksatz) hinweise.push(vorlage.merksatz);

  return { ...kopf, test: false, bloecke, minuten: Math.round(minuten), hinweise };

  // ---- ein Block ----
  function blockBauen(b) {
    const aus = { id: b.id, name: b.name, art: b.art, text: b.text || '', liste: [], hinweise: [], animationen: [], timer: null, power: !!b.power };
    const zeige = (clip, name) => { if (clip && !aus.animationen.some((a) => a.clip === clip)) aus.animationen.push({ clip, name }); };
    const getauscht = (u) => { if (u.statt) hinweise.push(`${u.name} statt ${u.statt}.`); };

    if (b.art === 'zeit') {
      const min = b.min[dauer];
      if (!min) return null;
      aus.menge = `${min} Min`;
      aus.minuten = min;
      if (b.seil) {
        const seil = uebungWaehlen(b.seil, lage);
        if (seil) {
          getauscht(seil);
          if (seil.statt) aus.text = `${seil.name} locker, dann dein eigenes Aufwärmen`;
          aus.hinweise = seil.hinweise;
          zeige(seil.id, seil.name);
        }
      } else if (b.uebungen) {
        const liste = b.uebungen.map((id) => uebungWaehlen(id, lage)).filter(Boolean);
        liste.forEach(getauscht);
        const einmalig = liste.filter((u, i) => liste.findIndex((x) => x.id === u.id) === i);
        aus.liste = einmalig.map((u) => u.name);
        aus.text = einmalig.length > 1 ? 'Im Wechsel' : '';
        aus.hinweise = einmalig[0]?.hinweise || [];
        einmalig.forEach((u) => zeige(u.id, u.name));
      } else {
        aus.text = 'Nach deinem eigenen Ablauf.';
      }
      aus.timer = { rundeSek: min * 60, pauseSek: 0, runden: 1, titel: b.name, ansage: false };
      return aus;
    }

    if (b.art === 'amrap') {
      const min = b.min[dauer];
      if (!min) return null;
      const u = uebungWaehlen(b.uebung, lage);
      if (!u) return null;
      getauscht(u);
      aus.menge = `${min} Min`;
      aus.minuten = min;
      aus.text = `${u.name} so viele wie möglich`;
      aus.hinweise = u.hinweise;
      zeige(u.id, u.name);
      aus.timer = { rundeSek: min * 60, pauseSek: 0, runden: 1, titel: b.name, ansage: false };
      return aus;
    }

    if (b.art === 'zirkel') {
      if (!b.durchgaenge[dauer]) return null;
      const n = mitDazu(b, 'durchgaenge', b.durchgaenge[dauer]);
      const pause = pauseVon(b, b.pauseSek);
      const liste = b.uebungen.map((u) => ({ wdh: u.wdh, u: uebungWaehlen(u.id, lage) })).filter((x) => x.u);
      if (!liste.length) return null;
      liste.forEach((x) => { getauscht(x.u); zeige(x.u.id, x.u.name); });
      aus.menge = mehrzahl(n, 'Durchgang', 'Durchgänge');
      aus.liste = liste.map((x) => `${x.wdh} ${x.u.name}`);
      aus.text = `Nach jedem Durchgang ${pause} Sek. Pause`;
      aus.hinweise = ['Jede Wiederholung mit voller Geschwindigkeit', 'Wird es langsam: aufhören, nicht durchquälen'];
      aus.minuten = (n * (60 + pause)) / 60;
      aus.timer = { rundeSek: pause, pauseSek: 0, runden: 1, titel: 'Pause', alsPause: true, ansage: false, knopf: `Pause starten (${pause} Sek.)` };
      return aus;
    }

    if (b.art === 'saetze') {
      if (!b.durchgaenge[dauer]) return null;
      const n = mitDazu(b, 'durchgaenge', b.durchgaenge[dauer]);
      const liste = b.uebungen.map((id) => ({ ursprung: id, u: uebungWaehlen(id, lage) })).filter((x) => x.u);
      if (!liste.length) return null;
      aus.menge = mehrzahl(n, 'Durchgang', 'Durchgänge');
      aus.liste = liste.map((x) => {
        getauscht(x.u);
        zeige(x.u.id, x.u.name);
        const max = letzterTest[x.u.id];
        return max ? `${rundeAuf(max * b.anteil)} ${x.u.name}` : `${x.u.name}: ca. ${Math.round(b.anteil * 100)} % von deinem Maximum`;
      });
      aus.text = Object.keys(letzterTest).length ? `${Math.round(b.anteil * 100)} % von deinem Testwert` : 'Ohne Test geschätzt. Mach den Test, dann stehen hier Zahlen.';
      aus.hinweise = liste[0].u.hinweise;
      aus.minuten = n * 4;
      return aus;
    }

    if (b.art === 'intervall') {
      if (!b.runden[dauer]) return null;
      let n = mitDazu(b, 'runden', b.runden[dauer]);
      if (platt && b.power) n = rundeAuf(n / 2);
      const arbeit = fest[`${b.id}.arbeitSek`] ?? b.arbeitSek;
      const pause = pauseVon(b, b.pauseSek);
      aus.menge = `${n} × ${arbeit} Sek.`;
      aus.minuten = (n * (arbeit + pause)) / 60;
      aus.text = `${b.text}. ${pause} Sek. Pause.`;
      if (b.seil) {
        const seil = uebungWaehlen(b.seil, lage);
        if (!seil) return null;
        getauscht(seil);
        if (seil.statt) aus.text = `${arbeit} Sek. ${seil.name} schnell, ${pause} Sek. locker.`;
        aus.hinweise = seil.hinweise;
        zeige(seil.id, seil.name);
      } else if (b.sack) {
        let typ = b.sack;
        const getauschtGegen = b.power ? ersatzFuer('sack_power', lage.regionen) : 'sack_power';
        if (b.power && getauschtGegen !== 'sack_power') {
          typ = 'technik';
          aus.text = getauschtGegen === 'schattenboxen'
            ? `Schattenboxen statt Sack, locker. ${pause} Sek. Pause.` : `2er-Kombis mit 60–70 % statt voller Kraft. ${pause} Sek. Pause.`;
          aus.power = false;
          hinweise.push('Power-Runden heute entschärft (Beschwerden).');
        }
        if (ohneSack) aus.text = `Ohne Sack: als Schattenboxen. ${aus.text}`;
        aus.hinweise = SACK_RUNDEN[typ].hinweise;
        zeige('1-2', 'Kombi 1-2');
      }
      aus.timer = { rundeSek: arbeit, pauseSek: pause, runden: n, ansage: false };
      return aus;
    }

    if (b.art === 'runden') {
      if (!b.runden[dauer]) return null;
      let n = mitDazu(b, 'runden', b.runden[dauer]);
      if (b.id === 'sack_runden') n = rundeAuf(n * rundenFaktor);
      const pause = pauseVon(b, b.pauseSek ?? PAUSE_ZWISCHEN_RUNDEN);
      aus.menge = `${n} × ${alsDauer(b.rundeSek)}`;
      aus.minuten = (n * b.rundeSek + (n - 1) * pause) / 60;
      aus.timer = { rundeSek: b.rundeSek, pauseSek: pause, runden: n, ansage: false };
      const jeRunde = (texte) => { aus.liste = n > 1 ? texte.map((t, i) => `Runde ${i + 1}: ${t}`) : texte; };

      if (b.ziel) {                                   // Schattenboxen
        const ziele = Array.from({ length: n }, (_, i) => (b.ziel === 'kraft' ? SCHATTEN_ZIEL_KRAFT : SCHATTEN_ZIELE[(i + woche + block) % SCHATTEN_ZIELE.length]));
        if (b.ziel === 'kraft') aus.liste = [`Ziel: ${SCHATTEN_ZIEL_KRAFT}`];
        else jeRunde(ziele);
        aus.text = b.kombiDerWoche ? `Kombi der Woche: ${kombis.join(' und ')}` : '';
        aus.hinweise = ['Jede Runde hat ein Ziel', 'Neue Kombi erst hier sauber, dann am Sack'];
        kombis.forEach((k) => zeige(k, `Kombi ${k}`));
        if (b.ziel === 'kraft') { zeige('cross', 'Cross'); zeige('haken', 'Haken'); }
      } else if (b.drills === 'beinarbeit') {
        const moeglich = Object.entries(BEINARBEIT).filter(([, d]) => !d.geraet || lage.ausruestung.includes(d.geraet));
        const anzahl = Math.min(moeglich.length, Math.max(b.anzahlDrills, n - (b.runden[dauer] - b.anzahlDrills)));
        const start = (woche - 1 + (block - 1) * 2) % moeglich.length;
        const gewaehlt = Array.from({ length: anzahl }, (_, i) => moeglich[(start + i) % moeglich.length]);
        jeRunde(Array.from({ length: n }, (_, i) => { const [, d] = gewaehlt[i % anzahl]; return `${d.name} – ${d.text}`; }));
        aus.hinweise = gewaehlt[0][1].hinweise;
        gewaehlt.forEach(([id, d]) => zeige(id, d.name));
      } else if (b.drills === 'abwehr') {
        const moeglich = b.auswahl.filter((id) => !ABWEHR[id].geraet || lage.ausruestung.includes(ABWEHR[id].geraet));
        const id = slipMitKonter && moeglich.includes('slip_seil') ? 'slip_seil' : moeglich[(woche - 1) % moeglich.length];
        const d = ABWEHR[id];
        aus.name = slipMitKonter && id === 'slip_seil' ? 'Slip-Seil mit Konter' : d.name;
        aus.text = slipMitKonter && id === 'slip_seil' ? `${d.text}. Nach jedem Abrollen ein Konter.` : d.text;
        aus.hinweise = d.hinweise;
        zeige(id, d.name);
      } else if (b.wechsel) {                         // Sack-Runden im Wechsel (Einheit B)
        const typen = Array.from({ length: n }, (_, i) => b.wechsel[i % b.wechsel.length]);
        jeRunde(typen.map((t) => `${SACK_RUNDEN[t].name} – ${SACK_RUNDEN[t].text}`));
        aus.text = `${alsDauer(b.rundeSek)} Runde, ${alsDauer(pause)} Pause${ohneSack ? '. Ohne Sack: als Schattenboxen.' : ''}`;
        aus.hinweise = SACK_RUNDEN[typen[0]].hinweise;
        aus.timer.ansage = true;
        aus.timer.ansageRunden = typen.map((t, i) => (t === 'kombi_ansage' ? i + 1 : 0)).filter(Boolean);
        kombis.forEach((k) => zeige(k, `Kombi ${k}`));
      } else if (b.sack) {                            // Technik am Sack
        aus.text = `${b.text}${b.ansage ? `. Kombi der Woche: ${kombis.join(' und ')}` : ''}${ohneSack ? '. Ohne Sack: als Schattenboxen.' : ''}`;
        aus.hinweise = SACK_RUNDEN[b.sack].hinweise;
        aus.timer.ansage = !!b.ansage;
        kombis.forEach((k) => zeige(k, `Kombi ${k}`));
      }
      return aus;
    }
    return null;
  }
}

// ------------------------------------------------------------------
// 7. Anpassung nach dem Training (Abschnitt 5.7)
// ------------------------------------------------------------------

export const LEICHT_BIS = 7;          // alles geschafft und Anstrengung höchstens so hoch -> steigern
export const MUEDE_AB = 4;            // Schichtmüdigkeit ab hier -> 30er-Version vorschlagen
export const SPARRING_HART_AB = 4;    // Sparring-Härte ab hier -> danach nur leichtes Training
export const SPARRING_WIRKT_TAGE = 3; // so viele Tage nach dem Sparring gilt das
// Gesteigert wird reihum, immer nur eins davon:
export const STEIGERUNG = ['runden', 'durchgaenge', 'pause'];
export const PAUSE_SCHRITT = 10;      // Sekunden
export const STEIGERUNGEN_HOECHSTENS = 9;

const STEIGERUNG_TEXT = { runden: '+1 Runde', durchgaenge: '+1 Durchgang', pause: `−${PAUSE_SCHRITT} Sek. Pause` };

function schrittAnwenden(a, schritt, richtung) {
  if (schritt === 'runden') a.runden += richtung;
  else if (schritt === 'durchgaenge') a.durchgaenge += richtung;
  else a.pauseSek -= richtung * PAUSE_SCHRITT;
}

// Was ändert sich beim nächsten Training gleichen Typs?
//   bisher   die bisherige Anpassung dieser Einheit { runden, durchgaenge, pauseSek, verlauf }
//   eintrag  der neue Eintrag { geschafft, anstrengung, platt, nurLeicht, woche }
//   davor    der Eintrag davor vom gleichen Typ (oder null)
// -> { anpassung, text }
export function naechsteAnpassung(bisher, eintrag, davor) {
  const a = { runden: 0, durchgaenge: 0, pauseSek: 0, ...bisher, verlauf: [...(bisher?.verlauf || [])] };

  if (eintrag.platt || eintrag.nurLeicht) return { anpassung: a, text: 'Verkürzte Einheit: zählt nicht für die Steigerung. Nächstes Mal wie geplant.' };
  if (eintrag.woche === 4) return { anpassung: a, text: 'Entlastungswoche: nächstes Mal bleibt alles gleich.' };

  if (eintrag.geschafft && eintrag.anstrengung <= LEICHT_BIS) {
    if (a.verlauf.length >= STEIGERUNGEN_HOECHSTENS) return { anpassung: a, text: 'Obergrenze der Steigerungen erreicht. Es bleibt gleich.' };
    const schritt = STEIGERUNG[a.verlauf.length % STEIGERUNG.length];
    schrittAnwenden(a, schritt, 1);
    a.verlauf.push(schritt);
    return { anpassung: a, text: `Alles geschafft und nicht zu hart. Nächstes Mal: ${STEIGERUNG_TEXT[schritt]}.` };
  }

  if (!eintrag.geschafft && davor && !davor.geschafft) {
    const schritt = a.verlauf.pop();
    if (!schritt) return { anpassung: a, text: 'Zweimal nicht geschafft. Du bist schon auf der Basis, es bleibt gleich.' };
    schrittAnwenden(a, schritt, -1);
    return { anpassung: a, text: 'Zweimal hintereinander nicht geschafft. Nächstes Mal eine Stufe zurück.' };
  }

  if (!eintrag.geschafft) return { anpassung: a, text: 'Nicht alles geschafft. Nächstes Mal bleibt es gleich.' };
  return { anpassung: a, text: 'Das war hart genug. Nächstes Mal bleibt es gleich.' };
}

// Abstand in Tagen zwischen zwei Tagen im Format "JJJJ-MM-TT"
function tageZwischen(von, bis) {
  return Math.round((new Date(`${bis}T12:00`) - new Date(`${von}T12:00`)) / TAG_MS);
}

// Schichtmüdigkeit 4–5 beim letzten Training (gestern oder heute) -> heute die 30er-Version vorschlagen
export function muedeVorschlag(eintraege, heute) {
  const letzter = [...eintraege].reverse().find((e) => e.einheit !== 'sparring');
  return !!letzter && letzter.muedigkeit >= MUEDE_AB && tageZwischen(letzter.tag, heute) <= 1;
}

// War das letzte Sparring hart und ist seitdem noch nicht trainiert worden?
export function nachHartemSparring(eintraege, heute) {
  const letzter = eintraege[eintraege.length - 1];
  return !!letzter && letzter.einheit === 'sparring' && letzter.sparringHaerte >= SPARRING_HART_AB
    && tageZwischen(letzter.tag, heute) <= SPARRING_WIRKT_TAGE;
}

// Wie viele Runden hat die Einheit insgesamt? (für die Wochenübersicht)
export function rundenDer(einheit) {
  return einheit.bloecke.reduce((s, b) => s + ((b.art === 'runden' || b.art === 'intervall') && b.timer ? b.timer.runden : 0), 0);
}
