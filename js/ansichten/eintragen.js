// Eintragen nach dem Training: wenige Tipper, unter 30 Sekunden.
// Aufruf: #/eintragen?einheit=A&platt=0  oder  #/eintragen?einheit=sparring

import { el, fuellen } from '../hilfen.js';
import { zahlFeld, textFeld, wahlFeld } from '../formular.js';
import { heuteLaden, eintragSpeichern } from '../plan.js';

const zahlen = (von, bis) => Array.from({ length: bis - von + 1 }, (_, i) => ({ wert: von + i, name: String(von + i) }));

export function zeigen(ziel, parameter) {
  const kurz = parameter.get('einheit');
  const istSparring = kurz === 'sparring';
  const platt = parameter.has('platt') ? parameter.get('platt') === '1' : null;
  const e = { geschafft: null, anstrengung: null, muedigkeit: null, sparringHaerte: null, wdh: {}, notiz: '' };
  let d = null;
  let fehler = '';
  let weg = false;

  heuteLaden({ wunsch: istSparring ? null : kurz, platt }).then((daten) => {
    if (weg) return;
    if (!daten || (!istSparring && !daten.einheit)) { location.hash = '#/heute'; return; }
    d = istSparring ? { ...daten, kurz: 'sparring', einheit: null } : daten;
    zeichnen();
  });

  const neu = (aendern) => (wert) => { aendern(wert); fehler = ''; zeichnen(); };

  function zeichnen() {
    // Blöcke, bei denen man zählt (z. B. Burpees im Finisher)
    const zaehlBloecke = d.einheit ? d.einheit.bloecke.filter((b) => b.art === 'amrap') : [];

    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, istSparring ? 'Nach dem Sparring' : `${d.einheit.kurz} ${d.einheit.name}`),
      el('h1', { class: 'titel' }, 'Eintragen'),

      istSparring ? null : wahlFeld('Alles geschafft?', [{ wert: true, name: 'Ja' }, { wert: false, name: 'Nein' }],
        e.geschafft, neu((w) => { e.geschafft = w; })),
      zaehlBloecke.map((b) => zahlFeld(b.text, 'Wdh.', e.wdh[b.id], (w) => { e.wdh[b.id] = w; })),

      wahlFeld('Anstrengung (1 = leicht, 10 = alles gegeben)', zahlen(1, 10), e.anstrengung, neu((w) => { e.anstrengung = w; }), 'wahl-raster'),
      istSparring
        ? wahlFeld('Härte des Sparrings (1 = locker, 5 = sehr hart)', zahlen(1, 5), e.sparringHaerte, neu((w) => { e.sparringHaerte = w; }))
        : wahlFeld('Müde von der Schicht (1 = wach, 5 = völlig platt)', zahlen(1, 5), e.muedigkeit, neu((w) => { e.muedigkeit = w; })),
      textFeld('Notiz (wenn du magst)', e.notiz, (w) => { e.notiz = w; }, true),

      fehler ? el('p', { class: 'fehler', role: 'alert' }, fehler) : null,
      el('div', { class: 'unten' },
        el('button', { class: 'balken', onclick: speichern }, istSparring ? 'Sparring speichern' : 'Training speichern'),
        el('a', { class: 'zurueck', href: '#/heute' }, 'Nicht eintragen'),
      ),
    );
  }

  async function speichern() {
    if (!istSparring && e.geschafft === null) fehler = 'Tipp an, ob du alles geschafft hast.';
    else if (e.anstrengung === null) fehler = 'Tipp deine Anstrengung an.';
    else if (istSparring && e.sparringHaerte === null) fehler = 'Tipp die Härte des Sparrings an.';
    else if (!istSparring && e.muedigkeit === null) fehler = 'Tipp an, wie müde du von der Schicht warst.';
    else fehler = '';
    if (fehler) { zeichnen(); return; }

    try {
      const text = await eintragSpeichern(d, {
        geschafft: istSparring ? true : e.geschafft,
        anstrengung: e.anstrengung,
        muedigkeit: e.muedigkeit,
        sparringHaerte: e.sparringHaerte,
        wdh: e.wdh,
        notiz: e.notiz.trim(),
      });
      gespeichert(text);
    } catch {
      fehler = 'Der Eintrag konnte nicht gespeichert werden. Ist der Speicher des Geräts voll?';
      zeichnen();
    }
  }

  function gespeichert(text) {
    const zusatz = [];
    if (istSparring && e.sparringHaerte >= 4) zusatz.push('Hartes Sparring: das nächste Training C hat nur Seil, Beinarbeit und Schattenboxen.');
    if (!istSparring && e.muedigkeit >= 4) zusatz.push('Du warst sehr müde: beim nächsten Training ist „Heute platt“ schon angetippt. Du kannst es ausschalten.');
    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, istSparring ? 'Sparring' : `${d.einheit.kurz} ${d.einheit.name}`),
      el('h1', { class: 'titel' }, 'Gespeichert'),
      el('p', { class: 'absatz' }, text),
      zusatz.map((z) => el('p', { class: 'hinweis' }, z)),
      el('div', { class: 'unten' }, el('a', { class: 'balken', href: '#/heute' }, 'Fertig')),
    );
  }

  return () => { weg = true; };
}
