// Prüft, ob die Datendateien zueinander passen.  Aufruf:  node --test "tests/*.test.js"
import test from 'node:test';
import assert from 'node:assert/strict';
import { KOMBIS, zerlegen } from '../js/data/kombis.js';
import { UEBUNGEN, SEIL } from '../js/data/uebungen.js';
import { BEINARBEIT, ABWEHR, SACK_RUNDEN, SCHATTEN_ZIELE } from '../js/data/drills.js';
import { AUSRUESTUNG } from '../js/data/ausruestung.js';
import { EINHEITEN, WOCHE } from '../js/data/einheiten.js';
import { BLOCK, TEST } from '../js/data/block.js';

const kombiTexte = KOMBIS.map((k) => k.text);

test('Bibliotheken haben den Umfang aus dem Auftrag', () => {
  assert.equal(Object.keys(BEINARBEIT).length, 6);
  assert.equal(Object.keys(ABWEHR).length, 4);
  assert.equal(Object.keys(SEIL).length, 4);
  assert.equal(Object.keys(UEBUNGEN).length, 12); // 11 aus dem Auftrag + Hampelmänner
  assert.equal(SCHATTEN_ZIELE.length, 3);
  assert.equal(TEST.length, 7);
});

test('Jede Übung und jeder Drill hat 2–3 Hinweise und bekanntes Gerät', () => {
  for (const liste of [UEBUNGEN, SEIL, BEINARBEIT, ABWEHR, SACK_RUNDEN]) {
    for (const [id, e] of Object.entries(liste)) {
      assert.ok(e.hinweise.length >= 2 && e.hinweise.length <= 3, id);
      if (e.geraet) assert.ok(AUSRUESTUNG[e.geraet], `${id}: Gerät ${e.geraet}`);
      if (e.kombi) assert.doesNotThrow(() => zerlegen(e.kombi), id);
    }
  }
});

test('Einheiten verweisen nur auf vorhandene Übungen, Drills und Rundentypen', () => {
  for (const [kurz, einheit] of Object.entries(EINHEITEN)) {
    for (const b of einheit.bloecke) {
      const wo = `${kurz}/${b.id}`;
      for (const u of b.uebungen || []) assert.ok(UEBUNGEN[u.id || u], `${wo}: ${u.id || u}`);
      if (b.uebung) assert.ok(UEBUNGEN[b.uebung], wo);
      if (b.seil) assert.ok(SEIL[b.seil], wo);
      if (b.sack) assert.ok(SACK_RUNDEN[b.sack], wo);
      for (const w of b.wechsel || []) assert.ok(SACK_RUNDEN[w], `${wo}: ${w}`);
      for (const a of b.auswahl || []) assert.ok(ABWEHR[a], `${wo}: ${a}`);
    }
  }
});

test('Zeiten der Einheiten passen ungefähr in 30 bzw. 45 Minuten', () => {
  // Grobe Rechnung: Pausen nur, wo der Auftrag sie nennt; Zirkel und Kraftausdauer geschätzt.
  const minuten = (b, dauer) => {
    if (b.art === 'zeit' || b.art === 'amrap') return b.min[dauer];
    if (b.art === 'runden') {
      const n = b.runden[dauer];
      return (n * b.rundeSek + Math.max(0, n - 1) * (b.pauseSek || 0)) / 60;
    }
    if (b.art === 'intervall') return b.runden[dauer] * (b.arbeitSek + b.pauseSek) / 60;
    if (b.art === 'zirkel') return b.durchgaenge[dauer] * (60 + b.pauseSek) / 60;
    if (b.art === 'saetze') return b.durchgaenge[dauer] * 4;
    throw new Error(b.art);
  };
  for (const [kurz, einheit] of Object.entries(EINHEITEN)) {
    for (const dauer of [30, 45]) {
      const summe = einheit.bloecke.reduce((s, b) => s + minuten(b, dauer), 0);
      assert.ok(summe >= dauer - 8 && summe <= dauer + 5, `${kurz} ${dauer}: ${summe} Min`);
    }
  }
});

test('Woche: C, A, frei, B, frei, frei, Sparring', () => {
  assert.deepEqual(WOCHE.map((w) => w.einheit), ['C', 'A', null, 'B', null, null, 'sparring']);
});

test('Block: Kombis der Woche stehen in der Bibliothek', () => {
  assert.equal(BLOCK.length, 4);
  for (const w of BLOCK) for (const k of w.kombis) assert.ok(kombiTexte.includes(k), `Woche ${w.woche}: ${k}`);
  assert.equal(BLOCK[3].A.test, true);
  assert.equal(BLOCK[3].B.rundenFaktor, 0.5);
});

test('Test: Übungen vorhanden', () => {
  for (const t of TEST) if (t.uebung) assert.ok(UEBUNGEN[t.uebung], t.id);
});
