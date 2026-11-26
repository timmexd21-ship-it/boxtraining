// Testseite für die 3D-Figur: alle vorhandenen Animationen ansehen.
// Three.js wird erst hier geladen, damit der Rest der App schnell startet.

import { el, fuellen } from '../hilfen.js';

import { KOMBIS } from '../data/kombis.js';

// Alle Bewegungen, nach Gruppen
const GRUPPEN = [
  { name: 'Schläge', liste: [
    ['jab', '1 Jab'], ['cross', '2 Cross'], ['haken', '3 Haken'], ['haken_hinten', '4 Hinterer Haken'],
    ['aufwaerts', '5 Aufwärtshaken'], ['aufwaerts_hinten', '6 Hint. Aufwärtsh.'],
    ['jab_k', '1K'], ['cross_k', '2K'], ['haken_k', '3K'], ['haken_hinten_k', '4K'],
  ] },
  { name: 'Kombis', liste: KOMBIS.map((k) => [k.text, k.text]) },
  { name: 'Abwehr', liste: [
    ['slip_aussen', 'Slip außen'], ['slip_innen', 'Slip innen'], ['abrollen', 'Abrollen'], ['slip_seil', 'Slip-Seil'],
    ['slip_konter', 'Slip und Konter'], ['abrollen_konter', 'Abrollen und Konter'], ['sack_pendel', 'Sack-Pendel'],
  ] },
  { name: 'Beinarbeit', liste: [
    ['step_drag', 'Step-Drag'], ['viereck', 'Viereck'], ['drehen', 'Drehen'],
    ['rein_raus', 'Rein-Raus'], ['winkel', 'Winkel'], ['linie', 'Linie'],
  ] },
  { name: 'Seil', liste: [
    ['grundsprung', 'Grundsprung'], ['boxer_skip', 'Boxer-Skip'], ['kniehebelauf', 'Kniehebelauf'], ['doppelsprung', 'Doppelsprünge'],
  ] },
  { name: 'Körpergewicht', liste: [
    ['liegestuetz', 'Liegestütze'], ['klatsch_liegestuetz', 'Klatsch-Liegest.'], ['klimmzug', 'Klimmzüge'],
    ['explosiv_klimmzug', 'Expl. Klimmzüge'], ['dips', 'Dips'], ['hocksprung', 'Hocksprünge'],
    ['ausfallschritt_sprung', 'Ausfallschr.-Spr.'], ['weitsprung', 'Weitsprung'], ['burpee', 'Burpees'],
    ['russian_twist', 'Russian Twists'], ['schultertippen', 'Schultertippen'], ['hampelmann', 'Hampelmänner'],
  ] },
];

export function zeigen(ziel, parameter = new URLSearchParams()) {
  let spieler = null;
  let weg = false;
  let gewaehlt = parameter.get('clip') || 'jab';

  const buehne = el('div', { class: 'buehne' });
  const steuerung = el('div', { class: 'wahl wahl-umbruch' });
  const liste = el('div', {});

  fuellen(ziel,
    el('p', { class: 'kopfzeile' }, 'Mit dem Finger drehen'),
    el('h1', { class: 'titel' }, 'Figur'),
    buehne,
    steuerung,
    liste,
  );

  function knoepfe() {
    const schalter = (name, an, tun) => el('button', { 'aria-pressed': String(an), onclick: () => { tun(); knoepfe(); } }, name);
    fuellen(steuerung,
      schalter(spieler.laeuft ? 'Pause' : 'Weiter', !spieler.laeuft, () => { spieler.laeuft = !spieler.laeuft; }),
      schalter('Zeitlupe', spieler.zeitlupe, () => { spieler.zeitlupe = !spieler.zeitlupe; }),
      schalter('Spiegeln', spieler.gespiegelt, () => { spieler.gespiegelt = !spieler.gespiegelt; }),
      schalter('Von oben', spieler.vonOben, () => { spieler.vonOben = !spieler.vonOben; }),
      schalter('Gelenke zeigen', spieler.puppe.gelenkeZeigen, () => { spieler.puppe.gelenkeZeigen = !spieler.puppe.gelenkeZeigen; }),
    );
    fuellen(liste, GRUPPEN.map((g) => el('div', { class: 'feld' },
      el('span', { class: 'feld-name' }, g.name),
      el('div', { class: 'wahl wahl-umbruch wahl-klein' }, g.liste.map(([wert, name]) => el('button', {
        'aria-pressed': String(wert === gewaehlt),
        onclick: () => { gewaehlt = wert; spieler.zeigen(gewaehlt); spieler.vonOben = false; knoepfe(); window.scrollTo(0, 0); },
      }, name))))));
  }

  import('../figur/spieler.js').then(({ Spieler }) => {
    if (weg) return;
    spieler = new Spieler(buehne);
    spieler.zeigen(gewaehlt);
    knoepfe();

    // Prüfbogen zum Kontrollieren: #/figur?clip=jab&bogen=0,0.1,0.17,0.3
    const bogen = parameter.get('bogen');
    if (bogen) {
      buehne.classList.add('bogen');
      spieler.groesse();
      spieler.pruefbogen(bogen.split(',').map(Number));
    }
    window.__spieler = spieler;
  }).catch((fehler) => {
    fuellen(buehne, el('p', { class: 'absatz' }, `Die 3D-Figur konnte nicht geladen werden: ${fehler.message}`));
  });

  return () => {
    weg = true;
    spieler?.entsorgen();
  };
}
