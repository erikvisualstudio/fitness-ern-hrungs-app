# Trainingstracker (PWA)

Persönliche Trainings- & Ernährungs-App für Erik & Nele. Session-Logging pro
Übung/Satz, automatische Progressionsvorschläge (Double Progression), getrennte
Fitness-Profile, dazu eine gemeinsame Mahlzeitenplanung — komplett lokal (kein
Backend, kein Account, keine Cloud) — installierbar als App über "Zum
Homescreen hinzufügen".

## Tech-Stack

Reines Vanilla HTML/CSS/JavaScript (ES-Module), kein Build-Tool, keine
Abhängigkeiten. Daten liegen im `localStorage` des Browsers — jedes Gerät/jeder
Browser hat seinen eigenen, unabhängigen Datenstand (kein Sync).

## Lokal starten

Browser können `file://`-Module und Service Worker nicht zuverlässig laden,
deshalb über einen einfachen lokalen Server öffnen, z. B.:

```bash
python -m http.server 8080
```

oder

```bash
npx serve .
```

Danach im Browser `http://localhost:8080` öffnen.

## Auf dem Handy installieren

1. App auf einem HTTPS-Host deployen (z. B. GitHub Pages, Netlify, Vercel —
   alles reicht, da rein statische Dateien) oder im selben WLAN über die
   lokale IP des Rechners öffnen.
2. Auf dem Handy im Browser öffnen.
3. iOS Safari: Teilen-Icon → "Zum Home-Bildschirm".
   Android Chrome: Menü → "App installieren" bzw. "Zum Startbildschirm hinzufügen".

**Wichtig:** Erik und Nele sollten die App jeweils auf ihrem eigenen Handy
installieren/öffnen, da die Daten lokal pro Gerät gespeichert werden. Innerhalb
der App gibt es zusätzlich eine Profilauswahl (Erik/Nele) für den Fall, dass
beide dasselbe Gerät nutzen.

**Ausnahme Ernährung:** Der "Ernährung"-Tab ist bewusst NICHT pro Profil
getrennt, sondern ein gemeinsamer Haushalts-Datenstand (siehe unten) — der
lebt aber genauso nur lokal auf dem jeweiligen Gerät, ohne Sync. Empfehlung:
für die Mahlzeitenplanung ein gemeinsam genutztes Gerät (z. B. Küchen-Tablet)
verwenden, damit beide dieselbe Planung sehen.

## GitHub Pages Deployment (Beispiel)

```bash
git push origin main
```

Danach in den Repo-Einstellungen unter "Pages" den `main`-Branch (Root) als
Quelle auswählen. Die App ist danach unter der GitHub-Pages-URL erreichbar
und per HTTPS installierbar.

## Projektstruktur

```
index.html              App-Shell
manifest.webmanifest     PWA-Manifest (Icons, Name, Theme-Farbe)
service-worker.js        Offline-Caching der App-Shell
css/style.css             Styling (dark-mode-fähig)
js/db.js                  localStorage-Datenschicht
js/seed-data.js           Ausgangsdaten (aus den Trainingsplänen + dem Ernährungsplan importiert)
js/progression.js         Double-Progression-Engine + Blockwochen-/Deload-Logik
js/nutrition.js            Mahlzeitenplanungs-Engine (Vorschläge, Modus, Reroll)
js/util.js                 Kleine Hilfsfunktionen (Formatierung, Toast)
js/app.js                  Router + App-Chrome (Topbar/Tabbar)
js/views/                  Profilauswahl, Dashboard, Session-Logging, Verlauf, Ernährung, Einstellungen
icons/                     App-Icons (generiert)
```

## Wie die Progression funktioniert

Beim ersten Öffnen ist die App mit den 4-Wochen-Plänen aus den Obsidian-Notizen
vorbefüllt (Woche-1-Werte als Startpunkt, Zielbereich = Woche-1-Wert bis
Woche-1-Wert + 2). Ab der ersten geloggten Session übernimmt die
Progressions-Engine (`js/progression.js`) die laufende Anpassung, unabhängig
von den ursprünglichen Wochenzahlen:

- **Freie Gewichte / Bänder:** werden alle Sätze am oberen Ende des
  Zielbereichs geschafft → nächstes Mal Gewicht (bzw. Bandstufe) erhöhen, Ziel
  zurück auf den unteren Bereich. Sonst: gleiches Gewicht, Ziel = letzte
  Bestleistung + 1-2 Wdh. Harte Obergrenzen (z. B. Eriks Langhantel-Limit
  45 kg) werden respektiert.
- **Bodyweight (Klimmzüge, Liegestütze, Plank, …):** Ziel ist das
  Gesamtvolumen (Wdh. bzw. Sekunden) über alle Sätze. Wird das Volumen
  erreicht → neues Ziel = altes Volumen + fester Schritt. Wird ein Ziel 3x in
  Folge stabil erreicht und ist für die Übung Zusatzgewicht vorgesehen (nicht
  bei Dips, wegen Schulter), schlägt die App vor, Zusatzgewicht (Rucksack)
  einzuführen.
- **Cardio:** keine automatische Progression, nur letzter Wert als Referenz.
- **Video-Workout (Nele, Pilates):** kein Einzelübungs-Tracking — stattdessen
  ein passendes YouTube-Video (Unterkörper/Oberkörper/Ganzkörper, frei wählbare
  Länge) auswählen, durchführen und Dauer + optional genutztes Gewicht (kg pro
  Hantel) abhaken. Wird 3x in Folge mit gleichem oder höherem Gewicht geloggt,
  schlägt die App beim nächsten Mal +0,5 kg pro Hantel vor. Bleibt das
  Gewichtsfeld leer, zählt die Session als Bodyweight (keine Progression).
- **Deload:** In Woche 4 jedes 4-Wochen-Blocks (automatisch berechnet ab dem
  in den Einstellungen hinterlegten Blockstart-Datum) wird der Vorschlag
  unabhängig von der Progression auf reduziertes Gewicht/Volumen
  heruntergesetzt. Das Blockstart-Datum lässt sich in den Einstellungen
  anpassen, falls mal eine Woche ausfällt.

Bei Nele sind die Startgewichte für die Kraftübungen an Tag 3 im
Original-Plan nicht als kg angegeben (dort steht nur RIR) — beim ersten
Logging einfach das tatsächlich genutzte Gewicht eintragen, danach greift die
Progression normal.

## Wie die Ernährungsplanung funktioniert

Der Tab "Ernährung" ist ein Mahlzeiten-**Planer**, kein freier Rezept-Browser
und kein Kalorien-Tagebuch: pro Tag und Mahlzeit (Frühstück/Mittag/Abend) gibt
es genau 3 vorausgewählte Optionen aus dem Gerichte-Pool, mit mindestens 1x
Deftig, 1x Leicht, wenn möglich zusätzlich 1x Schnell.

- **Modus pro Slot:** "Gemeinsam" (eine Wahl für beide, serviert mit den
  jeweiligen Personen-Portionen) oder "Getrennt" (zwei unabhängige 3er-Vorschläge,
  gefiltert nach persönlichen Präferenzen und eigener Historie). Frühstück
  startet standardmäßig getrennt, Mittag/Abend gemeinsam — pro Tag umschaltbar.
- **Portionsmodell:** jedes Gericht hat eine Basis-Portion (kalibriert auf
  Nele) plus eine Zusatz-Portion pro Person (aktuell "Erik-Zusatz", im
  Datenmodell generisch für weitere Personen erweiterbar).
- **Vorschläge sind deterministisch**, nicht bei jedem Laden neu gewürfelt —
  derselbe Tag zeigt beim erneuten Öffnen dieselben 3 Optionen. Ein Klick auf
  "Andere Vorschläge" würfelt gezielt neu (unter Berücksichtigung von
  Präferenzen und zuletzt gegessenen Gerichten der letzten ~3 Wochen).
- **Präferenzen als Filter:** in Einstellungen → "Ernährungs-Präferenzen" lässt
  sich pro Profil eine Liste ausgeschlossener Zutaten-Tags hinterlegen (z. B.
  Erik: `proteinpulver`). Gerichte mit einem dieser Tags werden für diese
  Person nie vorgeschlagen — weder gemeinsam (dann für den ganzen Haushalt
  ausgeschlossen) noch getrennt.
- **Datenstand ist geräteweit geteilt**, nicht pro Profil siloed wie das
  Fitness-Tracking — siehe Hinweis oben zu Homescreen-Installation.
- **Startpool:** 18 Gerichte (6 pro Mahlzeitentyp) aus dem Ernährungsplan-Dokument,
  in `js/seed-data.js` (`seedNutrition()`) hinterlegt. Erweiterung auf mehr
  Gerichte: in `seedNutrition()` weitere Einträge mit derselben Struktur
  (`id`, `mealType`, `name`, `categories`, `excludeTags`, `base`, `extras`)
  ergänzen — bestehende Nutzer bekommen neue Gerichte automatisch beim
  nächsten Laden nachgetragen, solange sich die IDs bestehender Gerichte
  nicht ändern (siehe `migrate()` in `js/db.js`).
- **Kein Tages-Kalorien-Tracking:** die Kalorien-/Proteinwerte pro Mahlzeit
  werden nur angezeigt, nicht zu einer Tagesbilanz aufsummiert oder gegen ein
  Ziel geprüft — bewusst schlank gehalten (siehe Konzept-Dokument).

## Daten sichern / übertragen

Unter Einstellungen → Daten: "Daten exportieren" lädt den kompletten
Datenstand als JSON-Datei herunter (Backup oder Übertragung auf ein neues
Gerät), "Daten importieren" spielt eine solche Datei wieder ein (überschreibt
den aktuellen Stand).
