// Die drei Einheiten A, B, C in der 30- und 45-Minuten-Version (Abschnitt 5.2)
// und die Wochenstruktur (Abschnitt 5.1).
//
// Jeder Block hat eine "art":
//   'zeit'      einfach so viele Minuten                    -> min
//   'runden'    Runden mit Pause dazwischen                 -> runden, rundeSek, pauseSek
//   'intervall' kurze Belastung / Pause im Wechsel          -> runden, arbeitSek, pauseSek
//   'zirkel'    Übungen hintereinander, dann Pause          -> durchgaenge, pauseSek, uebungen
//   'saetze'    Kraftausdauer mit Anteil vom Testmaximum    -> durchgaenge, anteil, uebungen
//   'amrap'     so viele wie möglich in der Zeit            -> min, uebung
// Werte mit { 30: …, 45: … } hängen von der Dauer der Einheit ab. 0 = Block entfällt.

// Pause zwischen 3-Minuten-Runden. Im Auftrag steht sie nur bei den Sack-Runden der
// Einheit B (1 Min); für die anderen Runden-Blöcke ist derselbe Wert angenommen.
export const PAUSE_ZWISCHEN_RUNDEN = 60;

export const EINHEITEN = {
  A: {
    name: 'Schlagkraft und Explosivität',
    intensitaet: 'hart, kurz',
    merksatz: 'Explosive Übungen nur frisch. Lieber weniger Wiederholungen mit voller Geschwindigkeit.',
    bloecke: [
      { id: 'aufwaermen', name: 'Aufwärmen', art: 'zeit', min: { 30: 5, 45: 5 },
        text: 'Seil locker, Schultern, Hüfte, Handgelenke', seil: 'grundsprung' },
      { id: 'schatten', name: 'Schattenboxen', art: 'runden', runden: { 30: 1, 45: 2 }, rundeSek: 180,
        ziel: 'kraft' },
      { id: 'zirkel', name: 'Explosiv-Zirkel', art: 'zirkel', durchgaenge: { 30: 3, 45: 4 }, pauseSek: 90,
        uebungen: [
          { id: 'klatsch_liegestuetz', wdh: 5 },
          { id: 'hocksprung', wdh: 5 },
          { id: 'explosiv_klimmzug', wdh: 3 },
        ] },
      { id: 'power', name: 'Power-Runden am Sack', art: 'intervall', runden: { 30: 6, 45: 8 },
        arbeitSek: 20, pauseSek: 40, sack: 'power', text: '2er-Kombis volle Kraft', power: true },
      { id: 'technik_sack', name: 'Technik am Sack', art: 'runden', runden: { 30: 0, 45: 2 }, rundeSek: 180,
        sack: 'technik', text: '70 % Kraft' },
      { id: 'rumpf', name: 'Rumpf', art: 'zeit', min: { 30: 2, 45: 4 },
        uebungen: ['russian_twist', 'schultertippen'] },
      { id: 'auslaufen', name: 'Auslaufen, Dehnen', art: 'zeit', min: { 30: 2, 45: 3 } },
    ],
  },

  B: {
    name: 'Boxausdauer',
    intensitaet: 'hart, lang',
    bloecke: [
      { id: 'aufwaermen', name: 'Aufwärmen', art: 'zeit', min: { 30: 4, 45: 5 },
        text: 'Seil im Boxer-Skip', seil: 'boxer_skip' },
      { id: 'seil_intervalle', name: 'Seil-Intervalle', art: 'intervall', runden: { 30: 4, 45: 6 },
        arbeitSek: 30, pauseSek: 30, seil: 'kniehebelauf', text: '30 Sek. Kniehebelauf, 30 Sek. locker' },
      { id: 'sack_runden', name: 'Sack-Runden', art: 'runden', runden: { 30: 4, 45: 6 }, rundeSek: 180, pauseSek: 60,
        text: '3 Min / 1 Min Pause, im Wechsel', wechsel: ['volumen', 'kombi_ansage', 'tempo', 'bewegung'] },
      { id: 'finisher', name: 'Finisher', art: 'amrap', min: { 30: 0, 45: 2 },
        uebung: 'burpee', text: 'Burpees so viele wie möglich' },
      { id: 'auslaufen', name: 'Auslaufen, Dehnen', art: 'zeit', min: { 30: 2, 45: 3 } },
    ],
  },

  C: {
    name: 'Technik und Beinarbeit',
    intensitaet: 'leicht bis mittel',
    merksatz: 'Nach dem Sparring: viel Bewegung, wenig Belastung.',
    bloecke: [
      { id: 'aufwaermen', name: 'Aufwärmen', art: 'zeit', min: { 30: 3, 45: 4 },
        text: 'Seil locker', seil: 'grundsprung' },
      { id: 'beinarbeit', name: 'Beinarbeit-Drills', art: 'runden', runden: { 30: 2, 45: 3 }, rundeSek: 180,
        drills: 'beinarbeit', anzahlDrills: 2 },
      { id: 'abwehr', name: 'Slip-Seil oder Slip und Konter', art: 'runden', runden: { 30: 1, 45: 2 }, rundeSek: 180,
        drills: 'abwehr', auswahl: ['slip_seil', 'slip_konter'] },
      { id: 'schatten', name: 'Schattenboxen mit Ziel', art: 'runden', runden: { 30: 1, 45: 2 }, rundeSek: 180,
        ziel: 'wechsel', kombiDerWoche: true },
      { id: 'technik_sack', name: 'Technik am Sack mit Kombi-Ansage', art: 'runden', runden: { 30: 2, 45: 3 }, rundeSek: 180,
        sack: 'technik', text: '60–70 %', ansage: true },
      { id: 'kraftausdauer', name: 'Kraftausdauer', art: 'saetze', durchgaenge: { 30: 1, 45: 2 }, anteil: 0.6,
        uebungen: ['klimmzug', 'dips', 'liegestuetz'], text: 'je ca. 60 % vom Testmaximum' },
    ],
  },
};

// Regel aus dem Auftrag: Passt eine 30er-Version zeitlich nicht, fällt der letzte Block weg.

// Wochenstruktur (Standard, im Onboarding änderbar).
// tag: 0 = Montagnacht … 6 = Sonntag.  einheit: 'A' | 'B' | 'C' | 'sparring' | null (frei)
export const WOCHE = [
  { tag: 0, name: 'Montagnacht', einheit: 'C', intensitaet: 'leicht bis mittel' },
  { tag: 1, name: 'Dienstagnacht', einheit: 'A', intensitaet: 'hart, kurz' },
  { tag: 2, name: 'Mittwochnacht', einheit: null },
  { tag: 3, name: 'Donnerstagnacht', einheit: 'B', intensitaet: 'hart, lang' },
  { tag: 4, name: 'Freitag', einheit: null },
  { tag: 5, name: 'Samstag', einheit: null },
  { tag: 6, name: 'Sonntag', einheit: 'sparring', intensitaet: 'sehr hart' },
];
