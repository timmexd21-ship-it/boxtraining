// Kombinations-Bibliothek (Abschnitt 5.4 des Auftrags).
// Hier kannst du Kombis ändern oder ergänzen. Schreibweise:
//   Schläge mit Bindestrich:  1-2-3
//   K direkt hinter der Zahl = zum Körper:  1-2K-3
//   Bewegungen durch Komma getrennt:  1-2, Slip, 2
//   Finte vor einem Schlag:  Finte 1, 2-3-2

// Nummernsystem für Linksausleger (linke Hand vorn). Bei Rechtsauslegern
// bleibt die Nummer gleich, nur die Seite ist gespiegelt.
//   name   = volle Bezeichnung
//   wort   = kurzes Wort für die Ansage
//   zahl   = Zahlwort für die Ansage
//   sprich = optional: so wird "wort" für die deutsche Stimme geschrieben
export const SCHLAEGE = {
  1: { name: 'Jab', wort: 'Jab', zahl: 'eins', sprich: 'Dschäb' },
  2: { name: 'Cross', wort: 'Cross', zahl: 'zwei', sprich: 'Kross' },
  3: { name: 'vorderer Haken', wort: 'Haken', zahl: 'drei' },
  4: { name: 'hinterer Haken', wort: 'hinterer Haken', zahl: 'vier' },
  5: { name: 'vorderer Aufwärtshaken', wort: 'Aufwärtshaken', zahl: 'fünf' },
  6: { name: 'hinterer Aufwärtshaken', wort: 'hinterer Aufwärtshaken', zahl: 'sechs' },
};

// Zusatz "K" = zum Körper
export const KOERPER = { name: 'zum Körper', wort: 'Körper' };

// Bewegungen, die in Kombis vorkommen dürfen
export const BEWEGUNGEN = {
  slip: { name: 'Slip', wort: 'Slip' },
  abrollen: { name: 'Abrollen', wort: 'Abrollen' },
  raus: { name: 'Raus', wort: 'Raus' },
  seit: { name: 'Schritt seitlich', wort: 'Schritt seitlich' },
  finte: { name: 'Finte', wort: 'Finte' },
};

export const KOMBIS = [
  { stufe: 1, text: '1-2' },
  { stufe: 1, text: '1-1-2' },
  { stufe: 1, text: '1-2-3' },
  { stufe: 1, text: '1-2-3-2' },
  { stufe: 1, text: '1, Raus' },

  { stufe: 2, text: '1-2K' },
  { stufe: 2, text: '1-1K-2' },
  { stufe: 2, text: '2-3-2' },
  { stufe: 2, text: '1-6-3' },
  { stufe: 2, text: '3K-3' },
  { stufe: 2, text: '1-2, Slip, 2' },
  { stufe: 2, text: '1-2K-3' },

  { stufe: 3, text: '1-2-3, Abrollen, 3-2' },
  { stufe: 3, text: '1-2, Schritt seitlich, 3-2' },
  { stufe: 3, text: '5-2-3' },
  { stufe: 3, text: 'Finte 1, 2-3-2' },
  { stufe: 3, text: '4K-3-4K-3' },
  { stufe: 3, text: 'Slip, 2-3, Raus' },
];

// ---------------------------------------------------------------
// Ab hier Technik: zerlegt den Text einer Kombi in einzelne Teile.
// ---------------------------------------------------------------

const BEWEGUNG_NACH_NAME = Object.fromEntries(
  Object.entries(BEWEGUNGEN).map(([kurz, b]) => [b.name.toLowerCase(), kurz]),
);

// '1-2K, Slip, 2' -> Gruppen von Teilen:
// [[{schlag:1},{schlag:2,koerper:true}], [{bewegung:'slip'}], [{schlag:2}]]
export function zerlegen(text) {
  return text.split(',').map((roh) => {
    let stueck = roh.trim();
    const gruppe = [];
    const finte = stueck.match(/^Finte\s+(.+)$/i);
    if (finte) {
      gruppe.push({ bewegung: 'finte' });
      stueck = finte[1];
    }
    if (/^[1-6]K?(-[1-6]K?)*$/.test(stueck)) {
      for (const s of stueck.split('-')) {
        gruppe.push({ schlag: Number(s[0]), koerper: s.endsWith('K') });
      }
    } else {
      const kurz = BEWEGUNG_NACH_NAME[stueck.toLowerCase()];
      if (!kurz) throw new Error(`Kombi "${text}": "${stueck}" kenne ich nicht.`);
      gruppe.push({ bewegung: kurz });
    }
    return gruppe;
  });
}

// Text, den die Stimme spricht. art: 'zahl' ("eins zwei drei") oder 'wort' ("Jab, Cross, Haken")
export function ansageText(text, art = 'zahl') {
  return zerlegen(text)
    .map((gruppe) => gruppe.map((teil) => {
      if (teil.bewegung) return BEWEGUNGEN[teil.bewegung].wort;
      const s = SCHLAEGE[teil.schlag];
      const gesprochen = art === 'wort' ? (s.sprich || s.wort) : s.zahl;
      return teil.koerper ? `${gesprochen} ${KOERPER.wort}` : gesprochen;
    }).join(', '))
    .join(', ');
}

// Alle Kombis bis einschließlich dieser Stufe
export function kombisBisStufe(stufe) {
  return KOMBIS.filter((k) => k.stufe <= stufe);
}
