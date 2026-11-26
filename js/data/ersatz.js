// Beschwerden: Körperregion -> betroffene Übung -> Ersatz.
// Regel aus dem Auftrag: betroffene Übung ersetzen, nicht einfach streichen.
//
// Von dir freigegeben. Links steht, was ausfällt, rechts der Ersatz aus der Bibliothek.
// Besondere Namen:
//   sack_power      = Power-Runden am Sack
//   'technik'       = Technik-Runden am Sack (60–70 %)
//   'schattenboxen' = dieselbe Zeit Schattenboxen
// Ist auch der Ersatz betroffen (mehrere Regionen), sucht die App weiter;
// findet sie nichts, fällt die Übung mit einem Hinweis aus.

export const REGIONEN = {
  schulter: { name: 'Schulter', ersatz: {
    klatsch_liegestuetz: 'hocksprung', explosiv_klimmzug: 'ausfallschritt_sprung',
    liegestuetz: 'russian_twist', dips: 'russian_twist', klimmzug: 'russian_twist',
    sack_power: 'technik',
  } },
  ellbogen: { name: 'Ellbogen', ersatz: {
    dips: 'russian_twist', klimmzug: 'russian_twist', explosiv_klimmzug: 'hocksprung',
  } },
  handgelenk: { name: 'Handgelenk', ersatz: {
    klatsch_liegestuetz: 'hocksprung', liegestuetz: 'hocksprung', burpee: 'hocksprung',
    schultertippen: 'russian_twist',
    sack_power: 'schattenboxen',
  } },
  ruecken: { name: 'Unterer Rücken', ersatz: {
    russian_twist: 'schultertippen', burpee: 'schultertippen',
  } },
  knie: { name: 'Knie', ersatz: {
    hocksprung: 'liegestuetz', ausfallschritt_sprung: 'liegestuetz', weitsprung: 'liegestuetz', burpee: 'liegestuetz',
    kniehebelauf: 'boxer_skip', doppelsprung: 'boxer_skip',
  } },
  sprunggelenk: { name: 'Sprunggelenk / Wade', ersatz: {
    grundsprung: 'schattenboxen', boxer_skip: 'schattenboxen', kniehebelauf: 'schattenboxen', doppelsprung: 'schattenboxen',
    hampelmann: 'schattenboxen',
    hocksprung: 'liegestuetz', ausfallschritt_sprung: 'liegestuetz', weitsprung: 'liegestuetz', burpee: 'liegestuetz',
  } },
};

// Aufwärmen und Dehnen machst du nach eigenem Ablauf: Diese Blöcke zeigen nur
// den Text aus dem Plan und einen Timer, keine vorgegebenen Übungen.
