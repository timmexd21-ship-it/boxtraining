// Skelett der Gliederpuppe: Maße und die Berechnung aller Gelenkpunkte.
//
// Achsen: Y zeigt nach oben, Z zum Gegner (vorn), X zur linken Seite der Figur.
// Maße in Metern, die Figur ist stehend etwa 1,73 m groß.

import { Vector3, Quaternion, Euler } from '../../vendor/three.module.js';

export const MASS = {
  hueftBreite: 0.10,     // Beckenmitte bis Hüftgelenk
  oberschenkel: 0.45,
  unterschenkel: 0.44,
  knoechelHoehe: 0.07,   // Knöchel über dem Boden
  ballenZuKnoechel: 0.13,// Fußballen bis unter den Knöchel
  lende: 0.10,           // Becken bis Drehpunkt des Rumpfs
  rumpf: 0.38,           // Drehpunkt bis Schulterlinie
  schulterBreite: 0.19,  // Mitte bis Schultergelenk
  hals: 0.07,
  kopf: 0.13,            // Halsansatz bis Kopfmitte
  kopfRadius: 0.105,
  oberarm: 0.30,
  unterarm: 0.27,
  faust: 0.055,
};

const GRAD = Math.PI / 180;

// Drehung aus [drehen um die Hochachse, vorbeugen, zur rechten Seite neigen] in Grad.
// Drehen: positiv = linke Schulter/Hüfte geht nach hinten, rechte kommt nach vorn.
export function quatAus(dreh = [0, 0, 0]) {
  return new Quaternion().setFromEuler(new Euler(dreh[1] * GRAD, dreh[0] * GRAD, dreh[2] * GRAD, 'YXZ'));
}

// Punkt in der Mitte der Schulterlinie
export function schulterMitte(beckenPos, beckenQuat, brustQuat) {
  return beckenPos.clone()
    .add(new Vector3(0, MASS.lende, 0).applyQuaternion(beckenQuat))
    .add(new Vector3(0, MASS.rumpf, 0).applyQuaternion(brustQuat));
}

// Zwei Knochen (Oberarm+Unterarm oder Ober-+Unterschenkel) von A zum Ziel.
// pol = Richtung, in die das mittlere Gelenk (Ellbogen/Knie) zeigen soll.
export function zweiKnochen(A, ziel, l1, l2, pol) {
  const d = ziel.clone().sub(A);
  const weit = Math.min(Math.max(d.length(), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.002);
  const richtung = d.lengthSq() > 1e-9 ? d.normalize() : new Vector3(0, -1, 0);
  const a = (l1 * l1 - l2 * l2 + weit * weit) / (2 * weit);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const quer = pol.clone().addScaledVector(richtung, -pol.dot(richtung));
  if (quer.lengthSq() < 1e-8) quer.set(richtung.y, -richtung.x, 0.01); // Notfall: irgendeine Querrichtung
  quer.normalize();
  return {
    mitte: A.clone().addScaledVector(richtung, a).addScaledVector(quer, h),
    ende: A.clone().addScaledVector(richtung, weit),
  };
}

// Aus einer fertigen Haltung alle Gelenkpunkte berechnen.
// haltung = {
//   becken: { pos: Vector3, quat }, brustQuat, kopfQuat,
//   hand: { L: { pos, pol }, R: { pos, pol } },          // Handgelenk-Ziel + Ellbogenrichtung
//   fuss: { L: { pos, yaw, ferse, knie? }, R: {...} },   // pos = Fußballen am Boden
// }
export function gelenke(h) {
  const { becken, brustQuat, kopfQuat } = h;
  const lende = becken.pos.clone().add(new Vector3(0, MASS.lende, 0).applyQuaternion(becken.quat));
  const S = lende.clone().add(new Vector3(0, MASS.rumpf, 0).applyQuaternion(brustQuat));
  const hals = S.clone().add(new Vector3(0, MASS.hals, 0.01).applyQuaternion(brustQuat));
  const kopf = hals.clone().add(new Vector3(0, MASS.kopf, 0.01).applyQuaternion(kopfQuat));
  const beckenVorn = new Vector3(0, 0, 1).applyQuaternion(becken.quat);

  const aus = { lende, S, hals, kopf, hueft: {}, knie: {}, knoechel: {}, fussQuat: {}, schulter: {}, ellbogen: {}, handgelenk: {}, faust: {} };

  for (const seite of ['L', 'R']) {
    const vz = seite === 'L' ? 1 : -1;

    // Bein: Hüfte -> Knöchel. Der Knöchel ergibt sich aus Fußballen, Fußrichtung und Fersenhub.
    const f = h.fuss[seite];
    const fussQuat = new Quaternion().setFromEuler(new Euler(f.ferse * GRAD, f.yaw * GRAD, 0, 'YXZ'));
    const knoechelZiel = f.pos.clone().add(
      new Vector3(0, MASS.knoechelHoehe, -MASS.ballenZuKnoechel).applyQuaternion(fussQuat));
    const hueft = becken.pos.clone().add(new Vector3(vz * MASS.hueftBreite, 0, 0).applyQuaternion(becken.quat));
    const fussVorn = new Vector3(Math.sin(f.yaw * GRAD), 0, Math.cos(f.yaw * GRAD));
    const kniePol = f.knie ? f.knie.clone() : beckenVorn.clone().add(fussVorn);
    const bein = zweiKnochen(hueft, knoechelZiel, MASS.oberschenkel, MASS.unterschenkel, kniePol);
    aus.hueft[seite] = hueft;
    aus.knie[seite] = bein.mitte;
    aus.knoechel[seite] = bein.ende;
    aus.fussQuat[seite] = fussQuat;

    // Arm: Schulter -> Handgelenk
    const schulter = S.clone().add(new Vector3(vz * MASS.schulterBreite, 0, 0).applyQuaternion(brustQuat));
    const arm = zweiKnochen(schulter, h.hand[seite].pos, MASS.oberarm, MASS.unterarm, h.hand[seite].pol);
    const unterarmRichtung = arm.ende.clone().sub(arm.mitte).normalize();
    aus.schulter[seite] = schulter;
    aus.ellbogen[seite] = arm.mitte;
    aus.handgelenk[seite] = arm.ende;
    aus.faust[seite] = arm.ende.clone().addScaledVector(unterarmRichtung, MASS.faust * 0.9);
  }
  return aus;
}
