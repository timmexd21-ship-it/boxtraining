// Datenablage auf dem Gerät (IndexedDB).
// Bereiche: profil, plan, einstellungen (je ein Eintrag pro Schlüssel),
//           tests, trainings (Listen, bekommen automatisch eine id).

const NAME = 'boxtraining';
const FASSUNG = 1;
let offen = null;

function oeffnen() {
  offen ??= new Promise((fertig, fehler) => {
    const anfrage = indexedDB.open(NAME, FASSUNG);
    anfrage.onupgradeneeded = () => {
      const db = anfrage.result;
      for (const s of ['profil', 'plan', 'einstellungen']) {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      }
      for (const s of ['tests', 'trainings']) {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id', autoIncrement: true });
      }
    };
    anfrage.onsuccess = () => fertig(anfrage.result);
    anfrage.onerror = () => fehler(anfrage.error);
  });
  return offen;
}

function ausfuehren(bereich, art, tun) {
  return oeffnen().then((db) => new Promise((fertig, fehler) => {
    const anfrage = tun(db.transaction(bereich, art).objectStore(bereich));
    anfrage.onsuccess = () => fertig(anfrage.result);
    anfrage.onerror = () => fehler(anfrage.error);
  }));
}

// Einen Eintrag lesen, z. B. lesen('einstellungen', 'timer')
export function lesen(bereich, schluessel) {
  return ausfuehren(bereich, 'readonly', (s) => s.get(schluessel));
}

// Einen Eintrag schreiben. Bei tests/trainings den Schlüssel weglassen.
export function schreiben(bereich, wert, schluessel) {
  return ausfuehren(bereich, 'readwrite', (s) => s.put(wert, schluessel));
}

// Alle Einträge eines Bereichs
export function alle(bereich) {
  return ausfuehren(bereich, 'readonly', (s) => s.getAll());
}

const MIT_SCHLUESSEL = ['profil', 'plan', 'einstellungen']; // ein Eintrag pro Schlüssel
const LISTEN = ['tests', 'trainings'];                      // Listen mit eigener id

const fertig = (anfrage) => new Promise((ok, fehler) => {
  anfrage.onsuccess = () => ok(anfrage.result);
  anfrage.onerror = () => fehler(anfrage.error);
});

// Alles, was gespeichert ist (für die Sicherung)
export async function allesLesen() {
  const db = await oeffnen();
  const t = db.transaction([...MIT_SCHLUESSEL, ...LISTEN], 'readonly');
  const aus = {};
  for (const bereich of MIT_SCHLUESSEL) {
    const lager = t.objectStore(bereich);
    const [schluessel, werte] = await Promise.all([fertig(lager.getAllKeys()), fertig(lager.getAll())]);
    aus[bereich] = Object.fromEntries(schluessel.map((k, i) => [k, werte[i]]));
  }
  for (const bereich of LISTEN) aus[bereich] = await fertig(t.objectStore(bereich).getAll());
  return aus;
}

// Alles löschen und durch die Sicherung ersetzen. Geht etwas schief, bleibt der alte Stand.
export async function allesErsetzen(daten) {
  const db = await oeffnen();
  await new Promise((ok, fehler) => {
    const t = db.transaction([...MIT_SCHLUESSEL, ...LISTEN], 'readwrite');
    t.oncomplete = ok;
    t.onerror = () => fehler(t.error);
    t.onabort = () => fehler(t.error);
    for (const bereich of MIT_SCHLUESSEL) {
      const lager = t.objectStore(bereich);
      lager.clear();
      for (const [k, wert] of Object.entries(daten[bereich] || {})) lager.put(wert, k);
    }
    for (const bereich of LISTEN) {
      const lager = t.objectStore(bereich);
      lager.clear();
      for (const wert of daten[bereich] || []) lager.put(wert);
    }
  });
}
