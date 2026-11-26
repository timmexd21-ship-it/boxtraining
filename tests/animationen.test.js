// Prüft: jede Übung, jeder Drill und jede Kombi hat eine Animation, die sich bauen lässt
// und zu jedem Zeitpunkt gültige Gelenke ergibt (kein Fuß im Boden, keine kaputten Werte).
import test from 'node:test';
import assert from 'node:assert/strict';
import { BEWEGUNGEN, ABLAEUFE, SCHLAG_BEWEGUNG, KOMBI_BEWEGUNG, gehen } from '../js/data/animations.js';
import { auswerten, spiegeln, zusammensetzen } from '../js/figur/bewegung.js';
import { gelenke } from '../js/figur/skelett.js';
import { KOMBIS, zerlegen } from '../js/data/kombis.js';
import { UEBUNGEN, SEIL } from '../js/data/uebungen.js';
import { BEINARBEIT, ABWEHR } from '../js/data/drills.js';

// Wie spieler.js, aber ohne Bildschirm
export function bauen(name) {
  if (BEWEGUNGEN[name]) return BEWEGUNGEN[name];
  if (ABLAEUFE[name]) {
    const { teile, start } = ABLAEUFE[name];
    return zusammensetzen(teile, { start, zurueck: gehen });
  }
  const clips = [];
  const teile = zerlegen(name).flat();
  for (let i = 0; i < teile.length; i++) {
    const t = teile[i];
    if (t.bewegung) {
      clips.push(KOMBI_BEWEGUNG[t.bewegung]());
      if (t.bewegung === 'finte') i += 1;
    } else {
      const clip = BEWEGUNGEN[SCHLAG_BEWEGUNG[t.schlag] + (t.koerper ? '_k' : '')];
      assert.ok(clip, `${name}: Schlag ${t.schlag}${t.koerper ? 'K' : ''} fehlt`);
      clips.push(clip);
    }
  }
  return zusammensetzen(clips, { zurueck: gehen });
}

function pruefen(name) {
  const clip = bauen(name);
  assert.ok(clip.dauer > 0.2 && clip.dauer < 40, `${name}: Dauer ${clip.dauer}`);
  for (let t = 0; t < clip.dauer; t += 0.02) {
    const h = auswerten(clip, t);
    for (const haltung of [h, spiegeln(auswerten(clip, t))]) {
      const g = gelenke(haltung);
      for (const seite of ['L', 'R']) {
        for (const teil of ['knie', 'knoechel', 'ellbogen', 'faust']) {
          const p = g[teil][seite];
          assert.ok(Number.isFinite(p.x + p.y + p.z), `${name} t=${t.toFixed(2)}: ${teil}${seite}`);
        }
        assert.ok(haltung.fuss[seite].pos.y > -0.005, `${name} t=${t.toFixed(2)}: Fuß ${seite} unter dem Boden`);
        assert.ok(g.knie[seite].y > 0.02, `${name} t=${t.toFixed(2)}: Knie ${seite} im Boden`);
      }
      assert.ok(g.kopf.y > 0.15, `${name} t=${t.toFixed(2)}: Kopf im Boden`);
    }
  }
  return clip;
}

test('Alle Übungen aus der Bibliothek haben eine Animation', () => {
  for (const id of [...Object.keys(UEBUNGEN), ...Object.keys(SEIL)]) pruefen(id);
});

test('Alle Beinarbeit- und Abwehr-Drills haben eine Animation', () => {
  for (const id of [...Object.keys(BEINARBEIT), ...Object.keys(ABWEHR)]) pruefen(id);
});

test('Alle 18 Kombis lassen sich aus Einzelschlägen zusammensetzen', () => {
  for (const k of KOMBIS) pruefen(k.text);
});

test('Drills enden dort, wo sie anfangen (Endlosschleife ohne Sprung)', () => {
  for (const id of ['viereck', 'drehen', 'rein_raus', 'winkel', 'linie', 'step_drag', 'slip_seil', 'sack_pendel', '1, Raus', '1-2, Schritt seitlich, 3-2']) {
    const clip = bauen(id);
    const anfang = auswerten(clip, 0);
    const ende = auswerten(clip, clip.dauer - 0.001);
    for (const seite of ['L', 'R']) {
      const abstand = anfang.fuss[seite].pos.distanceTo(ende.fuss[seite].pos);
      assert.ok(abstand < 0.02, `${id}: Fuß ${seite} steht am Ende ${abstand.toFixed(2)} m daneben`);
    }
  }
});

test('Füße kreuzen bei der Beinarbeit nie', () => {
  for (const id of ['step_drag', 'linie', 'rein_raus', 'viereck']) {
    const clip = bauen(id);
    for (let t = 0; t < clip.dauer; t += 0.02) {
      const h = auswerten(clip, t);
      assert.ok(h.fuss.L.pos.x - h.fuss.R.pos.x > 0.15, `${id} t=${t.toFixed(2)}: Füße zu eng oder gekreuzt`);
      assert.ok(h.fuss.L.pos.z - h.fuss.R.pos.z > 0.2, `${id} t=${t.toFixed(2)}: hinterer Fuß überholt den vorderen`);
    }
  }
});
