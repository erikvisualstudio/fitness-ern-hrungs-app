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
// Große, allgemeine Lebensmittel-Datenbank (nicht auf die 18 Startgerichte
// beschränkt) — Werte sind Standard-Nährwert-Näherungen (kcal/Protein pro
// 100 g bzw. 100 ml), keine Rohdaten aus einer amtlichen Datenbank. Burrata
// und Klebreis wurden gezielt online gegengecheckt, der Rest folgt gängigen
// Referenzwerten. "category" dient nur der Gruppierung in der Zutaten-Suche.
function ingredientsDB() {
  return [
    // Milchprodukte & Käse
    { id: "haferflocken", name: "Haferflocken", unit: "g", kcalPer100: 370, proteinPer100: 13, category: "Getreide & Brot" },
    { id: "sojamilch", name: "Sojamilch", unit: "ml", kcalPer100: 33, proteinPer100: 3.3, category: "Pflanzliche Alternativen" },
    { id: "skyr", name: "Skyr", unit: "g", kcalPer100: 63, proteinPer100: 11, category: "Milchprodukte" },
    { id: "beeren", name: "Beeren (gemischt)", unit: "g", kcalPer100: 50, proteinPer100: 1, category: "Obst" },
    { id: "chiasamen", name: "Chiasamen", unit: "g", kcalPer100: 486, proteinPer100: 17, category: "Nüsse & Samen" },
    { id: "mandeln", name: "Mandeln", unit: "g", kcalPer100: 579, proteinPer100: 21, category: "Nüsse & Samen" },
    { id: "erdnussbutter", name: "Erdnussbutter", unit: "g", kcalPer100: 588, proteinPer100: 25, category: "Nüsse & Samen" },
    { id: "banane", name: "Banane", unit: "g", kcalPer100: 89, proteinPer100: 1.1, category: "Obst" },
    { id: "tofu", name: "Tofu", unit: "g", kcalPer100: 145, proteinPer100: 15, category: "Pflanzliche Alternativen" },
    { id: "olivenoel", name: "Olivenöl", unit: "g", kcalPer100: 884, proteinPer100: 0, category: "Öle & Fette" },
    { id: "vollkornbrot", name: "Vollkornbrot", unit: "g", kcalPer100: 250, proteinPer100: 9, category: "Getreide & Brot" },
    { id: "avocado", name: "Avocado", unit: "g", kcalPer100: 160, proteinPer100: 2, category: "Obst" },
    { id: "ei", name: "Ei", unit: "g", kcalPer100: 155, proteinPer100: 13, category: "Eier" },
    { id: "kaese", name: "Käse", unit: "g", kcalPer100: 380, proteinPer100: 27, category: "Milchprodukte" },
    { id: "magerquark", name: "Magerquark", unit: "g", kcalPer100: 67, proteinPer100: 12, category: "Milchprodukte" },
    { id: "honig", name: "Honig", unit: "g", kcalPer100: 304, proteinPer100: 0.3, category: "Süßes" },
    { id: "nussmus", name: "Nussmus", unit: "g", kcalPer100: 614, proteinPer100: 21, category: "Nüsse & Samen" },
    { id: "huettenkaese", name: "Hüttenkäse", unit: "g", kcalPer100: 98, proteinPer100: 12, category: "Milchprodukte" },
    { id: "kirschtomaten", name: "Kirschtomaten", unit: "g", kcalPer100: 18, proteinPer100: 0.9, category: "Gemüse" },
    { id: "kraeuter", name: "Kräuter (Kresse/Basilikum)", unit: "g", kcalPer100: 25, proteinPer100: 2.5, category: "Gewürze & Soßen" },
    { id: "kokosmilch_light", name: "Kokosmilch light", unit: "ml", kcalPer100: 80, proteinPer100: 1.2, category: "Pflanzliche Alternativen" },
    { id: "kokosmilch", name: "Kokosmilch", unit: "ml", kcalPer100: 200, proteinPer100: 2, category: "Pflanzliche Alternativen" },
    { id: "mango", name: "Mango", unit: "g", kcalPer100: 60, proteinPer100: 0.8, category: "Obst" },
    { id: "kokosraspeln", name: "Kokosraspeln", unit: "g", kcalPer100: 660, proteinPer100: 6.9, category: "Nüsse & Samen" },
    { id: "linsen_rot", name: "Rote Linsen (gekocht)", unit: "g", kcalPer100: 116, proteinPer100: 9, category: "Hülsenfrüchte" },
    { id: "gemuese", name: "Gemüse (gemischt)", unit: "g", kcalPer100: 35, proteinPer100: 2, category: "Gemüse" },
    { id: "vollkornreis", name: "Vollkornreis (gekocht)", unit: "g", kcalPer100: 123, proteinPer100: 2.6, category: "Getreide & Brot" },
    { id: "kichererbsen", name: "Kichererbsen (gekocht)", unit: "g", kcalPer100: 164, proteinPer100: 8.9, category: "Hülsenfrüchte" },
    { id: "quinoa", name: "Quinoa (gekocht)", unit: "g", kcalPer100: 120, proteinPer100: 4.4, category: "Getreide & Brot" },
    { id: "feta", name: "Feta", unit: "g", kcalPer100: 264, proteinPer100: 14, category: "Milchprodukte" },
    { id: "tahin", name: "Tahin", unit: "g", kcalPer100: 595, proteinPer100: 17, category: "Gewürze & Soßen" },
    { id: "vollkornpasta", name: "Vollkornpasta (roh)", unit: "g", kcalPer100: 348, proteinPer100: 13, category: "Getreide & Brot" },
    { id: "hefeflocken", name: "Hefeflocken/Parmesan", unit: "g", kcalPer100: 385, proteinPer100: 40, category: "Milchprodukte" },
    { id: "falafel", name: "Falafel", unit: "g", kcalPer100: 333, proteinPer100: 13, category: "Pflanzliche Alternativen" },
    { id: "fladenbrot", name: "Fladenbrot/Wrap", unit: "g", kcalPer100: 275, proteinPer100: 9, category: "Getreide & Brot" },
    { id: "hummus", name: "Hummus", unit: "g", kcalPer100: 166, proteinPer100: 8, category: "Hülsenfrüchte" },
    { id: "sojajoghurt", name: "Sojajoghurt", unit: "g", kcalPer100: 43, proteinPer100: 3.5, category: "Pflanzliche Alternativen" },
    { id: "kuerbiskerne", name: "Kürbiskerne", unit: "g", kcalPer100: 559, proteinPer100: 30, category: "Nüsse & Samen" },
    { id: "tempeh", name: "Tempeh", unit: "g", kcalPer100: 193, proteinPer100: 19, category: "Pflanzliche Alternativen" },
    { id: "reisnudeln", name: "Reisnudeln (roh)", unit: "g", kcalPer100: 360, proteinPer100: 6, category: "Getreide & Brot" },
    { id: "erdnusssauce", name: "Erdnusssauce", unit: "g", kcalPer100: 280, proteinPer100: 10, category: "Gewürze & Soßen" },
    { id: "sesamoel", name: "Sesamöl", unit: "g", kcalPer100: 884, proteinPer100: 0, category: "Öle & Fette" },
    { id: "bohnen", name: "Gemischte Bohnen (gekocht)", unit: "g", kcalPer100: 127, proteinPer100: 8.7, category: "Hülsenfrüchte" },
    { id: "sojaprotein", name: "Sojaprotein texturiert (trocken)", unit: "g", kcalPer100: 330, proteinPer100: 52, category: "Pflanzliche Alternativen" },
    { id: "mais", name: "Mais", unit: "g", kcalPer100: 86, proteinPer100: 3.3, category: "Gemüse" },
    { id: "currypaste", name: "Currypaste", unit: "g", kcalPer100: 100, proteinPer100: 2, category: "Gewürze & Soßen" },
    { id: "cashewkerne", name: "Cashewkerne", unit: "g", kcalPer100: 553, proteinPer100: 18, category: "Nüsse & Samen" },
    { id: "paprika", name: "Paprika", unit: "g", kcalPer100: 31, proteinPer100: 1, category: "Gemüse" },
    { id: "vinaigrette", name: "Vinaigrette", unit: "g", kcalPer100: 350, proteinPer100: 0.5, category: "Gewürze & Soßen" },
    { id: "leinsamen", name: "Leinsamen", unit: "g", kcalPer100: 534, proteinPer100: 18, category: "Nüsse & Samen" },

    // Milchprodukte & Käse (Erweiterung)
    { id: "vollmilch", name: "Vollmilch (3,5%)", unit: "ml", kcalPer100: 64, proteinPer100: 3.3, category: "Milchprodukte" },
    { id: "milch_fettarm", name: "Milch (1,5%)", unit: "ml", kcalPer100: 47, proteinPer100: 3.4, category: "Milchprodukte" },
    { id: "buttermilch", name: "Buttermilch", unit: "ml", kcalPer100: 40, proteinPer100: 3.5, category: "Milchprodukte" },
    { id: "sahne", name: "Sahne (30%)", unit: "g", kcalPer100: 292, proteinPer100: 2.4, category: "Milchprodukte" },
    { id: "creme_fraiche", name: "Crème fraîche", unit: "g", kcalPer100: 292, proteinPer100: 2.2, category: "Milchprodukte" },
    { id: "joghurt_natur", name: "Joghurt (natur, 3,5%)", unit: "g", kcalPer100: 66, proteinPer100: 3.5, category: "Milchprodukte" },
    { id: "joghurt_griechisch", name: "Griechischer Joghurt (10%)", unit: "g", kcalPer100: 133, proteinPer100: 5.7, category: "Milchprodukte" },
    { id: "mozzarella", name: "Mozzarella", unit: "g", kcalPer100: 253, proteinPer100: 18, category: "Milchprodukte" },
    { id: "burrata", name: "Burrata", unit: "g", kcalPer100: 250, proteinPer100: 15, category: "Milchprodukte" },
    { id: "parmesan", name: "Parmesan", unit: "g", kcalPer100: 392, proteinPer100: 35, category: "Milchprodukte" },
    { id: "gouda", name: "Gouda", unit: "g", kcalPer100: 356, proteinPer100: 25, category: "Milchprodukte" },
    { id: "emmentaler", name: "Emmentaler", unit: "g", kcalPer100: 380, proteinPer100: 28, category: "Milchprodukte" },
    { id: "camembert", name: "Camembert", unit: "g", kcalPer100: 300, proteinPer100: 20, category: "Milchprodukte" },
    { id: "brie", name: "Brie", unit: "g", kcalPer100: 334, proteinPer100: 21, category: "Milchprodukte" },
    { id: "frischkaese", name: "Frischkäse (Doppelrahmstufe)", unit: "g", kcalPer100: 342, proteinPer100: 6, category: "Milchprodukte" },
    { id: "frischkaese_leicht", name: "Frischkäse (leicht)", unit: "g", kcalPer100: 152, proteinPer100: 11, category: "Milchprodukte" },
    { id: "ricotta", name: "Ricotta", unit: "g", kcalPer100: 174, proteinPer100: 11, category: "Milchprodukte" },
    { id: "mascarpone", name: "Mascarpone", unit: "g", kcalPer100: 429, proteinPer100: 4.3, category: "Milchprodukte" },
    { id: "butter", name: "Butter", unit: "g", kcalPer100: 741, proteinPer100: 0.7, category: "Milchprodukte" },
    { id: "ziegenkaese", name: "Ziegenkäse", unit: "g", kcalPer100: 364, proteinPer100: 21, category: "Milchprodukte" },
    { id: "halloumi", name: "Halloumi", unit: "g", kcalPer100: 320, proteinPer100: 22, category: "Milchprodukte" },
    { id: "schmand", name: "Schmand", unit: "g", kcalPer100: 221, proteinPer100: 2.9, category: "Milchprodukte" },
    { id: "kondensmilch", name: "Kondensmilch", unit: "g", kcalPer100: 135, proteinPer100: 6.8, category: "Milchprodukte" },

    // Fleisch & Wurst
    { id: "haehnchenbrust", name: "Hähnchenbrust", unit: "g", kcalPer100: 110, proteinPer100: 23, category: "Fleisch & Wurst" },
    { id: "haehnchenschenkel", name: "Hähnchenschenkel", unit: "g", kcalPer100: 175, proteinPer100: 18, category: "Fleisch & Wurst" },
    { id: "pute", name: "Putenbrust", unit: "g", kcalPer100: 105, proteinPer100: 24, category: "Fleisch & Wurst" },
    { id: "rindfleisch_mager", name: "Rindfleisch (mager)", unit: "g", kcalPer100: 137, proteinPer100: 21, category: "Fleisch & Wurst" },
    { id: "hackfleisch_rind", name: "Hackfleisch (Rind)", unit: "g", kcalPer100: 254, proteinPer100: 17, category: "Fleisch & Wurst" },
    { id: "hackfleisch_schwein", name: "Hackfleisch (Schwein)", unit: "g", kcalPer100: 263, proteinPer100: 16, category: "Fleisch & Wurst" },
    { id: "schweineschnitzel", name: "Schweineschnitzel", unit: "g", kcalPer100: 197, proteinPer100: 21, category: "Fleisch & Wurst" },
    { id: "speck", name: "Speck", unit: "g", kcalPer100: 541, proteinPer100: 9, category: "Fleisch & Wurst" },
    { id: "salami", name: "Salami", unit: "g", kcalPer100: 407, proteinPer100: 20, category: "Fleisch & Wurst" },
    { id: "schinken_gekocht", name: "Schinken (gekocht)", unit: "g", kcalPer100: 107, proteinPer100: 20, category: "Fleisch & Wurst" },
    { id: "lammfleisch", name: "Lammfleisch", unit: "g", kcalPer100: 235, proteinPer100: 18, category: "Fleisch & Wurst" },
    { id: "rinderfilet", name: "Rinderfilet", unit: "g", kcalPer100: 143, proteinPer100: 21, category: "Fleisch & Wurst" },
    { id: "wiener_wuerstchen", name: "Wiener Würstchen", unit: "g", kcalPer100: 280, proteinPer100: 11, category: "Fleisch & Wurst" },
    { id: "leberkaese", name: "Leberkäse", unit: "g", kcalPer100: 280, proteinPer100: 13, category: "Fleisch & Wurst" },

    // Fisch & Meeresfrüchte
    { id: "lachs", name: "Lachs", unit: "g", kcalPer100: 208, proteinPer100: 20, category: "Fisch & Meeresfrüchte" },
    { id: "thunfisch_frisch", name: "Thunfisch (frisch)", unit: "g", kcalPer100: 144, proteinPer100: 23, category: "Fisch & Meeresfrüchte" },
    { id: "thunfisch_dose", name: "Thunfisch (Dose, in Wasser)", unit: "g", kcalPer100: 116, proteinPer100: 26, category: "Fisch & Meeresfrüchte" },
    { id: "kabeljau", name: "Kabeljau", unit: "g", kcalPer100: 82, proteinPer100: 18, category: "Fisch & Meeresfrüchte" },
    { id: "garnelen", name: "Garnelen", unit: "g", kcalPer100: 99, proteinPer100: 21, category: "Fisch & Meeresfrüchte" },
    { id: "forelle", name: "Forelle", unit: "g", kcalPer100: 148, proteinPer100: 21, category: "Fisch & Meeresfrüchte" },
    { id: "hering", name: "Hering", unit: "g", kcalPer100: 158, proteinPer100: 18, category: "Fisch & Meeresfrüchte" },
    { id: "makrele", name: "Makrele", unit: "g", kcalPer100: 205, proteinPer100: 19, category: "Fisch & Meeresfrüchte" },
    { id: "lachs_geraeuchert", name: "Räucherlachs", unit: "g", kcalPer100: 117, proteinPer100: 18, category: "Fisch & Meeresfrüchte" },

    // Eier (Erweiterung)
    { id: "eiweiss", name: "Eiklar", unit: "g", kcalPer100: 52, proteinPer100: 11, category: "Eier" },
    { id: "eigelb", name: "Eigelb", unit: "g", kcalPer100: 322, proteinPer100: 16, category: "Eier" },

    // Gemüse
    { id: "tomate", name: "Tomate", unit: "g", kcalPer100: 18, proteinPer100: 0.9, category: "Gemüse" },
    { id: "tomate_getrocknet", name: "Getrocknete Tomaten", unit: "g", kcalPer100: 258, proteinPer100: 14, category: "Gemüse" },
    { id: "gurke", name: "Salatgurke", unit: "g", kcalPer100: 12, proteinPer100: 0.7, category: "Gemüse" },
    { id: "zucchini", name: "Zucchini", unit: "g", kcalPer100: 17, proteinPer100: 1.2, category: "Gemüse" },
    { id: "aubergine", name: "Aubergine", unit: "g", kcalPer100: 25, proteinPer100: 1, category: "Gemüse" },
    { id: "brokkoli", name: "Brokkoli", unit: "g", kcalPer100: 34, proteinPer100: 2.8, category: "Gemüse" },
    { id: "blumenkohl", name: "Blumenkohl", unit: "g", kcalPer100: 25, proteinPer100: 1.9, category: "Gemüse" },
    { id: "karotte", name: "Karotte", unit: "g", kcalPer100: 41, proteinPer100: 0.9, category: "Gemüse" },
    { id: "zwiebel", name: "Zwiebel", unit: "g", kcalPer100: 40, proteinPer100: 1.1, category: "Gemüse" },
    { id: "knoblauch", name: "Knoblauch", unit: "g", kcalPer100: 149, proteinPer100: 6.4, category: "Gemüse" },
    { id: "spinat", name: "Spinat", unit: "g", kcalPer100: 23, proteinPer100: 2.9, category: "Gemüse" },
    { id: "gruenkohl", name: "Grünkohl", unit: "g", kcalPer100: 49, proteinPer100: 4.3, category: "Gemüse" },
    { id: "rosenkohl", name: "Rosenkohl", unit: "g", kcalPer100: 43, proteinPer100: 3.4, category: "Gemüse" },
    { id: "weisskohl", name: "Weißkohl", unit: "g", kcalPer100: 25, proteinPer100: 1.3, category: "Gemüse" },
    { id: "rotkohl", name: "Rotkohl", unit: "g", kcalPer100: 27, proteinPer100: 1.4, category: "Gemüse" },
    { id: "staudensellerie", name: "Staudensellerie", unit: "g", kcalPer100: 16, proteinPer100: 0.7, category: "Gemüse" },
    { id: "lauch", name: "Lauch", unit: "g", kcalPer100: 61, proteinPer100: 1.5, category: "Gemüse" },
    { id: "radieschen", name: "Radieschen", unit: "g", kcalPer100: 16, proteinPer100: 0.7, category: "Gemüse" },
    { id: "rote_bete", name: "Rote Bete", unit: "g", kcalPer100: 43, proteinPer100: 1.6, category: "Gemüse" },
    { id: "champignons", name: "Champignons", unit: "g", kcalPer100: 22, proteinPer100: 3.1, category: "Gemüse" },
    { id: "suesskartoffel", name: "Süßkartoffel", unit: "g", kcalPer100: 86, proteinPer100: 1.6, category: "Gemüse" },
    { id: "kartoffel", name: "Kartoffel", unit: "g", kcalPer100: 77, proteinPer100: 2, category: "Gemüse" },
    { id: "erbsen", name: "Erbsen (grün)", unit: "g", kcalPer100: 81, proteinPer100: 5.4, category: "Gemüse" },
    { id: "gruene_bohnen", name: "Grüne Bohnen", unit: "g", kcalPer100: 31, proteinPer100: 1.8, category: "Gemüse" },
    { id: "spargel", name: "Spargel", unit: "g", kcalPer100: 20, proteinPer100: 2.2, category: "Gemüse" },
    { id: "fenchel", name: "Fenchel", unit: "g", kcalPer100: 31, proteinPer100: 1.2, category: "Gemüse" },
    { id: "kuerbis", name: "Kürbis (Hokkaido)", unit: "g", kcalPer100: 26, proteinPer100: 1, category: "Gemüse" },
    { id: "kopfsalat", name: "Kopfsalat", unit: "g", kcalPer100: 15, proteinPer100: 1.4, category: "Gemüse" },
    { id: "rucola", name: "Rucola", unit: "g", kcalPer100: 25, proteinPer100: 2.6, category: "Gemüse" },
    { id: "feldsalat", name: "Feldsalat", unit: "g", kcalPer100: 21, proteinPer100: 2, category: "Gemüse" },
    { id: "sellerie_knolle", name: "Sellerie (Knolle)", unit: "g", kcalPer100: 42, proteinPer100: 1.5, category: "Gemüse" },
    { id: "oliven", name: "Oliven", unit: "g", kcalPer100: 145, proteinPer100: 1, category: "Gemüse" },
    { id: "fruehlingszwiebel", name: "Frühlingszwiebel", unit: "g", kcalPer100: 32, proteinPer100: 1.8, category: "Gemüse" },
    { id: "chili", name: "Chilischote", unit: "g", kcalPer100: 40, proteinPer100: 1.9, category: "Gemüse" },
    { id: "ingwer", name: "Ingwer", unit: "g", kcalPer100: 80, proteinPer100: 1.8, category: "Gemüse" },

    // Obst
    { id: "apfel", name: "Apfel", unit: "g", kcalPer100: 52, proteinPer100: 0.3, category: "Obst" },
    { id: "orange", name: "Orange", unit: "g", kcalPer100: 47, proteinPer100: 0.9, category: "Obst" },
    { id: "birne", name: "Birne", unit: "g", kcalPer100: 57, proteinPer100: 0.4, category: "Obst" },
    { id: "erdbeere", name: "Erdbeere", unit: "g", kcalPer100: 32, proteinPer100: 0.7, category: "Obst" },
    { id: "himbeere", name: "Himbeere", unit: "g", kcalPer100: 52, proteinPer100: 1.2, category: "Obst" },
    { id: "blaubeere", name: "Blaubeere", unit: "g", kcalPer100: 57, proteinPer100: 0.7, category: "Obst" },
    { id: "weintraube", name: "Weintraube", unit: "g", kcalPer100: 69, proteinPer100: 0.6, category: "Obst" },
    { id: "ananas", name: "Ananas", unit: "g", kcalPer100: 50, proteinPer100: 0.5, category: "Obst" },
    { id: "honigmelone", name: "Honigmelone", unit: "g", kcalPer100: 36, proteinPer100: 0.8, category: "Obst" },
    { id: "wassermelone", name: "Wassermelone", unit: "g", kcalPer100: 30, proteinPer100: 0.6, category: "Obst" },
    { id: "kiwi", name: "Kiwi", unit: "g", kcalPer100: 61, proteinPer100: 1.1, category: "Obst" },
    { id: "pfirsich", name: "Pfirsich", unit: "g", kcalPer100: 39, proteinPer100: 0.9, category: "Obst" },
    { id: "aprikose", name: "Aprikose", unit: "g", kcalPer100: 48, proteinPer100: 1.4, category: "Obst" },
    { id: "kirsche", name: "Kirsche", unit: "g", kcalPer100: 63, proteinPer100: 1, category: "Obst" },
    { id: "pflaume", name: "Pflaume", unit: "g", kcalPer100: 46, proteinPer100: 0.7, category: "Obst" },
    { id: "zitrone", name: "Zitrone", unit: "g", kcalPer100: 29, proteinPer100: 1.1, category: "Obst" },
    { id: "limette", name: "Limette", unit: "g", kcalPer100: 30, proteinPer100: 0.7, category: "Obst" },
    { id: "grapefruit", name: "Grapefruit", unit: "g", kcalPer100: 42, proteinPer100: 0.8, category: "Obst" },
    { id: "feige", name: "Feige", unit: "g", kcalPer100: 74, proteinPer100: 0.8, category: "Obst" },
    { id: "feige_getrocknet", name: "Getrocknete Feigen", unit: "g", kcalPer100: 249, proteinPer100: 3.3, category: "Obst" },
    { id: "dattel", name: "Dattel", unit: "g", kcalPer100: 277, proteinPer100: 2.5, category: "Obst" },
    { id: "rosinen", name: "Rosinen", unit: "g", kcalPer100: 299, proteinPer100: 3.1, category: "Obst" },
    { id: "granatapfel", name: "Granatapfel", unit: "g", kcalPer100: 83, proteinPer100: 1.7, category: "Obst" },
    { id: "litchi", name: "Litschi", unit: "g", kcalPer100: 66, proteinPer100: 0.8, category: "Obst" },
    { id: "papaya", name: "Papaya", unit: "g", kcalPer100: 43, proteinPer100: 0.5, category: "Obst" },
    { id: "nektarine", name: "Nektarine", unit: "g", kcalPer100: 44, proteinPer100: 1.1, category: "Obst" },

    // Getreide, Reis, Nudeln, Brot
    { id: "klebreis", name: "Klebreis (gekocht)", unit: "g", kcalPer100: 150, proteinPer100: 2.8, category: "Getreide & Brot" },
    { id: "basmatireis", name: "Basmatireis (gekocht)", unit: "g", kcalPer100: 121, proteinPer100: 2.7, category: "Getreide & Brot" },
    { id: "jasminreis", name: "Jasminreis (gekocht)", unit: "g", kcalPer100: 129, proteinPer100: 2.4, category: "Getreide & Brot" },
    { id: "weisser_reis", name: "Weißer Reis (gekocht)", unit: "g", kcalPer100: 130, proteinPer100: 2.4, category: "Getreide & Brot" },
    { id: "bulgur", name: "Bulgur (gekocht)", unit: "g", kcalPer100: 83, proteinPer100: 3.1, category: "Getreide & Brot" },
    { id: "couscous", name: "Couscous (gekocht)", unit: "g", kcalPer100: 112, proteinPer100: 3.8, category: "Getreide & Brot" },
    { id: "hirse", name: "Hirse (gekocht)", unit: "g", kcalPer100: 118, proteinPer100: 3.5, category: "Getreide & Brot" },
    { id: "buchweizen", name: "Buchweizen (gekocht)", unit: "g", kcalPer100: 92, proteinPer100: 3.4, category: "Getreide & Brot" },
    { id: "griess", name: "Grieß (Weizen, roh)", unit: "g", kcalPer100: 356, proteinPer100: 10.3, category: "Getreide & Brot" },
    { id: "weizenmehl", name: "Weizenmehl (Type 405)", unit: "g", kcalPer100: 348, proteinPer100: 10, category: "Getreide & Brot" },
    { id: "vollkornmehl", name: "Vollkornmehl (Weizen)", unit: "g", kcalPer100: 340, proteinPer100: 13, category: "Getreide & Brot" },
    { id: "weisse_pasta", name: "Weiße Pasta (roh)", unit: "g", kcalPer100: 358, proteinPer100: 12, category: "Getreide & Brot" },
    { id: "toastbrot", name: "Toastbrot", unit: "g", kcalPer100: 265, proteinPer100: 8, category: "Getreide & Brot" },
    { id: "weissbrot", name: "Weißbrot", unit: "g", kcalPer100: 260, proteinPer100: 8, category: "Getreide & Brot" },
    { id: "roggenbrot", name: "Roggenbrot", unit: "g", kcalPer100: 220, proteinPer100: 6.5, category: "Getreide & Brot" },
    { id: "baguette", name: "Baguette", unit: "g", kcalPer100: 270, proteinPer100: 9, category: "Getreide & Brot" },
    { id: "tortilla", name: "Weizen-Tortilla", unit: "g", kcalPer100: 290, proteinPer100: 8, category: "Getreide & Brot" },
    { id: "reiswaffeln", name: "Reiswaffeln", unit: "g", kcalPer100: 387, proteinPer100: 8, category: "Getreide & Brot" },
    { id: "cornflakes", name: "Cornflakes", unit: "g", kcalPer100: 378, proteinPer100: 7, category: "Getreide & Brot" },
    { id: "haferkleie", name: "Haferkleie", unit: "g", kcalPer100: 246, proteinPer100: 17, category: "Getreide & Brot" },
    { id: "polenta", name: "Polenta (gekocht)", unit: "g", kcalPer100: 85, proteinPer100: 2, category: "Getreide & Brot" },
    { id: "naan", name: "Naan-Brot", unit: "g", kcalPer100: 310, proteinPer100: 9, category: "Getreide & Brot" },
    { id: "knaeckebrot", name: "Knäckebrot", unit: "g", kcalPer100: 350, proteinPer100: 10, category: "Getreide & Brot" },

    // Hülsenfrüchte
    { id: "linsen_gruen", name: "Grüne/braune Linsen (gekocht)", unit: "g", kcalPer100: 105, proteinPer100: 8.8, category: "Hülsenfrüchte" },
    { id: "linsen_gelb", name: "Gelbe Linsen (gekocht)", unit: "g", kcalPer100: 116, proteinPer100: 9, category: "Hülsenfrüchte" },
    { id: "schwarze_bohnen", name: "Schwarze Bohnen (gekocht)", unit: "g", kcalPer100: 132, proteinPer100: 8.9, category: "Hülsenfrüchte" },
    { id: "kidneybohnen", name: "Kidneybohnen (gekocht)", unit: "g", kcalPer100: 127, proteinPer100: 8.7, category: "Hülsenfrüchte" },
    { id: "weisse_bohnen", name: "Weiße Bohnen (gekocht)", unit: "g", kcalPer100: 139, proteinPer100: 9.7, category: "Hülsenfrüchte" },
    { id: "sojabohnen", name: "Sojabohnen (gekocht)", unit: "g", kcalPer100: 173, proteinPer100: 16.6, category: "Hülsenfrüchte" },
    { id: "edamame", name: "Edamame", unit: "g", kcalPer100: 122, proteinPer100: 11, category: "Hülsenfrüchte" },

    // Nüsse & Samen
    { id: "walnuesse", name: "Walnüsse", unit: "g", kcalPer100: 654, proteinPer100: 15, category: "Nüsse & Samen" },
    { id: "pistazien", name: "Pistazien", unit: "g", kcalPer100: 562, proteinPer100: 20, category: "Nüsse & Samen" },
    { id: "haselnuesse", name: "Haselnüsse", unit: "g", kcalPer100: 628, proteinPer100: 15, category: "Nüsse & Samen" },
    { id: "paranuesse", name: "Paranüsse", unit: "g", kcalPer100: 656, proteinPer100: 14, category: "Nüsse & Samen" },
    { id: "macadamia", name: "Macadamianüsse", unit: "g", kcalPer100: 718, proteinPer100: 8, category: "Nüsse & Samen" },
    { id: "erdnuesse", name: "Erdnüsse", unit: "g", kcalPer100: 567, proteinPer100: 26, category: "Nüsse & Samen" },
    { id: "sonnenblumenkerne", name: "Sonnenblumenkerne", unit: "g", kcalPer100: 584, proteinPer100: 21, category: "Nüsse & Samen" },
    { id: "sesam", name: "Sesam", unit: "g", kcalPer100: 573, proteinPer100: 18, category: "Nüsse & Samen" },
    { id: "pinienkerne", name: "Pinienkerne", unit: "g", kcalPer100: 673, proteinPer100: 14, category: "Nüsse & Samen" },

    // Öle & Fette
    { id: "rapsoel", name: "Rapsöl", unit: "g", kcalPer100: 884, proteinPer100: 0, category: "Öle & Fette" },
    { id: "sonnenblumenoel", name: "Sonnenblumenöl", unit: "g", kcalPer100: 884, proteinPer100: 0, category: "Öle & Fette" },
    { id: "kokosoel", name: "Kokosöl", unit: "g", kcalPer100: 862, proteinPer100: 0, category: "Öle & Fette" },
    { id: "margarine", name: "Margarine", unit: "g", kcalPer100: 719, proteinPer100: 0.2, category: "Öle & Fette" },
    { id: "avocadooel", name: "Avocadoöl", unit: "g", kcalPer100: 884, proteinPer100: 0, category: "Öle & Fette" },

    // Süßungsmittel & Süßes
    { id: "zucker", name: "Zucker", unit: "g", kcalPer100: 400, proteinPer100: 0, category: "Süßes" },
    { id: "ahornsirup", name: "Ahornsirup", unit: "g", kcalPer100: 261, proteinPer100: 0, category: "Süßes" },
    { id: "agavendicksaft", name: "Agavendicksaft", unit: "g", kcalPer100: 310, proteinPer100: 0.1, category: "Süßes" },
    { id: "schokolade_dunkel", name: "Zartbitterschokolade", unit: "g", kcalPer100: 546, proteinPer100: 7.8, category: "Süßes" },
    { id: "schokolade_vollmilch", name: "Vollmilchschokolade", unit: "g", kcalPer100: 534, proteinPer100: 7.6, category: "Süßes" },
    { id: "nutella", name: "Nuss-Nougat-Creme", unit: "g", kcalPer100: 539, proteinPer100: 6.3, category: "Süßes" },
    { id: "marmelade", name: "Marmelade", unit: "g", kcalPer100: 250, proteinPer100: 0.3, category: "Süßes" },

    // Pflanzliche Alternativen (Erweiterung)
    { id: "seitan", name: "Seitan", unit: "g", kcalPer100: 121, proteinPer100: 21, category: "Pflanzliche Alternativen" },
    { id: "sojagranulat", name: "Sojagranulat (trocken)", unit: "g", kcalPer100: 336, proteinPer100: 50, category: "Pflanzliche Alternativen" },
    { id: "hafermilch", name: "Hafermilch", unit: "ml", kcalPer100: 47, proteinPer100: 1, category: "Pflanzliche Alternativen" },
    { id: "mandelmilch", name: "Mandelmilch (ungesüßt)", unit: "ml", kcalPer100: 17, proteinPer100: 0.6, category: "Pflanzliche Alternativen" },
    { id: "veganer_kaese", name: "Veganer Käse (Scheiben)", unit: "g", kcalPer100: 290, proteinPer100: 3, category: "Pflanzliche Alternativen" },
    { id: "kokosjoghurt", name: "Kokosjoghurt", unit: "g", kcalPer100: 90, proteinPer100: 1.5, category: "Pflanzliche Alternativen" },
    { id: "seidentofu", name: "Seidentofu", unit: "g", kcalPer100: 62, proteinPer100: 5.5, category: "Pflanzliche Alternativen" },
    { id: "raeuchertofu", name: "Räuchertofu", unit: "g", kcalPer100: 178, proteinPer100: 17, category: "Pflanzliche Alternativen" },

    // Gewürze & Soßen
    { id: "senf", name: "Senf", unit: "g", kcalPer100: 90, proteinPer100: 4.4, category: "Gewürze & Soßen" },
    { id: "ketchup", name: "Ketchup", unit: "g", kcalPer100: 100, proteinPer100: 1.2, category: "Gewürze & Soßen" },
    { id: "mayonnaise", name: "Mayonnaise", unit: "g", kcalPer100: 680, proteinPer100: 1.1, category: "Gewürze & Soßen" },
    { id: "sojasauce", name: "Sojasauce", unit: "g", kcalPer100: 60, proteinPer100: 6, category: "Gewürze & Soßen" },
    { id: "essig", name: "Essig", unit: "g", kcalPer100: 21, proteinPer100: 0, category: "Gewürze & Soßen" },
    { id: "balsamico", name: "Balsamico-Essig", unit: "g", kcalPer100: 88, proteinPer100: 0.5, category: "Gewürze & Soßen" },
    { id: "tomatenmark", name: "Tomatenmark", unit: "g", kcalPer100: 82, proteinPer100: 4.3, category: "Gewürze & Soßen" },
    { id: "pesto", name: "Pesto (rot oder grün)", unit: "g", kcalPer100: 430, proteinPer100: 3.5, category: "Gewürze & Soßen" },
    { id: "guacamole", name: "Guacamole", unit: "g", kcalPer100: 155, proteinPer100: 2, category: "Gewürze & Soßen" },
    { id: "salsa", name: "Salsa-Sauce", unit: "g", kcalPer100: 36, proteinPer100: 1.3, category: "Gewürze & Soßen" },
    { id: "worcestersauce", name: "Worcestersauce", unit: "g", kcalPer100: 78, proteinPer100: 0, category: "Gewürze & Soßen" },
    { id: "sriracha", name: "Sriracha-Sauce", unit: "g", kcalPer100: 93, proteinPer100: 2, category: "Gewürze & Soßen" },

    // International & Nischig
    { id: "miso", name: "Miso-Paste", unit: "g", kcalPer100: 199, proteinPer100: 12, category: "International" },
    { id: "kimchi", name: "Kimchi", unit: "g", kcalPer100: 23, proteinPer100: 1.8, category: "International" },
    { id: "wasabi", name: "Wasabi-Paste", unit: "g", kcalPer100: 109, proteinPer100: 4, category: "International" },
    { id: "nori", name: "Nori-Blätter", unit: "g", kcalPer100: 35, proteinPer100: 6, category: "International" },
    { id: "panko", name: "Panko-Semmelbrösel", unit: "g", kcalPer100: 373, proteinPer100: 10, category: "International" },
    { id: "amaranth", name: "Amaranth (gekocht)", unit: "g", kcalPer100: 102, proteinPer100: 3.8, category: "International" },
    { id: "teff", name: "Teff (gekocht)", unit: "g", kcalPer100: 101, proteinPer100: 3.9, category: "International" },
    { id: "lupinen", name: "Lupinenkerne (gekocht)", unit: "g", kcalPer100: 119, proteinPer100: 15.6, category: "International" },
    { id: "jackfruit", name: "Jackfrucht", unit: "g", kcalPer100: 95, proteinPer100: 1.7, category: "International" },
    { id: "kefir", name: "Kefir", unit: "ml", kcalPer100: 41, proteinPer100: 3.3, category: "Milchprodukte" },
    { id: "ziegenmilch", name: "Ziegenmilch", unit: "ml", kcalPer100: 60, proteinPer100: 3.1, category: "Milchprodukte" },
    { id: "sauerkraut", name: "Sauerkraut", unit: "g", kcalPer100: 19, proteinPer100: 0.9, category: "Gemüse" },
    { id: "harissa", name: "Harissa-Paste", unit: "g", kcalPer100: 70, proteinPer100: 2, category: "International" },
    { id: "currypulver", name: "Currypulver", unit: "g", kcalPer100: 325, proteinPer100: 12, category: "Gewürze & Soßen" },
    { id: "kreuzkuemmel", name: "Kreuzkümmel (gemahlen)", unit: "g", kcalPer100: 375, proteinPer100: 18, category: "Gewürze & Soßen" },
    { id: "zimt", name: "Zimt", unit: "g", kcalPer100: 247, proteinPer100: 4, category: "Gewürze & Soßen" },
    { id: "kakao", name: "Kakaopulver", unit: "g", kcalPer100: 228, proteinPer100: 20, category: "Süßes" },
    { id: "teriyaki_sauce", name: "Teriyaki-Sauce", unit: "g", kcalPer100: 90, proteinPer100: 3, category: "Gewürze & Soßen" },
    { id: "pak_choi", name: "Pak Choi", unit: "g", kcalPer100: 13, proteinPer100: 1.5, category: "Gemüse" },
    { id: "portobello", name: "Portobello-Pilz", unit: "g", kcalPer100: 26, proteinPer100: 2.5, category: "Gemüse" },
  ];
}

export function seedNutrition() {
  return {
    ingredients: ingredientsDB(),

    dishes: [
      // Frühstück (Start-6 aus dem Ernährungsplan-Dokument)
      { id: "f1", mealType: "breakfast", name: "Porridge-Bowl", categories: ["leicht", "schnell"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 50 }, { ingredientId: "sojamilch", amount: 200 }, { ingredientId: "skyr", amount: 150 }, { ingredientId: "beeren", amount: 100 }, { ingredientId: "chiasamen", amount: 10 }, { ingredientId: "mandeln", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 20 }, { ingredientId: "banane", amount: 120 }] } } },
      { id: "f2", mealType: "breakfast", name: "Tofu-Scramble mit Vollkornbrot", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 130 }, { ingredientId: "olivenoel", amount: 5 }, { ingredientId: "vollkornbrot", amount: 80 }, { ingredientId: "avocado", amount: 50 }] }, extras: { erik: { addIngredients: [{ ingredientId: "ei", amount: 55 }, { ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "kaese", amount: 30 }] } } },
      { id: "f3", mealType: "breakfast", name: "Overnight Oats mit Quark", categories: ["leicht", "schnell"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 50 }, { ingredientId: "sojamilch", amount: 150 }, { ingredientId: "magerquark", amount: 150 }, { ingredientId: "banane", amount: 100 }, { ingredientId: "leinsamen", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 20 }, { ingredientId: "beeren", amount: 100 }] } } },
      { id: "f4", mealType: "breakfast", name: "Eiweiß-Pfannkuchen mit Quark", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 40 }, { ingredientId: "ei", amount: 110 }, { ingredientId: "magerquark", amount: 150 }, { ingredientId: "beeren", amount: 100 }, { ingredientId: "honig", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "ei", amount: 110 }, { ingredientId: "haferflocken", amount: 30 }, { ingredientId: "nussmus", amount: 15 }] } } },
      { id: "f5", mealType: "breakfast", name: "Vollkorn-Toast mit Hüttenkäse & Tomaten", categories: ["leicht", "schnell"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornbrot", amount: 100 }, { ingredientId: "huettenkaese", amount: 200 }, { ingredientId: "kirschtomaten", amount: 50 }, { ingredientId: "kraeuter", amount: 5 }, { ingredientId: "avocado", amount: 50 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "huettenkaese", amount: 100 }, { ingredientId: "mandeln", amount: 15 }] } } },
      { id: "f6", mealType: "breakfast", name: "Chia-Pudding mit Mango & Skyr", categories: ["leicht", "schnell"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "chiasamen", amount: 40 }, { ingredientId: "kokosmilch_light", amount: 200 }, { ingredientId: "mango", amount: 100 }, { ingredientId: "kokosraspeln", amount: 10 }, { ingredientId: "skyr", amount: 200 }] }, extras: { erik: { addIngredients: [{ ingredientId: "skyr", amount: 100 }, { ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 15 }] } } },

      // Frühstück (Erweiterung — überwiegend vegan, mehr Bowls, weniger Skyr/Quark-Wiederholung)
      { id: "f7", mealType: "breakfast", name: "Overnight Oats mit Sojajoghurt & Beeren", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 50 }, { ingredientId: "sojamilch", amount: 100 }, { ingredientId: "sojajoghurt", amount: 150 }, { ingredientId: "beeren", amount: 100 }, { ingredientId: "chiasamen", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 20 }, { ingredientId: "banane", amount: 100 }] } } },
      { id: "f8", mealType: "breakfast", name: "Tofu-Rührei-Wrap", categories: ["deftig", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 120 }, { ingredientId: "fladenbrot", amount: 70 }, { ingredientId: "paprika", amount: 50 }, { ingredientId: "zwiebel", amount: 30 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 40 }, { ingredientId: "fladenbrot", amount: 30 }, { ingredientId: "avocado", amount: 50 }] } } },
      { id: "f9", mealType: "breakfast", name: "Erdnussbutter-Bananen-Porridge", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 60 }, { ingredientId: "sojamilch", amount: 200 }, { ingredientId: "banane", amount: 100 }, { ingredientId: "erdnussbutter", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 15 }, { ingredientId: "mandeln", amount: 15 }] } } },
      { id: "f10", mealType: "breakfast", name: "Grüne Smoothie-Bowl", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "banane", amount: 120 }, { ingredientId: "spinat", amount: 40 }, { ingredientId: "mandelmilch", amount: 150 }, { ingredientId: "haferflocken", amount: 30 }, { ingredientId: "chiasamen", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "banane", amount: 80 }, { ingredientId: "haferflocken", amount: 30 }, { ingredientId: "erdnussbutter", amount: 15 }] } } },
      { id: "f11", mealType: "breakfast", name: "Beeren-Smoothie-Bowl", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "beeren", amount: 200 }, { ingredientId: "sojajoghurt", amount: 150 }, { ingredientId: "haferflocken", amount: 20 }, { ingredientId: "kuerbiskerne", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "sojajoghurt", amount: 100 }, { ingredientId: "haferflocken", amount: 30 }, { ingredientId: "mandeln", amount: 15 }] } } },
      { id: "f12", mealType: "breakfast", name: "Vegane Pfannkuchen mit Ahornsirup", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "weizenmehl", amount: 60 }, { ingredientId: "hafermilch", amount: 150 }, { ingredientId: "leinsamen", amount: 10 }, { ingredientId: "ahornsirup", amount: 20 }, { ingredientId: "beeren", amount: 80 }] }, extras: { erik: { addIngredients: [{ ingredientId: "weizenmehl", amount: 30 }, { ingredientId: "hafermilch", amount: 50 }, { ingredientId: "ahornsirup", amount: 10 }] } } },
      { id: "f13", mealType: "breakfast", name: "Avocado-Toast mit Radieschen & Sesam", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornbrot", amount: 80 }, { ingredientId: "avocado", amount: 100 }, { ingredientId: "radieschen", amount: 40 }, { ingredientId: "sesam", amount: 5 }, { ingredientId: "zitrone", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "avocado", amount: 50 }, { ingredientId: "weisse_bohnen", amount: 60 }] } } },
      { id: "f14", mealType: "breakfast", name: "Amaranth-Frühstücksbrei mit Apfel & Zimt", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "amaranth", amount: 60 }, { ingredientId: "sojamilch", amount: 200 }, { ingredientId: "apfel", amount: 100 }, { ingredientId: "zimt", amount: 2 }, { ingredientId: "mandeln", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "amaranth", amount: 30 }, { ingredientId: "sojamilch", amount: 50 }, { ingredientId: "mandeln", amount: 15 }] } } },
      { id: "f15", mealType: "breakfast", name: "Tofu-Frühstücksburrito", categories: ["deftig", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 100 }, { ingredientId: "schwarze_bohnen", amount: 80 }, { ingredientId: "tortilla", amount: 70 }, { ingredientId: "salsa", amount: 40 }, { ingredientId: "avocado", amount: 40 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 40 }, { ingredientId: "schwarze_bohnen", amount: 40 }, { ingredientId: "tortilla", amount: 30 }] } } },
      { id: "f16", mealType: "breakfast", name: "Chia-Pudding mit Mandelmilch & Mango", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "chiasamen", amount: 40 }, { ingredientId: "mandelmilch", amount: 200 }, { ingredientId: "mango", amount: 100 }, { ingredientId: "kokosraspeln", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "chiasamen", amount: 15 }, { ingredientId: "mandelmilch", amount: 50 }, { ingredientId: "mango", amount: 50 }, { ingredientId: "erdnussbutter", amount: 15 }] } } },
      { id: "f17", mealType: "breakfast", name: "Müsli mit Sojamilch, Nüssen & Obst", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 50 }, { ingredientId: "sojamilch", amount: 200 }, { ingredientId: "apfel", amount: 80 }, { ingredientId: "walnuesse", amount: 15 }, { ingredientId: "rosinen", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "haferflocken", amount: 30 }, { ingredientId: "walnuesse", amount: 15 }, { ingredientId: "banane", amount: 100 }] } } },
      { id: "f18", mealType: "breakfast", name: "Erdnussbutter-Toast mit Banane", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornbrot", amount: 80 }, { ingredientId: "erdnussbutter", amount: 25 }, { ingredientId: "banane", amount: 100 }, { ingredientId: "zimt", amount: 1 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "erdnussbutter", amount: 15 }, { ingredientId: "haferflocken", amount: 30 }] } } },
      { id: "f19", mealType: "breakfast", name: "Klebreis mit Mango & Kokosmilch", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "klebreis", amount: 180 }, { ingredientId: "kokosmilch", amount: 80 }, { ingredientId: "mango", amount: 120 }, { ingredientId: "sesam", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "klebreis", amount: 100 }, { ingredientId: "kokosmilch", amount: 30 }, { ingredientId: "mandeln", amount: 15 }] } } },
      { id: "f20", mealType: "breakfast", name: "Hafer-Walnuss-Porridge mit Apfel", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "haferflocken", amount: 60 }, { ingredientId: "hafermilch", amount: 200 }, { ingredientId: "apfel", amount: 80 }, { ingredientId: "walnuesse", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "haferflocken", amount: 30 }, { ingredientId: "walnuesse", amount: 15 }, { ingredientId: "ahornsirup", amount: 15 }] } } },
      { id: "f21", mealType: "breakfast", name: "Herzhafte Tofu-Scramble-Bowl mit Süßkartoffel & Grünkohl", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 120 }, { ingredientId: "suesskartoffel", amount: 150 }, { ingredientId: "gruenkohl", amount: 50 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 40 }, { ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "avocado", amount: 50 }] } } },
      { id: "f22", mealType: "breakfast", name: "Quinoa-Frühstücksbowl mit Beeren & Mandeln", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "quinoa", amount: 150 }, { ingredientId: "sojamilch", amount: 100 }, { ingredientId: "beeren", amount: 100 }, { ingredientId: "mandeln", amount: 15 }, { ingredientId: "ahornsirup", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "quinoa", amount: 80 }, { ingredientId: "mandeln", amount: 15 }, { ingredientId: "banane", amount: 100 }] } } },
      { id: "f23", mealType: "breakfast", name: "Vollkorntoast mit Guacamole & Kirschtomaten", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornbrot", amount: 80 }, { ingredientId: "guacamole", amount: 80 }, { ingredientId: "kirschtomaten", amount: 60 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "guacamole", amount: 40 }, { ingredientId: "weisse_bohnen", amount: 60 }] } } },
      { id: "f24", mealType: "breakfast", name: "Griechischer Joghurt-Bowl mit Honig, Walnüssen & Granatapfel", categories: ["leicht", "schnell"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "joghurt_griechisch", amount: 200 }, { ingredientId: "honig", amount: 15 }, { ingredientId: "walnuesse", amount: 15 }, { ingredientId: "granatapfel", amount: 50 }] }, extras: { erik: { addIngredients: [{ ingredientId: "joghurt_griechisch", amount: 100 }, { ingredientId: "walnuesse", amount: 15 }, { ingredientId: "haferflocken", amount: 30 }] } } },

      // Mittag (Start-6 aus dem Ernährungsplan-Dokument)
      { id: "m1", mealType: "lunch", name: "Linsen-Dal mit Vollkornreis", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "linsen_rot", amount: 250 }, { ingredientId: "kokosmilch_light", amount: 100 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "vollkornreis", amount: 180 }, { ingredientId: "olivenoel", amount: 5 }, { ingredientId: "kichererbsen", amount: 50 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornreis", amount: 100 }, { ingredientId: "linsen_rot", amount: 100 }, { ingredientId: "sojajoghurt", amount: 150 }] } } },
      { id: "m2", mealType: "lunch", name: "Kichererbsen-Bowl mit Feta", categories: ["leicht"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "kichererbsen", amount: 180 }, { ingredientId: "quinoa", amount: 120 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "feta", amount: 40 }, { ingredientId: "tahin", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "quinoa", amount: 80 }, { ingredientId: "kichererbsen", amount: 80 }, { ingredientId: "feta", amount: 30 }, { ingredientId: "olivenoel", amount: 10 }] } } },
      { id: "m3", mealType: "lunch", name: "Vollkornpasta mit Linsen-Bolognese", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornpasta", amount: 100 }, { ingredientId: "linsen_rot", amount: 150 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "hefeflocken", amount: 15 }, { ingredientId: "olivenoel", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornpasta", amount: 50 }, { ingredientId: "linsen_rot", amount: 100 }, { ingredientId: "olivenoel", amount: 10 }] } } },
      { id: "m4", mealType: "lunch", name: "Falafel-Wrap mit Hummus", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "falafel", amount: 120 }, { ingredientId: "fladenbrot", amount: 80 }, { ingredientId: "hummus", amount: 50 }, { ingredientId: "gemuese", amount: 100 }, { ingredientId: "sojajoghurt", amount: 50 }] }, extras: { erik: { addIngredients: [{ ingredientId: "falafel", amount: 40 }, { ingredientId: "fladenbrot", amount: 80 }, { ingredientId: "hummus", amount: 30 }] } } },
      { id: "m5", mealType: "lunch", name: "Rote-Linsen-Suppe mit Vollkornbrot", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "linsen_rot", amount: 280 }, { ingredientId: "gemuese", amount: 100 }, { ingredientId: "kokosmilch_light", amount: 50 }, { ingredientId: "vollkornbrot", amount: 80 }, { ingredientId: "olivenoel", amount: 5 }, { ingredientId: "kuerbiskerne", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "linsen_rot", amount: 100 }, { ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "kuerbiskerne", amount: 15 }] } } },
      { id: "m6", mealType: "lunch", name: "Gebratener Tempeh mit Gemüse & Reisnudeln", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tempeh", amount: 150 }, { ingredientId: "reisnudeln", amount: 80 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "erdnusssauce", amount: 20 }, { ingredientId: "sesamoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tempeh", amount: 50 }, { ingredientId: "reisnudeln", amount: 30 }, { ingredientId: "erdnusssauce", amount: 15 }] } } },

      // Mittag (Erweiterung — mehr Bowls, mehr Proteinvielfalt jenseits Linsen/Kichererbsen)
      { id: "m7", mealType: "lunch", name: "Teriyaki-Tofu-Bowl mit Reis & Brokkoli", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 150 }, { ingredientId: "vollkornreis", amount: 180 }, { ingredientId: "brokkoli", amount: 100 }, { ingredientId: "teriyaki_sauce", amount: 30 }, { ingredientId: "sesam", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "vollkornreis", amount: 100 }, { ingredientId: "teriyaki_sauce", amount: 15 }] } } },
      { id: "m8", mealType: "lunch", name: "Burrito Bowl mit schwarzen Bohnen & Mais", categories: ["deftig", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "schwarze_bohnen", amount: 150 }, { ingredientId: "weisser_reis", amount: 150 }, { ingredientId: "mais", amount: 60 }, { ingredientId: "avocado", amount: 60 }, { ingredientId: "salsa", amount: 40 }] }, extras: { erik: { addIngredients: [{ ingredientId: "schwarze_bohnen", amount: 80 }, { ingredientId: "weisser_reis", amount: 80 }, { ingredientId: "avocado", amount: 30 }] } } },
      { id: "m9", mealType: "lunch", name: "Gebratener Reis mit Tofu & Gemüse", categories: ["deftig", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 120 }, { ingredientId: "weisser_reis", amount: 180 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "sojasauce", amount: 15 }, { ingredientId: "sesamoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "weisser_reis", amount: 100 }, { ingredientId: "sojasauce", amount: 10 }] } } },
      { id: "m10", mealType: "lunch", name: "Seitan-Gyros mit Fladenbrot & Sojajoghurt-Tzatziki", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "seitan", amount: 130 }, { ingredientId: "fladenbrot", amount: 80 }, { ingredientId: "gurke", amount: 60 }, { ingredientId: "sojajoghurt", amount: 60 }, { ingredientId: "knoblauch", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "seitan", amount: 50 }, { ingredientId: "fladenbrot", amount: 40 }, { ingredientId: "sojajoghurt", amount: 40 }] } } },
      { id: "m11", mealType: "lunch", name: "Quinoa-Bowl mit geröstetem Gemüse & Tahin-Dressing", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "quinoa", amount: 150 }, { ingredientId: "suesskartoffel", amount: 120 }, { ingredientId: "zucchini", amount: 80 }, { ingredientId: "tahin", amount: 15 }, { ingredientId: "zitrone", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "quinoa", amount: 80 }, { ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "tahin", amount: 10 }] } } },
      { id: "m12", mealType: "lunch", name: "Schwarze-Bohnen-Burger mit Süßkartoffelpommes", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "schwarze_bohnen", amount: 180 }, { ingredientId: "fladenbrot", amount: 60 }, { ingredientId: "suesskartoffel", amount: 150 }, { ingredientId: "avocado", amount: 40 }] }, extras: { erik: { addIngredients: [{ ingredientId: "schwarze_bohnen", amount: 60 }, { ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "fladenbrot", amount: 30 }] } } },
      { id: "m13", mealType: "lunch", name: "Gemüse-Curry mit Kokosmilch & Basmatireis", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 100 }, { ingredientId: "kokosmilch", amount: 120 }, { ingredientId: "gemuese", amount: 180 }, { ingredientId: "basmatireis", amount: 150 }, { ingredientId: "currypaste", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "basmatireis", amount: 100 }, { ingredientId: "kokosmilch", amount: 30 }] } } },
      { id: "m14", mealType: "lunch", name: "Caprese-Sandwich mit Mozzarella", categories: ["leicht", "schnell"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "baguette", amount: 90 }, { ingredientId: "mozzarella", amount: 100 }, { ingredientId: "kirschtomaten", amount: 80 }, { ingredientId: "olivenoel", amount: 10 }, { ingredientId: "kraeuter", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "baguette", amount: 40 }, { ingredientId: "mozzarella", amount: 50 }, { ingredientId: "olivenoel", amount: 5 }] } } },
      { id: "m15", mealType: "lunch", name: "Nudelsalat mit veganem Pesto & Cherrytomaten", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornpasta", amount: 100 }, { ingredientId: "kirschtomaten", amount: 100 }, { ingredientId: "olivenoel", amount: 10 }, { ingredientId: "hefeflocken", amount: 15 }, { ingredientId: "pinienkerne", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornpasta", amount: 50 }, { ingredientId: "pinienkerne", amount: 15 }, { ingredientId: "olivenoel", amount: 10 }] } } },
      { id: "m16", mealType: "lunch", name: "Poke Bowl mit mariniertem Tofu", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 130 }, { ingredientId: "weisser_reis", amount: 150 }, { ingredientId: "edamame", amount: 60 }, { ingredientId: "gurke", amount: 60 }, { ingredientId: "avocado", amount: 50 }, { ingredientId: "sojasauce", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "weisser_reis", amount: 80 }, { ingredientId: "edamame", amount: 40 }] } } },
      { id: "m17", mealType: "lunch", name: "Gemüse-Wrap mit weißer Bohnencreme", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "fladenbrot", amount: 80 }, { ingredientId: "weisse_bohnen", amount: 100 }, { ingredientId: "gurke", amount: 50 }, { ingredientId: "karotte", amount: 50 }, { ingredientId: "spinat", amount: 30 }] }, extras: { erik: { addIngredients: [{ ingredientId: "fladenbrot", amount: 40 }, { ingredientId: "weisse_bohnen", amount: 60 }, { ingredientId: "avocado", amount: 40 }] } } },
      { id: "m18", mealType: "lunch", name: "Ofengemüse-Bowl mit Halloumi", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "halloumi", amount: 100 }, { ingredientId: "zucchini", amount: 80 }, { ingredientId: "paprika", amount: 80 }, { ingredientId: "suesskartoffel", amount: 150 }, { ingredientId: "olivenoel", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "halloumi", amount: 50 }, { ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "olivenoel", amount: 5 }] } } },
      { id: "m19", mealType: "lunch", name: "Edamame-Nudel-Bowl mit Sesam-Sauce", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "reisnudeln", amount: 90 }, { ingredientId: "edamame", amount: 100 }, { ingredientId: "karotte", amount: 50 }, { ingredientId: "erdnusssauce", amount: 20 }, { ingredientId: "sesam", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "reisnudeln", amount: 40 }, { ingredientId: "edamame", amount: 60 }, { ingredientId: "erdnusssauce", amount: 15 }] } } },
      { id: "m20", mealType: "lunch", name: "Süßkartoffel-Black-Bean-Bowl", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "suesskartoffel", amount: 180 }, { ingredientId: "schwarze_bohnen", amount: 130 }, { ingredientId: "mais", amount: 50 }, { ingredientId: "avocado", amount: 50 }, { ingredientId: "limette", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "schwarze_bohnen", amount: 60 }, { ingredientId: "avocado", amount: 30 }] } } },
      { id: "m21", mealType: "lunch", name: "Pilz-Risotto mit Parmesan", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "champignons", amount: 150 }, { ingredientId: "weisser_reis", amount: 150 }, { ingredientId: "parmesan", amount: 25 }, { ingredientId: "zwiebel", amount: 30 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "champignons", amount: 50 }, { ingredientId: "weisser_reis", amount: 80 }, { ingredientId: "parmesan", amount: 15 }] } } },
      { id: "m22", mealType: "lunch", name: "Gefüllte Süßkartoffel mit Kidneybohnen & Avocado", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "suesskartoffel", amount: 250 }, { ingredientId: "kidneybohnen", amount: 130 }, { ingredientId: "avocado", amount: 60 }, { ingredientId: "mais", amount: 40 }] }, extras: { erik: { addIngredients: [{ ingredientId: "suesskartoffel", amount: 100 }, { ingredientId: "kidneybohnen", amount: 60 }, { ingredientId: "avocado", amount: 30 }] } } },
      { id: "m23", mealType: "lunch", name: "Sommerrollen mit Erdnusssauce", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "reisnudeln", amount: 60 }, { ingredientId: "tofu", amount: 80 }, { ingredientId: "karotte", amount: 50 }, { ingredientId: "gurke", amount: 50 }, { ingredientId: "erdnusssauce", amount: 30 }] }, extras: { erik: { addIngredients: [{ ingredientId: "reisnudeln", amount: 30 }, { ingredientId: "tofu", amount: 40 }, { ingredientId: "erdnusssauce", amount: 15 }] } } },
      { id: "m24", mealType: "lunch", name: "Couscous-Salat mit Granatapfel & Mandeln", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "couscous", amount: 150 }, { ingredientId: "granatapfel", amount: 50 }, { ingredientId: "mandeln", amount: 15 }, { ingredientId: "kraeuter", amount: 5 }, { ingredientId: "zitrone", amount: 10 }, { ingredientId: "olivenoel", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "couscous", amount: 80 }, { ingredientId: "mandeln", amount: 15 }, { ingredientId: "olivenoel", amount: 5 }] } } },
      { id: "m25", mealType: "lunch", name: "Buchweizen-Bowl mit geröstetem Kürbis & Feta", categories: ["leicht"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "buchweizen", amount: 150 }, { ingredientId: "kuerbis", amount: 120 }, { ingredientId: "feta", amount: 40 }, { ingredientId: "kuerbiskerne", amount: 10 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "buchweizen", amount: 80 }, { ingredientId: "feta", amount: 20 }, { ingredientId: "kuerbiskerne", amount: 10 }] } } },

      // Abend (Start-6 aus dem Ernährungsplan-Dokument)
      { id: "a1", mealType: "dinner", name: "Bohnen-Chili mit Vollkornbrot", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "bohnen", amount: 200 }, { ingredientId: "sojaprotein", amount: 30 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "mais", amount: 50 }, { ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "kaese", amount: 20 }] }, extras: { erik: { addIngredients: [{ ingredientId: "sojaprotein", amount: 20 }, { ingredientId: "bohnen", amount: 100 }, { ingredientId: "vollkornbrot", amount: 40 }] } } },
      { id: "a2", mealType: "dinner", name: "Tofu-Gemüse-Curry mit Reis", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 150 }, { ingredientId: "kokosmilch", amount: 100 }, { ingredientId: "currypaste", amount: 15 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "vollkornreis", amount: 150 }, { ingredientId: "cashewkerne", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "vollkornreis", amount: 100 }, { ingredientId: "cashewkerne", amount: 15 }] } } },
      { id: "a3", mealType: "dinner", name: "Gefüllte Paprika mit Quinoa & Käse überbacken", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "paprika", amount: 240 }, { ingredientId: "quinoa", amount: 150 }, { ingredientId: "kichererbsen", amount: 150 }, { ingredientId: "gemuese", amount: 50 }, { ingredientId: "kaese", amount: 30 }] }, extras: { erik: { addIngredients: [{ ingredientId: "gemuese", amount: 150 }, { ingredientId: "kaese", amount: 20 }, { ingredientId: "vollkornbrot", amount: 40 }] } } },
      { id: "a4", mealType: "dinner", name: "Shakshuka mit Fladenbrot", categories: ["schnell"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "ei", amount: 140 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "kichererbsen", amount: 100 }, { ingredientId: "feta", amount: 30 }, { ingredientId: "fladenbrot", amount: 60 }] }, extras: { erik: { addIngredients: [{ ingredientId: "ei", amount: 55 }, { ingredientId: "fladenbrot", amount: 40 }, { ingredientId: "kichererbsen", amount: 50 }] } } },
      { id: "a5", mealType: "dinner", name: "Große Salat-Bowl mit gebackenem Tofu", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 150 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "vinaigrette", amount: 15 }, { ingredientId: "avocado", amount: 50 }, { ingredientId: "kuerbiskerne", amount: 15 }, { ingredientId: "vollkornbrot", amount: 40 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "kuerbiskerne", amount: 15 }] } } },
      { id: "a6", mealType: "dinner", name: "Schnelle Kichererbsen-Pfanne mit Fladenbrot", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "kichererbsen", amount: 280 }, { ingredientId: "gemuese", amount: 150 }, { ingredientId: "fladenbrot", amount: 60 }, { ingredientId: "sojajoghurt", amount: 80 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "kichererbsen", amount: 100 }, { ingredientId: "fladenbrot", amount: 40 }, { ingredientId: "kaese", amount: 30 }] } } },

      // Abend (Erweiterung — mehr Bowls, mehr Proteinvielfalt jenseits Linsen/Kichererbsen)
      { id: "a7", mealType: "dinner", name: "Gebackener Tofu-Bowl mit Erdnusssauce & Reis", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 150 }, { ingredientId: "weisser_reis", amount: 150 }, { ingredientId: "gemuese", amount: 120 }, { ingredientId: "erdnusssauce", amount: 25 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "weisser_reis", amount: 100 }, { ingredientId: "erdnusssauce", amount: 15 }] } } },
      { id: "a8", mealType: "dinner", name: "Auberginen-Curry mit Kokosmilch & Reis", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "aubergine", amount: 200 }, { ingredientId: "kokosmilch", amount: 120 }, { ingredientId: "basmatireis", amount: 150 }, { ingredientId: "currypaste", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "aubergine", amount: 80 }, { ingredientId: "basmatireis", amount: 100 }, { ingredientId: "kokosmilch", amount: 30 }] } } },
      { id: "a9", mealType: "dinner", name: "Gemüse-Pfanne mit Seitan-Streifen & Teriyaki", categories: ["deftig", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "seitan", amount: 130 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "teriyaki_sauce", amount: 25 }, { ingredientId: "weisser_reis", amount: 120 }] }, extras: { erik: { addIngredients: [{ ingredientId: "seitan", amount: 50 }, { ingredientId: "weisser_reis", amount: 80 }, { ingredientId: "teriyaki_sauce", amount: 10 }] } } },
      { id: "a10", mealType: "dinner", name: "Zucchini-Nudeln mit Avocado-Pesto", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "zucchini", amount: 250 }, { ingredientId: "vollkornpasta", amount: 60 }, { ingredientId: "avocado", amount: 80 }, { ingredientId: "pinienkerne", amount: 10 }, { ingredientId: "zitrone", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornpasta", amount: 60 }, { ingredientId: "avocado", amount: 40 }, { ingredientId: "pinienkerne", amount: 15 }] } } },
      { id: "a11", mealType: "dinner", name: "Portobello-Burger mit Halloumi", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "portobello", amount: 150 }, { ingredientId: "halloumi", amount: 80 }, { ingredientId: "fladenbrot", amount: 60 }, { ingredientId: "rucola", amount: 20 }, { ingredientId: "tomate", amount: 40 }] }, extras: { erik: { addIngredients: [{ ingredientId: "halloumi", amount: 40 }, { ingredientId: "fladenbrot", amount: 40 }, { ingredientId: "portobello", amount: 50 }] } } },
      { id: "a12", mealType: "dinner", name: "Süßkartoffel-Tempeh-Bowl mit Grünkohl", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tempeh", amount: 130 }, { ingredientId: "suesskartoffel", amount: 180 }, { ingredientId: "gruenkohl", amount: 60 }, { ingredientId: "erdnusssauce", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tempeh", amount: 50 }, { ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "erdnusssauce", amount: 15 }] } } },
      { id: "a13", mealType: "dinner", name: "Ratatouille mit Vollkornbrot", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "aubergine", amount: 100 }, { ingredientId: "zucchini", amount: 100 }, { ingredientId: "paprika", amount: 80 }, { ingredientId: "tomate", amount: 100 }, { ingredientId: "vollkornbrot", amount: 60 }, { ingredientId: "olivenoel", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornbrot", amount: 40 }, { ingredientId: "olivenoel", amount: 5 }, { ingredientId: "weisse_bohnen", amount: 80 }] } } },
      { id: "a14", mealType: "dinner", name: "Miso-Suppe mit Tofu & Edamame", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "miso", amount: 25 }, { ingredientId: "tofu", amount: 100 }, { ingredientId: "edamame", amount: 60 }, { ingredientId: "gemuese", amount: 80 }, { ingredientId: "fruehlingszwiebel", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "edamame", amount: 40 }, { ingredientId: "weisser_reis", amount: 120 }] } } },
      { id: "a15", mealType: "dinner", name: "Buddha Bowl mit geröstetem Gemüse, Quinoa & Tahin", categories: ["leicht"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "quinoa", amount: 150 }, { ingredientId: "suesskartoffel", amount: 100 }, { ingredientId: "gruenkohl", amount: 40 }, { ingredientId: "edamame", amount: 60 }, { ingredientId: "tahin", amount: 15 }] }, extras: { erik: { addIngredients: [{ ingredientId: "quinoa", amount: 80 }, { ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "tahin", amount: 10 }] } } },
      { id: "a16", mealType: "dinner", name: "Pilz-Stroganoff mit Vollkornnudeln", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "champignons", amount: 200 }, { ingredientId: "vollkornpasta", amount: 100 }, { ingredientId: "creme_fraiche", amount: 60 }, { ingredientId: "zwiebel", amount: 30 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornpasta", amount: 50 }, { ingredientId: "champignons", amount: 80 }, { ingredientId: "creme_fraiche", amount: 20 }] } } },
      { id: "a17", mealType: "dinner", name: "Kürbis-Risotto mit Parmesan", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "kuerbis", amount: 200 }, { ingredientId: "weisser_reis", amount: 150 }, { ingredientId: "parmesan", amount: 25 }, { ingredientId: "zwiebel", amount: 30 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "weisser_reis", amount: 80 }, { ingredientId: "parmesan", amount: 15 }, { ingredientId: "kuerbis", amount: 80 }] } } },
      { id: "a18", mealType: "dinner", name: "Gemüse-Lasagne mit Ricotta", categories: ["deftig"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "weisse_pasta", amount: 80 }, { ingredientId: "ricotta", amount: 100 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "tomatenmark", amount: 40 }, { ingredientId: "kaese", amount: 20 }] }, extras: { erik: { addIngredients: [{ ingredientId: "weisse_pasta", amount: 40 }, { ingredientId: "ricotta", amount: 50 }, { ingredientId: "kaese", amount: 20 }] } } },
      { id: "a19", mealType: "dinner", name: "One-Pot-Pasta mit Tomaten & weißen Bohnen", categories: ["deftig", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "vollkornpasta", amount: 100 }, { ingredientId: "weisse_bohnen", amount: 130 }, { ingredientId: "tomate", amount: 150 }, { ingredientId: "knoblauch", amount: 5 }, { ingredientId: "olivenoel", amount: 10 }] }, extras: { erik: { addIngredients: [{ ingredientId: "vollkornpasta", amount: 50 }, { ingredientId: "weisse_bohnen", amount: 60 }, { ingredientId: "olivenoel", amount: 5 }] } } },
      { id: "a20", mealType: "dinner", name: "Asia-Bowl mit Tofu, Pak Choi & Sesam", categories: ["leicht", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tofu", amount: 150 }, { ingredientId: "pak_choi", amount: 100 }, { ingredientId: "weisser_reis", amount: 150 }, { ingredientId: "sojasauce", amount: 15 }, { ingredientId: "sesam", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tofu", amount: 50 }, { ingredientId: "weisser_reis", amount: 80 }, { ingredientId: "sojasauce", amount: 10 }] } } },
      { id: "a21", mealType: "dinner", name: "Gebackene Süßkartoffel mit Guacamole & schwarzen Bohnen", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "suesskartoffel", amount: 250 }, { ingredientId: "guacamole", amount: 80 }, { ingredientId: "schwarze_bohnen", amount: 120 }, { ingredientId: "mais", amount: 40 }] }, extras: { erik: { addIngredients: [{ ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "schwarze_bohnen", amount: 60 }, { ingredientId: "guacamole", amount: 40 }] } } },
      { id: "a22", mealType: "dinner", name: "Sommerliche Quinoa-Bowl mit Feta & Wassermelone", categories: ["leicht", "schnell"], vegan: false, excludeTags: [], base: { ingredients: [{ ingredientId: "quinoa", amount: 150 }, { ingredientId: "feta", amount: 40 }, { ingredientId: "wassermelone", amount: 150 }, { ingredientId: "kraeuter", amount: 5 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "quinoa", amount: 80 }, { ingredientId: "feta", amount: 20 }, { ingredientId: "wassermelone", amount: 80 }] } } },
      { id: "a23", mealType: "dinner", name: "Seitan-Gulasch mit Kartoffeln", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "seitan", amount: 150 }, { ingredientId: "kartoffel", amount: 200 }, { ingredientId: "paprika", amount: 80 }, { ingredientId: "tomatenmark", amount: 30 }] }, extras: { erik: { addIngredients: [{ ingredientId: "seitan", amount: 50 }, { ingredientId: "kartoffel", amount: 100 }, { ingredientId: "tomatenmark", amount: 10 }] } } },
      { id: "a24", mealType: "dinner", name: "Gemüse-Wok mit Cashewkernen & Reisnudeln", categories: ["deftig", "schnell"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "reisnudeln", amount: 90 }, { ingredientId: "gemuese", amount: 200 }, { ingredientId: "cashewkerne", amount: 20 }, { ingredientId: "sojasauce", amount: 15 }, { ingredientId: "sesamoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "reisnudeln", amount: 40 }, { ingredientId: "cashewkerne", amount: 15 }, { ingredientId: "sojasauce", amount: 10 }] } } },
      { id: "a25", mealType: "dinner", name: "Gebratener Tempeh mit Süßkartoffelpüree & Grünkohl", categories: ["deftig"], vegan: true, excludeTags: [], base: { ingredients: [{ ingredientId: "tempeh", amount: 150 }, { ingredientId: "suesskartoffel", amount: 200 }, { ingredientId: "gruenkohl", amount: 60 }, { ingredientId: "olivenoel", amount: 5 }] }, extras: { erik: { addIngredients: [{ ingredientId: "tempeh", amount: 50 }, { ingredientId: "suesskartoffel", amount: 80 }, { ingredientId: "olivenoel", amount: 5 }] } } },
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
