// Heute: was steht an, wie lang, welche Kombi – und der Start ins Training.

import { el, fuellen, datumLang } from '../hilfen.js';
import { heuteLaden } from '../plan.js';
import { TAGE } from '../profil.js';
import { EINHEITEN } from '../data/einheiten.js';
import { HINWEISE } from '../data/ausruestung.js';

export function zeigen(ziel, parameter) {
  let weg = false;
  let platt = null; // null = die App schlägt vor (nach Schichtmüdigkeit 4–5)
  const wunsch = parameter.get('einheit'); // z. B. an einem freien Tag trotzdem trainieren

  laden();

  function laden() {
    heuteLaden({ wunsch, platt }).then((d) => {
      if (weg) return;
      if (!d) return ohneProfil();
      platt = d.platt;
      return mitProfil(d);
    });
  }

  function ohneProfil() {
    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, datumLang()),
      el('h1', { class: 'titel' }, 'Heute'),
      el('p', { class: 'absatz' }, 'Noch kein Plan. Er entsteht aus deinem Profil und dem Starttest.'),
      el('div', { class: 'unten' }, el('a', { class: 'balken', href: '#/start' }, 'Profil anlegen')),
    );
  }

  function mitProfil(d) {
    const kopf = el('p', { class: 'kopfzeile' }, `${TAGE[d.tag]}, ${datumLang()}`);
    const testFehlt = d.tests.length ? null : [
      el('p', { class: 'hinweis' }, 'Der Starttest fehlt noch. Ohne ihn stehen bei der Kraftausdauer keine Zahlen.'),
      el('a', { class: 'knopf', href: '#/test' }, 'Test machen'),
    ];
    const schonDa = d.eintragHeute
      ? el('p', { class: 'hinweis' }, `Heute schon eingetragen (Anstrengung ${d.eintragHeute.anstrengung}).`) : null;

    if (d.kurz === 'sparring') {
      fuellen(ziel, kopf,
        el('h1', { class: 'titel' }, 'Sparring'),
        el('p', { class: 'absatz' }, 'Die härteste Einheit der Woche. Trag danach ein, wie hart es war.'),
        schonDa, testFehlt,
        el('div', { class: 'unten' }, el('a', { class: 'balken', href: '#/eintragen?einheit=sparring' }, 'Sparring eintragen')),
      );
      return;
    }

    if (!d.einheit) {
      fuellen(ziel, kopf,
        el('h1', { class: 'titel' }, 'Frei'),
        el('p', { class: 'absatz' }, 'Heute steht kein Training im Plan.'),
        testFehlt,
        el('div', { class: 'feld' },
          el('span', { class: 'feld-name' }, 'Trotzdem trainieren'),
          el('div', { class: 'wahl' }, Object.keys(EINHEITEN).map((k) =>
            el('a', { class: 'wahl-link', href: `#/heute?einheit=${k}` }, k))),
        ),
      );
      return;
    }

    const e = d.einheit;
    const woche = el('p', { class: 'leise' }, `Block ${e.block}, Woche ${e.woche} von 4: ${e.wochenName}`);

    if (e.test) {
      fuellen(ziel, kopf,
        el('h1', { class: 'titel' }, 'Test'),
        woche,
        el('p', { class: 'absatz' }, 'Testwoche: statt Einheit A machst du heute den Test. Frisch, gleiche Reihenfolge wie beim letzten Mal.'),
        el('div', { class: 'unten' }, el('a', { class: 'balken', href: '#/test' }, 'Test machen')),
      );
      return;
    }

    const zusatz = `einheit=${e.kurz}&platt=${platt ? 1 : 0}`;

    fuellen(ziel, kopf,
      el('h1', { class: 'titel' }, `${e.kurz} ${e.name}`),
      woche,
      schonDa,
      d.vorschlagPlatt && platt ? el('p', { class: 'hinweis' }, 'Du warst bei der letzten Schicht sehr müde. Deshalb ist „Heute platt“ angetippt.') : null,
      el('p', { class: 'kombi-der-woche' },
        el('span', { class: 'kombi-name' }, e.kombis.length > 1 ? 'Kombis der Woche' : 'Kombi der Woche'),
        e.kombis.map((k) => el('span', { class: 'kombi-text' }, k))),
      el('ul', { class: 'zeilen' }, e.bloecke.map((b) =>
        el('li', {}, b.name, el('span', { class: 'wert' }, b.menge)))),
      el('p', { class: 'leise' }, `Etwa ${e.minuten} Minuten.`),
      e.hinweise.map((h) => el('p', { class: 'hinweis' }, h)),
      testFehlt,
      el('p', { class: 'leise' }, HINWEISE.join(' ')),
      d.sichernFaellig ? [
        el('p', { class: 'hinweis' }, 'Deine Daten liegen nur auf diesem Gerät und sind länger nicht gesichert.'),
        el('a', { class: 'knopf', href: '#/daten' }, 'Daten sichern'),
      ] : null,
      el('a', { class: 'zurueck', href: `#/eintragen?${zusatz}` }, 'Schon trainiert? Direkt eintragen'),
      el('div', { class: 'unten klebt' },
        d.nurLeicht ? null : el('button', {
          class: 'knopf platt-knopf', 'aria-pressed': String(platt),
          onclick: () => { platt = !platt; laden(); },
        }, platt ? 'Heute platt: an (30 Min, Power halbiert)' : 'Heute platt'),
        el('a', { class: 'balken', href: `#/training?${zusatz}` }, 'Training starten'),
      ),
    );
  }

  return () => { weg = true; };
}
