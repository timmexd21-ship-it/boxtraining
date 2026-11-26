// Onboarding: ein Thema pro Bildschirm. Dieselben Bildschirme dienen später zum Ändern
// einzelner Angaben (Aufruf mit #/start?schritt=3&einzeln=1).

import { el, fuellen } from '../hilfen.js';
import { zahlFeld, textFeld, wahlFeld, mehrfachFeld } from '../formular.js';
import { leeresProfil, profilLaden, profilSpeichern, zielAnteile, TAGE, TAGE_KURZ } from '../profil.js';
import { AUSRUESTUNG } from '../data/ausruestung.js';
import { EINHEITEN } from '../data/einheiten.js';
import { REGIONEN } from '../data/ersatz.js';
import { TEST } from '../data/block.js';

export function zeigen(ziel, parameter) {
  let p = leeresProfil();
  let schritt = Math.max(1, Number(parameter.get('schritt')) || 1);
  const einzeln = parameter.get('einzeln') === '1';
  let fehler = '';
  let weg = false;

  profilLaden().then((vorhanden) => {
    if (weg) return;
    if (vorhanden) p = { ...leeresProfil(), ...vorhanden };
    zeichnen();
  });

  const neu = (aendern) => () => { aendern(); zeichnen(); };
  const zwischen = (wert, min, max) => typeof wert === 'number' && wert >= min && wert <= max;

  // Jeder Schritt: Titel, Inhalt, Prüfung (gibt einen Fehlertext zurück oder nichts)
  const SCHRITTE = [
    {
      titel: 'Körper',
      inhalt: () => [
        zahlFeld('Alter', 'Jahre', p.alter, (w) => { p.alter = w; }),
        zahlFeld('Größe', 'cm', p.groesse, (w) => { p.groesse = w; }),
        zahlFeld('Gewicht', 'kg', p.gewicht, (w) => { p.gewicht = w; }),
      ],
      pruefen: () => {
        if (!zwischen(p.alter, 10, 99)) return 'Trag dein Alter ein (10 bis 99).';
        if (!zwischen(p.groesse, 120, 230)) return 'Trag deine Größe in cm ein (120 bis 230).';
        if (!zwischen(p.gewicht, 30, 250)) return 'Trag dein Gewicht in kg ein (30 bis 250).';
        return '';
      },
    },
    {
      titel: 'Erfahrung',
      inhalt: () => [
        zahlFeld('Boxen seit', 'Jahren', p.erfahrungJahre, (w) => { p.erfahrungJahre = w; }),
        textFeld('Andere Kampfsportarten (wenn du magst)', p.andereSportarten, (w) => { p.andereSportarten = w; }),
      ],
      pruefen: () => (zwischen(p.erfahrungJahre, 0, 80) ? '' : 'Trag ein, seit wie vielen Jahren du boxt. 0 ist auch in Ordnung.'),
    },
    {
      titel: 'Auslage',
      inhalt: () => [
        wahlFeld('Welche Hand ist vorn?', [
          { wert: 'links', name: 'Linke Hand vorn' },
          { wert: 'rechts', name: 'Rechte Hand vorn' },
        ], p.auslage, (w) => neu(() => { p.auslage = w; })(), 'wahl-hoch'),
        el('p', { class: 'leise' }, 'Die Figuren und das Nummernsystem richten sich danach: 1 ist immer die vordere Hand.'),
      ],
      pruefen: () => (p.auslage ? '' : 'Wähl deine Auslage.'),
    },
    {
      titel: 'Ziele',
      inhalt: () => {
        const anteile = zielAnteile(p.ziele);
        const regler = (kurz, name) => {
          const anzeige = el('span', { class: 'regler-wert' }, `${anteile[kurz]} %`);
          return el('label', { class: 'feld' },
            el('span', { class: 'regler-kopf' }, el('span', {}, name), anzeige),
            el('input', {
              class: 'regler', type: 'range', min: '0', max: '10', step: '1', value: p.ziele[kurz],
              oninput: (e) => {
                p.ziele[kurz] = Number(e.target.value);
                const neuAnteile = zielAnteile(p.ziele);
                for (const [k, feld] of Object.entries(anzeigen)) feld.textContent = `${neuAnteile[k]} %`;
              },
            }),
          );
        };
        const anzeigen = {};
        const felder = [['technik', 'Technik'], ['schlagkraft', 'Schlagkraft'], ['ausdauer', 'Ausdauer']].map(([kurz, name]) => {
          const feld = regler(kurz, name);
          anzeigen[kurz] = feld.querySelector('.regler-wert');
          return feld;
        });
        return [el('p', { class: 'leise' }, 'Schieb nach rechts, was dir wichtiger ist. Der Plan verschiebt die Anteile entsprechend.'), ...felder];
      },
      pruefen: () => '',
    },
    {
      titel: 'Trainingstage',
      inhalt: () => [
        wahlFeld('Dauer pro Einheit', [{ wert: 30, name: '30 Minuten' }, { wert: 45, name: '45 Minuten' }],
          p.dauer, (w) => neu(() => { p.dauer = w; })()),
        el('p', { class: 'leise' }, Object.entries(EINHEITEN).map(([k, e]) => `${k} = ${e.name}`).join(', ')),
        TAGE.map((name, tag) => wahlFeld(name, [
          { wert: null, name: 'frei' }, { wert: 'A', name: 'A' }, { wert: 'B', name: 'B' }, { wert: 'C', name: 'C' },
        ], p.woche[tag], (w) => neu(() => { p.woche[tag] = w; })())),
        el('p', { class: 'leise' }, 'Harte Einheiten (A und B) am besten in die erste Schichthälfte legen.'),
      ],
      pruefen: () => (p.woche.some(Boolean) ? '' : 'Leg mindestens einen Trainingstag fest.'),
    },
    {
      titel: 'Ausrüstung',
      inhalt: () => [
        mehrfachFeld('Was hast du in der Halle?', Object.entries(AUSRUESTUNG).map(([wert, a]) => ({ wert, name: a.name })),
          p.ausruestung, (w) => neu(() => { p.ausruestung = w; })()),
        el('p', { class: 'leise' }, 'Fehlt etwas, tauscht der Plan die Blöcke aus, die es brauchen.'),
      ],
      pruefen: () => '',
    },
    {
      titel: 'Sparring',
      inhalt: () => [
        wahlFeld('Machst du Sparring?', [{ wert: true, name: 'Ja' }, { wert: false, name: 'Nein' }],
          p.sparring.ja, (w) => neu(() => { p.sparring.ja = w; })()),
        p.sparring.ja ? wahlFeld('An welchem Tag?', TAGE_KURZ.map((name, tag) => ({ wert: tag, name })),
          p.sparring.tag, (w) => neu(() => { p.sparring.tag = w; })(), 'wahl-eng') : null,
        p.sparring.ja && p.woche[p.sparring.tag]
          ? el('p', { class: 'leise' }, `An dem Tag steht bisher Einheit ${p.woche[p.sparring.tag]}. Das Sparring ersetzt sie.`) : null,
      ],
      pruefen: () => '',
    },
    {
      titel: 'Beschwerden',
      inhalt: () => [
        mehrfachFeld('Tut gerade etwas weh? (kann leer bleiben)', Object.entries(REGIONEN).map(([wert, r]) => ({ wert, name: r.name })),
          p.beschwerden.regionen, (w) => neu(() => { p.beschwerden.regionen = w; })()),
        textFeld('Notiz dazu (wenn du magst)', p.beschwerden.notiz, (w) => { p.beschwerden.notiz = w; }, true),
        el('p', { class: 'leise' }, 'Betroffene Übungen werden ersetzt, nicht gestrichen. Die App ersetzt keinen Arzt.'),
      ],
      pruefen: () => '',
    },
    {
      titel: 'Starttest',
      inhalt: () => {
        const stationen = TEST.filter((t) => !t.geraet || p.ausruestung.includes(t.geraet));
        return [
          el('p', { class: 'absatz' }, `${stationen.length} Stationen, etwa 20 Minuten. Mach ihn frisch, nicht nach einer harten Schicht.`),
          el('ol', { class: 'schritte' }, stationen.map((t) => el('li', {}, t.name))),
          el('p', { class: 'leise' }, 'Aus den Werten entstehen deine Wiederholungszahlen. Du kannst den Test auch später machen.'),
        ];
      },
      pruefen: () => '',
    },
  ];

  function zeichnen() {
    schritt = Math.min(schritt, SCHRITTE.length);
    const s = SCHRITTE[schritt - 1];
    const letzter = schritt === SCHRITTE.length;

    let knoepfe;
    if (einzeln) {
      knoepfe = [el('button', { class: 'balken', onclick: () => weiter('#/profil') }, 'Speichern')];
    } else if (letzter) {
      knoepfe = [
        el('button', { class: 'balken', onclick: () => weiter('#/test') }, 'Test jetzt machen'),
        el('button', { class: 'knopf', onclick: () => weiter('#/heute') }, 'Später testen'),
      ];
    } else {
      knoepfe = [el('button', { class: 'balken', onclick: () => weiter() }, 'Weiter')];
    }

    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, einzeln ? 'Angabe ändern' : `Schritt ${schritt} von ${SCHRITTE.length}`),
      el('h1', { class: 'titel' }, s.titel),
      s.inhalt(),
      fehler ? el('p', { class: 'fehler', role: 'alert' }, fehler) : null,
      el('div', { class: 'unten' },
        knoepfe,
        einzeln
          ? el('a', { class: 'zurueck', href: '#/profil' }, 'Abbrechen')
          : (schritt > 1 ? el('button', { class: 'zurueck', onclick: () => { fehler = ''; schritt -= 1; zeichnen(); window.scrollTo(0, 0); } }, 'Zurück') : null),
      ),
    );
  }

  // Prüfen, dann zum nächsten Schritt oder speichern und zu "wohin" wechseln
  async function weiter(wohin) {
    fehler = SCHRITTE[schritt - 1].pruefen();
    if (fehler) { zeichnen(); return; }
    if (!wohin) {
      schritt += 1;
      zeichnen();
      window.scrollTo(0, 0);
      return;
    }
    try {
      await profilSpeichern({ ...p, angelegt: p.angelegt || new Date().toISOString() });
      location.hash = wohin;
    } catch (e) {
      fehler = 'Das Profil konnte nicht gespeichert werden. Ist der Speicher des Geräts voll oder der private Modus an?';
      zeichnen();
    }
  }

  return () => { weg = true; };
}
