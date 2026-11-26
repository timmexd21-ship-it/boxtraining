# Design-Notizen

Damit spätere Änderungen zum Rest passen.

## Welt und Nutzung
Boxhalle nachts. Das Handy liegt am Boden oder hängt am Kran, die Hände stecken in Bandagen, gelesen wird aus 2–3 Metern. Deshalb: große Schrift, große Tippflächen, hoher Kontrast, wenig Text.

## Farben (in `css/basis.css` als Variablen)
| Name | Wert | Wofür |
|---|---|---|
| Sackleder | `#231915` | Grundfläche. Warmes Dunkelbraun statt Schwarz, blendet nachts nicht. |
| Sackleder hell | `#35271f` | Trennlinien, gesperrte Knöpfe |
| Bandage | `#f1e9d8` | Schrift |
| Ringseil-Rot | `#c5301f` | Runde läuft, Haupt-Aktion |
| Ringboden-Blau | `#2c4f66` | Pause, Ruhe |
| Gong-Messing | `#d0a22b` | Warnung letzte 10 Sek., Kombi der Woche, „alles gut“-Werte, Fokus-Rahmen |
| Hallenbeton | `#8e8a82` | Nebentext |

Rot, Blau und Messing haben feste Bedeutungen (Runde / Pause / Achtung). Nicht als Deko verwenden.

## Schrift
- **Big Shoulders Display 800** (Plakatschrift): Titel, Zahlen, Timer, Haupt-Knopf. Immer Großbuchstaben.
- **Atkinson Hyperlegible 400/700**: aller Lesetext.
- Größen: 16 / 20 / 28 / 44 / 96 px. Keine Zwischengrößen.
- Beide liegen in `fonts/` (offline), Lizenz: SIL OFL.

## Aufbau
- Linksbündig, eine Aufgabe pro Bildschirm.
- Haupt-Aktion als breiter roter Balken unten (mind. 72 px hoch), Text sagt genau, was passiert.
- Gliederung über Größe und Abstand. Keine Karten, keine Schatten, keine runden Ecken.
- Angaben als Zeilen mit Linie (links was, rechts Wert).
- Leiste unten: nur Wörter, der aktive Bereich hat einen Tape-Streifen darüber.

## Das eine Besondere
Der Timer färbt den ganzen Bildschirm nach Zustand: Rot = Runde, Blau = Pause, Messing = letzte 10 Sekunden. Sonst bleibt alles ruhig.

## Bewusst weggelassen
Schwarz mit Neonfarbe, Verläufe, Glow, Karten-Raster, Statistik-Kacheln, Emojis, Icons in der Leiste, Einblend-Animationen.

## 3D-Figur
- Körper in Bandage, Hose in dunklem Beton. Vordere Hand und vorderer Fuß rot, hintere blau – das ist Information (welche Seite schlägt), keine Deko. Beim Spiegeln wandern die Farben mit.
- Requisiten (Stange, Holme, Tape, Seil) in Beton oder Bandage, der Sack in Lederbraun.
- Fußabdrücke am Boden in denselben Seitenfarben, halb durchsichtig; bei langen Wegen blasser.

## Kurven (Fortschritt)
- Eine Linie pro Testwert in Bandage, 2,5 px. Punkte mit Lederrand; nur der neueste Punkt ist Messing.
- Keine Gitterlinien, nur eine Grundlinie. Zahlen stehen als Text daneben, nie in der Linienfarbe.
- Antippen eines Punkts zeigt Datum und Wert darunter. Zu jeder Kurve gibt es die Werte auch als Liste.

## Texte
Du-Form, kurze Sätze, aktiv. Dieselbe Aktion heißt überall gleich („Training starten“, „Runde starten“, „Training speichern“). Leere Bildschirme sagen, was als Nächstes zu tun ist.
