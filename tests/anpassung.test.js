// Prüfungen für die Anpassung nach dem Training (Abschnitt 5.7).
import test from 'node:test';
import assert from 'node:assert/strict';
import { einheitBauen, naechsteAnpassung, muedeVorschlag, nachHartemSparring, rundenDer } from '../js/rules.js';

const profil = {
  dauer: 45, ziele: { technik: 5, schlagkraft: 5, ausdauer: 5 },
  ausruestung: ['seil', 'klimmzug', 'dips', 'sack', 'tape', 'slipseil'],
  beschwerden: { regionen: [], notiz: '' },
};
const block = (einheit, id) => einheit.bloecke.find((b) => b.id === id);
const werte = (a) => [a.runden, a.durchgaenge, a.pauseSek];

test('Alles geschafft und Anstrengung ≤ 7: reihum +1 Runde, +1 Durchgang, −10 Sek. Pause', () => {
  let a = {};
  const gut = { geschafft: true, anstrengung: 6, woche: 1 };
  a = naechsteAnpassung(a, gut, null).anpassung;
  assert.deepEqual(werte(a), [1, 0, 0]);
  a = naechsteAnpassung(a, gut, gut).anpassung;
  assert.deepEqual(werte(a), [1, 1, 0]);
  a = naechsteAnpassung(a, gut, gut).anpassung;
  assert.deepEqual(werte(a), [1, 1, -10]);
  const e = einheitBauen({ kurz: 'A', profil, anpassung: a });
  assert.equal(block(e, 'power').menge, '9 × 20 Sek.');
  assert.equal(block(e, 'zirkel').menge, '5 Durchgänge');
  assert.equal(block(e, 'zirkel').timer.rundeSek, 80);
});

test('Anstrengung 8–10: gleich lassen', () => {
  for (const anstrengung of [8, 9, 10]) {
    const a = naechsteAnpassung({}, { geschafft: true, anstrengung, woche: 1 }, null).anpassung;
    assert.deepEqual(werte(a), [0, 0, 0]);
  }
});

test('Zweimal hintereinander nicht geschafft: eine Stufe zurück', () => {
  const start = { runden: 1, durchgaenge: 1, pauseSek: 0, verlauf: ['runden', 'durchgaenge'] };
  const nicht = { geschafft: false, anstrengung: 9, woche: 2 };
  const einmal = naechsteAnpassung(start, nicht, { geschafft: true }).anpassung;
  assert.deepEqual(werte(einmal), [1, 1, 0]);
  const zweimal = naechsteAnpassung(einmal, nicht, nicht).anpassung;
  assert.deepEqual(werte(zweimal), [1, 0, 0]);
});

test('Verkürzte Einheit und Entlastungswoche ändern nichts', () => {
  const gut = { geschafft: true, anstrengung: 5 };
  assert.equal(naechsteAnpassung({}, { ...gut, platt: true, woche: 1 }, null).anpassung.runden, 0);
  assert.equal(naechsteAnpassung({}, { ...gut, woche: 4 }, null).anpassung.runden, 0);
});

test('Schichtmüdigkeit 4–5: 30er-Version vorschlagen', () => {
  assert.equal(muedeVorschlag([{ einheit: 'A', tag: '2026-11-24', muedigkeit: 4 }], '2026-11-25'), true);
  assert.equal(muedeVorschlag([{ einheit: 'A', tag: '2026-11-24', muedigkeit: 3 }], '2026-11-25'), false);
  assert.equal(muedeVorschlag([{ einheit: 'A', tag: '2026-11-20', muedigkeit: 5 }], '2026-11-25'), false);
});

test('Hartes Sparring: nächstes Training nur leicht', () => {
  const hart = { einheit: 'sparring', tag: '2026-11-22', sparringHaerte: 4 };
  assert.equal(nachHartemSparring([hart], '2026-11-23'), true);
  assert.equal(nachHartemSparring([{ ...hart, sparringHaerte: 3 }], '2026-11-23'), false);
  assert.equal(nachHartemSparring([hart, { einheit: 'C', tag: '2026-11-23' }], '2026-11-24'), false);
  assert.equal(nachHartemSparring([hart], '2026-11-27'), false);
});

test('Runden einer Einheit zählen', () => {
  assert.equal(rundenDer(einheitBauen({ kurz: 'A', profil })), 2 + 8 + 2);
  assert.equal(rundenDer(einheitBauen({ kurz: 'B', profil })), 6 + 6);
});
