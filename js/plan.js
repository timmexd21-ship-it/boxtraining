// Verbindet die Regeln (rules.js) mit den gespeicherten Daten:
// Profil, Tests, Einträge und der Stand des Plans (wann Block 1 begonnen hat, Anpassungen).

import { lesen, schreiben, alle } from './db.js';
import { profilLaden, trainingstag, trainingsDatum, einheitAm, tagText } from './profil.js';
import { letzteSicherung, sicherungFaellig } from './daten.js';
import { einheitBauen, wocheImBlock, montagVon, muedeVorschlag, nachHartemSparring, naechsteAnpassung, rundenDer } from './rules.js';

// Stand des Plans. Beim ersten Aufruf beginnt Block 1 am Montag dieser Woche.
export async function standLaden() {
  let stand = await lesen('plan', 'stand');
  if (!stand) {
    stand = { blockStart: montagVon(trainingsDatum()).toISOString(), anpassung: { A: {}, B: {}, C: {} } };
    await schreiben('plan', stand, 'stand');
  }
  return stand;
}

// Alles für heute: Profil, Tests, Einträge, Woche und die fertig gebaute Einheit.
//   wunsch  optional 'A' | 'B' | 'C': diese Einheit statt der aus dem Wochenplan
//   platt   true/false = so gewählt; null = die App schlägt vor (nach Schichtmüdigkeit 4–5)
// -> null, wenn es noch kein Profil gibt
export async function heuteLaden({ wunsch = null, platt = null } = {}) {
  const profil = await profilLaden();
  if (!profil) return null;
  const [tests, stand, trainings, gesichert] = await Promise.all([alle('tests'), standLaden(), alle('trainings'), letzteSicherung()]);
  const tag = trainingstag();
  const heute = tagText(trainingsDatum());
  const geplant = einheitAm(profil, tag);
  const kurz = wunsch || geplant;
  const { block, woche } = wocheImBlock(stand.blockStart, trainingsDatum());

  const vorschlagPlatt = muedeVorschlag(trainings, heute);
  const nurLeicht = kurz === 'C' && nachHartemSparring(trainings, heute);
  // Nach hartem Sparring ist die Einheit schon leicht: dann nicht zusätzlich "platt".
  const istPlatt = nurLeicht ? false : (platt ?? vorschlagPlatt);
  const einheit = kurz && kurz !== 'sparring'
    ? einheitBauen({ kurz, profil, tests, block, woche, platt: istPlatt, nurLeicht, anpassung: stand.anpassung?.[kurz] || {} })
    : null;

  return {
    profil, tests, stand, trainings, tag, heute, geplant, kurz, block, woche, einheit,
    platt: istPlatt, vorschlagPlatt, nurLeicht,
    sichernFaellig: sicherungFaellig(trainings, gesichert),
    eintragHeute: trainings.find((t) => t.tag === heute && t.einheit === kurz) || null,
  };
}

// Eintrag nach dem Training speichern und die Anpassung fürs nächste Mal ausrechnen.
//   d        das Ergebnis von heuteLaden()
//   angaben  { geschafft, anstrengung, muedigkeit, sparringHaerte, wdh, notiz }
// -> Text, was sich beim nächsten Mal ändert
export async function eintragSpeichern(d, angaben) {
  const e = d.einheit;
  const eintrag = {
    datum: new Date().toISOString(),
    tag: d.heute,
    einheit: d.kurz,
    block: d.block,
    woche: d.woche,
    ...angaben,
  };
  if (e) {
    Object.assign(eintrag, {
      dauer: e.dauer, minuten: e.minuten, platt: e.platt, nurLeicht: e.nurLeicht,
      runden: rundenDer(e), kombis: e.kombis,
    });
  }
  await schreiben('trainings', eintrag);
  if (!e) return 'Sparring eingetragen.';

  const davor = [...d.trainings].reverse().find((t) => t.einheit === d.kurz) || null;
  const { anpassung, text } = naechsteAnpassung(d.stand.anpassung?.[d.kurz], eintrag, davor);
  const stand = { ...d.stand, anpassung: { ...d.stand.anpassung, [d.kurz]: anpassung } };
  await schreiben('plan', stand, 'stand');
  return text;
}
