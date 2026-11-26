// Körpergewichts-Übungen und Seil (Abschnitt 5.3 des Auftrags).
//
//   geraet    was man dafür braucht (siehe ausruestung.js), null = nichts
//   art       'explosiv' (nur frisch, volle Geschwindigkeit), 'kraft', 'rumpf', 'ausdauer',
//             'aufwaermen' (allgemeine Übung zum Warmwerden)
//   hinweise  2–3 kurze Technik-Hinweise für die Trainingsansicht
//             (von Claude formuliert – bitte lesen und ändern, wenn du es anders machst)

export const UEBUNGEN = {
  // nachträglich von dir freigegeben (allgemeine Übung zum Warmwerden)
  hampelmann: {
    name: 'Hampelmänner', art: 'aufwaermen', geraet: null,
    hinweise: ['Arme ganz nach oben', 'Auf den Ballen federn', 'Gleichmäßiges Tempo'],
  },
  klatsch_liegestuetz: {
    name: 'Klatsch-Liegestütze', art: 'explosiv', geraet: null,
    hinweise: ['Körper bleibt ein Brett', 'So schnell hoch, dass die Hände abheben', 'Weich landen, Ellbogen geben nach'],
  },
  explosiv_klimmzug: {
    name: 'Explosive Klimmzüge', art: 'explosiv', geraet: 'klimmzug',
    hinweise: ['Aus dem langen Hang starten', 'So schnell hochziehen wie möglich', 'Kontrolliert ablassen'],
  },
  hocksprung: {
    name: 'Hocksprünge', art: 'explosiv', geraet: null,
    hinweise: ['Tief in die Hocke, Fersen am Boden', 'Mit voller Kraft abspringen', 'Leise und weich landen'],
  },
  ausfallschritt_sprung: {
    name: 'Ausfallschritt-Sprünge', art: 'explosiv', geraet: null,
    hinweise: ['Oberkörper aufrecht', 'In der Luft die Beine wechseln', 'Vorderes Knie bleibt über dem Fuß'],
  },
  weitsprung: {
    name: 'Weitsprung aus dem Stand', art: 'explosiv', geraet: null,
    hinweise: ['Arme holen Schwung', 'Aus beiden Beinen abspringen', 'Stehen bleiben nach der Landung'],
  },
  liegestuetz: {
    name: 'Liegestütze', art: 'kraft', geraet: null,
    hinweise: ['Körper bleibt ein Brett', 'Brust bis knapp über den Boden', 'Ellbogen schräg nach hinten'],
  },
  dips: {
    name: 'Dips', art: 'kraft', geraet: 'dips',
    hinweise: ['Schultern unten halten', 'Runter, bis die Oberarme waagerecht sind', 'Oben ganz strecken'],
  },
  klimmzug: {
    name: 'Klimmzüge', art: 'kraft', geraet: 'klimmzug',
    hinweise: ['Aus dem langen Hang starten', 'Kinn über die Stange', 'Nicht schwingen'],
  },
  burpee: {
    name: 'Burpees', art: 'ausdauer', geraet: null,
    hinweise: ['Brust zum Boden', 'Füße nah an die Hände springen', 'Oben ganz strecken und abspringen'],
  },
  russian_twist: {
    name: 'Russian Twists', art: 'rumpf', geraet: null,
    hinweise: ['Rücken gerade, leicht zurückgelehnt', 'Schultern drehen, nicht nur die Arme', 'Ruhig weiteratmen'],
  },
  schultertippen: {
    name: 'Unterarmstütz mit Schultertippen', art: 'rumpf', geraet: null,
    hinweise: ['Hüfte bleibt ruhig, nicht kippen', 'Füße etwas breiter stellen', 'Langsam, nicht hetzen'],
  },
};

export const SEIL = {
  grundsprung: {
    name: 'Grundsprung', geraet: 'seil',
    hinweise: ['Kleine Sprünge auf den Ballen', 'Handgelenke drehen das Seil', 'Ellbogen am Körper'],
  },
  boxer_skip: {
    name: 'Boxer-Skip', geraet: 'seil',
    hinweise: ['Gewicht wandert von Fuß zu Fuß', 'Locker bleiben, flach springen', 'Gleichmäßig atmen'],
  },
  kniehebelauf: {
    name: 'Kniehebelauf', geraet: 'seil',
    hinweise: ['Knie bis Hüfthöhe', 'Oberkörper aufrecht', 'Hohes Tempo, kurze Bodenkontakte'],
  },
  doppelsprung: {
    name: 'Doppelsprünge', geraet: 'seil',
    hinweise: ['Etwas höher springen', 'Seil schnell aus dem Handgelenk', 'Körper gestreckt lassen'],
  },
};
