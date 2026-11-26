// Drill-Bibliothek (Abschnitt 5.3 des Auftrags): Beinarbeit, Abwehr, Sack-Rundentypen, Schattenboxen.
//
//   text      die Beschreibung aus dem Auftrag
//   geraet    was man dafür braucht (siehe ausruestung.js), null = nichts
//   kombi     Kombi, die zum Drill gehört (Schreibweise wie in kombis.js)
//   hinweise  2–3 kurze Technik-Hinweise (von Claude formuliert – bitte lesen und ändern)

export const BEINARBEIT = {
  step_drag: {
    name: 'Step-Drag', text: '5–8 cm Schritte in alle Richtungen', geraet: null,
    hinweise: ['Der Fuß in Laufrichtung geht zuerst', 'Abstand der Füße bleibt gleich', 'Kleine Schritte, nicht hüpfen'],
  },
  viereck: {
    name: 'Viereck-Drill', text: '1×1 m Tape, an jeder Ecke 1-2', geraet: 'tape', kombi: '1-2',
    hinweise: ['An jeder Ecke erst stehen, dann schlagen', 'Füße kreuzen nie', 'Hände nach der Kombi zurück ans Kinn'],
  },
  drehen: {
    name: 'Drehen auf dem vorderen Fußballen', text: '45–90° drehen, dann 1-2', geraet: null, kombi: '1-2',
    hinweise: ['Vorderer Ballen bleibt am Boden', 'Hinterer Fuß schwingt herum', 'Nach der Drehung sofort wieder in der Stellung'],
  },
  rein_raus: {
    name: 'Rein-Raus', text: 'rein, 1-2, raus', geraet: null, kombi: '1-2',
    hinweise: ['Mit dem Schritt rein schlagen', 'Sofort wieder raus aus der Reichweite', 'Deckung bleibt oben'],
  },
  winkel: {
    name: 'Winkel nach der Kombi', text: '1-2-3, seitlich raus', geraet: null, kombi: '1-2-3',
    hinweise: ['Nach dem Haken nicht stehen bleiben', 'Seitlich raus, nicht gerade zurück', 'Am Ende wieder zum Gegner zeigen'],
  },
  linie: {
    name: 'Linien-Drill', text: 'auf Tape-Linie, Füße kreuzen nie', geraet: 'tape',
    hinweise: ['Vorderer Fuß links, hinterer rechts der Linie', 'Füße kreuzen nie', 'Blick nach vorn, nicht auf den Boden'],
  },
};

export const ABWEHR = {
  slip_seil: {
    name: 'Slip-Seil', text: 'Seil auf Schulterhöhe, daran entlang abrollen', geraet: 'slipseil',
    hinweise: ['Aus den Knien abtauchen, nicht aus dem Rücken', 'Augen bleiben vorn', 'Hände bleiben am Kinn'],
  },
  slip_konter: {
    name: 'Slip und Konter', text: 'Slip außen → 2, Slip innen → 3', geraet: null,
    hinweise: ['Kleine Bewegung, nur so weit wie nötig', 'Der Slip lädt den Konter auf', 'Gewicht bleibt zwischen den Füßen'],
  },
  abrollen_konter: {
    name: 'Abrollen und Konter', text: 'unter Haken abrollen → 3-2', geraet: null, kombi: '3-2',
    hinweise: ['Aus den Knien, Rücken bleibt gerade', 'Unter dem Schlag durch, auf der anderen Seite hoch', 'Aus dem Hochkommen kontern'],
  },
  sack_pendel: {
    name: 'Sack-Pendel', text: 'Sack anstoßen, ausweichen, kontern', geraet: 'sack',
    hinweise: ['Den Sack kommen lassen', 'Mit den Füßen ausweichen, nicht nur mit dem Kopf', 'Kontern, wenn der Sack vorbei ist'],
  },
};

// Rundentypen am Sack
export const SACK_RUNDEN = {
  technik: {
    name: 'Technik', text: '60–70 %, ein Fokuspunkt',
    hinweise: ['Sauber vor hart', 'Ein Fokuspunkt pro Runde', 'Nach jeder Kombi bewegen'],
  },
  power: {
    name: 'Power', text: '20–30 Sek. volle Kraft',
    hinweise: ['Jeder Schlag mit voller Kraft', 'Fuß und Hüfte drehen mit', 'In der Pause ganz runterkommen'],
  },
  volumen: {
    name: 'Volumen', text: 'leicht und schnell, bei jedem Schlag ausatmen',
    hinweise: ['Leicht und schnell', 'Bei jedem Schlag ausatmen', 'Nicht stehen bleiben'],
  },
  tempo: {
    name: 'Tempo-Intervalle', text: '15/15', arbeitSek: 15, pauseSek: 15,
    hinweise: ['15 Sek. Vollgas, 15 Sek. locker weiterarbeiten', 'Im lockeren Teil die Hände oben lassen', 'Technik halten, auch wenn es brennt'],
  },
  bewegung: {
    name: 'Bewegung', text: 'Kombi, raus, Winkel, rein',
    hinweise: ['Nach jeder Kombi raus', 'Über den Winkel wieder rein', 'Der Sack schwingt: mitgehen statt festhalten'],
  },
  // steht in Einheit B im Wechsel mit den anderen
  kombi_ansage: {
    name: 'Kombi-Ansage', text: 'Kombis nach Ansage',
    hinweise: ['Erst hören, dann schlagen', 'Zwischen den Ansagen bewegen', 'Hände zurück ans Kinn'],
  },
};

// Ziele fürs Schattenboxen: jede Runde bekommt eins
export const SCHATTEN_ZIELE = [
  'Nur Jab und Beinarbeit',
  'Jede Kombi endet mit Abwehr',
  'Gegner drückt nach vorn',
];

// Festes Ziel im Schattenboxen der Einheit A
export const SCHATTEN_ZIEL_KRAFT = 'Fuß und Hüfte drehen bei jedem 2 und 3';
