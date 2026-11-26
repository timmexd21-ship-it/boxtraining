// Das Profil: Vorgaben, Laden, Speichern und kleine Rechnungen dazu.

import { lesen, schreiben, alle } from './db.js';
import { WOCHE } from './data/einheiten.js';
import { AUSRUESTUNG } from './data/ausruestung.js';

export const TAGE = ['Montagnacht', 'Dienstagnacht', 'Mittwochnacht', 'Donnerstagnacht', 'Freitag', 'Samstag', 'Sonntag'];
export const TAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Bis zu dieser Uhrzeit zählt der Morgen noch zur Nacht davor (Nachtschicht).
export const NACHT_ENDET_UM = 10;

// Leeres Profil mit der Standardwoche aus dem Auftrag. Körperliche Angaben bleiben leer.
export function leeresProfil() {
  const sparring = WOCHE.find((w) => w.einheit === 'sparring');
  return {
    alter: null, groesse: null, gewicht: null,
    erfahrungJahre: null, andereSportarten: '',
    auslage: null,                                   // 'links' = linke Hand vorn, 'rechts'
    ziele: { technik: 5, schlagkraft: 5, ausdauer: 5 },
    woche: WOCHE.map((w) => (w.einheit === 'sparring' ? null : w.einheit)), // je Tag 'A' | 'B' | 'C' | null
    dauer: 45,
    ausruestung: Object.keys(AUSRUESTUNG),
    sparring: { ja: true, tag: sparring ? sparring.tag : 6 },
    beschwerden: { regionen: [], notiz: '' },
  };
}

export async function profilLaden() {
  return (await lesen('profil', 'ich')) || null;
}

export function profilSpeichern(profil) {
  return schreiben('profil', { ...profil, geaendert: new Date().toISOString() }, 'ich');
}

export async function letzterTest() {
  const tests = await alle('tests');
  return tests.length ? tests[tests.length - 1] : null;
}

// Ziel-Gewichtung als Anteile in Prozent (zusammen 100)
export function zielAnteile(ziele) {
  const summe = ziele.technik + ziele.schlagkraft + ziele.ausdauer;
  if (!summe) return { technik: 33, schlagkraft: 33, ausdauer: 34 };
  const technik = Math.round((ziele.technik / summe) * 100);
  const schlagkraft = Math.round((ziele.schlagkraft / summe) * 100);
  return { technik, schlagkraft, ausdauer: 100 - technik - schlagkraft };
}

// Welcher Trainingstag ist gerade? 0 = Montagnacht … 6 = Sonntag.
// Früh am Morgen zählt noch zur Nacht davor.
export function trainingstag(jetzt = new Date()) {
  return (trainingsDatum(jetzt).getDay() + 6) % 7;
}

// Das Datum, zu dem das Training zählt (früh am Morgen: der Tag davor)
export function trainingsDatum(jetzt = new Date()) {
  const d = new Date(jetzt);
  if (d.getHours() < NACHT_ENDET_UM) d.setDate(d.getDate() - 1);
  return d;
}

export { tagText } from './auswertung.js';

// Was steht an diesem Tag an? 'A' | 'B' | 'C' | 'sparring' | null
export function einheitAm(profil, tag) {
  if (profil.sparring.ja && profil.sparring.tag === tag) return 'sparring';
  return profil.woche[tag] || null;
}
