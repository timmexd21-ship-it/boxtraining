// Profil: deine Angaben (jede einzeln änderbar), der letzte Test und der Stand der App.

import { el, fuellen } from '../hilfen.js';
import { VERSION } from '../version.js';
import { profilLaden, letzterTest, zielAnteile, TAGE_KURZ, TAGE, einheitAm } from '../profil.js';
import { AUSRUESTUNG } from '../data/ausruestung.js';
import { REGIONEN } from '../data/ersatz.js';
import { TEST } from '../data/block.js';

// Läuft die App vom Home-Bildschirm aus (ohne Safari-Leisten)?
function alsAppGeoeffnet() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function zeigen(ziel) {
  let weg = false;
  const offline = el('span', { class: 'wert' }, 'wird geprüft');
  const netz = el('span', { class: 'wert' }, navigator.onLine ? 'verbunden' : 'getrennt');

  Promise.all([profilLaden(), letzterTest()]).then(([profil, test]) => {
    if (!weg) zeichnen(profil, test);
  });

  // Eine Angabe als Zeile; Tippen öffnet den passenden Onboarding-Bildschirm
  const zeile = (name, wert, schritt) => el('li', {},
    el('a', { class: 'zeile-link', href: `#/start?schritt=${schritt}&einzeln=1`, 'aria-label': `${name} ändern` },
      el('span', {}, name), el('span', { class: 'wert' }, wert)));

  function angaben(p) {
    const z = zielAnteile(p.ziele);
    const wochentage = TAGE_KURZ.map((kurz, tag) => {
      const e = einheitAm(p, tag);
      return e && e !== 'sparring' ? `${kurz} ${e}` : null;
    }).filter(Boolean).join(', ');
    return [
      el('p', { class: 'leise' }, 'Tipp eine Zeile an, um sie zu ändern.'),
      el('ul', { class: 'zeilen' },
        zeile('Körper', `${p.alter} J., ${p.groesse} cm, ${p.gewicht} kg`, 1),
        zeile('Erfahrung', `${p.erfahrungJahre} ${p.erfahrungJahre === 1 ? 'Jahr' : 'Jahre'}${p.andereSportarten ? `, ${p.andereSportarten}` : ''}`, 2),
        zeile('Auslage', p.auslage === 'links' ? 'Linke Hand vorn' : 'Rechte Hand vorn', 3),
        zeile('Ziele', `Technik ${z.technik} %, Kraft ${z.schlagkraft} %, Ausdauer ${z.ausdauer} %`, 4),
        zeile('Training', `${wochentage || 'kein Tag'}, je ${p.dauer} Min`, 5),
        zeile('Ausrüstung', `${p.ausruestung.length} von ${Object.keys(AUSRUESTUNG).length}`, 6),
        zeile('Sparring', p.sparring.ja ? TAGE[p.sparring.tag] : 'nein', 7),
        zeile('Beschwerden', p.beschwerden.regionen.map((r) => REGIONEN[r]?.name).filter(Boolean).join(', ') || 'keine', 8),
      ),
    ];
  }

  function testwerte(test) {
    if (!test) {
      return [
        el('h2', { class: 'abschnitt' }, 'Test'),
        el('p', { class: 'absatz' }, 'Noch kein Test gemacht. Aus den Werten entstehen deine Wiederholungszahlen.'),
        el('a', { class: 'knopf', href: '#/test' }, 'Test machen'),
      ];
    }
    const datum = new Date(test.datum).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    return [
      el('h2', { class: 'abschnitt' }, 'Letzter Test'),
      el('p', { class: 'leise' }, datum),
      el('ul', { class: 'zeilen' }, TEST.filter((t) => t.id in test.werte).map((t) =>
        el('li', {}, t.name, el('span', { class: 'wert' }, `${test.werte[t.id]} ${t.einheit}`)))),
      el('a', { class: 'knopf', href: '#/test' }, 'Test wiederholen'),
    ];
  }

  function zeichnen(profil, test) {
    fuellen(ziel,
      el('p', { class: 'kopfzeile' }, 'Deine Angaben und die App'),
      el('h1', { class: 'titel' }, 'Profil'),
      profil ? angaben(profil) : [
        el('p', { class: 'absatz' }, 'Noch kein Profil angelegt. Neun kurze Fragen, dann steht dein Plan.'),
        el('a', { class: 'balken', href: '#/start' }, 'Profil anlegen'),
      ],
      profil ? testwerte(test) : null,

      el('h2', { class: 'abschnitt' }, 'App'),
      el('ul', { class: 'zeilen' },
        el('li', {}, 'Stand', el('span', { class: 'wert' }, VERSION)),
        el('li', {}, 'Ohne Netz nutzbar', offline),
        el('li', {}, 'Netz', netz),
        el('li', {}, 'Vom Home-Bildschirm', el('span', { class: 'wert' }, alsAppGeoeffnet() ? 'ja' : 'nein')),
      ),
      el('a', { class: 'knopf', href: '#/daten' }, 'Daten sichern und einspielen'),
      el('a', { class: 'knopf', href: '#/figur' }, 'Alle Animationen ansehen'),

      alsAppGeoeffnet() ? null : [
        el('h2', { class: 'abschnitt' }, 'Aufs iPhone holen'),
        el('ol', { class: 'schritte' },
          el('li', {}, 'Diese Seite in Safari öffnen.'),
          el('li', {}, 'Unten auf das Teilen-Symbol tippen (Quadrat mit Pfeil nach oben).'),
          el('li', {}, '„Zum Home-Bildschirm“ wählen, dann „Hinzufügen“.'),
        ),
      ],
    );
    offlinePruefen();
  }

  // Offline bereit, sobald ein Service Worker die Seite steuert.
  function offlinePruefen() {
    const bereit = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
    offline.textContent = bereit ? 'ja' : 'noch nicht';
    offline.classList.toggle('gut', bereit);
  }
  function netzPruefen() {
    netz.textContent = navigator.onLine ? 'verbunden' : 'getrennt';
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => setTimeout(offlinePruefen, 300));
    navigator.serviceWorker.addEventListener('controllerchange', offlinePruefen);
  }
  window.addEventListener('online', netzPruefen);
  window.addEventListener('offline', netzPruefen);

  return () => {
    weg = true;
    window.removeEventListener('online', netzPruefen);
    window.removeEventListener('offline', netzPruefen);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('controllerchange', offlinePruefen);
    }
  };
}
