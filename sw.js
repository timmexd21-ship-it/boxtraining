// Service Worker: legt alle Dateien der App auf dem Gerät ab,
// damit sie ohne Netz läuft.
//
// WICHTIG bei Änderungen an der App:
// 1. CACHE hochzählen (gleiche Zahl wie in js/version.js).
// 2. Neue Dateien unten in DATEIEN eintragen.

const CACHE = 'boxtraining-0.9.0';

const DATEIEN = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/basis.css',
  'css/timer.css',
  'css/figur.css',
  'css/formular.css',
  'css/training.css',
  'js/app.js',
  'js/hilfen.js',
  'js/db.js',
  'js/formular.js',
  'js/profil.js',
  'js/auswertung.js',
  'js/daten.js',
  'js/ansichten/daten.js',
  'js/rules.js',
  'js/plan.js',
  'js/timer/lauf.js',
  'js/ansichten/training.js',
  'js/ansichten/eintragen.js',
  'js/ansichten/onboarding.js',
  'js/ansichten/test.js',
  'js/data/kombis.js',
  'js/data/uebungen.js',
  'js/data/drills.js',
  'js/data/ausruestung.js',
  'js/data/einheiten.js',
  'js/data/block.js',
  'js/data/ersatz.js',
  'js/data/animations.js',
  'js/figur/skelett.js',
  'js/figur/bewegung.js',
  'js/figur/puppe.js',
  'js/figur/spieler.js',
  'js/ansichten/figur.js',
  'vendor/three.module.js',
  'vendor/three.core.js',
  'js/timer/uhr.js',
  'js/timer/ton.js',
  'js/timer/ansage.js',
  'js/timer/wachbleiben.js',
  'js/version.js',
  'js/ansichten/heute.js',
  'js/ansichten/timer.js',
  'js/ansichten/fortschritt.js',
  'js/ansichten/profil.js',
  'fonts/bigshoulders-800.woff2',
  'fonts/atkinson-400.woff2',
  'fonts/atkinson-700.woff2',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

// Beim Einrichten: alles herunterladen und ablegen.
self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(DATEIEN.map((d) => new Request(d, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

// Beim Aktivieren: alte Ablagen früherer Versionen löschen.
self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Am Entwicklungsrechner (localhost) immer zuerst die frische Datei holen.
const ENTWICKLUNG = ['localhost', '127.0.0.1'].includes(self.location.hostname);

// Bei jeder Anfrage: aus der Ablage antworten. Alle Dateien dort gehören zur
// selben Version, es mischt sich nichts. Neues kommt erst mit einer neuen
// CACHE-Zahl – dann lädt das Gerät alles frisch und die App startet einmal neu.
self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;

  ereignis.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (ENTWICKLUNG) {
      try {
        return await fetch(anfrage.url, { cache: 'no-store' });
      } catch { /* Server aus: weiter mit der Ablage */ }
    }
    const abgelegt = await cache.match(anfrage, { ignoreSearch: true });
    if (abgelegt) return abgelegt;
    try {
      return await fetch(anfrage);
    } catch {
      // Ohne Netz und nicht abgelegt: bei Seitenaufrufen die Startseite zeigen.
      if (anfrage.mode === 'navigate') return cache.match('index.html');
      return new Response('', { status: 504, statusText: 'Ohne Netz nicht verfuegbar' });
    }
  })());
});
