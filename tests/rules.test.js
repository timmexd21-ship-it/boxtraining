// Prüfungen für die Planregeln.  Aufruf:  node --test "tests/*.test.js"
import test from 'node:test';
import assert from 'node:assert/strict';
import { einheitBauen, wocheImBlock, kombisDerWoche, ersatzFuer, zielSchwerpunkt, schwaechsterBereich } from '../js/rules.js';

const profil = (mehr = {}) => ({
  dauer: 45, ziele: { technik: 5, schlagkraft: 5, ausdauer: 5 },
  ausruestung: ['seil', 'klimmzug', 'dips', 'sack', 'tape', 'slipseil'],
  beschwerden: { regionen: [], notiz: '' }, ...mehr,
});
const block = (einheit, id) => einheit.bloecke.find((b) => b.id === id);
const bau = (kurz, mehr = {}) => einheitBauen({ kurz, profil: profil(), ...mehr });

test('Woche und Block aus dem Datum', () => {
  const start = new Date(2026, 10, 23); // Montag
  assert.deepEqual(wocheImBlock(start, new Date(2026, 10, 26)), { block: 1, woche: 1 });
  assert.deepEqual(wocheImBlock(start, new Date(2026, 10, 30)), { block: 1, woche: 2 });
  assert.deepEqual(wocheImBlock(start, new Date(2026, 11, 20)), { block: 1, woche: 4 });
  assert.deepEqual(wocheImBlock(start, new Date(2026, 11, 21)), { block: 2, woche: 1 });
});

test('Kombi der Woche: Block 1 wie im Auftrag, Block 2 aus Stufe 2', () => {
  assert.deepEqual(kombisDerWoche(1, 1), ['1-2-3-2']);
  assert.deepEqual(kombisDerWoche(1, 2), ['1-2K-3']);
  assert.equal(kombisDerWoche(1, 4).length, 3);
  assert.deepEqual(kombisDerWoche(2, 1), ['1-2K']);
  assert.equal(kombisDerWoche(3, 1)[0], '1-2, Schritt seitlich, 3-2');
});

test('Einheit A, 45 Min, Woche 1: Zahlen aus dem Auftrag', () => {
  const a = bau('A');
  assert.deepEqual(a.bloecke.map((b) => b.id), ['aufwaermen', 'schatten', 'zirkel', 'power', 'technik_sack', 'rumpf', 'auslaufen']);
  assert.equal(block(a, 'zirkel').menge, '4 Durchgänge');
  assert.deepEqual(block(a, 'zirkel').liste, ['5 Klatsch-Liegestütze', '5 Hocksprünge', '3 Explosive Klimmzüge']);
  assert.equal(block(a, 'power').menge, '8 × 20 Sek.');
  assert.deepEqual(block(a, 'power').timer, { rundeSek: 20, pauseSek: 40, runden: 8, ansage: false });
  assert.equal(block(a, 'schatten').menge, '2 × 3 Min');
});

test('Einheit A, 30 Min: Technik am Sack entfällt, 6 Power-Runden', () => {
  const a = einheitBauen({ kurz: 'A', profil: profil({ dauer: 30 }) });
  assert.equal(block(a, 'technik_sack'), undefined);
  assert.equal(block(a, 'power').menge, '6 × 20 Sek.');
  assert.equal(block(a, 'zirkel').menge, '3 Durchgänge');
});

test('Wochen 2–4 (Abschnitt 5.5)', () => {
  assert.equal(block(bau('A', { woche: 2 }), 'zirkel').menge, '5 Durchgänge');
  assert.equal(block(bau('B', { woche: 2 }), 'sack_runden').timer.runden, 7);
  assert.equal(block(bau('C', { woche: 2 }), 'beinarbeit').timer.runden, 4);
  assert.equal(block(bau('A', { woche: 3 }), 'power').menge, '8 × 25 Sek.');
  assert.equal(block(bau('A', { woche: 3 }), 'zirkel').menge, '5 Durchgänge');
  assert.equal(block(bau('B', { woche: 3 }), 'sack_runden').timer.pauseSek, 45);
  assert.equal(block(bau('C', { woche: 3 }), 'abwehr').name, 'Slip-Seil mit Konter');
  assert.equal(bau('A', { woche: 4 }).test, true);
  assert.equal(block(bau('B', { woche: 4 }), 'sack_runden').timer.runden, 3);
  assert.equal(block(bau('C', { woche: 4 }), 'beinarbeit').timer.runden, 3);
});

test('Nächster Block startet mit den Werten aus Woche 3', () => {
  const a = bau('A', { block: 2, woche: 1 });
  assert.equal(block(a, 'zirkel').menge, '5 Durchgänge');
  assert.equal(block(a, 'power').menge, '8 × 25 Sek.');
});

test('Heute platt: 30er-Version, Power halbiert, Technik bleibt', () => {
  const a = bau('A', { platt: true });
  assert.equal(a.dauer, 30);
  assert.equal(block(a, 'power').menge, '3 × 20 Sek.');
  assert.equal(block(a, 'schatten').menge, '1 × 3 Min');
  const c = bau('C', { platt: true });
  assert.equal(block(c, 'technik_sack').timer.runden, 2);
});

test('Nach hartem Sparring: nur Seil, Beinarbeit, Schattenboxen', () => {
  const c = bau('C', { nurLeicht: true });
  assert.deepEqual(c.bloecke.map((b) => b.id), ['aufwaermen', 'beinarbeit', 'schatten']);
});

test('Kraftausdauer: 60 % vom Testmaximum', () => {
  const c = bau('C', { tests: [{ werte: { liegestuetz: 32, klimmzug: 9, dips: 14 } }] });
  assert.deepEqual(block(c, 'kraftausdauer').liste, ['6 Klimmzüge', '9 Dips', '20 Liegestütze']);
});

test('Beschwerden: ersetzen, nicht streichen', () => {
  assert.equal(ersatzFuer('hocksprung', ['knie']), 'liegestuetz');
  assert.equal(ersatzFuer('hocksprung', []), 'hocksprung');
  assert.equal(ersatzFuer('hocksprung', ['knie', 'handgelenk']), null); // Knie -> Liegestütze -> Handgelenk -> Hocksprünge
  const a = einheitBauen({ kurz: 'A', profil: profil({ beschwerden: { regionen: ['knie'] } }) });
  assert.deepEqual(block(a, 'zirkel').liste, ['5 Klatsch-Liegestütze', '5 Liegestütze', '3 Explosive Klimmzüge']);
  assert.ok(a.hinweise.some((h) => h.includes('statt Hocksprünge')));
  const s = einheitBauen({ kurz: 'A', profil: profil({ beschwerden: { regionen: ['schulter'] } }) });
  assert.equal(block(s, 'power').power, false);
});

test('Fehlendes Gerät', () => {
  const ohne = profil({ ausruestung: ['tape'] });
  const a = einheitBauen({ kurz: 'A', profil: ohne });
  assert.deepEqual(block(a, 'zirkel').liste, ['5 Klatsch-Liegestütze', '5 Hocksprünge', '3 Ausfallschritt-Sprünge']);
  assert.ok(block(a, 'power').text.startsWith('Ohne Sack'));
  const c = einheitBauen({ kurz: 'C', profil: ohne });
  assert.equal(block(c, 'abwehr').name, 'Slip und Konter');
  assert.deepEqual(block(c, 'kraftausdauer').liste.length, 1);
});

test('Schwerpunkte', () => {
  assert.equal(zielSchwerpunkt({ technik: 5, schlagkraft: 5, ausdauer: 5 }), null);
  assert.equal(zielSchwerpunkt({ technik: 2, schlagkraft: 9, ausdauer: 3 }), 'schlagkraft');
  const a = einheitBauen({ kurz: 'A', profil: profil({ ziele: { technik: 2, schlagkraft: 9, ausdauer: 3 } }) });
  assert.equal(block(a, 'power').menge, '10 × 20 Sek.');
  assert.equal(schwaechsterBereich([{ werte: { liegestuetz: 30 } }]), null);
  assert.equal(schwaechsterBereich([
    { werte: { liegestuetz: 30, weitsprung: 220, burpee: 40 } },
    { werte: { liegestuetz: 36, weitsprung: 221, burpee: 46 } },
  ]), 'schlagkraft');
});

test('Zeit: Einheiten bleiben im Rahmen', () => {
  for (const kurz of ['A', 'B', 'C']) {
    for (const dauer of [30, 45]) {
      const e = einheitBauen({ kurz, profil: profil({ dauer }) });
      assert.ok(e.minuten <= dauer + 3, `${kurz} ${dauer}: ${e.minuten} Min`);
    }
  }
});
