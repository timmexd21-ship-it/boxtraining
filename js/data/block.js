// Der 4-Wochen-Block (Abschnitt 5.5) und der Test (Abschnitt 5.6).
//
// Jede Woche sagt, was sich gegenüber der Basis ändert:
//   A.zirkelDurchgaenge  +1 = ein Durchgang mehr im Explosiv-Zirkel
//   A.powerSek           Länge der Power-Runden in Sekunden
//   A.test               Test statt Training
//   B.sackRunden         +1 = eine Sack-Runde mehr
//   B.pauseSek           Pause zwischen den Sack-Runden
//   B.rundenFaktor       0.5 = halbe Rundenzahl
//   C.beinarbeitDrills   +1 = ein Beinarbeit-Drill mehr
//   C.slipSeilMitKonter  Slip-Seil mit Konter
// Woche 2 und 3 bauen aufeinander auf: Woche 3 (Spitze) hat alles aus Woche 2 und
// zusätzlich das, was bei Woche 3 steht. Woche 4 (Entlastung) geht zurück auf die Basis.

export const BLOCK = [
  { woche: 1, name: 'Einstieg', A: {}, B: {}, C: {}, kombis: ['1-2-3-2'] },
  { woche: 2, name: 'Aufbau', A: { zirkelDurchgaenge: 1 }, B: { sackRunden: 1 }, C: { beinarbeitDrills: 1 }, kombis: ['1-2K-3'] },
  // Im Auftrag steht hier "1-2, Abrollen, 3-2". Die gibt es in der Bibliothek nicht;
  // genommen ist die Fassung aus der Bibliothek. Zum Ändern einfach den Text tauschen
  // (und die Kombi in kombis.js ergänzen).
  { woche: 3, name: 'Spitze', A: { powerSek: 25 }, B: { pauseSek: 45 }, C: { slipSeilMitKonter: true }, kombis: ['1-2-3, Abrollen, 3-2'] },
  { woche: 4, name: 'Entlastung + Test', A: { test: true }, B: { rundenFaktor: 0.5 }, C: {},
    kombis: ['1-2-3-2', '1-2K-3', '1-2-3, Abrollen, 3-2'] },
];

// Nächster Block: Basis = Werte aus Woche 3, Kombis aus der nächsten Stufe.
export const NAECHSTER_BLOCK = { basisAusWoche: 3, kombisAusNaechsterStufe: true };

// Neue Kombis immer in dieser Reihenfolge einführen
export const KOMBI_EINFUEHRUNG = ['Schattenboxen', 'Sack', 'Sparring'];

// Test: am Start und jede 4. Woche, frisch, immer in dieser Reihenfolge.
//   art 'max'  = so viele wie möglich am Stück
//   art 'zeit' = so viele wie möglich in sek Sekunden (mit Timer)
//   art 'weite' = bester von mehreren Versuchen
//   geraet      = fehlt dieses Gerät, wird die Station ausgelassen
//   bereich     = wozu der Wert zählt, wenn der schwächste Bereich gesucht wird
//                 (Zuordnung von Claude vorgeschlagen)
export const TEST = [
  { id: 'liegestuetz', name: 'Liegestütze am Stück', art: 'max', einheit: 'Wdh.', bereich: 'kraftausdauer', uebung: 'liegestuetz' },
  { id: 'klimmzug', name: 'Klimmzüge am Stück', art: 'max', einheit: 'Wdh.', bereich: 'kraftausdauer', uebung: 'klimmzug', geraet: 'klimmzug' },
  { id: 'dips', name: 'Dips am Stück', art: 'max', einheit: 'Wdh.', bereich: 'kraftausdauer', uebung: 'dips', geraet: 'dips' },
  { id: 'weitsprung', name: 'Weitsprung aus dem Stand', art: 'weite', versuche: 3, einheit: 'cm', bereich: 'schlagkraft', uebung: 'weitsprung',
    text: 'Bester von 3. Ersatz für eine Schlagkraft-Messung: Sprungkraft hängt mit Schlagkraft zusammen.' },
  { id: 'schlaege', name: 'Schläge in 30 Sek. am Sack', art: 'zeit', sek: 30, einheit: 'Schläge', bereich: 'ausdauer', geraet: 'sack' },
  { id: 'seil', name: 'Seilsprünge in 2 Min', art: 'zeit', sek: 120, einheit: 'Sprünge', bereich: 'ausdauer', geraet: 'seil' },
  { id: 'burpee', name: 'Burpees in 3 Min', art: 'zeit', sek: 180, einheit: 'Wdh.', bereich: 'ausdauer', uebung: 'burpee' },
];
