// Abspieler: zeigt die Puppe in 3D, spielt eine Bewegung in Endlosschleife.
// Steuerung: mit dem Finger drehen, Pause, Zeitlupe, Auslage spiegeln, Draufsicht.

import * as THREE from '../../vendor/three.module.js';
import { Puppe, FARBEN } from './puppe.js';
import { auswerten, spiegeln, zusammensetzen, fussabdruecke } from './bewegung.js';
import { BEWEGUNGEN, SCHLAG_BEWEGUNG, KOMBI_BEWEGUNG, ABLAEUFE, GLEICH, gehen } from '../data/animations.js';
import { zerlegen } from '../data/kombis.js';

const ZEITLUPE = 0.3;
const GRAD = Math.PI / 180;

// Bewegung nach Namen holen:
//   einzelne Bewegung aus animations.js ("jab", "burpee"),
//   Drill-Ablauf ("viereck") oder Kombi in der Schreibweise aus kombis.js ("1-2K, Slip, 2").
// Kombis und Abläufe werden aus den Einzelbewegungen zusammengesetzt.
const gebaut = new Map();
export function bewegungFuer(name) {
  if (GLEICH[name]) return bewegungFuer(GLEICH[name]);
  if (BEWEGUNGEN[name]) return BEWEGUNGEN[name];
  if (gebaut.has(name)) return gebaut.get(name);

  let clip;
  const ablauf = ABLAEUFE[name];
  if (ablauf) {
    const { teile, start, ...rest } = ablauf;
    clip = { ...rest, ...zusammensetzen(teile, { start, zurueck: gehen }) };
  } else {
    const clips = [];
    const teile = zerlegen(name).flat();
    for (let i = 0; i < teile.length; i++) {
      const teil = teile[i];
      if (teil.bewegung) {
        clips.push(KOMBI_BEWEGUNG[teil.bewegung]());
        if (teil.bewegung === 'finte') i += 1; // "Finte 1": der Jab wird nur angedeutet, nicht geschlagen
      } else {
        const einzel = BEWEGUNGEN[SCHLAG_BEWEGUNG[teil.schlag] + (teil.koerper ? '_k' : '')];
        if (!einzel) throw new Error(`Für "${name}" fehlt noch eine Animation.`);
        clips.push(einzel);
      }
    }
    clip = { ...zusammensetzen(clips, { zurueck: gehen }), name: `Kombi ${name}` };
  }
  gebaut.set(name, clip);
  return clip;
}

const STAB_FARBE = { beton: 0x8e8a82, bandage: 0xf1e9d8, leder: 0x6e3b2a };

export class Spieler {
  constructor(behaelter) {
    this.behaelter = behaelter;
    this.zeit = 0;
    this.laeuft = true;
    this.zeitlupe = false;
    this.gespiegelt = false;
    this.vonOben = false;
    this.dreh = { seite: 55, hoehe: 12 }; // Blickwinkel in Grad
    this.blick = { ziel: new THREE.Vector3(0, 0.9, 0.1), abstand: 4.2 };

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    behaelter.append(this.renderer.domElement);

    this.szene = new THREE.Scene();
    this.szene.add(new THREE.HemisphereLight(0xfff6e6, 0x231915, 1.5));
    const licht = new THREE.DirectionalLight(0xffffff, 1.9);
    licht.position.set(1.5, 3, 2.5);
    this.szene.add(licht);

    // Hallenboden mit einem Tape-Streifen in Richtung Gegner
    const boden = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x35271f }));
    const tape = new THREE.Mesh(
      new THREE.PlaneGeometry(0.03, 3.4).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x8e8a82, transparent: true, opacity: 0.45 }));
    tape.position.y = 0.001;
    this.szene.add(boden, tape);

    this.abdruecke = new THREE.Group();
    this.requisiten = new THREE.Group();   // Stange, Holme, Tape, Sack
    this.szene.add(this.abdruecke, this.requisiten);
    this.pendel = [];                      // Säcke, die schwingen
    this.sprungseil = null;

    this.puppe = new Puppe();
    this.szene.add(this.puppe.gruppe);

    this.kamera3d = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    this.kameraOben = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    this.kameraOben.position.set(0, 8, 0);
    this.kameraOben.up.set(0, 0, 1);       // vorn (Gegner) ist im Bild oben
    this.kameraOben.lookAt(0, 0, 0);

    this.fingerEinrichten();
    this.beobachter = new ResizeObserver(() => this.groesse());
    this.beobachter.observe(behaelter);
    this.groesse();

    this.letzte = performance.now();
    this.schleife = (jetzt) => {
      this.rahmen = requestAnimationFrame(this.schleife);
      const dt = Math.min(0.1, (jetzt - this.letzte) / 1000);
      this.letzte = jetzt;
      if (this.laeuft && this.clip) this.zeit = (this.zeit + dt * (this.zeitlupe ? ZEITLUPE : 1)) % this.clip.dauer;
      this.zeichnen();
    };
    this.rahmen = requestAnimationFrame(this.schleife);
  }

  // Bewegung wählen (Name aus animations.js oder Kombi wie "1-2-3")
  zeigen(name) {
    this.clip = bewegungFuer(name);
    this.zeit = 0;
    const b = this.clip.blick;
    this.blick.ziel.set(...(b?.ziel || [0, 0.9, 0.1]));
    this.blick.abstand = b?.abstand || 4.2;
    this.dreh = { seite: b?.seite ?? 55, hoehe: b?.hoehe ?? 12 };
    this.abdrueckeBauen();
    this.requisitenBauen();
  }

  // Requisiten der Bewegung hinstellen
  requisitenBauen() {
    const weg = (kind) => { kind.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); kind.removeFromParent(); };
    [...this.requisiten.children].forEach(weg);
    if (this.sprungseil) { weg(this.sprungseil); this.sprungseil = null; }
    this.pendel = [];

    const stab = (von, nach, dick, farbe) => {
      const a = new THREE.Vector3(...von);
      const b = new THREE.Vector3(...nach);
      const netz = new THREE.Mesh(
        new THREE.CylinderGeometry(dick, dick, a.distanceTo(b), 12),
        new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.6 }));
      netz.position.copy(a).add(b).multiplyScalar(0.5);
      netz.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      return netz;
    };

    for (const r of this.clip.requisiten || []) {
      if (r.art === 'stab') {
        this.requisiten.add(stab(r.von, r.nach, r.dick || 0.02, STAB_FARBE[r.farbe || 'beton']));
      } else if (r.art === 'sack') {
        // Sack hängt an einem Drehpunkt und schwingt im Takt der Bewegung
        const haenger = new THREE.Group();
        haenger.position.set(...r.oben);
        haenger.add(stab([0, 0, 0], [0, -r.laenge, 0], 0.008, STAB_FARBE.beton));
        const sack = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.15, 0.42, 6, 18),
          new THREE.MeshStandardMaterial({ color: STAB_FARBE.leder, roughness: 0.85 }));
        sack.position.y = -r.laenge - 0.3;
        haenger.add(sack);
        this.requisiten.add(haenger);
        this.pendel.push({ haenger, grad: r.grad });
      } else if (r.art === 'seil') {
        const punkte = 28;
        this.sprungseil = new THREE.Line(
          new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(punkte * 3), 3)),
          new THREE.LineBasicMaterial({ color: STAB_FARBE.bandage }));
        this.sprungseil.frustumCulled = false;
        this.sprungseil.userData = { periode: r.periode, punkte };
        this.szene.add(this.sprungseil);
      }
    }
  }

  // Sprungseil und Sack passend zum Zeitpunkt stellen. g = Gelenkpunkte der Figur.
  beiwerkStellen(g) {
    for (const p of this.pendel) {
      p.haenger.rotation.x = -p.grad * GRAD * Math.sin((this.zeit / this.clip.dauer) * Math.PI * 2);
    }
    this.requisiten.scale.x = this.gespiegelt ? -1 : 1;
    if (!this.sprungseil) return;

    // Bogen von Hand zu Hand, der einmal pro "periode" um den Körper läuft.
    // Unten ist er genau in der Mitte der Periode – dann sind die Füße in der Luft.
    const { periode, punkte } = this.sprungseil.userData;
    const winkel = (this.zeit / periode) * Math.PI * 2;
    const L = g.faust.L;
    const R = g.faust.R;
    const radius = (L.y + R.y) / 2 + 0.04;   // reicht unten knapp bis zum Boden
    const ort = this.sprungseil.geometry.attributes.position;
    for (let i = 0; i < punkte; i++) {
      const s = i / (punkte - 1);
      const r = radius * Math.sin(Math.PI * s);
      ort.setXYZ(i, L.x + (R.x - L.x) * s, L.y + (R.y - L.y) * s + r * Math.cos(winkel), L.z + (R.z - L.z) * s + r * Math.sin(winkel));
    }
    ort.needsUpdate = true;
  }

  // Fußabdrücke am Boden: alle Stellen, an denen ein Fuß in dieser Bewegung steht
  abdrueckeBauen() {
    for (const kind of [...this.abdruecke.children]) {
      kind.geometry.dispose();
      kind.material.dispose();
      this.abdruecke.remove(kind);
    }
    const alle = fussabdruecke(this.clip);
    const deckkraft = alle.length > 12 ? 0.16 : 0.4; // bei langen Wegen blasser, sonst wird es ein Teppich
    for (const a of alle) {
      const vorn = a.seite === 'L';
      const form = new THREE.Mesh(
        new THREE.PlaneGeometry(0.105, 0.27).rotateX(-Math.PI / 2).translate(0, 0, -0.055),
        new THREE.MeshBasicMaterial({ color: vorn ? FARBEN.vorn : FARBEN.hinten, transparent: true, opacity: deckkraft }));
      form.position.set(a.pos[0], 0.002, a.pos[2]);
      form.rotation.y = a.yaw * GRAD;
      this.abdruecke.add(form);
    }
  }

  haltung(zeit = this.zeit) {
    const h = auswerten(this.clip, zeit);
    return this.gespiegelt ? spiegeln(h) : h;
  }

  zeichnen() {
    if (!this.clip) return;
    this.beiwerkStellen(this.puppe.setzen(this.haltung(), this.gespiegelt));
    this.abdruecke.scale.x = this.gespiegelt ? -1 : 1;
    this.abdruecke.visible = this.vonOben || !!this.clip.oben;
    this.renderer.render(this.szene, this.vonOben ? this.kameraOben : this.kameraStellen());
  }

  kameraStellen(seite = this.dreh.seite, hoehe = this.dreh.hoehe) {
    const k = this.kamera3d;
    const s = seite * GRAD;
    const h = hoehe * GRAD;
    k.position.set(
      this.blick.ziel.x + this.blick.abstand * Math.cos(h) * Math.sin(s),
      this.blick.ziel.y + this.blick.abstand * Math.sin(h),
      this.blick.ziel.z + this.blick.abstand * Math.cos(h) * Math.cos(s));
    k.lookAt(this.blick.ziel);
    return k;
  }

  groesse() {
    const b = this.behaelter.clientWidth;
    const h = this.behaelter.clientHeight;
    if (!b || !h) return;
    this.renderer.setSize(b, h);
    this.kamera3d.aspect = b / h;
    this.kamera3d.updateProjectionMatrix();
    // Draufsicht: 1,8 m in der kürzeren Richtung sichtbar. Der Gegner ist im Bild oben,
    // die linke Seite der Figur ist links (Blick von oben hinter der Figur).
    const halb = 0.9;
    const breit = b >= h ? halb * (b / h) : halb;
    const hoch = b >= h ? halb : halb * (h / b);
    Object.assign(this.kameraOben, { left: -breit, right: breit, top: hoch, bottom: -hoch });
    this.kameraOben.updateProjectionMatrix();
  }

  // Mit dem Finger (oder der Maus) drehen
  fingerEinrichten() {
    const flaeche = this.renderer.domElement;
    flaeche.style.touchAction = 'none';
    let letzter = null;
    flaeche.addEventListener('pointerdown', (e) => {
      letzter = { x: e.clientX, y: e.clientY };
      flaeche.setPointerCapture(e.pointerId);
    });
    flaeche.addEventListener('pointermove', (e) => {
      if (!letzter || this.vonOben) return;
      this.dreh.seite -= (e.clientX - letzter.x) * 0.5;
      this.dreh.hoehe = Math.min(85, Math.max(-5, this.dreh.hoehe + (e.clientY - letzter.y) * 0.35));
      letzter = { x: e.clientX, y: e.clientY };
    });
    const los = () => { letzter = null; };
    flaeche.addEventListener('pointerup', los);
    flaeche.addEventListener('pointercancel', los);
  }

  // Prüfbogen: mehrere Zeitpunkte nebeneinander, aus drei Richtungen untereinander.
  // Nur zum Kontrollieren der Animationen gedacht.
  pruefbogen(zeiten) {
    cancelAnimationFrame(this.rahmen);
    const r = this.renderer;
    const groesse = r.getSize(new THREE.Vector2());
    const ansichten = [
      { name: 'seite', kamera: () => this.kameraStellen(this.clip.blick?.seite ?? 90, 4) },
      { name: 'vorn', kamera: () => this.kameraStellen(0, 4) },
      { name: 'oben', kamera: () => this.kameraOben },
    ];
    const zb = groesse.x / zeiten.length;
    const zh = groesse.y / ansichten.length;
    const merkAspekt = this.kamera3d.aspect;
    const merkOben = { left: this.kameraOben.left, right: this.kameraOben.right, top: this.kameraOben.top, bottom: this.kameraOben.bottom };
    this.kamera3d.aspect = zb / zh;
    this.kamera3d.updateProjectionMatrix();
    const halb = 0.8;
    Object.assign(this.kameraOben, { left: -halb * (zb / zh), right: halb * (zb / zh), top: halb, bottom: -halb });
    this.kameraOben.updateProjectionMatrix();

    r.setScissorTest(true);
    r.setClearColor(0x231915, 1);
    this.abdruecke.visible = true;
    zeiten.forEach((zeit, spalte) => {
      this.zeit = zeit;
      this.beiwerkStellen(this.puppe.setzen(this.haltung(zeit), this.gespiegelt));
      ansichten.forEach((a, zeile) => {
        const x = spalte * zb;
        const y = groesse.y - (zeile + 1) * zh;
        r.setViewport(x, y, zb, zh);
        r.setScissor(x + 1, y + 1, zb - 2, zh - 2);
        r.render(this.szene, a.kamera());
      });
    });
    r.setScissorTest(false);
    r.setViewport(0, 0, groesse.x, groesse.y);
    this.kamera3d.aspect = merkAspekt;
    this.kamera3d.updateProjectionMatrix();
    Object.assign(this.kameraOben, merkOben);
    this.kameraOben.updateProjectionMatrix();
  }

  entsorgen() {
    cancelAnimationFrame(this.rahmen);
    this.beobachter.disconnect();
    this.puppe.entsorgen();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
