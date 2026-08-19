# Trainingstracker (PWA)

Persönliche Trainings- & Ernährungs-App für Erik & Nele. Session-Logging pro
Übung/Satz, automatische Progressionsvorschläge (Double Progression), getrennte
Fitness-Profile, dazu eine gemeinsame Mahlzeitenplanung — komplett lokal (kein
Backend, kein Account, keine Cloud) — installierbar als App über "Zum
Homescreen hinzufügen".

## Tech-Stack

Reines Vanilla HTML/CSS/JavaScript (ES-Module), kein Build-Tool, keine
Abhängigkeiten. Daten liegen im `localStorage` des Browsers — jedes Gerät/jeder
Browser hat seinen eigenen, unabhängigen Datenstand. Ausnahme: die
Ernährungsdaten werden zusätzlich über Firebase (Firestore) zwischen Geräten
synchronisiert, siehe unten.

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
getrennt, sondern ein gemeinsamer Haushalts-Datenstand (siehe unten), der
per Cloud-Sync (Firebase) automatisch zwischen Eriks und Neles Geräten
abgeglichen wird — beide sehen also dieselbe Planung und gegenseitig die
Nährwert-Scores, auch auf getrennten Handys.

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
js/sync.js                 Cloud-Sync der Ernährungsdaten über Firebase
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
- **Pool:** 84 Gerichte (24 Frühstück, 30 Mittag, 30 Abend) in `js/seed-data.js`
  (`seedNutrition()`) hinterlegt — die ursprünglichen 6 pro Mahlzeitentyp aus
  dem Ernährungsplan-Dokument plus zwei Erweiterungsrunden mit mehr Bowls und
  mehr Proteinvielfalt (Tofu/Tempeh/Seitan/Edamame/verschiedene Bohnensorten
  neben Linsen/Kichererbsen), ca. 80 % vegan / 20 % vegetarisch (`vegan`-Feld
  pro Gericht). Erik mag keine Kuhmilch-Trinkmilch/-Joghurt/-Quark (Käse ist
  okay) — die ursprünglich 5 betroffenen Frühstücksgerichte (Skyr, Magerquark,
  griechischer Joghurt) laufen deshalb auf Sojajoghurt/Ahornsirup um; neue
  Gerichte verwenden diese Zutaten bewusst nicht mehr. Weitere Erweiterung: in
  `seedNutrition()` Einträge mit derselben Struktur (`id`, `mealType`, `name`,
  `categories`, `vegan`, `excludeTags`, `base`, `extras`) ergänzen — bestehende
  Nutzer bekommen neue Gerichte
  automatisch beim nächsten Laden nachgetragen (per-ID-Merge, bestehende IDs
  bleiben unangetastet), solange sich die IDs bestehender Gerichte nicht
  ändern (siehe `migrate()` in `js/db.js`).
- **Zutaten-basiert, nicht fixe Gesamtwerte:** jedes Gericht referenziert eine
  gemeinsame Zutaten-Datenbank (kcal/Protein pro 100 g bzw. 100 ml,
  `state.nutrition.ingredients`). kcal/Protein pro Portion werden daraus live
  berechnet, nicht als fixe Zahl gepflegt.
- **Anpassungen pro Person und Mahlzeit** (Abschnitt "Tatsächlich gegessen"):
  Mengen ändern, Zutaten ersetzen oder komplett freie Einträge (z. B. "150 g
  Sojahack, 170 kcal/100g, 20 g P/100g") erfassen — mit Live-Neuberechnung.
  Zwei Speicher-Modi:
  - **"Nur heute übernehmen"** — gilt nur für den gewählten Tag, das Rezept im
    Pool bleibt unverändert (für einmalige Abweichungen wie "nur 60 g statt
    80 g Haferflocken geschafft" oder "Sojajoghurt statt Skyr, weil das zuhause
    war").
  - **"Dauerhaft im Rezept ändern"** — schreibt die Änderung ins Rezept
    zurück (bei Erik als Delta zur Basis-Portion, bei Nele direkt in die
    Basis — wirkt sich dann auch auf Eriks Portion aus, da seine Portion =
    Basis + Delta).
  - Eine Tagesbilanz ("Bisher heute") oben auf der Seite zeigt Ist vs. Ziel
    (kcal/Protein) über die 3 Hauptmahlzeiten, damit ein Defizit/Überschuss
    bei einer Mahlzeit bewusst bei der nächsten ausgeglichen werden kann —
    die App passt Vorschläge dafür nicht automatisch an, das bleibt eine
    bewusste Entscheidung.

## Einkaufsliste

Eigener Tab, getrennt von der tageweisen Essensplanung: hier wird nicht "was
isst du heute", sondern "welche Mittag-/Abendgerichte kochen wir diese Woche"
gewählt — typischerweise einmal vor Wochenstart.

- Für Mittag und Abend je eine durchsuchbare Liste aller Gerichte im Pool zum
  An-/Abhaken ("diese Woche geplant" — keine feste Anzahl, einfach so viele
  wie gewünscht).
- Daraus wird automatisch eine Zutatenliste berechnet: pro gewähltem Gericht
  die Haushalts-Gesamtmenge (Basis-Portion + Eriks Zusatz-Delta, falls
  vorhanden), über alle gewählten Gerichte aufsummiert und nach
  Zutaten-Kategorie gruppiert.
- Jede Zutat hat eine Checkbox zum Abhaken (schon zuhause vorhanden oder
  gerade eingekauft) — abgehakte Posten wandern innerhalb ihrer Kategorie ans
  Ende der Liste.
- "Woche zurücksetzen" leert sowohl die Gerichte-Auswahl als auch den
  Abhak-Fortschritt für den nächsten Durchlauf.
- Gehört zu `state.nutrition` und wird daher wie der Rest der
  Ernährungsdaten automatisch mitsynchronisiert (siehe Cloud-Sync unten).

## Cloud-Sync der Ernährungsdaten (Firebase)

Nur die Ernährungsdaten (`state.nutrition`) werden synchronisiert — das
Fitness-Tracking bleibt bewusst rein lokal pro Profil/Gerät. Technisch:

- **Firebase-Projekt:** `erik-nele-ernaehrung`, Firestore + anonyme
  Authentifizierung. Konfiguration liegt direkt in `js/sync.js`
  (`FIREBASE_CONFIG`) — das ist bei Firebase-Web-Apps kein Geheimnis, der
  Zugriffsschutz läuft über die Firestore-Security-Rules, nicht über
  Geheimhaltung dieser Werte.
- **Ein gemeinsames Dokument** (`households/erik-nele`) für den ganzen
  Haushalt. Beim Speichern (`db.saveNutritionState()`) wird der komplette
  Ernährungs-Datenstand (debounced, 800 ms) dorthin gepusht; ein
  Firestore-Listener übernimmt Änderungen von anderen Geräten automatisch.
- **Konfliktauflösung: Last-Write-Wins**, anhand von `state.nutrition.updatedAt`.
  Kein Feld-für-Feld-Merge — bei einer echten Gleichzeitig-Änderung auf beiden
  Geräten gewinnt die spätere. Für zwei Personen mit seltenen echten
  Kollisionen ist das ein bewusst einfacher, ausreichend robuster Trade-off.
- **Offline-fähig:** Ohne Internet/Firebase bleibt die App normal nutzbar,
  Sync läuft dann einfach nicht (Status-Anzeige oben auf der Ernährungsseite:
  "Synchronisiert" / "Verbinde…" / "Offline").
- **Firestore-Security-Rules** müssen auf authentifizierten Zugriff
  beschränkt sein (siehe Firebase Console → Firestore Database → Regeln):
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /households/{householdId} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
  Firestore startet im "Testmodus" mit offenen Regeln für 30 Tage — diese
  Regeln sollten zeitnah eingetragen werden.
- Die genutzte Domain (bei GitHub Pages z. B. `erikvisualstudio.github.io`)
  muss unter Firebase Console → Authentication → Settings →
  "Autorisierte Domains" eingetragen sein, sonst schlägt die anonyme
  Anmeldung auf der Live-Seite fehl (lokal via `localhost` funktioniert immer,
  da automatisch autorisiert).

## Daten sichern / übertragen

Unter Einstellungen → Daten: "Daten exportieren" lädt den kompletten
Datenstand als JSON-Datei herunter (Backup oder Übertragung auf ein neues
Gerät), "Daten importieren" spielt eine solche Datei wieder ein (überschreibt
den aktuellen Stand).
