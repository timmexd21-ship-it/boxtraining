// Töne des Timers, komplett im Code erzeugt (keine Tondateien).

let ctx = null;

// Muss einmal durch einen Fingertipp aufgerufen werden, sonst bleibt das iPhone stumm.
export function tonBereit() {
  const Art = window.AudioContext || window.webkitAudioContext;
  if (!Art) return false;
  ctx ??= new Art();
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

// Ein Schlag auf die Ringglocke: mehrere Teiltöne, die unterschiedlich schnell ausklingen.
function schlag(wann, laut = 0.5) {
  const grundton = 740;
  const teiltoene = [
    { mal: 1.0, staerke: 1.0, dauer: 1.8 },
    { mal: 2.41, staerke: 0.55, dauer: 1.2 },
    { mal: 3.9, staerke: 0.3, dauer: 0.7 },
    { mal: 5.3, staerke: 0.18, dauer: 0.45 },
  ];
  for (const t of teiltoene) {
    const osz = ctx.createOscillator();
    const pegel = ctx.createGain();
    osz.type = 'sine';
    osz.frequency.value = grundton * t.mal;
    pegel.gain.setValueAtTime(0.0001, wann);
    pegel.gain.exponentialRampToValueAtTime(laut * t.staerke, wann + 0.004);
    pegel.gain.exponentialRampToValueAtTime(0.0001, wann + t.dauer);
    osz.connect(pegel).connect(ctx.destination);
    osz.start(wann);
    osz.stop(wann + t.dauer + 0.05);
  }
}

// Gong: 1× Rundenbeginn, 2× Rundenende, 3× alles vorbei
export function gong(anzahl = 1) {
  if (!ctx) return;
  for (let i = 0; i < anzahl; i++) schlag(ctx.currentTime + 0.02 + i * 0.42);
}

// Warnsignal 10 Sek. vor Ende: drei trockene Klopfer wie das Holz am Ring.
export function warnung() {
  if (!ctx) return;
  for (let i = 0; i < 3; i++) {
    const wann = ctx.currentTime + 0.02 + i * 0.17;
    const osz = ctx.createOscillator();
    const pegel = ctx.createGain();
    osz.type = 'square';
    osz.frequency.setValueAtTime(1500, wann);
    osz.frequency.exponentialRampToValueAtTime(900, wann + 0.06);
    pegel.gain.setValueAtTime(0.0001, wann);
    pegel.gain.exponentialRampToValueAtTime(0.35, wann + 0.003);
    pegel.gain.exponentialRampToValueAtTime(0.0001, wann + 0.07);
    osz.connect(pegel).connect(ctx.destination);
    osz.start(wann);
    osz.stop(wann + 0.1);
  }
}

// Kurzer Ton für die letzten 3 Sekunden des Vorlaufs
export function piep() {
  if (!ctx) return;
  const wann = ctx.currentTime + 0.01;
  const osz = ctx.createOscillator();
  const pegel = ctx.createGain();
  osz.type = 'sine';
  osz.frequency.value = 880;
  pegel.gain.setValueAtTime(0.0001, wann);
  pegel.gain.exponentialRampToValueAtTime(0.3, wann + 0.005);
  pegel.gain.exponentialRampToValueAtTime(0.0001, wann + 0.14);
  osz.connect(pegel).connect(ctx.destination);
  osz.start(wann);
  osz.stop(wann + 0.18);
}
