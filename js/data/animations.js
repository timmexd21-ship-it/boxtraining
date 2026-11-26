// Animationsdaten: Grundhaltungen und Keyframes aller Bewegungen.
//
// SO LIEST MAN DIE DATEN
// Achsen: x = zur linken Seite der Figur, y = nach oben, z = nach vorn zum Gegner. Maße in Metern.
// Alles ist für die Auslage "linke Hand vorn" beschrieben; gespiegelt wird automatisch.
//
// Eine Haltung hat sieben Teile:
//   becken  pos [x,y,z] = Mitte zwischen den Hüftgelenken
//           dreh [drehen, vorbeugen, neigen] in Grad.
//           drehen: 0 = Becken frontal zum Gegner; MINUS = linke Hüfte vorn (Boxstellung),
//                   PLUS = rechte Hüfte kommt nach vorn (Cross).
//           neigen: PLUS = zur rechten Seite, MINUS = zur linken
//   rumpf   dreh wie oben, aber zusätzlich zum Becken (Verwringung des Oberkörpers)
//   kopf    dreh; frei: true = schaut unabhängig vom Körper zum Gegner
//   handL/handR  pos = wo das Handgelenk ist, pol = wohin der Ellbogen zeigt,
//           faust = Drehung der Faust in Grad (0 = Daumen oben, 90 = Handrücken oben, -90 = Handfläche oben)
//           raum 'kinn' = Deckung vor dem Kinn, 'stand' = Punkt vor der Figur (Schlagziel),
//                'brust' = am Oberkörper, 'welt' = fester Punkt (Boden, Stange)
//   fussL/fussR  pos = Fußballen, yaw = Fußrichtung (0 = Zehen zum Gegner, MINUS = nach rechts gedreht),
//           ferse = Fersenhub in Grad (Drehung auf dem Ballen), knie = wohin das Knie zeigt (optional)
//
// Eine Bewegung hat:
//   dauer   Länge in Sekunden
//   weiter  ab wann in einer Kombi die nächste Bewegung starten darf
//   spuren  je Körperteil eine Liste von Keyframes { t: Zeitpunkt, ...Werte }
//           { t, halt: true }  = bis hierhin nichts tun (verzögerter Einsatz)
//           { t }  ohne Werte = zurück in die Grundhaltung
//           e: 'aus' = schnellt los und bremst ab, 'ein' = wird schneller, 'linear', sonst weich
//   versatz [dx, dz]  die Bewegung versetzt die Figur (Schritt)
//   dreht   Grad      die Bewegung dreht die Figur (auf dem vorderen Fußballen)
//   blick   Kamera: { ziel, seite, hoehe, abstand };  oben: true = Draufsicht anbieten
//   requisiten  Stangen, Tape, Seil, Sack
//
// KRAFTKETTE: Bei jedem Schlag starten die Spuren versetzt –
// erst der Fuß, dann das Becken, dann der Rumpf, zuletzt die Hand.

// Für beide Seiten dieselben Keyframes, gespiegelt: seiten('fuss', v => [...]) -> { fussL, fussR }
// v ist +1 für links und -1 für rechts.
function seiten(teil, fn) {
  return { [teil + 'L']: fn(1), [teil + 'R']: fn(-1) };
}

export const POSEN = {
  // Boxstellung, linke Hand vorn
  kampf: {
    becken: { pos: [0, 0.90, 0], dreh: [-30, 2, -2] },
    rumpf: { dreh: [-6, 5, -3] },
    kopf: { dreh: [-6, 10, 0], frei: true },
    handL: { raum: 'kinn', pos: [0.09, 0.06, 0.38], pol: [0.4, -1, -0.2] },
    handR: { raum: 'kinn', pos: [-0.07, 0.09, 0.14], pol: [-0.5, -1, -0.4] },
    fussL: { pos: [0.14, 0, 0.21], yaw: -12, ferse: 3 },
    fussR: { pos: [-0.16, 0, -0.21], yaw: -45, ferse: 20 },
  },

  // aufrecht stehen
  stehen: {
    becken: { pos: [0, 0.925, 0], dreh: [0, 2, 0] },
    rumpf: { dreh: [0, 2, 0] },
    kopf: { dreh: [0, 0, 0], frei: false },
    handL: { raum: 'stand', pos: [0.26, 0.86, 0.04], pol: [0.3, 0, -1] },
    handR: { raum: 'stand', pos: [-0.26, 0.86, 0.04], pol: [-0.3, 0, -1] },
    fussL: { pos: [0.11, 0, 0.02], yaw: 8, ferse: 0 },
    fussR: { pos: [-0.11, 0, 0.02], yaw: -8, ferse: 0 },
  },

  // Seilspringen: Füße eng, Hände seitlich an der Hüfte
  seil: {
    becken: { pos: [0, 0.915, 0], dreh: [0, 2, 0] },
    rumpf: { dreh: [0, 2, 0] },
    kopf: { dreh: [0, 0, 0], frei: false },
    handL: { raum: 'stand', pos: [0.34, 0.92, 0.10], pol: [0.2, -0.3, -1] },
    handR: { raum: 'stand', pos: [-0.34, 0.92, 0.10], pol: [-0.2, -0.3, -1] },
    fussL: { pos: [0.07, 0, 0.02], yaw: 0, ferse: 0 },
    fussR: { pos: [-0.07, 0, 0.02], yaw: 0, ferse: 0 },
  },

  // Liegestütz, oben
  stuetz: {
    becken: { pos: [0, 0.43, -0.13], dreh: [0, 70, 0] },
    rumpf: { dreh: [0, 0, 0] },
    kopf: { dreh: [0, -42, 0], frei: false },
    handL: { raum: 'welt', pos: [0.27, 0.115, 0.36], pol: [0.7, 0.1, -1], faust: 90 },
    handR: { raum: 'welt', pos: [-0.27, 0.115, 0.36], pol: [-0.7, 0.1, -1], faust: 90 },
    fussL: { pos: [0.08, 0, -1.0], yaw: 0, ferse: 80 },
    fussR: { pos: [-0.08, 0, -1.0], yaw: 0, ferse: 80 },
  },

  // Ausfallschritt, linkes Bein vorn
  ausfall: {
    becken: { pos: [0, 0.60, 0], dreh: [0, 6, 0] },
    rumpf: { dreh: [0, 0, 0] },
    kopf: { dreh: [0, 0, 0], frei: false },
    handL: { raum: 'brust', pos: [0.18, -0.18, 0.22], pol: [0.4, -1, -0.3] },
    handR: { raum: 'brust', pos: [-0.18, -0.18, 0.22], pol: [-0.4, -1, -0.3] },
    fussL: { pos: [0.11, 0, 0.42], yaw: 0, ferse: 0 },
    fussR: { pos: [-0.11, 0, -0.50], yaw: 0, ferse: 65 },
  },

  // Stütz auf den Dip-Holmen, Arme gestreckt
  dipstuetz: {
    becken: { pos: [0, 1.14, 0], dreh: [0, 5, 0] },
    rumpf: { dreh: [0, 3, 0] },
    kopf: { dreh: [0, 0, 0], frei: false },
    handL: { raum: 'welt', pos: [0.28, 1.10, 0], pol: [0.15, 0, -1] },
    handR: { raum: 'welt', pos: [-0.28, 1.10, 0], pol: [-0.15, 0, -1] },
    fussL: { pos: [0.09, 0.42, -0.30], yaw: 0, ferse: 50 },
    fussR: { pos: [-0.09, 0.42, -0.30], yaw: 0, ferse: 50 },
  },

  // langer Hang an der Stange
  hang: {
    becken: { pos: [0, 1.07, 0], dreh: [0, 0, 0] },
    rumpf: { dreh: [0, 0, 0] },
    kopf: { dreh: [0, -10, 0], frei: false },
    handL: { raum: 'welt', pos: [0.30, 2.10, 0], pol: [1, -0.3, 0.4], faust: 90 },
    handR: { raum: 'welt', pos: [-0.30, 2.10, 0], pol: [-1, -0.3, 0.4], faust: 90 },
    fussL: { pos: [0.08, 0.14, 0.06], yaw: 0, ferse: 35 },
    fussR: { pos: [-0.08, 0.14, 0.06], yaw: 0, ferse: 35 },
  },

  // Sitz für Russian Twists: zurückgelehnt, Füße knapp über dem Boden
  sitz: {
    becken: { pos: [0, 0.115, 0], dreh: [0, -32, 0] },
    rumpf: { dreh: [0, 0, 0] },
    kopf: { dreh: [0, 28, 0], frei: false },
    handL: { raum: 'brust', pos: [0.04, -0.14, 0.30], pol: [0.8, -0.6, 0] },
    handR: { raum: 'brust', pos: [-0.04, -0.14, 0.30], pol: [-0.8, -0.6, 0] },
    fussL: { pos: [0.10, 0.10, 0.62], yaw: 0, ferse: 0, knie: [0, 1, 0.2] },
    fussR: { pos: [-0.10, 0.10, 0.62], yaw: 0, ferse: 0, knie: [0, 1, 0.2] },
  },
};
POSEN.stuetzBreit = {
  ...POSEN.stuetz,
  fussL: { ...POSEN.stuetz.fussL, pos: [0.18, 0, -1.0] },
  fussR: { ...POSEN.stuetz.fussR, pos: [-0.18, 0, -1.0] },
};

const K = POSEN.kampf;
const STEHEN = POSEN.stehen;
const SEIL_POSE = POSEN.seil;

// Schlagziele im Raum 'stand': Kinnhöhe eines gleich großen Gegners
const KINN = 1.43;
// Körperschlag: so viel tiefer geht die Faust, so viel tiefer das Becken
const KOERPER_TIEFER = { faust: 0.38, becken: 0.13 };

// ------------------------------------------------------------------
// Schläge
// ------------------------------------------------------------------

// Vordere Hand eng ans Kinn, während die hintere schlägt
const HAND_VORN_ANS_KINN = [
  { t: 0.18, raum: 'kinn', pos: [0.10, 0.08, 0.17], pol: [0.5, -1, -0.2] },
  { t: 0.26, raum: 'kinn', pos: [0.10, 0.08, 0.17], pol: [0.5, -1, -0.2] },
  { t: 0.54 },
];
// Hinterer Fuß dreht auf dem Ballen ein (Cross, hinterer Haken)
const FUSS_HINTEN_DREHT = [
  { t: 0.11, yaw: -8, ferse: 50, e: 'aus' },
  { t: 0.26, yaw: -8, ferse: 50 },
  { t: 0.52 },
];

const SCHLAEGE = {
  // 1 – Jab: vordere Hand gerade raus, Schulter schiebt nach, Hand kommt auf demselben Weg zurück.
  jab: {
    name: 'Jab', basis: K, dauer: 0.75, weiter: 0.30,
    spuren: {
      fussR: [
        { t: 0.10, ferse: 30, e: 'aus' },         // hinterer Fuß drückt ab
        { t: 0.22, ferse: 30 },
        { t: 0.45 },
      ],
      becken: [
        { t: 0.11, pos: [0, 0.895, 0.035], dreh: [-42, 3, -3], e: 'aus' },
        { t: 0.22, pos: [0, 0.895, 0.035], dreh: [-42, 3, -3] },
        { t: 0.45 },
      ],
      rumpf: [
        { t: 0.03, halt: true },
        { t: 0.14, dreh: [-18, 5, -4], e: 'aus' },
        { t: 0.22, dreh: [-18, 5, -4] },
        { t: 0.45 },
      ],
      handL: [
        { t: 0.06, halt: true },
        { t: 0.17, raum: 'stand', pos: [0.04, KINN, 0.85], pol: [0.3, -1, -0.2], faust: 90, e: 'aus' },
        { t: 0.21, raum: 'stand', pos: [0.04, KINN, 0.85], pol: [0.3, -1, -0.2], faust: 90 },
        { t: 0.42 },
      ],
    },
  },

  // 2 – Cross: hinterer Fuß dreht auf dem Ballen, Hüfte und Schulter drehen durch, dann die Hand.
  cross: {
    name: 'Cross', basis: K, dauer: 0.85, weiter: 0.32,
    spuren: {
      fussR: FUSS_HINTEN_DREHT,
      becken: [
        { t: 0.03, halt: true },
        { t: 0.15, pos: [0.02, 0.89, 0.06], dreh: [12, 5, 1], e: 'aus' },
        { t: 0.26, pos: [0.02, 0.89, 0.06], dreh: [12, 5, 1] },
        { t: 0.54 },
      ],
      rumpf: [
        { t: 0.06, halt: true },
        { t: 0.18, dreh: [22, 6, 2], e: 'aus' },
        { t: 0.26, dreh: [22, 6, 2] },
        { t: 0.54 },
      ],
      handR: [
        { t: 0.09, halt: true },
        { t: 0.21, raum: 'stand', pos: [0.02, KINN, 0.76], pol: [-0.3, -1, -0.2], faust: 90, e: 'aus' },
        { t: 0.25, raum: 'stand', pos: [0.02, KINN, 0.76], pol: [-0.3, -1, -0.2], faust: 90 },
        { t: 0.50 },
      ],
      handL: HAND_VORN_ANS_KINN,
    },
  },

  // 3 – vorderer Haken: Gewicht aufs vordere Bein, vorderer Fuß und Hüfte drehen ein,
  // der Arm bleibt im rechten Winkel und wird vom Körper mitgenommen. Ellbogen auf Faust-Höhe.
  haken: {
    name: 'Haken', basis: K, dauer: 0.95, weiter: 0.36,
    spuren: {
      fussL: [
        { t: 0.10, halt: true },
        { t: 0.23, yaw: -62, ferse: 38, e: 'aus' },
        { t: 0.33, yaw: -62, ferse: 38 },
        { t: 0.58 },
      ],
      becken: [
        { t: 0.11, pos: [0.03, 0.885, 0.03], dreh: [-24, 4, -3] },             // laden
        { t: 0.25, pos: [0.01, 0.89, 0.02], dreh: [-62, 3, -5], e: 'aus' },    // eindrehen
        { t: 0.33, pos: [0.01, 0.89, 0.02], dreh: [-62, 3, -5] },
        { t: 0.60 },
      ],
      rumpf: [
        { t: 0.11, dreh: [-2, 6, -3] },
        { t: 0.27, dreh: [-16, 4, -6], e: 'aus' },
        { t: 0.33, dreh: [-16, 4, -6] },
        { t: 0.60 },
      ],
      handL: [
        { t: 0.12, raum: 'stand', pos: [0.21, 1.40, 0.38], pol: [1, 0.3, 0.1] },              // Ellbogen hebt sich
        { t: 0.27, raum: 'stand', pos: [-0.12, 1.44, 0.60], pol: [0.5, 0.1, 0.8], e: 'aus' }, // Treffer
        { t: 0.33, raum: 'stand', pos: [-0.20, 1.43, 0.50], pol: [0.4, 0.1, 0.9] },           // durchziehen
        { t: 0.58 },
      ],
    },
  },

  // 4 – hinterer Haken: wie der Cross aus Fuß und Hüfte, aber der Arm bleibt im rechten Winkel.
  haken_hinten: {
    name: 'Hinterer Haken', basis: K, dauer: 0.95, weiter: 0.36,
    spuren: {
      fussR: FUSS_HINTEN_DREHT,
      becken: [
        { t: 0.03, halt: true },
        { t: 0.16, pos: [0.02, 0.89, 0.05], dreh: [18, 5, 1], e: 'aus' },
        { t: 0.27, pos: [0.02, 0.89, 0.05], dreh: [18, 5, 1] },
        { t: 0.56 },
      ],
      rumpf: [
        { t: 0.06, halt: true },
        { t: 0.19, dreh: [26, 6, 2], e: 'aus' },
        { t: 0.27, dreh: [26, 6, 2] },
        { t: 0.56 },
      ],
      handR: [
        { t: 0.10, raum: 'stand', pos: [-0.15, 1.40, 0.24], pol: [-1, 0.3, 0.1] },
        { t: 0.22, raum: 'stand', pos: [0.10, 1.44, 0.52], pol: [-0.5, 0.1, 0.8], e: 'aus' },
        { t: 0.28, raum: 'stand', pos: [0.18, 1.43, 0.44], pol: [-0.4, 0.1, 0.9] },
        { t: 0.52 },
      ],
      handL: HAND_VORN_ANS_KINN,
    },
  },

  // 5 – vorderer Aufwärtshaken: kurz abtauchen, dann aus Bein und Hüfte nach oben. Handfläche zu dir.
  aufwaerts: {
    name: 'Aufwärtshaken', basis: K, dauer: 0.95, weiter: 0.36,
    spuren: {
      fussL: [
        { t: 0.10, halt: true },
        { t: 0.24, yaw: -45, ferse: 30, e: 'aus' },
        { t: 0.32, yaw: -45, ferse: 30 },
        { t: 0.58 },
      ],
      becken: [
        { t: 0.12, pos: [0.03, 0.85, 0.02], dreh: [-24, 6, -8] },             // abtauchen
        { t: 0.25, pos: [0.02, 0.91, 0.03], dreh: [-50, 2, 0], e: 'aus' },    // hochdrücken
        { t: 0.32, pos: [0.02, 0.91, 0.03], dreh: [-50, 2, 0] },
        { t: 0.58 },
      ],
      rumpf: [
        { t: 0.12, dreh: [-2, 8, -6] },
        { t: 0.26, dreh: [-14, 3, 0], e: 'aus' },
        { t: 0.32, dreh: [-14, 3, 0] },
        { t: 0.58 },
      ],
      handL: [
        { t: 0.13, raum: 'stand', pos: [0.20, 1.02, 0.30], pol: [0.3, -0.3, -1], faust: -90 },
        { t: 0.26, raum: 'stand', pos: [0.05, 1.45, 0.55], pol: [0.3, -1, -0.3], faust: -90, e: 'aus' },
        { t: 0.31, raum: 'stand', pos: [0.04, 1.52, 0.50], pol: [0.3, -1, -0.3], faust: -90 },
        { t: 0.56 },
      ],
    },
  },

  // 6 – hinterer Aufwärtshaken
  aufwaerts_hinten: {
    name: 'Hinterer Aufwärtshaken', basis: K, dauer: 0.98, weiter: 0.38,
    spuren: {
      fussR: [
        { t: 0.12, halt: true },
        { t: 0.25, yaw: -8, ferse: 50, e: 'aus' },
        { t: 0.33, yaw: -8, ferse: 50 },
        { t: 0.60 },
      ],
      becken: [
        { t: 0.12, pos: [-0.02, 0.85, -0.01], dreh: [-34, 6, 8] },
        { t: 0.26, pos: [0.02, 0.91, 0.05], dreh: [10, 3, 0], e: 'aus' },
        { t: 0.33, pos: [0.02, 0.91, 0.05], dreh: [10, 3, 0] },
        { t: 0.60 },
      ],
      rumpf: [
        { t: 0.12, dreh: [-8, 8, 6] },
        { t: 0.27, dreh: [20, 3, 0], e: 'aus' },
        { t: 0.33, dreh: [20, 3, 0] },
        { t: 0.60 },
      ],
      handR: [
        { t: 0.13, raum: 'stand', pos: [-0.20, 1.00, 0.12], pol: [-0.3, -0.3, -1], faust: -90 },
        { t: 0.27, raum: 'stand', pos: [0.0, 1.45, 0.58], pol: [-0.3, -1, -0.3], faust: -90, e: 'aus' },
        { t: 0.32, raum: 'stand', pos: [0.0, 1.52, 0.53], pol: [-0.3, -1, -0.3], faust: -90 },
        { t: 0.58 },
      ],
      handL: HAND_VORN_ANS_KINN,
    },
  },
};

// Derselbe Schlag zum Körper: in die Knie gehen, Faust tiefer.
function zumKoerper(clip) {
  const spuren = {};
  for (const [kanal, keys] of Object.entries(clip.spuren)) {
    spuren[kanal] = keys.map((k) => {
      if (kanal.startsWith('hand') && k.raum === 'stand') return { ...k, pos: [k.pos[0], k.pos[1] - KOERPER_TIEFER.faust, k.pos[2]] };
      if (kanal === 'becken' && k.pos) return { ...k, pos: [k.pos[0], k.pos[1] - KOERPER_TIEFER.becken, k.pos[2]], dreh: [k.dreh[0], k.dreh[1] + 8, k.dreh[2]] };
      return k;
    });
  }
  return { ...clip, name: `${clip.name} zum Körper`, spuren };
}

// ------------------------------------------------------------------
// Abwehr und Bewegung in der Kombi
// ------------------------------------------------------------------

// Slip: Kopf aus der Linie nehmen. seite -1 = nach außen (rechts, lädt die 2), +1 = nach innen (links, lädt die 3)
function slip(seite, name) {
  return {
    name, basis: K, dauer: 0.6, weiter: 0.26,
    spuren: {
      becken: [
        { t: 0.14, pos: [seite * 0.05, 0.86, 0.01], dreh: [-30 - seite * 8, 6, -seite * 10], e: 'aus' },
        { t: 0.24, pos: [seite * 0.05, 0.86, 0.01], dreh: [-30 - seite * 8, 6, -seite * 10] },
        { t: 0.46 },
      ],
      rumpf: [
        { t: 0.14, dreh: [-6 - seite * 8, 8, -seite * 8], e: 'aus' },
        { t: 0.24, dreh: [-6 - seite * 8, 8, -seite * 8] },
        { t: 0.46 },
      ],
    },
  };
}

// Abrollen: aus den Knien unter dem Schlag durch. richtung +1 = von rechts nach links (lädt die 3).
function abrollen(richtung = 1, tief = 0.70, breit = 0.05) {
  const r = richtung;
  const halb = (0.9 + tief) / 2;
  return {
    name: 'Abrollen', basis: K, dauer: 0.8, weiter: 0.5,
    spuren: {
      becken: [
        { t: 0.12, pos: [-r * breit, halb, 0], dreh: [-30, 10, r * 6] },
        { t: 0.27, pos: [0, tief, 0.02], dreh: [-30, 16, 0] },
        { t: 0.42, pos: [r * breit, halb, 0.02], dreh: [-30, 10, -r * 6] },
        { t: 0.56, pos: [r * breit * 0.6, 0.88, 0.02], dreh: [-30, 4, -r * 3] },
      ],
      rumpf: [
        { t: 0.12, dreh: [-6, 12, r * 5] },
        { t: 0.27, dreh: [-6, 18, 0] },
        { t: 0.42, dreh: [-6, 12, -r * 5] },
        { t: 0.58 },
      ],
    },
  };
}

// Finte: Jab nur andeuten
const FINTE = {
  name: 'Finte', basis: K, dauer: 0.45, weiter: 0.30,
  spuren: {
    rumpf: [{ t: 0.11, dreh: [-12, 5, -3], e: 'aus' }, { t: 0.27 }],
    handL: [
      { t: 0.03, halt: true },
      { t: 0.12, raum: 'stand', pos: [0.07, 1.42, 0.60], pol: [0.3, -1, -0.2], faust: 45, e: 'aus' },
      { t: 0.27 },
    ],
  },
};

// Ein Schritt mit Nachziehen (Step-Drag). Der Fuß in Laufrichtung geht zuerst.
export function gehen(dx, dz, weiter = 0.52) {
  const zuerst = dz > 0.001 || (Math.abs(dz) <= 0.001 && dx > 0) ? 'L' : 'R';
  const danach = zuerst === 'L' ? 'R' : 'L';
  const fuss = (seite, t0) => {
    const von = K['fuss' + seite].pos;
    return [
      { t: t0, halt: true },
      { t: t0 + 0.11, pos: [von[0] + dx / 2, 0.03, von[2] + dz / 2], e: 'linear' },
      { t: t0 + 0.22, pos: [von[0] + dx, 0, von[2] + dz], e: 'linear' },
    ];
  };
  const b = K.becken.pos;
  return {
    name: 'Schritt', basis: K, dauer: 0.6, weiter, versatz: [dx, dz],
    spuren: {
      ['fuss' + zuerst]: fuss(zuerst, 0.02),
      ['fuss' + danach]: fuss(danach, 0.26),
      becken: [
        { t: 0.02, halt: true },
        { t: 0.25, pos: [b[0] + dx / 2, b[1], b[2] + dz / 2] },
        { t: 0.50, pos: [b[0] + dx, b[1], b[2] + dz] },
      ],
    },
  };
}

// Punkt um einen anderen drehen (um die Hochachse, PLUS = nach links)
function dreheUm([x, y, z], grad, um) {
  const c = Math.cos((grad * Math.PI) / 180);
  const s = Math.sin((grad * Math.PI) / 180);
  const px = x - um[0];
  const pz = z - um[2];
  return [um[0] + px * c + pz * s, y, um[2] - px * s + pz * c];
}

// Drehung auf dem vorderen Fußballen. grad PLUS = nach links drehen.
export function drehung(grad) {
  const P = K.fussL.pos;
  const hinten = K.fussR.pos;
  const halb = dreheUm(hinten, grad / 2, P);
  const ende = dreheUm([0, 0, 0], grad, P);
  return {
    name: 'Drehen', basis: K, dauer: 0.6, weiter: 0.5, dreht: grad, drehtZeit: [0.05, 0.36], versatz: [ende[0], ende[2]],
    spuren: {
      fussL: [
        { t: 0.05, halt: true },
        { t: 0.20, yaw: K.fussL.yaw + grad / 2, ferse: 22, e: 'linear' },
        { t: 0.38, yaw: K.fussL.yaw + grad, ferse: 3, e: 'linear' },
      ],
      fussR: [
        { t: 0.05, halt: true },
        { t: 0.20, pos: [halb[0], 0.03, halb[2]], yaw: K.fussR.yaw + grad / 2, e: 'linear' },
        { t: 0.36, pos: dreheUm(hinten, grad, P), yaw: K.fussR.yaw + grad, e: 'linear' },
      ],
      becken: [
        { t: 0.05, halt: true },
        { t: 0.36, pos: dreheUm(K.becken.pos, grad, P), dreh: [K.becken.dreh[0] + grad, K.becken.dreh[1], K.becken.dreh[2]] },
      ],
    },
  };
}

// Kurz stehen bleiben
export const warte = (sek) => ({ name: 'Pause', basis: K, dauer: sek, weiter: sek, spuren: {} });

// ------------------------------------------------------------------
// Körpergewicht
// ------------------------------------------------------------------

const UNTEN = { pos: [0, 0.19, -0.10], dreh: [0, 86, 0] }; // Liegestütz unten

// Klimmzug in zwei Tempi
function klimmzug(name, hochBis, hoehe, dauer, art) {
  const oben = { pos: [0, hoehe, -0.03], dreh: [0, -6, 0] };
  return {
    name, basis: POSEN.hang, dauer,
    blick: { ziel: [0, 1.25, 0], seite: 35, hoehe: 4, abstand: 6.2 },
    requisiten: [{ art: 'stab', von: [-0.6, 2.17, 0], nach: [0.6, 2.17, 0], dick: 0.022 }],
    spuren: {
      becken: [{ t: hochBis, ...oben, e: art }, { t: hochBis + 0.22, ...oben }, { t: dauer - 0.5 }],
      ...seiten('fuss', (v) => [
        { t: hochBis, pos: [v * 0.08, hoehe - 0.93, 0.10], e: art }, { t: hochBis + 0.22, halt: true }, { t: dauer - 0.5 },
      ]),
      ...seiten('hand', (v) => [
        { t: hochBis, raum: 'welt', pos: [v * 0.30, 2.10, 0], pol: [v, -1, 0.2], faust: 90 }, { t: hochBis + 0.22, halt: true }, { t: dauer - 0.5 },
      ]),
    },
  };
}

const KOERPERGEWICHT = {
  // Liegestütz: Körper bleibt ein Brett, Hände und Füße stehen fest.
  liegestuetz: {
    name: 'Liegestütze', basis: POSEN.stuetz, dauer: 2.2,
    blick: { ziel: [0, 0.3, -0.3], seite: 75, hoehe: 12, abstand: 4.4 },
    spuren: {
      becken: [{ t: 0.9, ...UNTEN }, { t: 1.1, ...UNTEN }, { t: 1.8, e: 'aus' }],
    },
  },

  // Klatsch-Liegestütz: so schnell hoch, dass die Hände abheben.
  klatsch_liegestuetz: {
    name: 'Klatsch-Liegestütze', basis: POSEN.stuetz, dauer: 1.7,
    blick: { ziel: [0, 0.3, -0.3], seite: 75, hoehe: 12, abstand: 4.4 },
    spuren: {
      becken: [
        { t: 0.5, ...UNTEN }, { t: 0.6, ...UNTEN },
        { t: 0.84, pos: [0, 0.50, -0.13], dreh: [0, 64, 0], e: 'aus' },
        { t: 1.06, e: 'ein' },
        { t: 1.25, pos: [0, 0.36, -0.12], dreh: [0, 76, 0], e: 'aus' },   // weich landen
        { t: 1.5 },
      ],
      ...seiten('hand', (v) => [
        { t: 0.72, halt: true },
        { t: 0.87, raum: 'welt', pos: [v * 0.05, 0.30, 0.42], pol: [v * 0.7, 0.1, -1], faust: 90, e: 'aus' },
        { t: 1.04, e: 'ein' },
      ]),
    },
  },

  // Unterarmstütz mit Schultertippen (hier im hohen Stütz): Hüfte bleibt ruhig.
  schultertippen: {
    name: 'Schultertippen', basis: POSEN.stuetzBreit, dauer: 2.4,
    blick: { ziel: [0, 0.3, -0.3], seite: 40, hoehe: 22, abstand: 4.6 },
    spuren: {
      becken: [
        { t: 0.45, pos: [-0.04, 0.43, -0.13] }, { t: 0.85, pos: [-0.04, 0.43, -0.13] }, { t: 1.05 },
        { t: 1.55, pos: [0.04, 0.43, -0.13] }, { t: 1.95, pos: [0.04, 0.43, -0.13] }, { t: 2.15 },
      ],
      handL: [{ t: 0.3, halt: true }, { t: 0.55, raum: 'brust', pos: [-0.15, 0.02, 0.12], pol: [0.6, -0.4, -0.3], faust: 90 }, { t: 0.8, halt: true }, { t: 1.05 }],
      handR: [{ t: 1.4, halt: true }, { t: 1.65, raum: 'brust', pos: [0.15, 0.02, 0.12], pol: [-0.6, -0.4, -0.3], faust: 90 }, { t: 1.9, halt: true }, { t: 2.15 }],
    },
  },

  // Hocksprung: tief runter, mit voller Kraft hoch, weich landen.
  hocksprung: {
    name: 'Hocksprünge', basis: STEHEN, dauer: 1.5,
    blick: { ziel: [0, 0.9, 0], seite: 60, hoehe: 8, abstand: 5 },
    spuren: {
      becken: [
        { t: 0.40, pos: [0, 0.58, -0.08], dreh: [0, 28, 0] },
        { t: 0.50, pos: [0, 0.58, -0.08], dreh: [0, 28, 0] },
        { t: 0.68, pos: [0, 1.22, 0], dreh: [0, 2, 0], e: 'aus' },
        { t: 0.86, pos: [0, 0.93, 0], dreh: [0, 4, 0], e: 'ein' },
        { t: 1.05, pos: [0, 0.66, -0.06], dreh: [0, 22, 0], e: 'aus' },
        { t: 1.35 },
      ],
      ...seiten('fuss', (v) => [
        { t: 0.56, halt: true },
        { t: 0.68, pos: [v * 0.11, 0.28, 0.02], ferse: 40, e: 'aus' },
        { t: 0.86, pos: [v * 0.11, 0, 0.02], ferse: 8, e: 'ein' },
        { t: 1.0 },
      ]),
      ...seiten('hand', (v) => [
        { t: 0.40, raum: 'stand', pos: [v * 0.2, 0.95, 0.35], pol: [v * 0.3, -1, -0.3] },
        { t: 0.50, halt: true },
        { t: 0.68, raum: 'stand', pos: [v * 0.22, 1.75, 0.25], pol: [v * 0.5, -0.5, -0.5], e: 'aus' },
        { t: 1.05, raum: 'stand', pos: [v * 0.2, 1.0, 0.35], pol: [v * 0.3, -1, -0.3] },
        { t: 1.35 },
      ]),
    },
  },

  // Ausfallschritt-Sprung: in der Luft die Beine wechseln.
  ausfallschritt_sprung: {
    name: 'Ausfallschritt-Sprünge', basis: POSEN.ausfall, dauer: 1.9,
    blick: { ziel: [0, 0.8, 0], seite: 80, hoehe: 8, abstand: 5 },
    spuren: {
      becken: [
        { t: 0.22, pos: [0, 0.56, 0] }, { t: 0.42, pos: [0, 0.98, 0], e: 'aus' }, { t: 0.62, pos: [0, 0.60, 0], e: 'ein' },
        { t: 1.12, pos: [0, 0.56, 0] }, { t: 1.32, pos: [0, 0.98, 0], e: 'aus' }, { t: 1.52, pos: [0, 0.60, 0], e: 'ein' },
      ],
      fussL: [
        { t: 0.26, halt: true }, { t: 0.42, pos: [0.11, 0.22, -0.04], ferse: 30 }, { t: 0.62, pos: [0.11, 0, -0.50], ferse: 65 },
        { t: 1.16, halt: true }, { t: 1.32, pos: [0.11, 0.22, -0.04], ferse: 30 }, { t: 1.52, pos: [0.11, 0, 0.42], ferse: 0 },
      ],
      fussR: [
        { t: 0.26, halt: true }, { t: 0.42, pos: [-0.11, 0.22, -0.04], ferse: 30 }, { t: 0.62, pos: [-0.11, 0, 0.42], ferse: 0 },
        { t: 1.16, halt: true }, { t: 1.32, pos: [-0.11, 0.22, -0.04], ferse: 30 }, { t: 1.52, pos: [-0.11, 0, -0.50], ferse: 65 },
      ],
    },
  },

  // Weitsprung aus dem Stand: Arme holen Schwung, beidbeinig ab, stehen bleiben.
  weitsprung: {
    name: 'Weitsprung aus dem Stand', basis: STEHEN, dauer: 2.2,
    blick: { ziel: [0, 0.85, 0], seite: 90, hoehe: 6, abstand: 6 },
    spuren: {
      becken: [
        { t: 0, pos: [0, 0.925, -0.70] },
        { t: 0.50, pos: [0, 0.62, -0.74], dreh: [0, 35, 0] },
        { t: 0.72, pos: [0, 1.12, -0.10], dreh: [0, 12, 0], e: 'aus' },
        { t: 0.95, pos: [0, 0.68, 0.46], dreh: [0, 30, 0], e: 'ein' },
        { t: 1.40, pos: [0, 0.925, 0.52] },
        { t: 2.19, pos: [0, 0.925, 0.52] },
      ],
      ...seiten('fuss', (v) => [
        { t: 0, pos: [v * 0.11, 0, -0.68] },
        { t: 0.55, pos: [v * 0.11, 0, -0.68] },
        { t: 0.72, pos: [v * 0.11, 0.35, -0.05], ferse: 35, e: 'aus' },
        { t: 0.93, pos: [v * 0.11, 0, 0.56], e: 'ein' },
        { t: 2.19, pos: [v * 0.11, 0, 0.56] },
      ]),
      ...seiten('hand', (v) => [
        { t: 0.50, raum: 'stand', pos: [v * 0.26, 0.80, -0.35], pol: [v * 0.3, 0.3, -1] },
        { t: 0.72, raum: 'stand', pos: [v * 0.22, 1.65, 0.40], pol: [v * 0.4, -1, -0.3], e: 'aus' },
        { t: 0.95, raum: 'stand', pos: [v * 0.22, 1.0, 0.40], pol: [v * 0.4, -1, -0.3] },
        { t: 1.40 },
      ]),
    },
  },

  // Hampelmann
  hampelmann: {
    name: 'Hampelmänner', basis: STEHEN, dauer: 0.9,
    blick: { ziel: [0, 1.0, 0], seite: 20, hoehe: 6, abstand: 5.4 },
    spuren: {
      becken: [{ t: 0.12, pos: [0, 0.96, 0] }, { t: 0.25, pos: [0, 0.90, 0] }, { t: 0.55, halt: true }, { t: 0.67, pos: [0, 0.96, 0] }, { t: 0.8 }],
      ...seiten('fuss', (v) => [
        { t: 0.12, pos: [v * 0.24, 0.07, 0.02] }, { t: 0.25, pos: [v * 0.38, 0, 0.02], yaw: v * 15 },
        { t: 0.55, halt: true }, { t: 0.67, pos: [v * 0.24, 0.07, 0.02] }, { t: 0.8 },
      ]),
      ...seiten('hand', (v) => [
        { t: 0.25, raum: 'stand', pos: [v * 0.20, 1.95, 0], pol: [v, 0, -0.3] },
        { t: 0.55, halt: true }, { t: 0.8 },
      ]),
    },
  },

  // Dips: Schultern unten halten, runter bis die Oberarme waagerecht sind.
  dips: {
    name: 'Dips', basis: POSEN.dipstuetz, dauer: 2.3,
    blick: { ziel: [0, 1.0, 0], seite: 70, hoehe: 6, abstand: 5 },
    requisiten: [
      { art: 'stab', von: [0.28, 1.04, -0.38], nach: [0.28, 1.04, 0.38], dick: 0.024 },
      { art: 'stab', von: [-0.28, 1.04, -0.38], nach: [-0.28, 1.04, 0.38], dick: 0.024 },
    ],
    spuren: {
      becken: [{ t: 0.9, pos: [0, 0.86, -0.04], dreh: [0, 16, 0] }, { t: 1.1, pos: [0, 0.86, -0.04], dreh: [0, 16, 0] }, { t: 1.85 }],
      ...seiten('fuss', (v) => [{ t: 0.9, pos: [v * 0.09, 0.16, -0.32] }, { t: 1.1, pos: [v * 0.09, 0.16, -0.32] }, { t: 1.85 }]),
    },
  },

  klimmzug: klimmzug('Klimmzüge', 0.95, 1.49, 2.7, 'weich'),
  explosiv_klimmzug: klimmzug('Explosive Klimmzüge', 0.36, 1.56, 2.1, 'aus'),

  // Burpee: Brust zum Boden, Füße nah an die Hände, oben strecken und abspringen.
  burpee: {
    name: 'Burpees', basis: STEHEN, dauer: 2.7,
    blick: { ziel: [0, 0.95, -0.35], seite: 78, hoehe: 8, abstand: 7 },
    spuren: {
      becken: [
        { t: 0.35, pos: [0, 0.44, -0.14], dreh: [0, 62, 0] },
        { t: 0.53, pos: [0, 0.56, -0.20], dreh: [0, 60, 0] },   // Hüfte hoch, damit die Beine nach hinten können
        { t: 0.70, pos: [0, 0.43, -0.17], dreh: [0, 70, 0] },
        { t: 1.00, pos: [0, 0.19, -0.14], dreh: [0, 86, 0] },
        { t: 1.30, pos: [0, 0.43, -0.17], dreh: [0, 70, 0] },
        { t: 1.46, pos: [0, 0.56, -0.20], dreh: [0, 60, 0] },
        { t: 1.60, pos: [0, 0.44, -0.14], dreh: [0, 62, 0] },
        { t: 1.85, pos: [0, 1.20, 0], dreh: [0, 2, 0], e: 'aus' },
        { t: 2.10, pos: [0, 0.86, 0], dreh: [0, 8, 0], e: 'ein' },
        { t: 2.40 },
      ],
      kopf: [{ t: 0.35, dreh: [0, -30, 0] }, { t: 0.70, dreh: [0, -42, 0] }, { t: 1.60, dreh: [0, -30, 0] }, { t: 1.85 }],
      ...seiten('hand', (v) => [
        { t: 0.35, raum: 'welt', pos: [v * 0.2, 0.115, 0.32], pol: [v * 0.7, 0.1, -1], faust: 90 },
        { t: 1.60, raum: 'welt', pos: [v * 0.2, 0.115, 0.32], pol: [v * 0.7, 0.1, -1], faust: 90 },
        { t: 1.85, raum: 'stand', pos: [v * 0.2, 2.2, 0.05], pol: [v * 0.4, 0, 1], e: 'aus' },
        { t: 2.10, raum: 'stand', pos: [v * 0.26, 1.0, 0.2], pol: [v * 0.3, 0, -1] },
        { t: 2.40 },
      ]),
      ...seiten('fuss', (v) => [
        { t: 0.40, halt: true },
        { t: 0.55, pos: [v * 0.08, 0.16, -0.60], yaw: 0, ferse: 60 },
        { t: 0.70, pos: [v * 0.08, 0, -1.04], yaw: 0, ferse: 80 },
        { t: 1.32, halt: true },
        { t: 1.46, pos: [v * 0.09, 0.16, -0.55], yaw: 0, ferse: 60 },
        { t: 1.60, pos: [v * 0.11, 0, 0.02], ferse: 10 },
        { t: 1.72, halt: true },
        { t: 1.85, pos: [v * 0.11, 0.25, 0.02], ferse: 40, e: 'aus' },
        { t: 2.10, pos: [v * 0.11, 0, 0.02], ferse: 5, e: 'ein' },
        { t: 2.40 },
      ]),
    },
  },

  // Russian Twist: Schultern drehen, nicht nur die Arme.
  russian_twist: {
    name: 'Russian Twists', basis: POSEN.sitz, dauer: 1.8,
    blick: { ziel: [0, 0.45, 0.25], seite: 35, hoehe: 16, abstand: 4.4 },
    spuren: {
      rumpf: [{ t: 0.45, dreh: [42, 0, 0] }, { t: 0.6, halt: true }, { t: 1.2, dreh: [-42, 0, 0] }, { t: 1.35, halt: true }, { t: 1.8 }],
    },
  },
};

// ------------------------------------------------------------------
// Seil
// ------------------------------------------------------------------

const seilBlick = { ziel: [0, 0.95, 0], seite: 40, hoehe: 6, abstand: 5.6 };

const SEILSPRUENGE = {
  grundsprung: {
    name: 'Grundsprung', basis: SEIL_POSE, dauer: 0.45, blick: seilBlick,
    requisiten: [{ art: 'seil', periode: 0.45 }],
    spuren: {
      becken: [{ t: 0.22, pos: [0, 0.975, 0] }, { t: 0.40 }],
      ...seiten('fuss', (v) => [{ t: 0.22, pos: [v * 0.07, 0.06, 0.02], ferse: 25 }, { t: 0.40 }]),
    },
  },
  // Boxer-Skip: das Gewicht wandert von Fuß zu Fuß, der freie Fuß tippt nach vorn.
  boxer_skip: {
    name: 'Boxer-Skip', basis: SEIL_POSE, dauer: 0.9, blick: seilBlick,
    requisiten: [{ art: 'seil', periode: 0.45 }],
    spuren: {
      becken: [{ t: 0.22, pos: [0.02, 0.96, 0] }, { t: 0.42, pos: [0.02, 0.915, 0] }, { t: 0.67, pos: [-0.02, 0.96, 0] }, { t: 0.87, pos: [-0.02, 0.915, 0] }],
      fussL: [{ t: 0.22, pos: [0.07, 0.05, 0.02], ferse: 25 }, { t: 0.40, pos: [0.07, 0, 0.02] }, { t: 0.67, pos: [0.07, 0.11, 0.13], ferse: 15 }, { t: 0.86, pos: [0.07, 0.03, 0.10], ferse: 10 }],
      fussR: [{ t: 0.22, pos: [-0.07, 0.11, 0.13], ferse: 15 }, { t: 0.40, pos: [-0.07, 0.03, 0.10], ferse: 10 }, { t: 0.67, pos: [-0.07, 0.05, 0.02], ferse: 25 }, { t: 0.86, pos: [-0.07, 0, 0.02] }],
    },
  },
  kniehebelauf: {
    name: 'Kniehebelauf', basis: SEIL_POSE, dauer: 0.7, blick: seilBlick,
    requisiten: [{ art: 'seil', periode: 0.35 }],
    spuren: {
      becken: [{ t: 0.17, pos: [0, 0.95, 0] }, { t: 0.33, pos: [0, 0.915, 0] }, { t: 0.52, pos: [0, 0.95, 0] }, { t: 0.68 }],
      fussL: [{ t: 0.17, pos: [0.07, 0.44, 0.16], ferse: 30 }, { t: 0.33, pos: [0.07, 0, 0.02] }, { t: 0.52, pos: [0.07, 0.04, 0.02], ferse: 20 }, { t: 0.68 }],
      fussR: [{ t: 0.17, pos: [-0.07, 0.04, 0.02], ferse: 20 }, { t: 0.33, pos: [-0.07, 0, 0.02] }, { t: 0.52, pos: [-0.07, 0.44, 0.16], ferse: 30 }, { t: 0.68 }],
    },
  },
  doppelsprung: {
    name: 'Doppelsprünge', basis: SEIL_POSE, dauer: 0.7, blick: seilBlick,
    requisiten: [{ art: 'seil', periode: 0.28 }],
    spuren: {
      becken: [{ t: 0.08, pos: [0, 0.88, 0] }, { t: 0.30, pos: [0, 1.10, 0], e: 'aus' }, { t: 0.54, pos: [0, 0.90, 0], e: 'ein' }, { t: 0.66 }],
      ...seiten('fuss', (v) => [{ t: 0.10, halt: true }, { t: 0.30, pos: [v * 0.07, 0.20, 0.02], ferse: 35, e: 'aus' }, { t: 0.52, pos: [v * 0.07, 0, 0.02], ferse: 5, e: 'ein' }]),
    },
  },
};

// ------------------------------------------------------------------
// Alle einzelnen Bewegungen
// ------------------------------------------------------------------

export const BEWEGUNGEN = {
  ...SCHLAEGE,
  jab_k: zumKoerper(SCHLAEGE.jab),
  cross_k: zumKoerper(SCHLAEGE.cross),
  haken_k: zumKoerper(SCHLAEGE.haken),
  haken_hinten_k: zumKoerper(SCHLAEGE.haken_hinten),
  aufwaerts_k: zumKoerper(SCHLAEGE.aufwaerts),
  aufwaerts_hinten_k: zumKoerper(SCHLAEGE.aufwaerts_hinten),
  slip_aussen: slip(-1, 'Slip außen'),
  slip_innen: slip(1, 'Slip innen'),
  abrollen: abrollen(1),
  finte: FINTE,
  ...KOERPERGEWICHT,
  ...SEILSPRUENGE,
};

// Welche Bewegung gehört zu welcher Schlagnummer? "K" hängt _k an.
export const SCHLAG_BEWEGUNG = {
  1: 'jab', 2: 'cross', 3: 'haken', 4: 'haken_hinten', 5: 'aufwaerts', 6: 'aufwaerts_hinten',
};

// Bewegungen in Kombis (Namen wie in kombis.js)
export const KOMBI_BEWEGUNG = {
  slip: () => BEWEGUNGEN.slip_aussen,
  abrollen: () => BEWEGUNGEN.abrollen,
  finte: () => BEWEGUNGEN.finte,
  raus: () => gehen(0, -0.20),
  seit: () => gehen(0.20, 0),
};

// ------------------------------------------------------------------
// Drills: Abläufe aus mehreren Bewegungen
// ------------------------------------------------------------------

const B = BEWEGUNGEN;
const TAPE = { dick: 0.012, farbe: 'bandage' };
const viereckTape = [[-0.5, -0.5, 0.5, -0.5], [0.5, -0.5, 0.5, 0.5], [0.5, 0.5, -0.5, 0.5], [-0.5, 0.5, -0.5, -0.5]]
  .map(([x1, z1, x2, z2]) => ({ art: 'stab', von: [x1, 0.008, z1], nach: [x2, 0.008, z2], ...TAPE }));
const dreiSchritte = (dx, dz) => [gehen(dx / 3, dz / 3, 0.5), gehen(dx / 3, dz / 3, 0.5), gehen(dx / 3, dz / 3, 0.62)];
const einsZwei = [B.jab, B.cross, warte(0.4)];

export const ABLAEUFE = {
  // Step-Drag: kleine Schritte (7 cm) vor, zurück, links, rechts. Die Füße kreuzen nie.
  step_drag: {
    name: 'Step-Drag', oben: true,
    teile: [warte(0.3), gehen(0, 0.07, 0.85), gehen(0, -0.07, 0.85), gehen(0.07, 0, 0.85), gehen(-0.07, 0, 0.85)],
  },
  // Viereck: an jeder Ecke stehen, 1-2, weiter. Immer mit Blick nach vorn.
  viereck: {
    name: 'Viereck-Drill', oben: true, start: [0.4, -0.4], requisiten: viereckTape,
    teile: [
      ...einsZwei, ...dreiSchritte(0, 0.8),
      ...einsZwei, ...dreiSchritte(-0.8, 0),
      ...einsZwei, ...dreiSchritte(0, -0.8),
      ...einsZwei, ...dreiSchritte(0.8, 0),
    ],
  },
  // Drehen auf dem vorderen Fußballen, dann 1-2. Einmal hin, einmal zurück.
  drehen: {
    name: 'Drehen auf dem vorderen Fußballen', oben: true,
    teile: [warte(0.2), drehung(60), warte(0.15), ...einsZwei, drehung(-60), warte(0.15), ...einsZwei],
  },
  rein_raus: {
    name: 'Rein-Raus', oben: true,
    teile: [warte(0.2), gehen(0, 0.22, 0.42), B.jab, B.cross, warte(0.3), gehen(0, -0.22, 0.7)],
  },
  // Winkel: nach der 1-2-3 seitlich raus und wieder zum Gegner drehen.
  winkel: {
    name: 'Winkel nach der Kombi', oben: true,
    teile: [B.jab, B.cross, B.haken, warte(0.35), gehen(0.28, 0, 0.5), drehung(-40), warte(0.7), drehung(40), gehen(-0.28, 0, 0.6)],
  },
  // Linie: vorderer Fuß links, hinterer rechts vom Tape. Die Füße kreuzen nie.
  linie: {
    name: 'Linien-Drill', oben: true,
    requisiten: [{ art: 'stab', von: [0, 0.008, -1.2], nach: [0, 0.008, 1.2], ...TAPE }],
    teile: [warte(0.2), gehen(0, 0.15), gehen(0, 0.15, 0.8), gehen(0, -0.15), gehen(0, -0.15, 0.7)],
  },
  // Slip-Seil: unter dem Seil durch von Seite zu Seite, dabei vorwärts.
  slip_seil: {
    name: 'Slip-Seil', start: [0, -0.3],
    blick: { ziel: [0, 0.95, 0], seite: 25, hoehe: 8, abstand: 5 },
    requisiten: [{ art: 'stab', von: [0, 1.42, -1.4], nach: [0, 1.42, 1.4], dick: 0.008, farbe: 'bandage' }],
    teile: [
      { ...abrollen(1, 0.60, 0.15), weiter: 0.6 }, gehen(0, 0.2, 0.5),
      { ...abrollen(-1, 0.60, 0.15), weiter: 0.6 }, gehen(0, 0.2, 0.6),
    ],
  },
  // Slip außen -> 2, Slip innen -> 3
  slip_konter: {
    name: 'Slip und Konter',
    teile: [B.slip_aussen, B.cross, warte(0.5), B.slip_innen, B.haken],
  },
  // Unter dem Haken abrollen -> 3-2
  abrollen_konter: {
    name: 'Abrollen und Konter',
    teile: [B.abrollen, B.haken, B.cross],
  },
  // Sack anstoßen, zur Seite ausweichen, kontern
  sack_pendel: {
    name: 'Sack-Pendel', oben: true,
    blick: { ziel: [0, 1.0, 0.4], seite: 70, hoehe: 8, abstand: 6.2 },
    requisiten: [{ art: 'sack', oben: [0, 2.7, 0.95], laenge: 1.05, grad: 15 }],
    teile: [B.finte, warte(0.25), gehen(0.24, 0, 0.6), B.cross, warte(0.55), gehen(-0.24, 0, 0.6)],
  },
};

// Andere Namen für dieselbe Bewegung
export const GLEICH = {
  schattenboxen: '1-2',
};
