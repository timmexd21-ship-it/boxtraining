// Kleine Helfer, die mehrere Ansichten brauchen.

// Baut ein HTML-Element. kinder: Text oder weitere Elemente.
export function el(tag, eigenschaften = {}, ...kinder) {
  const e = document.createElement(tag);
  for (const [name, wert] of Object.entries(eigenschaften)) {
    if (wert === false || wert == null) continue;
    if (name === 'class') e.className = wert;
    else if (name.startsWith('on')) e.addEventListener(name.slice(2), wert);
    else if (wert === true) e.setAttribute(name, '');
    else e.setAttribute(name, wert);
  }
  e.append(...sauber(kinder));
  return e;
}

// Ersetzt den Inhalt eines Elements. Leere Einträge und verschachtelte Listen sind erlaubt.
export function fuellen(ziel, ...kinder) {
  ziel.replaceChildren(...sauber(kinder));
}

function sauber(kinder) {
  return kinder.flat(Infinity).filter((k) => k != null && k !== false);
}

// "Donnerstag, 26. November"
export function datumLang(datum = new Date()) {
  return datum.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}
