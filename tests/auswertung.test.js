// Prüfungen für Wochenübersicht, Testreihen, Zusammenfassung und Sicherung.
import test from 'node:test';
import assert from 'node:assert/strict';
import { wochenZahlen, letzteWochen, testReihen, zusammenfassung, blockPruefen, BLOCK_FORMAT } from '../js/auswertung.js';
import { sicherungLesen, sicherungFaellig } from '../js/daten.js';

const eintraege = [
  { tag: '2026-11-16', einheit: 'C', runden: 9, anstrengung: 5, kombis: ['1-2-3-2'], geschafft: true, muedigkeit: 2, dauer: 45 },
  { tag: '2026-11-23', einheit: 'C', runden: 9, anstrengung: 6, kombis: ['1-2K-3'], geschafft: true, muedigkeit: 2, dauer: 45 },
  { tag: '2026-11-24', einheit: 'A', runden: 12, anstrengung: 8, kombis: ['1-2K-3'], geschafft: false, muedigkeit: 4, dauer: 45 },
  { tag: '2026-11-29', einheit: 'sparring', anstrengung: 9, sparringHaerte: 5 },
];

test('Wochenzahlen: Einheiten, Runden, Anstrengung, Kombis', () => {
  const z = wochenZahlen(eintraege.slice(1));
  assert.equal(z.einheiten, 2);
  assert.equal(z.sparring, 1);
  assert.equal(z.runden, 21);
  assert.equal(z.anstrengung, 7.7);
  assert.deepEqual(z.kombis, ['1-2K-3']);
});

test('Letzte Wochen: aktuelle zuerst, Montag bis Sonntag', () => {
  const wochen = letzteWochen(eintraege, new Date(2026, 10, 26));
  assert.equal(wochen[0].einheiten, 2);
  assert.equal(wochen[0].sparring, 1);
  assert.equal(wochen[1].einheiten, 1);
  assert.equal(wochen[2].einheiten, 0);
});

test('Testreihen: nur Stationen mit Werten, in Testreihenfolge', () => {
  const reihen = testReihen([
    { datum: '2026-11-01T10:00:00Z', werte: { liegestuetz: 30, burpee: 40 } },
    { datum: '2026-11-29T10:00:00Z', werte: { liegestuetz: 34 } },
  ]);
  assert.deepEqual(reihen.map((r) => r.id), ['liegestuetz', 'burpee']);
  assert.deepEqual(reihen[0].punkte.map((p) => p.wert), [30, 34]);
  assert.equal(reihen[1].punkte.length, 1);
});

test('Zusammenfassung enthält Profil, Tests, Einträge und das Rückgabeformat', () => {
  const text = zusammenfassung({
    profil: {
      alter: 30, groesse: 180, gewicht: 80, erfahrungJahre: 3, andereSportarten: 'Judo', auslage: 'links',
      ziele: { technik: 5, schlagkraft: 7, ausdauer: 4 }, woche: ['C', 'A', null, 'B', null, null, null], dauer: 45,
      ausruestung: ['seil', 'sack'], sparring: { ja: true, tag: 6 }, beschwerden: { regionen: ['knie'], notiz: 'links' },
    },
    tests: [{ datum: '2026-11-01T10:00:00Z', werte: { liegestuetz: 30 } }],
    trainings: eintraege, stand: { anpassung: { A: { runden: 1 } } }, block: 1, woche: 2, heute: new Date(2026, 10, 30),
  });
  for (const stueck of ['30 Jahre, 180 cm, 80 kg', 'Judo', 'linke Hand vorn', 'Mo C, Di A, Do B', 'Knie (links)',
    'Block 1, Woche 2', 'Liegestütze am Stück: 30', '2026-11-24 Einheit A', 'nicht geschafft', 'Sparring: Härte 5/5', '"woche": 1']) {
    assert.ok(text.includes(stueck), `fehlt: ${stueck}`);
  }
});

test('Block von Claude prüfen', () => {
  const gut = BLOCK_FORMAT.slice(0, BLOCK_FORMAT.indexOf(']\nErlaubt') + 1);
  assert.equal(blockPruefen(`Hier ist dein Block:\n${gut}\nViel Erfolg!`).block.length, 4);
  assert.match(blockPruefen('kein json').fehler, /kein lesbares JSON/);
  assert.match(blockPruefen('[{"woche":1}]').fehler, /genau 4 Wochen/);
  assert.match(blockPruefen(gut.replace('"zirkelDurchgaenge"', '"gewichte"')).fehler, /kennt die App nicht/);
  assert.match(blockPruefen(gut.replace('"1-2K-3"', '"7-8"')).fehler, /kann die App nicht lesen/);
});

test('Sicherung lesen: nur Dateien aus dieser App', () => {
  assert.match(sicherungLesen('xx').fehler, /kein JSON/);
  assert.match(sicherungLesen('{"app":"anders","daten":{}}').fehler, /nicht aus dieser App/);
  assert.match(sicherungLesen('{"app":"boxtraining","fassung":99,"daten":{}}').fehler, /neueren Version/);
  const ok = sicherungLesen(JSON.stringify({ app: 'boxtraining', fassung: 1, gesichert: '2026-11-26T00:00:00Z',
    daten: { profil: { ich: {} }, tests: [{}], trainings: [{}, {}] } }));
  assert.deepEqual(ok.uebersicht, { gesichert: '2026-11-26T00:00:00Z', profil: true, tests: 1, trainings: 2 });
});

test('Erinnerung ans Sichern', () => {
  const jetzt = new Date(2026, 10, 30);
  assert.equal(sicherungFaellig([{}, {}], null, jetzt), false);
  assert.equal(sicherungFaellig([{}, {}, {}], null, jetzt), true);
  assert.equal(sicherungFaellig([{}, {}, {}], new Date(2026, 10, 25), jetzt), false);
  assert.equal(sicherungFaellig([{}, {}, {}], new Date(2026, 10, 1), jetzt), true);
});
