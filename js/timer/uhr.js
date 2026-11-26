// Rundenlogik. Rechnet immer aus der vergangenen Zeit, zählt nicht mit.
// Dadurch stimmt der Timer auch, wenn das Handy kurz hängt.
//
// einstellung = { rundeSek, pauseSek, runden }

export const VORLAUF_SEK = 10;   // Zeit zum Hinstellen vor Runde 1
export const WARNUNG_SEK = 10;   // Warnsignal so viele Sekunden vor Rundenende

// Der ganze Ablauf als Liste: Vorlauf, Runde 1, Pause, Runde 2, … (nach der letzten Runde keine Pause)
export function abschnitte({ rundeSek, pauseSek, runden }) {
  const liste = [{ art: 'vorlauf', sek: VORLAUF_SEK, runde: 0 }];
  for (let r = 1; r <= runden; r++) {
    liste.push({ art: 'runde', sek: rundeSek, runde: r });
    if (r < runden && pauseSek > 0) liste.push({ art: 'pause', sek: pauseSek, runde: r });
  }
  return liste;
}

// Wo steht der Timer nach so vielen Millisekunden?
// -> { art: 'vorlauf'|'runde'|'pause'|'ende', runde, restMs, nummer }
export function standBei(einstellung, vergangenMs) {
  const liste = abschnitte(einstellung);
  let start = 0;
  for (let i = 0; i < liste.length; i++) {
    const ende = start + liste[i].sek * 1000;
    if (vergangenMs < ende) {
      return { art: liste[i].art, runde: liste[i].runde, restMs: ende - vergangenMs, nummer: i };
    }
    start = ende;
  }
  return { art: 'ende', runde: einstellung.runden, restMs: 0, nummer: liste.length };
}

// Dauer ohne Vorlauf in Sekunden
export function gesamtSek({ rundeSek, pauseSek, runden }) {
  return runden * rundeSek + Math.max(0, runden - 1) * pauseSek;
}

// Soll in dieser Runde gewarnt werden? Bei sehr kurzen Runden nicht.
export function mitWarnung(einstellung) {
  return einstellung.rundeSek >= 30;
}

// "3:00", "0:20"
export function alsZeit(sek) {
  const s = Math.max(0, Math.round(sek));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Stoppuhr, die man anhalten kann.
export class Uhr {
  constructor(jetzt = () => Date.now()) {
    this.jetzt = jetzt;
    this.gesammelt = 0;      // Zeit aus früheren Laufphasen
    this.laeuftSeit = null;  // Zeitstempel, seit dem sie gerade läuft
  }
  starten() { if (this.laeuftSeit === null) this.laeuftSeit = this.jetzt(); }
  anhalten() {
    if (this.laeuftSeit !== null) {
      this.gesammelt += this.jetzt() - this.laeuftSeit;
      this.laeuftSeit = null;
    }
  }
  get laeuft() { return this.laeuftSeit !== null; }
  vergangenMs() {
    return this.gesammelt + (this.laeuftSeit === null ? 0 : this.jetzt() - this.laeuftSeit);
  }
}
