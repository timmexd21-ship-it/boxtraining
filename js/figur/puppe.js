// Die sichtbare Figur: ein geschlossener Körper mit Handschuhen, Schuhen und Hose.
// Die Gelenkpunkte kommen aus skelett.js, hier werden nur die Formen hingestellt.
// Mit gelenkeZeigen werden die Gelenke grau hervorgehoben (gut für die Kraftkette).

import * as THREE from '../../vendor/three.module.js';
import { MASS, gelenke } from './skelett.js';

export const FARBEN = {
  koerper: 0xf1e9d8,   // Bandage
  gelenk: 0x8e8a82,    // Hallenbeton
  hose: 0x6f6b64,      // dunkler Beton
  vorn: 0xc5301f,      // Ringseil-Rot: vordere Hand und vorderer Fuß
  hinten: 0x3d7396,    // helleres Ringboden-Blau: hintere Hand und hinterer Fuß
};

const HOCH = new THREE.Vector3(0, 1, 0);
const VORN = new THREE.Vector3(0, 0, 1);
const GRAD = Math.PI / 180;

export class Puppe {
  constructor() {
    this.gruppe = new THREE.Group();
    this.gelenkeZeigen = false;
    const stoff = (farbe, rau = 0.8) => new THREE.MeshStandardMaterial({ color: farbe, roughness: rau, metalness: 0 });
    this.mat = {
      koerper: stoff(FARBEN.koerper), gelenk: stoff(FARBEN.gelenk), hose: stoff(FARBEN.hose, 0.95),
      vorn: stoff(FARBEN.vorn, 0.55), hinten: stoff(FARBEN.hinten, 0.55),
    };
    const m = this.mat;

    // Glied, das zum Ende hin dünner wird (nah = am Körper, fern = am Ende)
    const glied = (rNah, rFern, laenge, mat = m.koerper) =>
      this.neu(new THREE.CylinderGeometry(rFern, rNah, laenge, 20, 1), mat);
    const kugel = (radius, mat = m.koerper) => this.neu(new THREE.SphereGeometry(radius, 20, 14), mat);

    // Brustkorb: Umriss von der Taille bis zum Halsansatz, breiter als tief
    const umriss = [[0, -0.03], [0.105, 0], [0.112, 0.08], [0.135, 0.2], [0.142, 0.3], [0.118, 0.375], [0.06, 0.42], [0, 0.43]]
      .map(([r, y]) => new THREE.Vector2(r, y));

    this.teile = {
      becken: this.neu(new THREE.SphereGeometry(0.125, 24, 16).scale(1.22, 0.86, 0.88).translate(0, 0.03, 0), m.hose),
      bauch: this.neu(new THREE.SphereGeometry(0.112, 20, 14).scale(1.12, 1, 0.8), m.koerper),
      brust: this.neu(new THREE.LatheGeometry(umriss, 28).scale(1.22, 1, 0.74), m.koerper),
      hals: glied(0.052, 0.045, 0.12),
      kopf: this.neu(new THREE.SphereGeometry(MASS.kopfRadius, 24, 18).scale(0.88, 1.1, 1), m.koerper),
      kinn: this.neu(new THREE.SphereGeometry(0.07, 18, 12).scale(0.95, 0.8, 1), m.koerper),
      nase: this.neu(new THREE.SphereGeometry(0.02, 10, 8).scale(0.8, 1.2, 1.3), m.koerper),
    };
    this.gelenkTeile = [];
    for (const s of ['L', 'R']) {
      const t = this.teile;
      t['oberschenkel' + s] = glied(0.078, 0.054, MASS.oberschenkel);
      t['unterschenkel' + s] = glied(0.054, 0.037, MASS.unterschenkel);
      t['wade' + s] = this.neu(new THREE.SphereGeometry(0.05, 16, 12).scale(1, 2.3, 1.05), m.koerper);
      t['hosenbein' + s] = glied(0.092, 0.076, 0.22, m.hose);
      t['oberarm' + s] = glied(0.05, 0.04, MASS.oberarm);
      t['unterarm' + s] = glied(0.042, 0.032, MASS.unterarm);

      // Schuh: flache Kapsel, Sohle auf dem Boden, Fußballen im Ursprung
      t['fuss' + s] = this.neu(
        new THREE.CapsuleGeometry(0.046, 0.15, 6, 14).rotateX(Math.PI / 2).scale(1, 0.78, 1).translate(0, 0.036, -0.05), m.vorn);
      t['schaft' + s] = glied(0.045, 0.042, 0.09, m.vorn);

      // Boxhandschuh: Polster, Daumen, Stulpe
      t['faust' + s] = this.neu(new THREE.SphereGeometry(0.066, 20, 14).scale(1, 0.92, 1.22), m.vorn);
      t['daumen' + s] = this.neu(new THREE.SphereGeometry(0.03, 12, 10).scale(1, 1, 1.5), m.vorn);
      t['stulpe' + s] = glied(0.046, 0.05, 0.075, m.vorn);

      t['schulter' + s] = kugel(0.064);
      t['ellbogen' + s] = kugel(0.041);
      t['hueft' + s] = kugel(0.08, m.hose);
      t['knie' + s] = kugel(0.055);
      t['knoechel' + s] = kugel(0.038);
      this.gelenkTeile.push(t['schulter' + s], t['ellbogen' + s], t['knie' + s], t['knoechel' + s]);
    }
  }

  neu(geometrie, material) {
    const netz = new THREE.Mesh(geometrie, material);
    this.gruppe.add(netz);
    return netz;
  }

  // Glied zwischen zwei Punkte legen (a = nah am Körper, b = fern)
  zwischen(netz, a, b) {
    netz.position.copy(a).add(b).multiplyScalar(0.5);
    netz.quaternion.setFromUnitVectors(HOCH, b.clone().sub(a).normalize());
  }

  // Haltung übernehmen. gespiegelt: dann ist die rechte Seite vorn.
  setzen(haltung, gespiegelt = false) {
    const g = gelenke(haltung);
    const t = this.teile;

    t.becken.position.copy(haltung.becken.pos);
    t.becken.quaternion.copy(haltung.becken.quat);
    t.bauch.position.copy(g.lende);
    t.bauch.quaternion.copy(haltung.brustQuat);
    t.brust.position.copy(g.lende);
    t.brust.quaternion.copy(haltung.brustQuat);

    this.zwischen(t.hals, g.S, g.kopf);
    t.kopf.position.copy(g.kopf);
    t.kopf.quaternion.copy(haltung.kopfQuat);
    t.kinn.position.copy(g.kopf).add(new THREE.Vector3(0, -0.07, 0.035).applyQuaternion(haltung.kopfQuat));
    t.kinn.quaternion.copy(haltung.kopfQuat);
    t.nase.position.copy(g.kopf).add(new THREE.Vector3(0, -0.01, MASS.kopfRadius).applyQuaternion(haltung.kopfQuat));
    t.nase.quaternion.copy(haltung.kopfQuat);

    for (const netz of this.gelenkTeile) {
      netz.material = this.gelenkeZeigen ? this.mat.gelenk : this.mat.koerper;
      netz.scale.setScalar(this.gelenkeZeigen ? 1.14 : 1);
    }

    for (const s of ['L', 'R']) {
      const farbe = (s === 'L') !== gespiegelt ? this.mat.vorn : this.mat.hinten;

      // Bein
      this.zwischen(t['oberschenkel' + s], g.hueft[s], g.knie[s]);
      this.zwischen(t['unterschenkel' + s], g.knie[s], g.knoechel[s]);
      const schenkel = g.knie[s].clone().sub(g.hueft[s]).normalize();
      this.zwischen(t['hosenbein' + s], g.hueft[s], g.hueft[s].clone().addScaledVector(schenkel, 0.22));
      const schien = g.knoechel[s].clone().sub(g.knie[s]).normalize();
      t['wade' + s].position.copy(g.knie[s]).addScaledVector(schien, 0.15)
        .addScaledVector(new THREE.Vector3(0, 0, -0.012).applyQuaternion(g.fussQuat[s]), 1);
      t['wade' + s].quaternion.setFromUnitVectors(HOCH, schien);

      // Schuh
      t['fuss' + s].position.copy(haltung.fuss[s].pos);
      t['fuss' + s].quaternion.copy(g.fussQuat[s]);
      t['fuss' + s].material = farbe;
      this.zwischen(t['schaft' + s], g.knoechel[s].clone().addScaledVector(schien, -0.07), g.knoechel[s].clone().addScaledVector(schien, 0.02));
      t['schaft' + s].material = farbe;

      // Arm
      this.zwischen(t['oberarm' + s], g.schulter[s], g.ellbogen[s]);
      this.zwischen(t['unterarm' + s], g.ellbogen[s], g.handgelenk[s]);

      // Handschuh. faust = Drehung in Grad: 0 = Daumen oben (Deckung), 90 = Handrücken oben (gerader Schlag)
      const arm = g.handgelenk[s].clone().sub(g.ellbogen[s]).normalize();
      const oben = HOCH.clone().addScaledVector(arm, -arm.y);
      if (oben.lengthSq() < 1e-4) oben.set(0, 0, -1).addScaledVector(arm, arm.z); // Arm zeigt senkrecht
      oben.normalize();
      const innen = new THREE.Vector3().crossVectors(oben, arm).multiplyScalar(s === 'L' ? -1 : 1);
      const winkel = (haltung.hand[s].faust || 0) * GRAD;
      const daumen = oben.clone().multiplyScalar(Math.cos(winkel)).addScaledVector(innen, Math.sin(winkel));
      const faust = g.handgelenk[s].clone().addScaledVector(arm, 0.062);
      const ausrichtung = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(daumen, arm), daumen, arm));
      t['faust' + s].position.copy(faust);
      t['faust' + s].quaternion.copy(ausrichtung);
      t['daumen' + s].position.copy(faust).addScaledVector(daumen, 0.05).addScaledVector(arm, -0.012);
      t['daumen' + s].quaternion.copy(ausrichtung);
      this.zwischen(t['stulpe' + s], g.handgelenk[s].clone().addScaledVector(arm, -0.055), g.handgelenk[s].clone().addScaledVector(arm, 0.02));
      for (const teil of ['faust', 'daumen', 'stulpe']) t[teil + s].material = farbe;

      t['schulter' + s].position.copy(g.schulter[s]);
      t['ellbogen' + s].position.copy(g.ellbogen[s]);
      t['hueft' + s].position.copy(g.hueft[s]);
      t['knie' + s].position.copy(g.knie[s]);
      t['knoechel' + s].position.copy(g.knoechel[s]);
    }
    return g;
  }

  entsorgen() {
    this.gruppe.traverse((o) => o.geometry?.dispose());
    Object.values(this.mat).forEach((m) => m.dispose());
  }
}
