// Start der App: Routen, Wechsel der Ansichten, Service Worker.

import * as heute from './ansichten/heute.js';
import * as timer from './ansichten/timer.js';
import * as fortschritt from './ansichten/fortschritt.js';
import * as profil from './ansichten/profil.js';
import * as figur from './ansichten/figur.js';
import * as onboarding from './ansichten/onboarding.js';
import * as test from './ansichten/test.js';
import * as training from './ansichten/training.js';
import * as eintragen from './ansichten/eintragen.js';
import * as daten from './ansichten/daten.js';

const ROUTEN = {
  '/heute': heute,
  '/timer': timer,
  '/fortschritt': fortschritt,
  '/profil': profil,
  '/figur': figur,
  '/start': onboarding,
  '/test': test,
  '/training': training,
  '/eintragen': eintragen,
  '/daten': daten,
};
const START = '/heute';
// In diesen Bereichen ist die Leiste unten ausgeblendet (geführte Abläufe).
const OHNE_LEISTE = ['/start', '/test', '/training', '/eintragen'];

const ansicht = document.getElementById('ansicht');
let aufraeumen = null;

// "#/figur?clip=jab" -> Pfad "/figur", Parameter clip=jab
function aktuelleRoute() {
  const [pfad, zusatz = ''] = location.hash.replace(/^#/, '').split('?');
  return { pfad: ROUTEN[pfad] ? pfad : START, parameter: new URLSearchParams(zusatz) };
}

function zeigen() {
  const { pfad, parameter } = aktuelleRoute();

  if (typeof aufraeumen === 'function') aufraeumen();
  ansicht.replaceChildren();
  document.body.classList.toggle('ohne-leiste', OHNE_LEISTE.includes(pfad));
  aufraeumen = ROUTEN[pfad].zeigen(ansicht, parameter) || null;

  for (const link of document.querySelectorAll('.leiste a')) {
    if (link.getAttribute('href') === '#' + pfad) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', zeigen);
zeigen();

// Service Worker: macht die App offline nutzbar.
if ('serviceWorker' in navigator) {
  // Kommt eine neue Version an, einmal neu laden – aber nie, während der Timer läuft.
  const hatteSchonEinen = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hatteSchonEinen && !document.querySelector('.lauf')) location.reload();
  });
  navigator.serviceWorker.register('sw.js').catch((fehler) => {
    console.error('Service Worker konnte nicht angemeldet werden:', fehler);
  });
}
