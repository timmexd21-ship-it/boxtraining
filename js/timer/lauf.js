// Der laufende Timer: bildschirmfüllend, Farbe zeigt den Zustand.
// Wird vom Timer-Bereich und von den Trainingsblöcken benutzt.
//
// e = { rundeSek, pauseSek, runden,            Ablauf
//       ansage, art, stufe, tempo, kdw, kdwOefter,   Kombi-Ansage (siehe ansage.js)
//       ansageRunden,  optional: nur in diesen Runden ansagen, z. B. [2, 6]
//       titel,      optional: Beschriftung statt "Runde" (z. B. "Aufwärmen")
//       alsPause }  optional: die Zeit ist eine Pause (blaue Fläche)
// zu()     wird aufgerufen, wenn der Timer geschlossen wird
// fertig() wird aufgerufen, wenn alle Runden durchgelaufen sind

import { el } from '../hilfen.js';
import { Uhr, standBei, mitWarnung, alsZeit, WARNUNG_SEK } from './uhr.js';
import { tonBereit, gong, warnung, piep } from './ton.js';
import { TEMPO, sprich, schweigen, naechsteKombi, sprechdauer, ansageText } from './ansage.js';
import { wachbleiben, wachbleibenBeenden } from './wachbleiben.js';

export function timerStarten(e, { zu, fertig } = {}) {
  tonBereit();
  wachbleiben();
  if (e.ansage) sprich('Fertig machen');

  const uhr = new Uhr();
  const kopf = el('p', { class: 'lauf-kopf' });
  const zeit = el('p', { class: 'lauf-zeit', 'aria-live': 'off' });
  const kombi = el('p', { class: 'lauf-kombi' });
  const knoepfe = el('div', { class: 'lauf-knoepfe' });
  const flaeche = el('section', { class: 'lauf', 'aria-label': 'Timer läuft' }, kopf, zeit, kombi, knoepfe);
  document.body.append(flaeche);

  let nummer = -1;          // welcher Abschnitt zuletzt gezeigt wurde
  let gewarnt = false;
  let letzterPiep = 0;
  let letzteKombi = null;
  let naechsteAnsage = 0;   // Zeitpunkt (ms auf der Uhr) der nächsten Ansage
  let gezeigteZeit = '';

  function zeitSetzen(text) {
    if (text === gezeigteZeit) return;
    gezeigteZeit = text;
    // Jede Ziffer in ein gleich breites Feld, damit die Zahl nicht wackelt
    zeit.replaceChildren(...[...text].map((z) => el('span', { class: z === ':' ? 'punkt' : 'ziffer' }, z)));
  }

  // Kombi groß zeigen. Jede Gruppe ("1-2-3", "Abrollen") bleibt am Stück in einer Zeile.
  function kombiSetzen(text) {
    const gruppen = text ? text.split(', ') : [];
    kombi.classList.toggle('lang', text.length > 9);
    kombi.replaceChildren(...gruppen.map((g, i) =>
      el('span', { class: 'gruppe' }, i < gruppen.length - 1 ? `${g}, ` : g)));
  }

  function knoepfeSetzen() {
    if (uhr.laeuft) {
      knoepfe.replaceChildren(el('button', { class: 'lauf-knopf', onclick: anhalten }, 'Anhalten'));
    } else {
      knoepfe.replaceChildren(
        el('button', { class: 'lauf-knopf', onclick: weiter }, 'Weiter'),
        el('button', { class: 'lauf-knopf', onclick: beenden }, 'Beenden'),
      );
    }
  }

  function anhalten() {
    uhr.anhalten();
    schweigen();
    flaeche.dataset.angehalten = 'ja';
    knoepfeSetzen();
    takt();
  }
  function weiter() {
    tonBereit();
    uhr.starten();
    delete flaeche.dataset.angehalten;
    knoepfeSetzen();
  }

  function takt() {
    const jetzt = uhr.vergangenMs();
    const s = standBei(e, jetzt);
    const restSek = Math.ceil(s.restMs / 1000);

    // Neuer Abschnitt: Gong und Beschriftung
    if (s.nummer !== nummer) {
      const erster = nummer === -1;
      nummer = s.nummer;
      gewarnt = false;
      kombiSetzen(s.art === 'pause' ? `Dann Runde ${s.runde + 1} / ${e.runden}` : '');
      naechsteAnsage = jetzt + 2000;
      if (s.art === 'runde') gong(1);
      else if (s.art === 'pause') gong(2);
      else if (s.art === 'ende') gong(3);
      if (s.art !== 'runde' && !erster) schweigen();
    }

    if (s.art === 'ende') {
      clearInterval(zaehler);
      wachbleibenBeenden();
      flaeche.dataset.zustand = 'ende';
      kopf.textContent = 'Fertig';
      zeitSetzen(e.titel && e.runden === 1 ? '✓' : String(e.runden));
      kombiSetzen(e.titel && e.runden === 1 ? `${e.titel} vorbei` : (e.runden === 1 ? 'Runde geschafft' : 'Runden geschafft'));
      fertig?.();
      knoepfe.replaceChildren(el('button', { class: 'lauf-knopf', onclick: beenden }, 'Schließen'));
      return;
    }

    const warnzeit = s.art === 'runde' && mitWarnung(e) && s.restMs <= WARNUNG_SEK * 1000;
    flaeche.dataset.zustand = warnzeit ? 'warnung' : (s.art === 'runde' && e.alsPause ? 'pause' : s.art);

    if (!uhr.laeuft) kopf.textContent = 'Angehalten';
    else if (s.art === 'vorlauf') kopf.textContent = 'Fertig machen';
    else if (s.art === 'pause') kopf.textContent = 'Pause';
    else if (e.titel) kopf.textContent = e.runden > 1 ? `${e.titel} ${s.runde} / ${e.runden}` : e.titel;
    else kopf.textContent = `Runde ${s.runde} / ${e.runden}`;

    zeitSetzen(alsZeit(restSek));
    if (!uhr.laeuft) return;

    if (warnzeit && !gewarnt) {
      gewarnt = true;
      warnung();
    }
    if (s.art === 'vorlauf' && restSek <= 3 && restSek !== letzterPiep) {
      letzterPiep = restSek;
      piep();
    }

    // Kombi ansagen: nur in der Runde, nicht mehr in den letzten 4 Sekunden
    const ansageInDieserRunde = e.ansage && (!e.ansageRunden || e.ansageRunden.includes(s.runde));
    if (s.art === 'runde' && ansageInDieserRunde && jetzt >= naechsteAnsage && s.restMs > 4000) {
      letzteKombi = naechsteKombi(e, letzteKombi);
      kombiSetzen(letzteKombi);
      sprich(ansageText(letzteKombi, e.art));
      naechsteAnsage = jetzt + (sprechdauer(letzteKombi, e.art) + TEMPO[e.tempo].luecke) * 1000;
    }
  }

  function beenden() {
    clearInterval(zaehler);
    schweigen();
    wachbleibenBeenden();
    flaeche.remove();
    zu?.();
  }

  uhr.starten();
  knoepfeSetzen();
  const zaehler = setInterval(takt, 100);
  takt();
  return { beenden };
}
