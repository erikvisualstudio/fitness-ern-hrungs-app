// Ausgangsdaten, abgeleitet aus "Trainingsplan Erik.md" und "Trainingsplan Nele.md".
// Diese Werte sind nur der STARTPUNKT (Woche 1 des Plans). Ab der ersten geloggten
// Session übernimmt die Double-Progression-Engine (siehe progression.js) die
// laufende Anpassung von Gewicht/Wiederholungen — die App folgt danach nicht mehr
// stur den fixen Wochenzahlen aus dem ursprünglichen 4-Wochen-Plan.
//
// Zielbereich-Konvention (siehe Nutzerentscheidung): repMin = Woche-1-Wert,
// repMax = Woche-1-Wert + 2 (bzw. aus Woche-1→Woche-2-Delta, wo im Plan vorhanden).
// loadStep = beobachtete kg-Differenz zwischen den Plan-Wochen, sonst Standardwert
// (2,5 kg Kurzhantel / 2,5-5 kg Langhantel, wie im Konzept vorgeschlagen).

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function seedState() {
  const today = todayISO();

  return {
    schemaVersion: 1,
    currentUserId: null,
    users: [
      {
        id: "erik",
        name: "Erik",
        healthNote:
          "Wiederkehrende Schulterschmerzen (vermutlich Impingement), ausgelöst v. a. durch Seitheben und ruckartige Überkopfbewegungen. Seitheben ist deshalb aus dem Plan gestrichen. Bei stechendem/scharfem Schmerz Übung sofort abbrechen — bei wiederkehrenden Beschwerden Abklärung bei Orthopäde/Physio sinnvoll.",
        barbellCapKg: 45,
      },
      {
        id: "nele",
        name: "Nele",
        healthNote:
          "Haarausfall und erhöhte Kälteempfindlichkeit können Warnsignale für zu geringe Energiezufuhr sein. Plan ist bewusst auf Gewicht halten (nicht Defizit) ausgelegt. Bei anhaltenden Symptomen ärztlichen Check (Schilddrüse, Eisenwerte) in Betracht ziehen.",
        barbellCapKg: null,
      },
    ],

    blockStart: {
      erik: today,
      nele: today,
    },

    exercises: {
      erik: [
        // Tag 1 — Push
        { id: "e_ohp", name: "Kurzhantel Überkopfdrücken", type: "weighted", sets: 3, repMin: 8, repMax: 10, startLoad: 10, loadStep: 2.5, cap: null, perSide: false, safetyNote: "Kontrolliert, keine Hektik/ruckartige Bewegung — Schulter." },
        { id: "e_floor_press", name: "Kurzhantel Floor Press", type: "weighted", sets: 3, repMin: 10, repMax: 12, startLoad: 12.5, loadStep: 2.5, cap: null, perSide: false, safetyNote: null },
        { id: "e_cuban_press", name: "Band Cuban Press", type: "band", sets: 3, repMin: 10, repMax: 12, bandLevel: "mittel", safetyNote: "Ersatz für Seitheben (Schulter-Anpassung)." },
        { id: "e_aussenrotation", name: "Band Außenrotation", type: "band", sets: 3, repMin: 15, repMax: 17, bandLevel: "mittel", safetyNote: "Rotatorenmanschette — Aufwärm-/Präventionsübung." },
        { id: "e_face_pull", name: "Face Pull", type: "band", sets: 3, repMin: 15, repMax: 17, bandLevel: "mittel", safetyNote: null },
        { id: "e_trizeps_pushdown", name: "Band Trizeps-Pushdown", type: "band", sets: 3, repMin: 15, repMax: 17, bandLevel: "mittel", safetyNote: null },

        // Tag 2 — Park: Pull + Core + Cardio
        { id: "e_hinweg_t2", name: "Hinweg joggen", type: "cardio", cardioDefault: { duration: 12, pace: "locker" } },
        { id: "e_klimmzuege", name: "Klimmzüge", type: "bodyweight", holdBased: false, perSide: false, sets: 5, targetVolume: 14, incrementAmount: 2, loadType: "rucksack", allowLoadProgression: true, safetyNote: "Sauber, kein Kipping, exzentrisch (Ablassen) langsam. 90 Sek Pause zwischen Sätzen." },
        { id: "e_liegestuetze", name: "Liegestütze", type: "bodyweight", holdBased: false, perSide: false, sets: 4, targetVolume: 112, incrementAmount: 4, loadType: "rucksack", allowLoadProgression: true, safetyNote: "Ellbogen ca. 45° zum Körper, nicht auf 90° ausstellen." },
        { id: "e_dips", name: "Dips", type: "bodyweight", holdBased: false, perSide: false, sets: 4, targetVolume: 40, incrementAmount: 2, loadType: null, allowLoadProgression: false, safetyNote: "Nur bis Oberarm-parallel absenken. KEIN Zusatzgewicht wegen Schulter." },
        { id: "e_beinheben", name: "Hängendes Beinheben", type: "bodyweight", holdBased: false, perSide: false, sets: 4, targetVolume: 48, incrementAmount: 2, loadType: null, allowLoadProgression: false, safetyNote: null },
        { id: "e_rueckweg_t2", name: "Rückweg joggen", type: "cardio", cardioDefault: { duration: 12, pace: "locker" } },

        // Tag 3 — Beine
        { id: "e_kniebeugen", name: "Langhantel Kniebeugen", type: "weighted", sets: 3, repMin: 8, repMax: 10, startLoad: 32.5, loadStep: 2.5, cap: 45, perSide: false, safetyNote: null },
        { id: "e_rdl", name: "Langhantel Rumänisches Kreuzheben", type: "weighted", sets: 3, repMin: 10, repMax: 12, startLoad: 30, loadStep: 2.5, cap: 45, perSide: false, safetyNote: null },
        { id: "e_ausfallschritte", name: "Kurzhantel Ausfallschritte", type: "weighted", sets: 3, repMin: 12, repMax: 14, startLoad: 12.5, loadStep: 2.5, cap: null, perSide: true, safetyNote: null },
        { id: "e_wadenheben", name: "Kurzhantel Wadenheben", type: "weighted", sets: 3, repMin: 15, repMax: 17, startLoad: 20, loadStep: 2.5, cap: null, perSide: false, safetyNote: null },
        { id: "e_hip_thrust", name: "Band Hip Thrust", type: "band", sets: 3, repMin: 15, repMax: 17, bandLevel: "mittel", safetyNote: null },

        // Tag 4 — Pull/Arme
        { id: "e_rudern_vorgebeugt", name: "Kurzhantel vorgebeugtes Rudern", type: "weighted", sets: 3, repMin: 10, repMax: 12, startLoad: 17.5, loadStep: 2.5, cap: null, perSide: false, safetyNote: null },
        { id: "e_rudern_band", name: "Band Rudern breit", type: "band", sets: 3, repMin: 15, repMax: 17, bandLevel: "mittel", safetyNote: null },
        { id: "e_bizeps_curls", name: "Langhantel Bizeps Curls", type: "weighted", sets: 3, repMin: 10, repMax: 12, startLoad: 20, loadStep: 5, cap: 45, perSide: false, safetyNote: null },
        { id: "e_hammer_curls", name: "Kurzhantel Hammer Curls", type: "weighted", sets: 3, repMin: 12, repMax: 14, startLoad: 10, loadStep: 2.5, cap: null, perSide: false, safetyNote: null },
        { id: "e_plank", name: "Plank", type: "bodyweight", holdBased: true, perSide: false, sets: 3, targetVolume: 135, incrementAmount: 45, loadType: null, allowLoadProgression: false, safetyNote: null },

        // Tag 5 — Park: Ganzkörper-Zirkel + Cardio
        { id: "e_hinweg_t5", name: "Hinweg joggen", type: "cardio", cardioDefault: { duration: 10, pace: "locker" } },
        { id: "e_klimmzuege_zirkel", name: "Klimmzüge (Zirkel, pro Runde)", type: "bodyweight", holdBased: false, perSide: false, sets: 4, targetVolume: 16, incrementAmount: 2, loadType: "rucksack", allowLoadProgression: true, safetyNote: "Sauber, kein Kipping." },
        { id: "e_liegestuetze_zirkel", name: "Liegestütze (Zirkel, pro Runde)", type: "bodyweight", holdBased: false, perSide: false, sets: 4, targetVolume: 80, incrementAmount: 8, loadType: "rucksack", allowLoadProgression: true, safetyNote: "Ellbogen ca. 45° zum Körper." },
        { id: "e_ausfallschritte_zirkel", name: "Ausfallschritte Bodyweight (Zirkel, pro Runde/Bein)", type: "bodyweight", holdBased: false, perSide: true, sets: 4, targetVolume: 60, incrementAmount: 4, loadType: null, allowLoadProgression: false, safetyNote: null },
        { id: "e_situps_zirkel", name: "Sit-ups (Zirkel, pro Runde)", type: "bodyweight", holdBased: false, perSide: false, sets: 4, targetVolume: 72, incrementAmount: 8, loadType: null, allowLoadProgression: false, safetyNote: null },
        { id: "e_rueckweg_t5", name: "Rückweg joggen", type: "cardio", cardioDefault: { duration: 10, pace: "locker" } },
      ],

      nele: [
        // Tag 1 — Pilates: kein Einzelübungs-Tracking, stattdessen ein passendes YouTube-Video
        // (Unterkörper/Oberkörper/Ganzkörper, frei wählbare Länge) abhaken. Gewicht ist optional
        // (Bodyweight oder ganz leichte Kurzhanteln) und steigt nach 3x gleichbleibendem Gewicht
        // um einen festen Schritt (siehe progression.js, Typ "pilates").
        { id: "n_pilates_unterkoerper", name: "Pilates-Video Unterkörper", type: "pilates", startWeight: null, loadStep: 0.5, safetyNote: null },
        { id: "n_pilates_oberkoerper", name: "Pilates-Video Oberkörper", type: "pilates", startWeight: null, loadStep: 0.5, safetyNote: null },
        { id: "n_pilates_ganzkoerper", name: "Pilates-Video Ganzkörper", type: "pilates", startWeight: null, loadStep: 0.5, safetyNote: null },

        // Tag 2 — Lauf ruhig
        { id: "n_lauf_ruhig", name: "Lauf ruhig", type: "cardio", cardioDefault: { duration: 27, pace: "locker" } },

        // Tag 3 — Ganzkörper-Kraft (Plan gibt hier kein Startgewicht vor, nur RIR — Startgewicht wird beim ersten Logging festgelegt)
        { id: "n_goblet_squat", name: "Kurzhantel Goblet Squat", type: "weighted", sets: 3, repMin: 12, repMax: 14, startLoad: null, loadStep: 2.5, cap: null, perSide: false, safetyNote: null },
        { id: "n_rudern_vorgebeugt", name: "Kurzhantel vorgebeugtes Rudern", type: "weighted", sets: 3, repMin: 12, repMax: 14, startLoad: null, loadStep: 2.5, cap: null, perSide: false, safetyNote: null },
        { id: "n_schulterdruecken", name: "Kurzhantel Schulterdrücken", type: "weighted", sets: 3, repMin: 10, repMax: 12, startLoad: null, loadStep: 2.5, cap: null, perSide: false, safetyNote: null },
        { id: "n_hip_thrust", name: "Band Hip Thrust", type: "band", sets: 3, repMin: 15, repMax: 17, bandLevel: "mittel", safetyNote: null },
        { id: "n_rdl", name: "Kurzhantel RDL", type: "weighted", sets: 3, repMin: 10, repMax: 12, startLoad: null, loadStep: 2.5, cap: null, perSide: false, safetyNote: "Einbeinig optional." },
        { id: "n_plank_bauch", name: "Plank (Bauch)", type: "bodyweight", holdBased: true, perSide: false, sets: 3, targetVolume: 90, incrementAmount: 30, loadType: null, allowLoadProgression: false, safetyNote: null },
        { id: "n_russian_twist", name: "Russian Twist", type: "bodyweight", holdBased: false, perSide: false, sets: 3, targetVolume: 45, incrementAmount: 15, loadType: null, allowLoadProgression: false, safetyNote: null },

        // Tag 4 — Pilates ODER Lauf mit Tempowechsel
        { id: "n_lauf_tempo", name: "Lauf mit Tempowechsel", type: "cardio", cardioDefault: { duration: 24, pace: "locker + Tempowechsel-Intervalle" } },

        // Tag 5 (optional) — Lockerer Lauf oder Mobility/Pilates
        { id: "n_lauf_locker_t5", name: "Lockerer Lauf", type: "cardio", cardioDefault: { duration: 25, pace: "sehr locker" } },
      ],
    },

    workoutDays: {
      erik: [
        { id: "e_day1", name: "Tag 1 — Push", location: "Zuhause", note: "Schulterangepasst: Seitheben gestrichen. Vorher 5 Min Schulter-Warm-up (Armkreisen, Band Pull-Apart 2×15, Außenrotation leicht 2×15).", exerciseIds: ["e_ohp", "e_floor_press", "e_cuban_press", "e_aussenrotation", "e_face_pull", "e_trizeps_pushdown"] },
        { id: "e_day2", name: "Tag 2 — Park: Pull + Core + Cardio", location: "Park", note: "Nur volle Wiederholungsamplitude zählt (bei Klimmzügen: Kinn klar über der Stange, unten Arme durchgestreckt). Vorher Schulter-Warm-up.", exerciseIds: ["e_hinweg_t2", "e_klimmzuege", "e_liegestuetze", "e_dips", "e_beinheben", "e_rueckweg_t2"] },
        { id: "e_day3", name: "Tag 3 — Beine", location: "Zuhause", note: "Langhantel-Obergrenze 45 kg gesamt gilt für alle Langhantel-Übungen.", exerciseIds: ["e_kniebeugen", "e_rdl", "e_ausfallschritte", "e_wadenheben", "e_hip_thrust"] },
        { id: "e_day4", name: "Tag 4 — Pull/Arme", location: "Zuhause", note: null, exerciseIds: ["e_rudern_vorgebeugt", "e_rudern_band", "e_bizeps_curls", "e_hammer_curls", "e_plank"] },
        { id: "e_day5", name: "Tag 5 — Park: Ganzkörper-Zirkel", location: "Park", note: "Zirkel mit 45 Sek Pause zwischen Übungen, 2 Min zwischen Runden. Zielrunden: 4 (Deload-Woche: 2). Vorher Schulter-Warm-up. Wenn die Zielzahl in späteren Runden nicht mehr sauber machbar ist: so viele saubere wie möglich, keine Halb-Wiederholungen zählen.", exerciseIds: ["e_hinweg_t5", "e_klimmzuege_zirkel", "e_liegestuetze_zirkel", "e_ausfallschritte_zirkel", "e_situps_zirkel", "e_rueckweg_t5"] },
      ],
      nele: [
        { id: "n_day1", name: "Tag 1 — Pilates", location: "Zuhause", note: "Passendes YouTube-Video wählen (Unterkörper/Oberkörper/Ganzkörper, ~20-40 Min), durchführen, danach hier abhaken. Bodyweight oder mit ganz leichten Kurzhanteln — Gewicht ist optional.", exerciseIds: ["n_pilates_unterkoerper", "n_pilates_oberkoerper", "n_pilates_ganzkoerper"] },
        { id: "n_day2", name: "Tag 2 — Lauf ruhig", location: null, note: "Locker, Gespräch sollte möglich sein.", exerciseIds: ["n_lauf_ruhig"] },
        { id: "n_day3", name: "Tag 3 — Ganzkörper-Kraft", location: "Zuhause", note: "Startgewichte sind im Plan nicht als kg vorgegeben (nur RIR) — beim ersten Logging das tatsächlich genutzte Gewicht eintragen, danach übernimmt die Progression.", exerciseIds: ["n_goblet_squat", "n_rudern_vorgebeugt", "n_schulterdruecken", "n_hip_thrust", "n_rdl", "n_plank_bauch", "n_russian_twist"] },
        { id: "n_day4", name: "Tag 4 — Pilates oder Lauf mit Tempowechsel", location: null, note: "Wahlweise Pilates-Video wie Tag 1, oder Lauf mit Tempowechsel — wöchentlich abwechseln oder nach Lust wählen.", exerciseIds: ["n_pilates_unterkoerper", "n_pilates_oberkoerper", "n_pilates_ganzkoerper", "n_lauf_tempo"] },
        { id: "n_day5", name: "Tag 5 (optional) — Lockerer Lauf / Mobility", location: null, note: "Erster Tag, der bei Zeitmangel oder Müdigkeit gestrichen wird. Alternativ 20 Min Mobility/Dehnen (nicht separat getrackt).", exerciseIds: ["n_lauf_locker_t5"] },
      ],
    },

    sessionLogs: {
      erik: [],
      nele: [],
    },

    nutrition: seedNutrition(),
  };
}

// Ernährungsteil — additiv zum Sport-Tracking, siehe "Ausblick Phase 2: Ernährung"
// im Konzept-Dokument. Anders als exercises/workoutDays/sessionLogs ist das HIER
// bewusst NICHT pro Profil siloed: die Mahlzeitenplanung ist eine gemeinsame
// Haushalts-Entscheidung, sichtbar unabhängig vom aktiven Fitness-Profil.
//
// Portionsmodell: jedes Gericht hat eine Basis-Portion (kalibriert auf Nele) und
// pro Person ein optionales "extras"-Objekt mit Zusatz-Zutaten (als Delta-Menge
// relativ zur Basis) für diese Person (aktuell nur "erik", Modell ist generisch
// für weitere Personen erweiterbar).
//
// Zutaten-Modell: Gerichte referenzieren eine gemeinsame Zutaten-Datenbank
// (kcal/Protein pro 100 g bzw. 100 ml) statt fixer Gesamtwerte. kcal/Protein
// pro Portion werden daraus live berechnet (siehe computeMacros in nutrition.js)
// — das erlaubt Mengen-Anpassungen (z. B. "nur 60 g Haferflocken statt 80 g")
// oder Zutaten-Tausch (z. B. Sojajoghurt statt Skyr), ohne Werte doppelt pflegen
// zu müssen. Die kcal/Protein-Werte hier sind eigene Näherungen auf Zutatenbasis
// und weichen deshalb leicht von den (ebenfalls nur grob geschätzten) Summen im
// Ernährungsplan-Dokument ab — beide sind Schätzungen, keine exakte Nährwertdatenbank.
function ingredientsDB() {
  return [
    { id: "haferflocken", name: "Haferflocken", unit: "g", kcalPer100: 370, proteinPer100: 13 },
    { id: "sojamilch", name: "Sojamilch", unit: "ml", kcalPer100: 33, proteinPer100: 3.3 },
    { id: "skyr", name: "Skyr", unit: "g", kcalPer100: 63, proteinPer100: 11 },
    { id: "beeren", name: "Beeren (gemischt)", unit: "g", kcalPer100: 50, proteinPer100: 1 },
    { id: "chiasamen", name: "Chiasamen", unit: "g", kcalPer100: 486, proteinPer100: 17 },
    { id: "mandeln", name: "Mandeln", unit: "g", kcalPer100: 579, proteinPer100: 21 },
    { id: "erdnussbutter", name: "Erdnussbutter", unit: "g", kcalPer100: 588, proteinPer100: 25 },
    { id: "banane", name: "Banane", unit: "g", kcalPer100: 89, proteinPer100: 1.1 },
    { id: "tofu", name: "Tofu", unit: "g", kcalPer100: 145, proteinPer100: 15 },
    { id: "olivenoel", name: "Olivenöl", unit: "g", kcalPer100: 884, proteinPer100: 0 },
    { id: "vollkornbrot", name: "Vollkornbrot", unit: "g", kcalPer100: 250, proteinPer100: 9 },
    { id: "avocado", name: "Avocado", unit: "g", kcalPer100: 160, proteinPer100: 2 },
    { id: "ei", name: "Ei", unit: "g", kcalPer100: 155, proteinPer100: 13 },
    { id: "kaese", name: "Käse", unit: "g", kcalPer100: 380, proteinPer100: 27 },
    { id: "magerquark", name: "Magerquark", unit: "g", kcalPer100: 67, proteinPer100: 12 },
    { id: "honig", name: "Honig", unit: "g", kcalPer100: 304, proteinPer100: 0.3 },
    { id: "nussmus", name: "Nussmus", unit: "g", kcalPer100: 614, proteinPer100: 21 },
    { id: "huettenkaese", name: "Hüttenkäse", unit: "g", kcalPer100: 98, proteinPer100: 12 },
    { id: "kirschtomaten", name: "Kirschtomaten", unit: "g", kcalPer100: 18, proteinPer100: 0.9 },
    { id: "kraeuter", name: "Kräuter (Kresse/Basilikum)", unit: "g", kcalPer100: 25, proteinPer100: 2.5 },
    { id: "kokosmilch_light", name: "Kokosmilch light", unit: "ml", kcalPer100: 80, proteinPer100: 1.2 },
    { id: "kokosmilch", name: "Kokosmilch", unit: "ml", kcalPer100: 200, proteinPer100: 2 },
    { id: "mango", name: "Mango", unit: "g", kcalPer100: 60, proteinPer100: 0.8 },
    { id: "kokosraspeln", name: "Kokosraspeln", unit: "g", kcalPer100: 660, proteinPer100: 6.9 },
    { id: "linsen_rot", name: "Rote Linsen (gekocht)", unit: "g", kcalPer100: 116, proteinPer100: 9 },
    { id: "gemuese", name: "Gemüse (gemischt)", unit: "g", kcalPer100: 35, proteinPer100: 2 },
    { id: "vollkornreis", name: "Vollkornreis (gekocht)", unit: "g", kcalPer100: 123, proteinPer100: 2.6 },
    { id: "kichererbsen", name: "Kichererbsen (gekocht)", unit: "g", kcalPer100: 164, proteinPer100: 8.9 },
    { id: "quinoa", name: "Quinoa (gekocht)", unit: "g", kcalPer100: 120, proteinPer100: 4.4 },
    { id: "feta", name: "Feta", unit: "g", kcalPer100: 264, proteinPer100: 14 },
    { id: "tahin", name: "Tahin", unit: "g", kcalPer100: 595, proteinPer100: 17 },
    { id: "vollkornpasta", name: "Vollkornpasta (roh)", unit: "g", kcalPer100: 348, proteinPer100: 13 },
    { id: "hefeflocken", name: "Hefeflocken/Parmesan", unit: "g", kcalPer100: 385, proteinPer100: 40 },
    { id: "falafel", name: "Falafel", unit: "g", kcalPer100: 333, proteinPer100: 13 },
    { id: "fladenbrot", name: "Fladenbrot/Wrap", unit: "g", kcalPer100: 275, proteinPer100: 9 },
    { id: "hummus", name: "Hummus", unit: "g", kcalPer100: 166, proteinPer100: 8 },
    { id: "sojajoghurt", name: "Sojajoghurt", unit: "g", kcalPer100: 43, proteinPer100: 3.5 },
    { id: "kuerbiskerne", name: "Kürbiskerne", unit: "g", kcalPer100: 559, proteinPer100: 30 },
    { id: "tempeh", name: "Tempeh", unit: "g", kcalPer100: 193, proteinPer100: 19 },
    { id: "reisnudeln", name: "Reisnudeln (roh)", unit: "g", kcalPer100: 360, proteinPer100: 6 },
    { id: "erdnusssauce", name: "Erdnusssauce", unit: "g", kcalPer100: 280, proteinPer100: 10 },
    { id: "sesamoel", name: "Sesamöl", unit: "g", kcalPer100: 884, proteinPer100: 0 },
    { id: "bohnen", name: "Gemischte Bohnen (gekocht)", unit: "g", kcalPer100: 127, proteinPer100: 8.7 },
    { id: "sojaprotein", name: "Sojaprotein texturiert (trocken)", unit: "g", kcalPer100: 330, proteinPer100: 52 },
    { id: "mais", name: "Mais", unit: "g", kcalPer100: 86, proteinPer100: 3.3 },
    { id: "currypaste", name: "Currypaste", unit: "g", kcalPer100: 100, proteinPer100: 2 },
    { id: "cashewkerne", name: "Cashewkerne", unit: "g", kcalPer100: 553, proteinPer100: 18 },
    { id: "paprika", name: "Paprika", unit: "g", kcalPer100: 31, proteinPer100: 1 },
    { id: "vinaigrette", name: "Vinaigrette", unit: "g", kcalPer100: 350, proteinPer100: 0.5 },
    { id: "leinsamen", name: "Leinsamen", unit: "g", kcalPer100: 534, proteinPer100: 18 },
  ];
}

export function seedNutrition() {
  return {
    ingredients: ingredientsDB(),

    dishes: [
      // Frühstück
      { id: "f1", mealType: "breakfast", name: "Porridge-Bowl", categories: ["leicht", "schnell"], excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 50 }, { ingredientId: "sojamilch", amount: 200 }, { ingredientId: "skyr", amount: 150 }, { ingredientId: "beeren", amount: 100 }, { ingredientId: "chiasamen", amount: 10 }, { ingredientId: "mandeln", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 20 }, { ingredientId: "banane", amount: 120 }] } } },
      { id: "f2", mealType: "breakfast", name: "Tofu-Scramble mit Vollkornbrot", categories: ["deftig"], excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 130 }, { ingredientId: "olivenoel", amount: 5 }, { ingredientId: "vollkornbrot", amount: 80 }, { ingredientId: "avocado", amount: 50 }] }, extras: { erik: { addIngredients: [{ ingredientId: "ei", amount: 55 }, { ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "kaese", amount: 30 }] } } },
      { id: "f3", mealType: "breakfast", name: "Overnight Oats mit Quark", categories: ["leicht", "schnell"], excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 50 }, { ingredientId: "sojamilch", amount: 150 }, { ingredientId: "magerquark", amount: 150 }, { ingredientId: "banane", amount: 100 }, { ingredientId: "leinsamen", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 20 }, { ingredientId: "beeren", amount: 100 }] } } },
      { id: "f4", mealType: "breakfast", name: "Eiweiß-Pfannkuchen mit Quark", categories: ["deftig"], excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 40 }, { ingredientId: "ei", amount: 110 }, { ingredientId: "magerquark", amount: 150 }, { ingredientId: "beeren", amount: 100 }, { ingredientId: "honig", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "ei", amount: 110 }, { ingredientId: "haferflocken", amount: 30 }, { ingredientId: "nussmus", amount: 15 }] } } },
      { id: "f5", mealType: "breakfast", name: "Vollkorn-Toast mit Hüttenkäse & Tomaten", categories: ["leicht", "schnell"], excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornbrot", amount: 100 }, { ingredientId: "huettenkaese", amount: 200 }, { ingredientId: "kirschtomaten", amount: 50 }, { ingredientId: "kraeuter", amount: 5 }, { ingredientId: "avocado", amount: 50 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "huettenkaese", amount: 100 }, { ingredientId: "mandeln", amount: 15 }] } } },
      { id: "f6", mealType: "breakfast", name: "Chia-Pudding mit Mango & Skyr", categories: ["leicht", "schnell"], excludeTags: [], base: { ingredients: [{ ingredientId: "chiasamen", amount: 40 }, { ingredientId: "kokosmilch_light", amount: 200 }, { ingredientId: "mango", amount: 100 }, { ingredientId: "kokosraspeln", amount: 10 }, { ingredientId: "skyr", amount: 200 }] }, extras: { erik: { addIngredients: [{ ingredientId: "skyr", amount: 100 }, { ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 15 }] } } },

      // Mittag
      { id: "m1", mealType: "lunch", name: "Linsen-Dal mit Vollkornreis", categories: ["deftig"], excludeTags: [], base: { ingredients: [{ ingredientId: "linsen_rot", amount: 250 }, { ingredientId: "kokosmilch_light", amount: 100 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "vollkornreis", amount: 180 }, { ingredientId: "olivenoel", amount: 5 }, { ingredientId: "kichererbsen", amount: 50 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornreis", amount: 100 }, { ingredientId: "linsen_rot", amount: 100 }, { ingredientId: "sojajoghurt", amount: 150 }] } } },
      { id: "m2", mealType: "lunch", name: "Kichererbsen-Bowl mit Feta", categories: ["leicht"], excludeTags: [], base: { ingredients: [{ ingredientId: "kichererbsen", amount: 180 }, { ingredientId: "quinoa", amount: 120 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "feta", amount: 40 }, { ingredientId: "tahin", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "quinoa", amount: 80 }, { ingredientId: "kichererbsen", amount: 80 }, { ingredientId: "feta", amount: 30 }, { ingredientId: "olivenoel", amount: 10 }] } } },
      { id: "m3", mealType: "lunch", name: "Vollkornpasta mit Linsen-Bolognese", categories: ["deftig"], excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornpasta", amount: 100 }, { ingredientId: "linsen_rot", amount: 150 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "hefeflocken", amount: 15 }, { ingredientId: "olivenoel", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornpasta", amount: 50 }, { ingredientId: "linsen_rot", amount: 100 }, { ingredientId: "olivenoel", amount: 10 }] } } },
      { id: "m4", mealType: "lunch", name: "Falafel-Wrap mit Hummus", categories: ["leicht", "schnell"], excludeTags: [], base: { ingredients: [{ ingredientId: "falafel", amount: 120 }, { ingredientId: "fladenbrot", amount: 80 }, { ingredientId: "hummus", amount: 50 }, { ingredientId: "gemuese", amount: 100 }, { ingredientId: "sojajoghurt", amount: 50 }] }, extras: { erik: { addIngredients: [{ ingredientId: "falafel", amount: 40 }, { ingredientId: "fladenbrot", amount: 80 }, { ingredientId: "hummus", amount: 30 }] } } },
      { id: "m5", mealType: "lunch", name: "Rote-Linsen-Suppe mit Vollkornbrot", categories: ["leicht", "schnell"], excludeTags: [], base: { ingredients: [{ ingredientId: "linsen_rot", amount: 280 }, { ingredientId: "gemuese", amount: 100 }, { ingredientId: "kokosmilch_light", amount: 50 }, { ingredientId: "vollkornbrot", amount: 80 }, { ingredientId: "olivenoel", amount: 5 }, { ingredientId: "kuerbiskerne", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "linsen_rot", amount: 100 }, { ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "kuerbiskerne", amount: 15 }] } } },
      { id: "m6", mealType: "lunch", name: "Gebratener Tempeh mit Gemüse & Reisnudeln", categories: ["deftig"], excludeTags: [], base: { ingredients: [{ ingredientId: "tempeh", amount: 150 }, { ingredientId: "reisnudeln", amount: 80 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "erdnusssauce", amount: 20 }, { ingredientId: "sesamoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tempeh", amount: 50 }, { ingredientId: "reisnudeln", amount: 30 }, { ingredientId: "erdnusssauce", amount: 15 }] } } },

      // Abend
      { id: "a1", mealType: "dinner", name: "Bohnen-Chili mit Vollkornbrot", categories: ["deftig"], excludeTags: [], base: { ingredients: [{ ingredientId: "bohnen", amount: 200 }, { ingredientId: "sojaprotein", amount: 30 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "mais", amount: 50 }, { ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "kaese", amount: 20 }] }, extras: { erik: { addIngredients: [{ ingredientId: "sojaprotein", amount: 20 }, { ingredientId: "bohnen", amount: 100 }, { ingredientId: "vollkornbrot", amount: 40 }] } } },
      { id: "a2", mealType: "dinner", name: "Tofu-Gemüse-Curry mit Reis", categories: ["deftig"], excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 150 }, { ingredientId: "kokosmilch", amount: 100 }, { ingredientId: "currypaste", amount: 15 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "vollkornreis", amount: 150 }, { ingredientId: "cashewkerne", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "vollkornreis", amount: 100 }, { ingredientId: "cashewkerne", amount: 15 }] } } },
      { id: "a3", mealType: "dinner", name: "Gefüllte Paprika mit Quinoa & Käse überbacken", categories: ["deftig"], excludeTags: [], base: { ingredients: [{ ingredientId: "paprika", amount: 240 }, { ingredientId: "quinoa", amount: 150 }, { ingredientId: "kichererbsen", amount: 150 }, { ingredientId: "gemuese", amount: 50 }, { ingredientId: "kaese", amount: 30 }] }, extras: { erik: { addIngredients: [{ ingredientId: "gemuese", amount: 150 }, { ingredientId: "kaese", amount: 20 }, { ingredientId: "vollkornbrot", amount: 40 }] } } },
      { id: "a4", mealType: "dinner", name: "Shakshuka mit Fladenbrot", categories: ["schnell"], excludeTags: [], base: { ingredients: [{ ingredientId: "ei", amount: 140 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "kichererbsen", amount: 100 }, { ingredientId: "feta", amount: 30 }, { ingredientId: "fladenbrot", amount: 60 }] }, extras: { erik: { addIngredients: [{ ingredientId: "ei", amount: 55 }, { ingredientId: "fladenbrot", amount: 40 }, { ingredientId: "kichererbsen", amount: 50 }] } } },
      { id: "a5", mealType: "dinner", name: "Große Salat-Bowl mit gebackenem Tofu", categories: ["leicht"], excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 150 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "vinaigrette", amount: 15 }, { ingredientId: "avocado", amount: 50 }, { ingredientId: "kuerbiskerne", amount: 15 }, { ingredientId: "vollkornbrot", amount: 40 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "kuerbiskerne", amount: 15 }] } } },
      { id: "a6", mealType: "dinner", name: "Schnelle Kichererbsen-Pfanne mit Fladenbrot", categories: ["leicht", "schnell"], excludeTags: [], base: { ingredients: [{ ingredientId: "kichererbsen", amount: 280 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "fladenbrot", amount: 60 }, { ingredientId: "sojajoghurt", amount: 80 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "kichererbsen", amount: 100 }, { ingredientId: "fladenbrot", amount: 40 }, { ingredientId: "kaese", amount: 30 }] } } },
    ],

    // Referenzwerte aus dem Ernährungsplan-Dokument, nur zur Anzeige (kein automatischer Soll/Ist-Abgleich der Vorschläge).
    targets: {
      erik: {
        dailyKcal: 3300, dailyProtein: 160, dailyCarbs: 440, dailyFat: 100,
        meals: { breakfast: { kcal: 820, protein: 40 }, lunch: { kcal: 1100, protein: 50 }, dinner: { kcal: 950, protein: 45 } },
        rest: { kcal: 330, protein: 25 },
      },
      nele: {
        dailyKcal: 2150, dailyProtein: 110, dailyCarbs: 260, dailyFat: 70,
        meals: { breakfast: { kcal: 540, protein: 28 }, lunch: { kcal: 750, protein: 35 }, dinner: { kcal: 650, protein: 32 } },
        rest: { kcal: 210, protein: 15 },
      },
    },

    // Präferenzen als Filter: Gerichte mit einem hier gelisteten Tag in excludeTags
    // werden für diese Person nie vorgeschlagen (weder in "gemeinsam" noch "getrennt").
    preferences: {
      erik: { excludeTags: ["proteinpulver"] },
      nele: { excludeTags: [] },
    },

    // Tagespläne, keyed nach ISO-Datum. Wird lazy von nutrition.js befüllt
    // (ensureDayPlan) — hier bewusst leer, damit Vorschläge nicht vorab für
    // beliebig viele Tage generiert werden.
    days: {},
  };
}
