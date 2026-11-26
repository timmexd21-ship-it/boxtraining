// Trainingsansicht: die Einheit Block für Block durchklicken.
// Jeder Block zeigt Figur (wenn es eine Animation gibt), Umfang, Hinweise und startet den Timer.

import { el, fuellen } from '../hilfen.js';
import { lesen } from '../db.js';
import { heuteLaden } from '../plan.js';
import { ansageStufe } from '../rules.js';
import { timerStarten } from '../timer/lauf.js';
import { STANDARD as TIMER_STANDARD } from './timer.js';

export function zeigen(ziel, parameter) {
  const platt = parameter.has('platt') ? parameter.get('platt') === '1' : null;
  const wunsch = parameter.get('einheit');
  let daten = null;
  let timerEinstellung = TIMER_STANDARD;
  let nummer = 0;
  let spieler = null;
  let figur = null;      // geladenes Modul figur/spieler.js
  let lauf = null;
  let weg = false;

  Promise.all([heuteLaden({ wunsch, platt }), lesen('einstellungen', 'timer').catch(() => null)]).then(([d, t]) => {
    if (weg) return;
    daten = d;
    if (t) timerEinstellung = { ...TIMER_STANDARD, ...t };
    if (!daten?.einheit || daten.einheit.test || !daten.einheit.bloecke.length) {
      location.hash = '#/heute';
      return;
    }
    zeichnen();
  });

  function buehneRaeumen() {
    spieler?.entsorgen();
    spieler = null;
  }

  function zeichnen() {
    buehneRaeumen();
    const e = daten.einheit;
    if (nummer >= e.bloecke.length) return geschafft();
    const b = e.bloecke[nummer];
    const letzter = nummer === e.bloecke.length - 1;
    const naechster = () => { nummer += 1; zeichnen(); window.scrollTo(0, 0); };

    const buehne = el('div', { class: 'buehne buehne-klein', hidden: true });
    const wahl = el('div', { class: 'wahl wahl-umbruch', hidden: true });

    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, `Block ${nummer + 1} von ${e.bloecke.length} · ${e.kurz} ${e.name}`),
      el('h1', { class: 'titel' }, b.name),
      el('p', { class: 'menge' }, b.menge),
      b.text ? el('p', { class: 'absatz eng' }, b.text) : null,
      buehne, wahl,
      b.liste.length ? el('ul', { class: 'ablauf' }, b.liste.map((z) => el('li', {}, z))) : null,
      b.hinweise.length ? el('ul', { class: 'hinweise' }, b.hinweise.map((h) => el('li', {}, h))) : null,
      el('div', { class: 'unten' },
        b.timer ? el('button', { class: 'balken', onclick: () => timer(b) }, b.timer.knopf || 'Timer starten') : null,
        el('button', { class: b.timer ? 'knopf' : 'balken', onclick: naechster }, letzter ? 'Training beenden' : 'Nächster Block'),
        nummer > 0
          ? el('button', { class: 'zurueck', onclick: () => { nummer -= 1; zeichnen(); window.scrollTo(0, 0); } }, 'Zurück')
          : el('a', { class: 'zurueck', href: '#/heute' }, 'Abbrechen'),
      ),
    );
    if (b.animationen.length) figurZeigen(b, buehne, wahl);
  }

  // Figur laden und nur die Bewegungen anbieten, für die es schon eine Animation gibt
  async function figurZeigen(b, buehne, wahl) {
    try {
      figur ??= await import('../figur/spieler.js');
    } catch {
      return;
    }
    if (weg || daten.einheit.bloecke[nummer] !== b) return;
    const vorhanden = b.animationen.filter((a) => {
      try { figur.bewegungFuer(a.clip); return true; } catch { return false; }
    });
    if (!vorhanden.length) return;

    buehne.hidden = false;
    spieler = new figur.Spieler(buehne);
    spieler.gespiegelt = daten.profil.auslage === 'rechts';
    let gewaehlt = vorhanden[0].clip;
    spieler.zeigen(gewaehlt);

    const knoepfe = () => {
      fuellen(wahl,
        vorhanden.length > 1 ? vorhanden.map((a) => el('button', {
          'aria-pressed': String(a.clip === gewaehlt),
          onclick: () => { gewaehlt = a.clip; spieler.zeigen(gewaehlt); knoepfe(); },
        }, a.name)) : null,
        el('button', { 'aria-pressed': String(spieler.zeitlupe), onclick: () => { spieler.zeitlupe = !spieler.zeitlupe; knoepfe(); } }, 'Zeitlupe'),
        el('button', { 'aria-pressed': String(!spieler.laeuft), onclick: () => { spieler.laeuft = !spieler.laeuft; knoepfe(); } }, spieler.laeuft ? 'Pause' : 'Weiter'),
      );
    };
    wahl.hidden = false;
    knoepfe();
  }

  function timer(b) {
    if (spieler) spieler.laeuft = false; // Figur anhalten, solange der Timer die Fläche hat
    lauf = timerStarten({
      ...timerEinstellung,
      ...b.timer,
      kdw: daten.einheit.kombis[0],
      kdwOefter: true,
      stufe: ansageStufe(daten.block),
    }, { zu: () => { lauf = null; if (spieler) spieler.laeuft = true; } });
  }

  function geschafft() {
    const e = daten.einheit;
    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, `${e.kurz} ${e.name}`),
      el('h1', { class: 'titel' }, 'Geschafft'),
      el('p', { class: 'absatz' }, 'Noch kurz eintragen, wie es war. Daraus entsteht dein nächstes Training.'),
      el('div', { class: 'unten' },
        el('a', { class: 'balken', href: `#/eintragen?einheit=${e.kurz}&platt=${e.platt ? 1 : 0}` }, 'Training eintragen'),
        el('a', { class: 'zurueck', href: '#/heute' }, 'Nicht eintragen'),
      ),
    );
  }

  return () => {
    weg = true;
    lauf?.beenden();
    buehneRaeumen();
  };
}
