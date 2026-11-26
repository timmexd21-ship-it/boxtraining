// Geführter Test (Start und jede 4. Woche): Station für Station, mit Timer wo nötig.

import { el, fuellen } from '../hilfen.js';
import { zahlFeld } from '../formular.js';
import { schreiben } from '../db.js';
import { profilLaden } from '../profil.js';
import { TEST } from '../data/block.js';
import { AUSRUESTUNG } from '../data/ausruestung.js';
import { alsZeit } from '../timer/uhr.js';
import { tonBereit, gong, piep } from '../timer/ton.js';
import { wachbleiben, wachbleibenBeenden } from '../timer/wachbleiben.js';

const VORLAUF_SEK = 5;

export function zeigen(ziel) {
  let stationen = TEST;
  let nummer = -1;            // -1 = Einleitung, stationen.length = Zusammenfassung
  const werte = {};           // id -> Zahl (fehlt = ausgelassen)
  let eingabe = {};           // Zwischenstand der aktuellen Station
  let zaehler = null;
  let fehler = '';
  let weg = false;

  profilLaden().then((profil) => {
    if (weg) return;
    const vorhanden = profil?.ausruestung || Object.keys(AUSRUESTUNG);
    stationen = TEST.filter((t) => !t.geraet || vorhanden.includes(t.geraet));
    zeichnen();
  });

  function zeichnen() {
    if (nummer < 0) return einleitung();
    if (nummer >= stationen.length) return zusammenfassung();
    return station(stationen[nummer]);
  }

  function einleitung() {
    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, `${stationen.length} Stationen, immer in dieser Reihenfolge`),
      el('h1', { class: 'titel' }, 'Test'),
      el('p', { class: 'absatz' }, 'Mach den Test frisch. Zwischen den Stationen so lange Pause, bis du wieder ruhig atmest.'),
      el('ol', { class: 'schritte' }, stationen.map((t) => el('li', {}, t.name))),
      el('div', { class: 'unten' },
        el('button', { class: 'balken', onclick: () => { tonBereit(); wachbleiben(); nummer = 0; zeichnen(); } }, 'Test starten'),
        el('a', { class: 'zurueck', href: '#/heute' }, 'Abbrechen'),
      ),
    );
  }

  function station(t) {
    const kopf = [
      el('p', { class: 'kopfzeile' }, `Station ${nummer + 1} von ${stationen.length}`),
      el('h1', { class: 'titel' }, t.name),
      t.text ? el('p', { class: 'leise' }, t.text) : null,
    ];
    const auslassen = el('button', { class: 'zurueck', onclick: () => naechste(null) }, 'Station auslassen');

    // Zeit-Station: erst läuft die Uhr, dann wird gezählt
    if (t.art === 'zeit' && !eingabe.zeitVorbei) {
      const anzeige = el('p', { class: 'grosse-zeit' }, alsZeit(t.sek));
      const lage = el('p', { class: 'absatz' }, 'Stell dich hin. Nach dem Start hast du 5 Sekunden, dann kommt der Gong.');
      const start = el('button', { class: 'balken', onclick: () => zeitStarten(t, anzeige, lage, start) }, 'Zeit starten');
      fuellen(ziel, kopf, anzeige, lage, el('div', { class: 'unten' }, start, auslassen));
      return;
    }

    let felder;
    if (t.art === 'weite') {
      eingabe.versuche ??= Array(t.versuche).fill(null);
      felder = eingabe.versuche.map((w, i) => zahlFeld(`Versuch ${i + 1}`, t.einheit, w, (neu) => { eingabe.versuche[i] = neu; }));
    } else {
      const frage = t.art === 'zeit' ? 'Wie viele hast du geschafft?' : 'So viele wie möglich, dann eintragen';
      felder = [zahlFeld(frage, t.einheit, eingabe.wert, (neu) => { eingabe.wert = neu; })];
    }

    fuellen(ziel, kopf, felder,
      fehler ? el('p', { class: 'fehler', role: 'alert' }, fehler) : null,
      el('div', { class: 'unten' },
        el('button', { class: 'balken', onclick: () => {
          const wert = t.art === 'weite'
            ? Math.max(...eingabe.versuche.filter((v) => typeof v === 'number'), -1)
            : eingabe.wert;
          if (typeof wert !== 'number' || wert < 0) {
            fehler = t.art === 'weite' ? 'Trag mindestens einen Versuch ein.' : 'Trag eine Zahl ein oder lass die Station aus.';
            zeichnen();
            return;
          }
          naechste(wert);
        } }, nummer === stationen.length - 1 ? 'Zum Ergebnis' : 'Nächste Station'),
        auslassen,
      ),
    );
  }

  function zeitStarten(t, anzeige, lage, start) {
    tonBereit();
    start.disabled = true;
    const beginn = Date.now();
    let letzterPiep = 0;
    let laeuft = false;
    zaehler = setInterval(() => {
      const vergangen = (Date.now() - beginn) / 1000;
      if (vergangen < VORLAUF_SEK) {
        const rest = Math.ceil(VORLAUF_SEK - vergangen);
        lage.textContent = 'Fertig machen';
        anzeige.textContent = String(rest);
        if (rest <= 3 && rest !== letzterPiep) { letzterPiep = rest; piep(); }
        return;
      }
      if (!laeuft) {
        laeuft = true;
        gong(1);
        lage.textContent = 'Läuft. Zähl mit.';
        anzeige.classList.add('laeuft');
      }
      const rest = t.sek - (vergangen - VORLAUF_SEK);
      anzeige.textContent = alsZeit(Math.ceil(rest));
      if (rest <= 0) {
        clearInterval(zaehler);
        zaehler = null;
        gong(2);
        eingabe.zeitVorbei = true;
        zeichnen();
      }
    }, 100);
  }

  function naechste(wert) {
    clearInterval(zaehler);
    zaehler = null;
    if (wert !== null) werte[stationen[nummer].id] = wert;
    else delete werte[stationen[nummer].id];
    eingabe = {};
    fehler = '';
    nummer += 1;
    zeichnen();
    window.scrollTo(0, 0);
  }

  function zusammenfassung() {
    wachbleibenBeenden();
    const gemacht = Object.keys(werte).length;
    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, `${gemacht} von ${stationen.length} Stationen gemacht`),
      el('h1', { class: 'titel' }, 'Ergebnis'),
      el('ul', { class: 'zeilen' }, stationen.map((t) => el('li', {}, t.name,
        el('span', { class: 'wert' }, t.id in werte ? `${werte[t.id]} ${t.einheit}` : 'ausgelassen')))),
      fehler ? el('p', { class: 'fehler', role: 'alert' }, fehler) : null,
      el('div', { class: 'unten' },
        el('button', { class: 'balken', disabled: gemacht === 0, onclick: speichern }, 'Test speichern'),
        el('a', { class: 'zurueck', href: '#/heute' }, 'Verwerfen'),
      ),
    );
  }

  async function speichern() {
    try {
      await schreiben('tests', { datum: new Date().toISOString(), werte });
      location.hash = '#/profil';
    } catch {
      fehler = 'Der Test konnte nicht gespeichert werden. Ist der Speicher des Geräts voll?';
      zeichnen();
    }
  }

  return () => {
    weg = true;
    clearInterval(zaehler);
    wachbleibenBeenden();
  };
}
