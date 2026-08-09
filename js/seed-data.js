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
  };
}
