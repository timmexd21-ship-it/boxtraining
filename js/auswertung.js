// Auswertung der gespeicherten Daten: Wochenzahlen, Testreihen und die
// Text-Zusammenfassung zum Einfügen in Claude. Rechnet nur, speichert nichts.

import { TEST, BLOCK } from './data/block.js';
import { EINHEITEN } from './data/einheiten.js';
import { AUSRUESTUNG } from './data/ausruestung.js';
import { REGIONEN } from './data/ersatz.js';
import { zerlegen } from './data/kombis.js';

const TAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const TAGE = ['Montagnacht', 'Dienstagnacht', 'Mittwochnacht', 'Donnerstagnacht', 'Freitag', 'Samstag', 'Sonntag'];

// Datum als "JJJJ-MM-TT" (Ortszeit)
export function tagText(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Montag 0 Uhr der Woche, in der das Datum liegt
function montagVon(datum) {
  const d = new Date(datum);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Zahlen einer Woche: Einheiten, Sparring, Runden, Durchschnitts-Anstrengung, geübte Kombis
export function wochenZahlen(eintraege) {
  const training = eintraege.filter((e) => e.einheit !== 'sparring');
  const mitAnstrengung = eintraege.filter((e) => typeof e.anstrengung === 'number');
  return {
    einheiten: training.length,
    sparring: eintraege.length - training.length,
    runden: training.reduce((s, e) => s + (e.runden || 0), 0),
    anstrengung: mitAnstrengung.length
      ? Math.round((mitAnstrengung.reduce((s, e) => s + e.anstrengung, 0) / mitAnstrengung.length) * 10) / 10
      : null,
    kombis: [...new Set(training.flatMap((e) => e.kombis || []))],
  };
}

// Die letzten n Wochen, die aktuelle zuerst. heute = Trainingsdatum
export function letzteWochen(trainings, heute, n = 5) {
  const wochen = [];
  const montag = montagVon(heute);
  for (let i = 0; i < n; i++) {
    const von = new Date(montag);
    von.setDate(von.getDate() - 7 * i);
    const bis = new Date(von);
    bis.setDate(bis.getDate() + 7);
    const eintraege = trainings.filter((e) => e.tag >= tagText(von) && e.tag < tagText(bis));
    wochen.push({ montag: von, ...wochenZahlen(eintraege) });
  }
  return wochen;
}

// Für jede Test-Station die Werte über die Zeit
export function testReihen(tests) {
  return TEST.map((t) => ({
    id: t.id, name: t.name, einheit: t.einheit,
    punkte: tests.filter((x) => typeof x.werte[t.id] === 'number').map((x) => ({ datum: x.datum, wert: x.werte[t.id] })),
  })).filter((r) => r.punkte.length > 0);
}

// ---------------------------------------------------------------
// Zusammenfassung als Text: Profil + letzte 4 Wochen + Tests.
// Zum Einfügen in Claude, damit dort der nächste Block entsteht.
// ---------------------------------------------------------------
export function zusammenfassung({ profil, tests, trainings, stand, block, woche, heute }) {
  const z = [];
  const datum = (iso) => new Date(iso).toLocaleDateString('de-DE');
  z.push(`BOXTRAINING – ZUSAMMENFASSUNG (Stand ${heute.toLocaleDateString('de-DE')})`, '');

  z.push('PROFIL');
  z.push(`- ${profil.alter} Jahre, ${profil.groesse} cm, ${profil.gewicht} kg`);
  z.push(`- Boxen seit ${profil.erfahrungJahre} Jahren${profil.andereSportarten ? `; außerdem: ${profil.andereSportarten}` : ''}`);
  z.push(`- Auslage: ${profil.auslage === 'links' ? 'linke Hand vorn' : 'rechte Hand vorn'}`);
  z.push(`- Ziel-Gewichtung (0–10): Technik ${profil.ziele.technik}, Schlagkraft ${profil.ziele.schlagkraft}, Ausdauer ${profil.ziele.ausdauer}`);
  const wochenplan = profil.woche.map((e, i) => (e ? `${TAGE_KURZ[i]} ${e}` : null)).filter(Boolean).join(', ');
  z.push(`- Woche: ${wochenplan}; je ${profil.dauer} Minuten${profil.sparring.ja ? `; Sparring ${TAGE[profil.sparring.tag]}` : '; kein Sparring'}`);
  z.push(`- Ausrüstung: ${profil.ausruestung.map((a) => AUSRUESTUNG[a]?.name).filter(Boolean).join(', ') || 'keine'}`);
  const weh = profil.beschwerden.regionen.map((r) => REGIONEN[r]?.name).filter(Boolean).join(', ');
  z.push(`- Beschwerden: ${weh || 'keine'}${profil.beschwerden.notiz ? ` (${profil.beschwerden.notiz})` : ''}`);
  z.push('- Rahmen: Nachtschicht Mo–Fr ab 19 Uhr, Training nachts in der Halle, keine Gewichte.', '');

  z.push('STAND IM PLAN');
  z.push(`- Block ${block}, Woche ${woche} von 4 (${BLOCK[woche - 1].name})`);
  for (const kurz of Object.keys(EINHEITEN)) {
    const a = stand.anpassung?.[kurz] || {};
    z.push(`- Einheit ${kurz} (${EINHEITEN[kurz].name}): ${a.runden || 0} Runden dazu, ${a.durchgaenge || 0} Durchgänge dazu, Pause ${a.pauseSek || 0} Sek.`);
  }
  z.push('');

  z.push('TESTS (ältester zuerst)');
  if (!tests.length) z.push('- noch kein Test');
  for (const t of tests) {
    const werte = TEST.filter((s) => s.id in t.werte).map((s) => `${s.name}: ${t.werte[s.id]} ${s.einheit}`).join('; ');
    z.push(`- ${datum(t.datum)}: ${werte}`);
  }
  z.push('');

  const grenze = new Date(heute);
  grenze.setDate(grenze.getDate() - 28);
  const letzte = trainings.filter((e) => e.tag >= tagText(grenze));
  z.push(`LETZTE 4 WOCHEN (${letzte.length} Einträge)`);
  if (!letzte.length) z.push('- keine Einträge');
  for (const e of letzte) {
    if (e.einheit === 'sparring') {
      z.push(`- ${e.tag} Sparring: Härte ${e.sparringHaerte}/5, Anstrengung ${e.anstrengung}/10${e.notiz ? ` – ${e.notiz}` : ''}`);
    } else {
      const zusatz = [e.platt ? 'heute platt' : null, e.nurLeicht ? 'nur leicht nach Sparring' : null].filter(Boolean).join(', ');
      z.push(`- ${e.tag} Einheit ${e.einheit}, ${e.dauer} Min${zusatz ? ` (${zusatz})` : ''}: ${e.geschafft ? 'geschafft' : 'nicht geschafft'}, `
        + `Anstrengung ${e.anstrengung}/10, Müdigkeit ${e.muedigkeit}/5, ${e.runden || 0} Runden`
        + `${e.kombis?.length ? `, Kombi ${e.kombis.join(' / ')}` : ''}${e.notiz ? ` – ${e.notiz}` : ''}`);
    }
  }
  z.push('');

  z.push('AUFGABE');
  z.push('Baue daraus den nächsten 4-Wochen-Block. Antworte nur mit JSON in genau diesem Format, damit ich es einspielen kann:');
  z.push(BLOCK_FORMAT);
  return z.join('\n');
}

// Das Format, in dem ein neuer Block zurückkommen muss (wie BLOCK in data/block.js)
export const BLOCK_FORMAT = `[
  { "woche": 1, "name": "Einstieg", "A": {}, "B": {}, "C": {}, "kombis": ["1-2-3-2"] },
  { "woche": 2, "name": "Aufbau", "A": { "zirkelDurchgaenge": 1 }, "B": { "sackRunden": 1 }, "C": { "beinarbeitDrills": 1 }, "kombis": ["1-2K-3"] },
  { "woche": 3, "name": "Spitze", "A": { "powerSek": 25 }, "B": { "pauseSek": 45 }, "C": { "slipSeilMitKonter": true }, "kombis": ["1-2, Slip, 2"] },
  { "woche": 4, "name": "Entlastung + Test", "A": { "test": true }, "B": { "rundenFaktor": 0.5 }, "C": {}, "kombis": ["1-2-3-2", "1-2K-3", "1-2, Slip, 2"] }
]
Erlaubt sind nur diese Angaben: zirkelDurchgaenge, powerSek, test (in A), sackRunden, pauseSek, rundenFaktor (in B), beinarbeitDrills, slipSeilMitKonter (in C).
Kombis in der Schreibweise 1-2K-3 oder "1-2, Slip, 2" (Schläge 1–6, K = zum Körper; Slip, Abrollen, Raus, Schritt seitlich, Finte).`;

const ERLAUBT = {
  A: ['zirkelDurchgaenge', 'powerSek', 'test'],
  B: ['sackRunden', 'pauseSek', 'rundenFaktor'],
  C: ['beinarbeitDrills', 'slipSeilMitKonter'],
};

// Prüft einen Block, der von Claude zurückkommt. -> { block } oder { fehler: 'Text' }
export function blockPruefen(text) {
  let block;
  try {
    block = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
  } catch {
    return { fehler: 'Das ist kein lesbares JSON. Kopier die Antwort von der eckigen Klammer [ bis zur eckigen Klammer ].' };
  }
  if (!Array.isArray(block) || block.length !== 4) return { fehler: 'Der Block braucht genau 4 Wochen.' };
  for (let i = 0; i < 4; i++) {
    const w = block[i];
    if (!w || w.woche !== i + 1) return { fehler: `Eintrag ${i + 1} muss "woche": ${i + 1} haben.` };
    for (const kurz of ['A', 'B', 'C']) {
      if (typeof w[kurz] !== 'object' || w[kurz] === null) return { fehler: `Woche ${i + 1}: Angabe für Einheit ${kurz} fehlt.` };
      const fremd = Object.keys(w[kurz]).find((k) => !ERLAUBT[kurz].includes(k));
      if (fremd) return { fehler: `Woche ${i + 1}, Einheit ${kurz}: "${fremd}" kennt die App nicht.` };
    }
    if (!Array.isArray(w.kombis) || !w.kombis.length) return { fehler: `Woche ${i + 1}: Kombi fehlt.` };
    for (const k of w.kombis) {
      try { zerlegen(k); } catch { return { fehler: `Woche ${i + 1}: Die Kombi "${k}" kann die App nicht lesen.` }; }
    }
  }
  return { block };
}
