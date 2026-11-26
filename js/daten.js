// Daten sichern und einspielen: alles in einer JSON-Datei.

import { allesLesen, allesErsetzen, schreiben, lesen } from './db.js';
import { tagText } from './auswertung.js';

export const DATEI_FASSUNG = 1;

// Alles, was auf dem Gerät gespeichert ist, als Text für die Sicherungsdatei
export async function sicherungAlsText() {
  return JSON.stringify({ app: 'boxtraining', fassung: DATEI_FASSUNG, gesichert: new Date().toISOString(), daten: await allesLesen() }, null, 2);
}

// Sicherungsdatei erzeugen. Auf dem iPhone über "Teilen" (z. B. In Dateien sichern),
// sonst als normaler Download. -> 'geteilt' | 'geladen' | 'abgebrochen'
export async function sichern() {
  const text = await sicherungAlsText();
  const name = `boxtraining-${tagText(new Date())}.json`;
  const datei = new File([text], name, { type: 'application/json' });
  let wie = 'geladen';
  if (navigator.canShare?.({ files: [datei] })) {
    try {
      await navigator.share({ files: [datei], title: 'Boxtraining-Sicherung' });
      wie = 'geteilt';
    } catch (fehler) {
      if (fehler.name === 'AbortError') return 'abgebrochen';
      herunterladen(datei, name);
    }
  } else {
    herunterladen(datei, name);
  }
  await schreiben('einstellungen', { datum: new Date().toISOString() }, 'sicherung');
  return wie;
}

function herunterladen(datei, name) {
  const adresse = URL.createObjectURL(datei);
  const link = Object.assign(document.createElement('a'), { href: adresse, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(adresse), 2000);
}

// Sicherungsdatei lesen und prüfen. -> { daten, uebersicht } oder { fehler }
export function sicherungLesen(text) {
  let inhalt;
  try {
    inhalt = JSON.parse(text);
  } catch {
    return { fehler: 'Die Datei ist keine lesbare Sicherung (kein JSON).' };
  }
  if (inhalt?.app !== 'boxtraining' || !inhalt.daten) return { fehler: 'Die Datei stammt nicht aus dieser App.' };
  if (inhalt.fassung > DATEI_FASSUNG) return { fehler: 'Die Sicherung stammt aus einer neueren Version der App. Aktualisiere die App und versuch es noch einmal.' };
  const d = inhalt.daten;
  return {
    daten: d,
    uebersicht: {
      gesichert: inhalt.gesichert,
      profil: !!d.profil?.ich,
      tests: (d.tests || []).length,
      trainings: (d.trainings || []).length,
    },
  };
}

// Alles auf dem Gerät durch die Sicherung ersetzen
export function einspielen(daten) {
  return allesErsetzen(daten);
}

// Wann wurde zuletzt gesichert? -> Date oder null
export async function letzteSicherung() {
  const s = await lesen('einstellungen', 'sicherung');
  return s ? new Date(s.datum) : null;
}

// Erinnern, wenn es Einträge gibt und die letzte Sicherung länger her ist
export const SICHERN_NACH_TAGEN = 14;
export function sicherungFaellig(trainings, letzte, jetzt = new Date()) {
  if (trainings.length < 3) return false;
  return !letzte || (jetzt - letzte) / 86400000 > SICHERN_NACH_TAGEN;
}
