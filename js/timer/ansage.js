// Kombi-Ansage per Stimme (Web Speech API, Deutsch) und Auswahl der nächsten Kombi.

import { kombisBisStufe, ansageText } from '../data/kombis.js';

// Abstand zwischen zwei Ansagen in Sekunden (Zeit zum Schlagen)
export const TEMPO = {
  langsam: { name: 'Langsam', luecke: 9 },
  mittel: { name: 'Mittel', luecke: 6 },
  schnell: { name: 'Schnell', luecke: 4 },
};

// Wie oft die Kombi der Woche drankommt, wenn "öfter" an ist (0.4 = 4 von 10 Ansagen)
export const ANTEIL_KOMBI_DER_WOCHE = 0.4;

export function stimmeVorhanden() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

let stimme = null;
function stimmeSuchen() {
  const deutsche = speechSynthesis.getVoices().filter((s) => s.lang && s.lang.toLowerCase().startsWith('de'));
  stimme = deutsche.find((s) => s.localService) || deutsche[0] || null;
}
if (stimmeVorhanden()) {
  stimmeSuchen();
  speechSynthesis.addEventListener?.('voiceschanged', stimmeSuchen);
}

// Spricht einen Text. Der erste Aufruf muss aus einem Fingertipp kommen (iPhone).
export function sprich(text) {
  if (!stimmeVorhanden()) return;
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  const satz = new SpeechSynthesisUtterance(text);
  satz.lang = 'de-DE';
  if (stimme) satz.voice = stimme;
  satz.rate = 1.05;
  speechSynthesis.speak(satz);
}

export function schweigen() {
  if (stimmeVorhanden()) speechSynthesis.cancel();
}

// Sucht die nächste Kombi aus. Nie zweimal dieselbe direkt hintereinander
// (außer es gibt nur eine).
export function naechsteKombi({ stufe, kdw, kdwOefter }, letzte, zufall = Math.random) {
  if (kdwOefter && kdw && kdw !== letzte && zufall() < ANTEIL_KOMBI_DER_WOCHE) return kdw;
  const auswahl = kombisBisStufe(stufe).map((k) => k.text).filter((t) => t !== letzte);
  if (auswahl.length === 0) return letzte || kdw;
  return auswahl[Math.floor(zufall() * auswahl.length)];
}

// Geschätzte Sprechdauer in Sekunden, damit die nächste Ansage nicht hineinredet
export function sprechdauer(text, art) {
  return 0.5 + ansageText(text, art).split(/[ ,]+/).length * 0.42;
}

export { ansageText };
