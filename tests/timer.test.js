// Prüfungen für Rundenlogik und Kombi-Bibliothek.  Aufruf:  node --test "tests/*.test.js"
import test from 'node:test';
import assert from 'node:assert/strict';
import { abschnitte, standBei, gesamtSek, alsZeit, Uhr, VORLAUF_SEK } from '../js/timer/uhr.js';
import { KOMBIS, zerlegen, ansageText, kombisBisStufe } from '../js/data/kombis.js';

const e = { rundeSek: 180, pauseSek: 60, runden: 3 };
const v = VORLAUF_SEK * 1000;

test('Ablauf: Vorlauf, dann Runden mit Pausen dazwischen, keine Pause am Ende', () => {
  assert.deepEqual(abschnitte(e).map((a) => a.art),
    ['vorlauf', 'runde', 'pause', 'runde', 'pause', 'runde']);
  assert.equal(gesamtSek(e), 3 * 180 + 2 * 60);
});

test('Stand zu bestimmten Zeitpunkten', () => {
  assert.equal(standBei(e, 0).art, 'vorlauf');
  assert.deepEqual(standBei(e, v), { art: 'runde', runde: 1, restMs: 180000, nummer: 1 });
  assert.equal(standBei(e, v + 179999).art, 'runde');
  const pause = standBei(e, v + 180000);
  assert.equal(pause.art, 'pause');
  assert.equal(pause.runde, 1);
  assert.equal(standBei(e, v + 240000).runde, 2);
  assert.equal(standBei(e, v + gesamtSek(e) * 1000 - 1).art, 'runde');
  assert.equal(standBei(e, v + gesamtSek(e) * 1000).art, 'ende');
});

test('Intervall 20/40 mit 8 Runden', () => {
  const i = { rundeSek: 20, pauseSek: 40, runden: 8 };
  assert.equal(gesamtSek(i), 8 * 20 + 7 * 40);
  assert.equal(standBei(i, v + 61000).runde, 2);
});

test('Uhr lässt sich anhalten', () => {
  let t = 1000;
  const uhr = new Uhr(() => t);
  uhr.starten(); t += 5000;
  uhr.anhalten(); t += 60000;
  assert.equal(uhr.vergangenMs(), 5000);
  uhr.starten(); t += 2000;
  assert.equal(uhr.vergangenMs(), 7000);
});

test('Zeitanzeige', () => {
  assert.equal(alsZeit(180), '3:00');
  assert.equal(alsZeit(20), '0:20');
  assert.equal(alsZeit(605), '10:05');
});

test('Bibliothek: 5 + 7 + 6 Kombis, alle lesbar', () => {
  assert.equal(kombisBisStufe(1).length, 5);
  assert.equal(kombisBisStufe(2).length, 12);
  assert.equal(KOMBIS.length, 18);
  for (const k of KOMBIS) assert.doesNotThrow(() => zerlegen(k.text), k.text);
});

test('Ansage als Zahl und als Wort', () => {
  assert.equal(ansageText('1-2-3', 'zahl'), 'eins, zwei, drei');
  assert.equal(ansageText('1-2K-3', 'zahl'), 'eins, zwei Körper, drei');
  assert.equal(ansageText('1-2, Slip, 2', 'zahl'), 'eins, zwei, Slip, zwei');
  assert.equal(ansageText('Finte 1, 2-3-2', 'zahl'), 'Finte, eins, zwei, drei, zwei');
  assert.equal(ansageText('1-2-3', 'wort'), 'Dschäb, Kross, Haken');
  assert.equal(ansageText('1-2, Schritt seitlich, 3-2', 'zahl'), 'eins, zwei, Schritt seitlich, drei, zwei');
});
