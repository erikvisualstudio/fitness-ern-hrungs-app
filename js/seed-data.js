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
// pro Person ein optionales "extras"-Objekt mit Zusatz-Zutaten + resultierender
// Gesamt-Kalorien-/Proteinmenge für diese Person (aktuell nur "erik", Modell ist
// generisch für weitere Personen erweiterbar).
export function seedNutrition() {
  return {
    dishes: [
      // Frühstück
      { id: "f1", mealType: "breakfast", name: "Porridge-Bowl", categories: ["leicht", "schnell"], excludeTags: [], base: { kcal: 520, protein: 33, description: "Haferflocken 50 g, Sojamilch 200 ml, Skyr 150 g, Beeren 100 g, Chiasamen 10 g, Mandeln 10 g." }, extras: { erik: { addDescription: "+30 g Haferflocken, +20 g Erdnussbutter, +1 Banane", totalKcal: 810, totalProtein: 42 } } },
      { id: "f2", mealType: "breakfast", name: "Tofu-Scramble mit Vollkornbrot", categories: ["deftig"], excludeTags: [], base: { kcal: 540, protein: 27, description: "Tofu 130 g mit Kurkuma/Paprika/Spinat angebraten, Olivenöl 5 g, 2 Scheiben Vollkornbrot, ¼ Avocado." }, extras: { erik: { addDescription: "+1 Ei, +1 Scheibe Brot, +30 g Käse", totalKcal: 810, totalProtein: 44 } } },
      { id: "f3", mealType: "breakfast", name: "Overnight Oats mit Quark", categories: ["leicht", "schnell"], excludeTags: [], base: { kcal: 480, protein: 31, description: "Haferflocken 50 g, Sojamilch 150 ml, Magerquark 150 g, Banane 100 g, Leinsamen 10 g, über Nacht einweichen." }, extras: { erik: { addDescription: "+30 g Haferflocken, +20 g Erdnussbutter, +100 g Beeren", totalKcal: 810, totalProtein: 40 } } },
      { id: "f4", mealType: "breakfast", name: "Eiweiß-Pfannkuchen mit Quark", categories: ["deftig"], excludeTags: [], base: { kcal: 480, protein: 31, description: "Haferflocken 40 g + 2 Eier zu Pfannkuchen verarbeitet, dazu Magerquark 150 g, Beeren 100 g, 10 g Honig." }, extras: { erik: { addDescription: "+2 Eier, +30 g Haferflocken, +15 g Nussmus", totalKcal: 810, totalProtein: 45 } } },
      { id: "f5", mealType: "breakfast", name: "Vollkorn-Toast mit Hüttenkäse & Tomaten", categories: ["leicht", "schnell"], excludeTags: [], base: { kcal: 555, protein: 29, description: "2-3 Scheiben Vollkornbrot, Hüttenkäse 200 g, Kirschtomaten, Kresse/Basilikum, ¼ Avocado, Olivenöl 5 g." }, extras: { erik: { addDescription: "+1 Scheibe Brot, +100 g Hüttenkäse, +15 g Nüsse", totalKcal: 835, totalProtein: 44 } } },
      { id: "f6", mealType: "breakfast", name: "Chia-Pudding mit Mango & Skyr", categories: ["leicht", "schnell"], excludeTags: [], base: { kcal: 520, protein: 28, description: "Chiasamen 40 g, Kokosmilch light 200 ml, Mango 100 g, Kokosraspeln 10 g, Skyr 200 g separat untergerührt." }, extras: { erik: { addDescription: "+100 g Skyr, +30 g Haferflocken als Topping, +15 g Erdnussbutter", totalKcal: 820, totalProtein: 43 } } },

      // Mittag
      { id: "m1", mealType: "lunch", name: "Linsen-Dal mit Vollkornreis", categories: ["deftig"], excludeTags: [], base: { kcal: 780, protein: 31, description: "Rote Linsen (250 g gekocht), Kokosmilch light 100 ml, Gemüse, Vollkornreis 180 g gekocht, Öl 5 g, Topping: 50 g geröstete Kichererbsen." }, extras: { erik: { addDescription: "+100 g Reis, +100 g Linsen, +150 g Sojajoghurt", totalKcal: 1090, totalProtein: 53 } } },
      { id: "m2", mealType: "lunch", name: "Kichererbsen-Bowl mit Feta", categories: ["leicht"], excludeTags: [], base: { kcal: 780, protein: 29, description: "Kichererbsen 180 g gekocht, Quinoa 120 g gekocht, geröstetes Gemüse (Süßkartoffel, Zucchini, Paprika) 200 g, Feta 40 g, Tahin-Dressing 15 g." }, extras: { erik: { addDescription: "+80 g Quinoa, +80 g Kichererbsen, +30 g Feta, +10 g Olivenöl", totalKcal: 1140, totalProtein: 44 } } },
      { id: "m3", mealType: "lunch", name: "Vollkornpasta mit Linsen-Bolognese", categories: ["deftig"], excludeTags: [], base: { kcal: 730, protein: 31, description: "Vollkornpasta 100 g (roh), Linsen-Bolognese (150 g gekochte Linsen, Tomatensauce, Gemüse), Hefeflocken/Parmesan 15 g, Salat mit Olivenöl." }, extras: { erik: { addDescription: "+50 g Pasta, +100 g Linsen, +10 g Olivenöl", totalKcal: 1110, totalProtein: 47 } } },
      { id: "m4", mealType: "lunch", name: "Falafel-Wrap mit Hummus", categories: ["leicht", "schnell"], excludeTags: [], base: { kcal: 750, protein: 28, description: "6 Falafel, Vollkorn-Wrap/Fladenbrot 80 g, Hummus 50 g, reichlich Salat/Gemüse, Joghurt-Sauce 50 g." }, extras: { erik: { addDescription: "+2 Falafel, +ein weiterer Wrap, +30 g Hummus", totalKcal: 1100, totalProtein: 41 } } },
      { id: "m5", mealType: "lunch", name: "Rote-Linsen-Suppe mit Vollkornbrot", categories: ["leicht", "schnell"], excludeTags: [], base: { kcal: 755, protein: 36, description: "Rote Linsen 280 g gekocht als Suppe mit Gemüse und etwas Kokosmilch, Vollkornbrot 80 g, Olivenöl 5 g, Topping Kürbiskerne 15 g." }, extras: { erik: { addDescription: "+100 g Linsen, +40 g Brot, +15 g Kürbiskerne", totalKcal: 1055, totalProtein: 49 } } },
      { id: "m6", mealType: "lunch", name: "Gebratener Tempeh mit Gemüse & Reisnudeln", categories: ["deftig"], excludeTags: [], base: { kcal: 695, protein: 38, description: "Tempeh 150 g gebraten, Reisnudeln 80 g (roh), Gemüsepfanne (Brokkoli, Karotten, Paprika), Erdnusssauce 20 g, Sesamöl 5 g." }, extras: { erik: { addDescription: "+50 g Tempeh, +30 g Reisnudeln, +15 g Erdnusssauce", totalKcal: 995, totalProtein: 53 } } },

      // Abend
      { id: "a1", mealType: "dinner", name: "Bohnen-Chili mit Vollkornbrot", categories: ["deftig"], excludeTags: [], base: { kcal: 650, protein: 35, description: "Gemischte Bohnen 200 g, texturiertes Sojaprotein 30 g (trocken), Tomatensauce/Gemüse, Mais, Vollkornbrot 40 g, geriebener Käse 20 g." }, extras: { erik: { addDescription: "+20 g Sojaprotein, +100 g Bohnen, +eine weitere Brotscheibe", totalKcal: 930, totalProtein: 50 } } },
      { id: "a2", mealType: "dinner", name: "Tofu-Gemüse-Curry mit Reis", categories: ["deftig"], excludeTags: [], base: { kcal: 670, protein: 29, description: "Tofu 150 g, Kokosmilch 100 ml, Currypaste, Gemüse, Vollkornreis 150 g gekocht, Cashew-Topping 15 g." }, extras: { erik: { addDescription: "+50 g Tofu, +100 g Reis, +15 g Cashews", totalKcal: 1000, totalProtein: 42 } } },
      { id: "a3", mealType: "dinner", name: "Gefüllte Paprika mit Quinoa & Käse überbacken", categories: ["deftig"], excludeTags: [], base: { kcal: 600, protein: 32, description: "2 Paprika, Füllung aus Quinoa 150 g gekocht + Linsen/Kichererbsen 150 g gekocht + Gemüse, mit 30 g Käse überbacken." }, extras: { erik: { addDescription: "+eine weitere Paprika/größere Portion Füllung, +20 g Käse, +Vollkornbrot 40 g als Beilage", totalKcal: 930, totalProtein: 45 } } },
      { id: "a4", mealType: "dinner", name: "Shakshuka mit Fladenbrot", categories: ["schnell"], excludeTags: [], base: { kcal: 680, protein: 33, description: "2-3 Eier in Tomaten-Paprika-Sauce mit 100 g Kichererbsen, 30 g Feta, dazu 60 g Vollkorn-/Fladenbrot." }, extras: { erik: { addDescription: "+1 Ei, +weiteres Brot, +50 g Kichererbsen", totalKcal: 930, totalProtein: 45 } } },
      { id: "a5", mealType: "dinner", name: "Große Salat-Bowl mit gebackenem Tofu", categories: ["leicht"], excludeTags: [], base: { kcal: 613, protein: 30, description: "Tofu 150 g gebacken, reichlich gemischter Salat (Blattsalat, Gurke, Tomate, Mais, Rotkohl), Vinaigrette 15 g, ¼ Avocado, Kürbiskerne 15 g, Vollkornbrot 40 g als Beilage." }, extras: { erik: { addDescription: "+50 g Tofu, +40 g Brot, +15 g Kürbiskerne", totalKcal: 913, totalProtein: 45 } } },
      { id: "a6", mealType: "dinner", name: "Schnelle Kichererbsen-Pfanne mit Fladenbrot", categories: ["leicht", "schnell"], excludeTags: [], base: { kcal: 632, protein: 31, description: "Kichererbsen 280 g gekocht in Tomatensauce mit Paprika/Zwiebel/Kreuzkümmel, Fladenbrot/Vollkornbrot 60 g, Sojajoghurt-Dip 80 g, Olivenöl 5 g." }, extras: { erik: { addDescription: "+100 g Kichererbsen, +40 g Brot, +30 g Käse", totalKcal: 982, totalProtein: 48 } } },
    ],

    // Referenzwerte aus dem Ernährungsplan-Dokument, nur zur Anzeige (kein Tages-Tracking/Abgleich in Phase 2).
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
