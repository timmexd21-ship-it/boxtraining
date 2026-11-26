// Bausteine für Eingaben: Zahl, Text, eine aus mehreren, mehrere aus mehreren.

import { el } from './hilfen.js';

// Große Zahleneingabe mit Einheit dahinter
export function zahlFeld(name, einheit, wert, setzen) {
  return el('label', { class: 'feld' },
    el('span', { class: 'feld-name' }, name),
    el('span', { class: 'eingabe-zeile' },
      el('input', {
        class: 'zahl', type: 'number', inputmode: 'numeric', min: '0',
        value: wert ?? '',
        oninput: (e) => setzen(e.target.value === '' ? null : Number(e.target.value)),
      }),
      el('span', { class: 'einheit' }, einheit),
    ),
  );
}

export function textFeld(name, wert, setzen, mehrzeilig = false) {
  const eingabe = mehrzeilig
    ? el('textarea', { class: 'text-eingabe', rows: '3', oninput: (e) => setzen(e.target.value) }, wert || '')
    : el('input', { class: 'text-eingabe', type: 'text', value: wert || '', oninput: (e) => setzen(e.target.value) });
  return el('label', { class: 'feld' }, el('span', { class: 'feld-name' }, name), eingabe);
}

// Eine aus mehreren. moeglich = [{ wert, name }]
export function wahlFeld(name, moeglich, aktuell, setzen, zusatz = '') {
  return el('div', { class: 'feld' },
    name ? el('span', { class: 'feld-name' }, name) : null,
    el('div', { class: `wahl ${zusatz}`, role: 'group', 'aria-label': name || 'Auswahl' },
      moeglich.map((m) => el('button', {
        type: 'button',
        'aria-pressed': String(m.wert === aktuell),
        onclick: () => setzen(m.wert),
      }, m.name)),
    ),
  );
}

// Mehrere aus mehreren (Häkchen). gewaehlt = Liste von Werten
export function mehrfachFeld(name, moeglich, gewaehlt, setzen) {
  return el('div', { class: 'feld' },
    name ? el('span', { class: 'feld-name' }, name) : null,
    el('div', { class: 'haken-liste', role: 'group', 'aria-label': name || 'Auswahl' },
      moeglich.map((m) => {
        const an = gewaehlt.includes(m.wert);
        return el('button', {
          type: 'button', class: 'haken', 'aria-pressed': String(an),
          onclick: () => setzen(an ? gewaehlt.filter((w) => w !== m.wert) : [...gewaehlt, m.wert]),
        }, el('span', { class: 'haken-kasten', 'aria-hidden': 'true' }, an ? '✓' : ''), m.name);
      }),
    ),
  );
}
