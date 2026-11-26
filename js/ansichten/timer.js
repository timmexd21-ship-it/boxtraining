// Runden-Timer: erst einstellen, dann läuft er bildschirmfüllend.

import { el, fuellen } from '../hilfen.js';
import { lesen, schreiben } from '../db.js';
import { KOMBIS } from '../data/kombis.js';
import { gesamtSek, alsZeit } from '../timer/uhr.js';
import { TEMPO, sprich, stimmeVorhanden, ansageText } from '../timer/ansage.js';
import { wachbleibenMoeglich } from '../timer/wachbleiben.js';
import { timerStarten } from '../timer/lauf.js';

export const STANDARD = {
  rundeSek: 180,
  pauseSek: 60,
  runden: 6,
  ansage: true,
  art: 'zahl',        // 'zahl' oder 'wort'
  stufe: 1,           // 1–3
  tempo: 'mittel',    // siehe TEMPO in ansage.js
  kdw: '1-2-3-2',     // Kombi der Woche
  kdwOefter: true,
};

const VORGABEN = [
  { name: '3:00 / 1:00', rundeSek: 180, pauseSek: 60 },
  { name: '30 / 30', rundeSek: 30, pauseSek: 30 },
  { name: '20 / 40', rundeSek: 20, pauseSek: 40 },
  { name: '15 / 15', rundeSek: 15, pauseSek: 15 },
];

// Schrittweite für + und −: kurze Zeiten fein, lange grob
function schritt(sek, richtung) {
  const grenze = richtung > 0 ? sek : sek - 1;
  const weite = grenze < 60 ? 5 : grenze < 180 ? 15 : 30;
  return Math.min(900, Math.max(5, sek + richtung * weite));
}

export function zeigen(ziel) {
  let e = { ...STANDARD };
  let lauf = null; // { beenden() } solange der Timer läuft
  let weg = false;

  lesen('einstellungen', 'timer')
    .then((gespeichert) => { if (gespeichert) e = { ...STANDARD, ...gespeichert }; })
    .catch(() => {})
    .finally(() => { if (!weg) einstellenZeigen(); });

  function merken() {
    schreiben('einstellungen', e, 'timer').catch(() => {});
  }

  // ---------- Bildschirm 1: einstellen ----------

  function einstellenZeigen() {
    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, `${e.runden} Runden, zusammen ${alsZeit(gesamtSek(e))}`),
      el('h1', { class: 'titel' }, 'Timer'),

      wahl('Schnellwahl', VORGABEN.map((v) => ({ wert: v.name, name: v.name })),
        VORGABEN.find((v) => v.rundeSek === e.rundeSek && v.pauseSek === e.pauseSek)?.name,
        (name) => {
          const v = VORGABEN.find((x) => x.name === name);
          e.rundeSek = v.rundeSek;
          e.pauseSek = v.pauseSek;
        }, 'wahl-umbruch'),

      stufen('Runde', alsZeit(e.rundeSek), (r) => { e.rundeSek = schritt(e.rundeSek, r); }),
      stufen('Pause', alsZeit(e.pauseSek), (r) => { e.pauseSek = schritt(e.pauseSek, r); }),
      stufen('Runden', String(e.runden), (r) => { e.runden = Math.min(30, Math.max(1, e.runden + r)); }),

      el('h2', { class: 'abschnitt' }, 'Kombi-Ansage'),
      stimmeVorhanden() ? null : el('p', { class: 'leise' }, 'Dieses Gerät hat keine Sprachausgabe. Die Kombis werden nur angezeigt.'),

      wahl('Ansage', [{ wert: true, name: 'An' }, { wert: false, name: 'Aus' }], e.ansage, (w) => { e.ansage = w; }),
      e.ansage ? [
        wahl('Sagt an als', [{ wert: 'zahl', name: 'Zahl' }, { wert: 'wort', name: 'Wort' }], e.art, (w) => { e.art = w; }),
        wahl('Kombis bis Stufe', [1, 2, 3].map((s) => ({ wert: s, name: String(s) })), e.stufe, (w) => { e.stufe = w; }),
        wahl('Tempo', Object.entries(TEMPO).map(([wert, t]) => ({ wert, name: t.name })), e.tempo, (w) => { e.tempo = w; }),
        el('label', { class: 'feld' },
          el('span', { class: 'feld-name' }, 'Kombi der Woche'),
          el('select', {
            class: 'auswahl',
            onchange: (ev) => { e.kdw = ev.target.value; merken(); },
          }, KOMBIS.map((k) => el('option', { value: k.text, selected: k.text === e.kdw }, `${k.text}  (Stufe ${k.stufe})`))),
        ),
        wahl('Kombi der Woche öfter', [{ wert: true, name: 'Ja' }, { wert: false, name: 'Nein' }], e.kdwOefter, (w) => { e.kdwOefter = w; }),
        el('button', {
          class: 'knopf',
          onclick: () => sprich(ansageText(e.kdw, e.art)),
        }, 'Ansage anhören'),
      ] : null,

      wachbleibenMoeglich() ? null : el('p', { class: 'leise' },
        'Dieses Gerät kann den Bildschirm nicht selbst anlassen. Stell vor dem Training die automatische Sperre aus (Einstellungen, Anzeige & Helligkeit).'),
      el('p', { class: 'leise' }, 'Kein Ton? Schalter an der Seite des iPhones prüfen und lauter stellen.'),

      el('div', { class: 'unten klebt' },
        el('button', { class: 'balken', onclick: starten }, 'Runde starten'),
      ),
    );
  }

  // Zeile mit − Wert +
  function stufen(name, wert, aendern) {
    const tun = (richtung) => () => { aendern(richtung); merken(); einstellenZeigen(); };
    return el('div', { class: 'feld feld-stufen' },
      el('span', { class: 'feld-name' }, name),
      el('div', { class: 'stufen' },
        el('button', { class: 'stufe-knopf', 'aria-label': `${name} weniger`, onclick: tun(-1) }, '−'),
        el('span', { class: 'stufe-wert' }, wert),
        el('button', { class: 'stufe-knopf', 'aria-label': `${name} mehr`, onclick: tun(1) }, '+'),
      ),
    );
  }

  // Zeile mit mehreren Möglichkeiten, eine ist gewählt
  function wahl(name, moeglich, aktuell, setzen, zusatz = '') {
    return el('div', { class: 'feld' },
      el('span', { class: 'feld-name' }, name),
      el('div', { class: `wahl ${zusatz}`, role: 'group', 'aria-label': name },
        moeglich.map((m) => el('button', {
          'aria-pressed': String(m.wert === aktuell),
          onclick: () => { setzen(m.wert); merken(); einstellenZeigen(); },
        }, m.name)),
      ),
    );
  }

  function starten() {
    lauf = timerStarten(e, { zu: () => { lauf = null; } });
  }

  // Aufräumen, wenn man den Bereich verlässt
  return () => {
    weg = true;
    lauf?.beenden();
  };
}
