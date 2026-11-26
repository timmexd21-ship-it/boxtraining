// Hält den Bildschirm an, solange der Timer läuft (Wake Lock).

let sperre = null;
let gewuenscht = false;

export function wachbleibenMoeglich() {
  return 'wakeLock' in navigator;
}

async function holen() {
  if (!wachbleibenMoeglich() || sperre || document.visibilityState !== 'visible') return;
  try {
    sperre = await navigator.wakeLock.request('screen');
    sperre.addEventListener('release', () => { sperre = null; });
  } catch {
    sperre = null; // z. B. Stromsparmodus: dann eben ohne
  }
}

export function wachbleiben() {
  gewuenscht = true;
  return holen();
}

export function wachbleibenBeenden() {
  gewuenscht = false;
  sperre?.release().catch(() => {});
  sperre = null;
}

// Nach dem Zurückkommen in die App gibt das System die Sperre frei – neu holen.
document.addEventListener('visibilitychange', () => {
  if (gewuenscht && document.visibilityState === 'visible') holen();
});
