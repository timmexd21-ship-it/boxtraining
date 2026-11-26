// Daten: sichern, einspielen, Zusammenfassung für Claude, neuen Block einspielen (vorbereitet).

import { el, fuellen } from '../hilfen.js';
import { schreiben, lesen } from '../db.js';
import { sichern, sicherungLesen, einspielen, letzteSicherung } from '../daten.js';
import { heuteLaden } from '../plan.js';
import { trainingsDatum } from '../profil.js';
import { zusammenfassung, blockPruefen } from '../auswertung.js';

export function zeigen(ziel) {
  let weg = false;
  let meldung = '';        // Rückmeldung nach einer Aktion
  let fehler = '';
  let wartend = null;      // gelesene Sicherung, die auf "Ersetzen" wartet
  let text = '';           // Zusammenfassung für Claude
  let blockText = '';
  let letzte = null;
  let eigenerBlock = null;

  const waehler = el('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: dateiGewaehlt });

  Promise.all([letzteSicherung(), lesen('plan', 'eigenerBlock')]).then(([l, b]) => {
    if (weg) return;
    letzte = l;
    eigenerBlock = b || null;
    zeichnen();
  });

  function zeichnen() {
    const tageHer = letzte ? Math.floor((Date.now() - letzte) / 86400000) : null;
    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, 'Alles liegt nur auf diesem Gerät'),
      el('h1', { class: 'titel' }, 'Daten'),
      meldung ? el('p', { class: 'hinweis', role: 'status' }, meldung) : null,
      fehler ? el('p', { class: 'fehler', role: 'alert' }, fehler) : null,

      el('h2', { class: 'abschnitt' }, 'Sichern'),
      el('p', { class: 'leise' }, tageHer === null ? 'Noch nie gesichert.' : (tageHer === 0 ? 'Zuletzt heute gesichert.' : `Zuletzt vor ${tageHer} ${tageHer === 1 ? 'Tag' : 'Tagen'} gesichert.`)),
      el('button', { class: 'knopf', onclick: jetztSichern }, 'Daten sichern'),
      el('p', { class: 'leise' }, 'Es entsteht eine Datei mit Profil, Tests und allen Einträgen. Leg sie in „Dateien“ oder schick sie dir selbst.'),

      el('h2', { class: 'abschnitt' }, 'Einspielen'),
      waehler,
      wartend ? [
        el('p', { class: 'hinweis' }, `Die Sicherung vom ${new Date(wartend.uebersicht.gesichert).toLocaleDateString('de-DE')} enthält `
          + `${wartend.uebersicht.profil ? 'ein Profil' : 'kein Profil'}, ${wartend.uebersicht.tests} Tests und ${wartend.uebersicht.trainings} Einträge. `
          + 'Sie ersetzt alles, was jetzt auf diesem Gerät gespeichert ist.'),
        el('button', { class: 'balken', onclick: ersetzen }, 'Alles ersetzen'),
        el('button', { class: 'zurueck', onclick: () => { wartend = null; zeichnen(); } }, 'Abbrechen'),
      ] : el('button', { class: 'knopf', onclick: () => waehler.click() }, 'Sicherung auswählen'),

      el('h2', { class: 'abschnitt' }, 'Für Claude'),
      el('p', { class: 'leise' }, 'Profil, Tests und die letzten 4 Wochen als Text. Füg ihn in Claude ein und lass dir den nächsten Block bauen.'),
      el('button', { class: 'knopf', onclick: zusammenfassen }, 'Zusammenfassung erstellen'),
      text ? [
        el('textarea', { class: 'text-eingabe gross', readonly: true, rows: '10' }, text),
        el('button', { class: 'knopf', onclick: kopieren }, 'Text kopieren'),
      ] : null,

      el('h2', { class: 'abschnitt' }, 'Block von Claude'),
      el('p', { class: 'leise' }, eigenerBlock
        ? `Gespeichert ist ein Block mit den Kombis ${eigenerBlock.block.slice(0, 3).map((w) => w.kombis[0]).join(', ')}. Der Plan verwendet ihn noch nicht – das ist für später vorbereitet.`
        : 'Füg hier die Antwort von Claude ein. Der Block wird geprüft und gespeichert. Der Plan verwendet ihn noch nicht – das ist für später vorbereitet.'),
      el('textarea', { class: 'text-eingabe', rows: '4', placeholder: '[ { "woche": 1, … } ]', oninput: (e) => { blockText = e.target.value; } }, blockText),
      el('button', { class: 'knopf', onclick: blockSpeichern }, 'Block prüfen und speichern'),

      el('div', { class: 'unten' }, el('a', { class: 'zurueck', href: '#/profil' }, 'Zurück zum Profil')),
    );
  }

  const melde = (m, f = '') => { meldung = m; fehler = f; zeichnen(); window.scrollTo(0, 0); };

  async function jetztSichern() {
    try {
      const wie = await sichern();
      if (wie === 'abgebrochen') return;
      letzte = new Date();
      melde(wie === 'geteilt' ? 'Gesichert.' : 'Gesichert. Die Datei liegt bei deinen Downloads.');
    } catch {
      melde('', 'Die Sicherung konnte nicht erstellt werden.');
    }
  }

  async function dateiGewaehlt() {
    const datei = waehler.files[0];
    waehler.value = '';
    if (!datei) return;
    const ergebnis = sicherungLesen(await datei.text());
    if (ergebnis.fehler) { wartend = null; melde('', ergebnis.fehler); return; }
    wartend = ergebnis;
    melde('');
  }

  async function ersetzen() {
    try {
      await einspielen(wartend.daten);
      wartend = null;
      letzte = await letzteSicherung();
      melde('Eingespielt. Alle Daten stammen jetzt aus der Sicherung.');
    } catch {
      melde('', 'Das Einspielen hat nicht geklappt. Deine bisherigen Daten sind unverändert.');
    }
  }

  async function zusammenfassen() {
    const d = await heuteLaden();
    if (!d) { melde('', 'Leg zuerst dein Profil an.'); return; }
    text = zusammenfassung({ profil: d.profil, tests: d.tests, trainings: d.trainings, stand: d.stand, block: d.block, woche: d.woche, heute: trainingsDatum() });
    melde('');
  }

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(text);
      melde('Text kopiert.');
    } catch {
      melde('', 'Kopieren hat nicht geklappt. Tipp lange in das Textfeld und wähl „Alles auswählen“, dann „Kopieren“.');
    }
  }

  async function blockSpeichern() {
    const ergebnis = blockPruefen(blockText);
    if (ergebnis.fehler) { melde('', ergebnis.fehler); return; }
    eigenerBlock = { block: ergebnis.block, gespeichert: new Date().toISOString() };
    await schreiben('plan', eigenerBlock, 'eigenerBlock');
    blockText = '';
    melde('Block geprüft und gespeichert.');
  }

  return () => { weg = true; };
}
