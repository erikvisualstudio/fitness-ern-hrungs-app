// Double-Progression-Engine.
//
// Grundprinzip (siehe Konzept): die App simuliert die komplette Session-Historie
// einer Übung von den Ausgangswerten aus neu durch, um den aktuellen Vorschlag
// für die NÄCHSTE Session zu ermitteln. Es gibt keinen separat gepflegten
// "Fortschritts-Zustand" — der Vorschlag ist immer eine reine Funktion der
// geloggten Historie, damit nichts auseinanderlaufen kann.
//
// Drei Progressions-Typen:
//  - weighted: Zielbereich (repMin-repMax) pro Gewicht. Werden ALLE Sätze am
//    oberen Ende geschafft -> Gewicht um festen Schritt erhöhen (harte Obergrenze
//    respektieren), sonst gleiches Gewicht mit Ziel "1-2 Wdh. mehr als letztes Mal".
//  - band: gleiche Logik wie weighted, aber statt eines kg-Werts wird eine
//    Bandstufe (sehr leicht/leicht/mittel/schwer/sehr schwer) vorgeschlagen;
//    ist die höchste Stufe schon erreicht, wandert der Zielbereich weiter nach oben.
//  - bodyweight: Ziel ist das Gesamtvolumen (Wdh. oder Sekunden) über alle Sätze.
//    Wird das Volumen der letzten Session erreicht/übertroffen -> neues Ziel
//    = letztes Volumen + fester Schritt. Wird das Ziel mehrfach stabil (3x in
//    Folge) erreicht und Zusatzgewicht ist für diese Übung erlaubt -> Vorschlag,
//    Zusatzgewicht (Rucksack) einzuführen.
//  - cardio: keine automatische Progression, nur letzter Wert als Referenz.
//
// Deload: in Woche 4 jedes 4-Wochen-Blocks wird der berechnete Vorschlag
// unabhängig von der individuellen Progression auf reduziertes Volumen/Gewicht
// heruntergesetzt (fixe Deload-Regel laut Konzept).

export const BAND_LEVELS = ["sehr leicht", "leicht", "mittel", "schwer", "sehr schwer"];

export function getBlockWeek(blockStartISO, todayISOStr) {
  const start = new Date(`${blockStartISO}T00:00:00`);
  const now = new Date(`${todayISOStr}T00:00:00`);
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  return (((diffWeeks % 4) + 4) % 4) + 1;
}

export function isDeloadWeek(weekInBlock) {
  return weekInBlock === 4;
}

function roundToStep(value, step) {
  const s = step || 2.5;
  return Math.round(value / s) * s;
}

function sessionsWithSets(exercise, sessions) {
  return sessions.filter((s) => s.sets && s.sets[exercise.id] && s.sets[exercise.id].length);
}

function computeWeighted(exercise, sessions) {
  const relevant = sessionsWithSets(exercise, sessions);
  let load = exercise.startLoad;
  let lastSets = null;

  for (const session of relevant) {
    const sets = session.sets[exercise.id];
    lastSets = sets;
    const heaviestThisSession = Math.max(...sets.map((s) => s.weight));
    if (load == null) {
      load = heaviestThisSession;
      continue;
    }
    const allHitTop = sets.every((s) => s.reps >= exercise.repMax && s.weight >= load);
    if (allHitTop) {
      load = load + exercise.loadStep;
      if (exercise.cap != null) load = Math.min(load, exercise.cap);
    }
  }

  let repMin = exercise.repMin;
  let repMax = exercise.repMax;
  if (lastSets) {
    const allHitTop = lastSets.every((s) => s.reps >= exercise.repMax);
    if (!allHitTop) {
      const bestReps = Math.max(...lastSets.map((s) => s.reps));
      repMax = Math.min(exercise.repMax, bestReps + 2);
      repMin = Math.min(repMax, bestReps + 1);
    }
  }

  return {
    kind: "weighted",
    load,
    repMin,
    repMax,
    capped: exercise.cap != null && load != null && load >= exercise.cap,
    hasHistory: relevant.length > 0,
  };
}

function computeBand(exercise, sessions) {
  const relevant = sessionsWithSets(exercise, sessions);
  let levelIdx = Math.max(0, BAND_LEVELS.indexOf(exercise.bandLevel || "mittel"));
  let repMin = exercise.repMin;
  let repMax = exercise.repMax;
  let lastSets = null;

  for (const session of relevant) {
    const sets = session.sets[exercise.id];
    lastSets = sets;
    const allHitTop = sets.every((s) => s.reps >= repMax);
    if (allHitTop) {
      if (levelIdx < BAND_LEVELS.length - 1) {
        levelIdx += 1;
        repMin = exercise.repMin;
        repMax = exercise.repMax;
      } else {
        repMin += 2;
        repMax += 2;
      }
    }
  }

  let targetRepMin = repMin;
  let targetRepMax = repMax;
  if (lastSets) {
    const allHitTop = lastSets.every((s) => s.reps >= repMax);
    if (!allHitTop) {
      const bestReps = Math.max(...lastSets.map((s) => s.reps));
      targetRepMax = Math.min(repMax, bestReps + 2);
      targetRepMin = Math.min(targetRepMax, bestReps + 1);
    }
  }

  return {
    kind: "band",
    bandLevel: BAND_LEVELS[levelIdx],
    repMin: targetRepMin,
    repMax: targetRepMax,
    hasHistory: relevant.length > 0,
  };
}

function computeBodyweight(exercise, sessions) {
  const relevant = sessionsWithSets(exercise, sessions);
  const metricKey = exercise.holdBased ? "seconds" : "reps";
  let targetVolume = exercise.targetVolume;
  let stableStreak = 0;
  let lastVolume = null;

  for (const session of relevant) {
    const sets = session.sets[exercise.id];
    const volume = sets.reduce((sum, s) => sum + (Number(s[metricKey]) || 0), 0);
    lastVolume = volume;
    if (volume >= targetVolume) {
      targetVolume = volume + exercise.incrementAmount;
      stableStreak += 1;
    } else {
      stableStreak = 0;
    }
  }

  return {
    kind: "bodyweight",
    metricKey,
    targetVolume,
    lastVolume,
    suggestLoadBump: Boolean(exercise.allowLoadProgression) && stableStreak >= 3,
    hasHistory: relevant.length > 0,
  };
}

function computePilates(exercise, sessions) {
  // Kein Satz-/Wdh.-Tracking: einfach ein YouTube-Video (Bodyweight oder mit leichten
  // Gewichten) abhaken. Wird 3x in Folge mit gleichem oder höherem Gewicht geloggt,
  // steigt der Gewichtsvorschlag um einen festen Schritt.
  const relevant = sessionsWithSets(exercise, sessions);
  let weight = exercise.startWeight;
  let streak = 0;
  let lastEntry = null;

  for (const session of relevant) {
    const entry = session.sets[exercise.id][0];
    if (!entry) continue;
    lastEntry = entry;
    if (entry.loadMode !== "gewicht" || entry.weight == null) continue;

    if (weight == null || entry.weight < weight) {
      weight = entry.weight;
      streak = 1;
    } else {
      streak += 1;
      if (streak >= 3) {
        weight = weight + exercise.loadStep;
        streak = 0;
      }
    }
  }

  return {
    kind: "pilates",
    weight,
    lastLoadMode: lastEntry ? lastEntry.loadMode : null,
    lastDuration: lastEntry ? lastEntry.duration : null,
    hasHistory: relevant.length > 0,
  };
}

function computeCardio(exercise, sessions) {
  const relevant = sessionsWithSets(exercise, sessions);
  let last = null;
  for (const session of relevant) {
    const entry = session.sets[exercise.id][0];
    if (entry) last = entry;
  }
  const base = last || exercise.cardioDefault || { duration: null, pace: null };
  return { kind: "cardio", duration: base.duration, pace: base.pace, hasHistory: relevant.length > 0 };
}

// Aussagekräftige Kennzahl einer Session für einen Übungstyp — dieselbe
// Definition trägt sowohl das Verlaufs-Diagramm (history.js) als auch die
// Rekord-Erkennung unten, damit beide nie auseinanderlaufen.
export function sessionMetric(exercise, sets) {
  if (!sets || !sets.length) return null;
  if (exercise.type === "weighted") return Math.max(...sets.map((s) => s.weight));
  if (exercise.type === "band") return Math.max(...sets.map((s) => s.reps));
  if (exercise.type === "bodyweight") {
    const key = exercise.holdBased ? "seconds" : "reps";
    return sets.reduce((sum, s) => sum + (Number(s[key]) || 0), 0);
  }
  if (exercise.type === "cardio" || exercise.type === "pilates") return sets[0] ? sets[0].duration : null;
  return null;
}

const RECORD_ELIGIBLE_TYPES = ["weighted", "band", "bodyweight"];

// "Kleiner Belohnungsmoment" beim Abschließen einer Einheit: prüft, ob die
// gerade geloggten Sätze einer Übung die bisherige Bestleistung übertreffen.
// Cardio/Pilates bewusst ausgenommen — "länger gelaufen" ist keine
// eindeutige Leistungssteigerung wie mehr Gewicht/Wiederholungen/Volumen,
// das würde sich falsch als "Rekord" anfühlen.
export function checkNewRecord(exercise, previousSessions, newSets) {
  if (!RECORD_ELIGIBLE_TYPES.includes(exercise.type)) return null;
  const newValue = sessionMetric(exercise, newSets);
  if (newValue == null) return null;
  const previousValues = previousSessions
    .map((s) => sessionMetric(exercise, s.sets[exercise.id]))
    .filter((v) => v != null);
  if (previousValues.length === 0) return null;
  const previousBest = Math.max(...previousValues);
  if (newValue > previousBest) return { value: newValue, previousBest };
  return null;
}

function applyDeload(base, exercise) {
  if (base.kind === "weighted") {
    if (base.load == null) return { ...base, deload: true };
    let load = roundToStep(base.load * 0.65, exercise.loadStep);
    if (exercise.cap != null) load = Math.min(load, exercise.cap);
    return { ...base, load, repMin: exercise.repMin, repMax: exercise.repMax, deload: true };
  }
  if (base.kind === "band") {
    const idx = Math.max(0, BAND_LEVELS.indexOf(base.bandLevel) - 1);
    return { ...base, bandLevel: BAND_LEVELS[idx], repMin: exercise.repMin, repMax: exercise.repMax, deload: true };
  }
  if (base.kind === "bodyweight") {
    const targetVolume = Math.max(exercise.incrementAmount, Math.round(base.targetVolume * 0.6));
    return { ...base, targetVolume, suggestLoadBump: false, deload: true };
  }
  if (base.kind === "cardio") {
    const duration = base.duration ? Math.max(5, Math.round(base.duration * 0.7)) : base.duration;
    return { ...base, duration, pace: "locker", deload: true };
  }
  if (base.kind === "pilates") {
    return { ...base, deload: true, deloadHint: "Bodyweight oder sehr leicht, gerne auch kürzeres Video reicht." };
  }
  return base;
}

export function getSuggestion(exercise, sessions, weekInBlock) {
  let base;
  if (exercise.type === "weighted") base = computeWeighted(exercise, sessions);
  else if (exercise.type === "band") base = computeBand(exercise, sessions);
  else if (exercise.type === "bodyweight") base = computeBodyweight(exercise, sessions);
  else if (exercise.type === "pilates") base = computePilates(exercise, sessions);
  else base = computeCardio(exercise, sessions);

  if (isDeloadWeek(weekInBlock)) return applyDeload(base, exercise);
  return base;
}
