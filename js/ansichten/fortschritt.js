// Fortschritt: Wochenübersicht und Testwerte als Kurven.

import { el, fuellen } from '../hilfen.js';
import { alle } from '../db.js';
import { trainingsDatum } from '../profil.js';
import { letzteWochen, testReihen } from '../auswertung.js';

const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, eigenschaften = {}, ...kinder) => {
  const e = document.createElementNS(SVG, tag);
  for (const [name, wert] of Object.entries(eigenschaften)) e.setAttribute(name, wert);
  e.append(...kinder);
  return e;
};
const kurz = (iso) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
const zahl = (x) => String(x).replace('.', ',');

export function zeigen(ziel) {
  let weg = false;
  Promise.all([alle('trainings'), alle('tests')]).then(([trainings, tests]) => {
    if (!weg) zeichnen(trainings, tests);
  });

  function zeichnen(trainings, tests) {
    const wochen = letzteWochen(trainings, trainingsDatum());
    const diese = wochen[0];
    const reihen = testReihen(tests);

    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, 'Testwerte und Wochen'),
      el('h1', { class: 'titel' }, 'Fortschritt'),

      el('h2', { class: 'abschnitt' }, 'Diese Woche'),
      trainings.length === 0
        ? el('p', { class: 'absatz' }, 'Noch kein Training eingetragen. Nach deiner ersten Einheit siehst du hier deine Woche.')
        : el('ul', { class: 'zeilen' },
          el('li', {}, 'Einheiten', el('span', { class: 'wert' }, `${diese.einheiten}${diese.sparring ? ` + ${diese.sparring}× Sparring` : ''}`)),
          el('li', {}, 'Runden gesamt', el('span', { class: 'wert' }, String(diese.runden))),
          el('li', {}, 'Anstrengung im Schnitt', el('span', { class: 'wert' }, diese.anstrengung === null ? '–' : `${zahl(diese.anstrengung)} von 10`)),
          el('li', {}, 'Kombis geübt', el('span', { class: 'wert' }, diese.kombis.join(', ') || '–')),
        ),

      wochen.slice(1).some((w) => w.einheiten || w.sparring) ? [
        el('h2', { class: 'abschnitt' }, 'Wochen davor'),
        el('ul', { class: 'zeilen' }, wochen.slice(1).filter((w) => w.einheiten || w.sparring).map((w) =>
          el('li', {}, `ab ${kurz(w.montag)}`,
            el('span', { class: 'wert' }, `${w.einheiten} Einh., ${w.runden} Runden, Ø ${w.anstrengung === null ? '–' : zahl(w.anstrengung)}`)))),
      ] : null,

      el('h2', { class: 'abschnitt' }, 'Testwerte'),
      reihen.length === 0
        ? [el('p', { class: 'absatz' }, 'Noch kein Test gemacht.'), el('a', { class: 'knopf', href: '#/test' }, 'Test machen')]
        : [
          tests.length === 1 ? el('p', { class: 'leise' }, 'Nach dem zweiten Test (Woche 4) werden daraus Kurven.') : null,
          reihen.map(kurve),
        ],
    );
  }

  // Eine Testreihe: Überschrift mit Veränderung, Kurve, Werte als Liste
  function kurve(reihe) {
    const p = reihe.punkte;
    const erster = p[0].wert;
    const letzter = p[p.length - 1].wert;
    const unterschied = letzter - erster;
    const kopf = el('div', { class: 'kurve-kopf' },
      el('span', { class: 'kurve-name' }, reihe.name),
      el('span', { class: 'kurve-wert' }, `${zahl(letzter)} ${reihe.einheit}`));
    if (p.length === 1) return el('section', { class: 'kurve' }, kopf);

    const anzeige = el('p', { class: 'kurve-anzeige', 'aria-live': 'polite' },
      `${unterschied >= 0 ? '+' : '−'}${zahl(Math.abs(unterschied))} seit ${kurz(p[0].datum)}`);

    // Maße der Zeichnung
    const B = 320; const H = 120; const links = 10; const rechts = 14; const oben = 14; const unten = 24;
    const werte = p.map((x) => x.wert);
    const min = Math.min(...werte);
    const max = Math.max(...werte);
    const spanne = max - min || 1;
    const x = (i) => links + (i * (B - links - rechts)) / (p.length - 1);
    const y = (w) => oben + (1 - (w - min) / spanne) * (H - oben - unten);

    const punkte = p.map((punkt, i) => {
      const neuester = i === p.length - 1;
      const zeigenWert = () => { anzeige.textContent = `${kurz(punkt.datum)}: ${zahl(punkt.wert)} ${reihe.einheit}`; };
      const treffer = svg('circle', { cx: x(i), cy: y(punkt.wert), r: 18, fill: 'transparent', tabindex: 0, role: 'button', 'aria-label': `${kurz(punkt.datum)}: ${punkt.wert} ${reihe.einheit}` });
      for (const ereignis of ['pointerenter', 'click', 'focus']) treffer.addEventListener(ereignis, zeigenWert);
      return [
        svg('circle', { cx: x(i), cy: y(punkt.wert), r: neuester ? 6 : 5, class: neuester ? 'kurve-punkt neu' : 'kurve-punkt' }),
        treffer,
      ];
    }).flat();

    const bild = svg('svg', { viewBox: `0 0 ${B} ${H}`, class: 'kurve-bild', role: 'img', 'aria-label': `${reihe.name}: von ${erster} auf ${letzter} ${reihe.einheit}` },
      svg('line', { x1: links, x2: B - rechts, y1: H - unten + 8, y2: H - unten + 8, class: 'kurve-achse' }),
      svg('polyline', { points: p.map((punkt, i) => `${x(i)},${y(punkt.wert)}`).join(' '), class: 'kurve-linie' }),
      ...punkte,
      svg('text', { x: links, y: H - 4, class: 'kurve-text' }, kurz(p[0].datum)),
      svg('text', { x: B - rechts, y: H - 4, class: 'kurve-text', 'text-anchor': 'end' }, kurz(p[p.length - 1].datum)),
    );

    return el('section', { class: 'kurve' }, kopf, bild, anzeige,
      el('details', { class: 'kurve-liste' },
        el('summary', {}, 'Werte als Liste'),
        el('ul', { class: 'zeilen' }, p.map((punkt) => el('li', {}, kurz(punkt.datum), el('span', { class: 'wert' }, `${zahl(punkt.wert)} ${reihe.einheit}`)))),
      ),
    );
  }

  return () => { weg = true; };
}
