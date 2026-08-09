// Lokale Datenschicht auf Basis von localStorage. Kein Backend, kein Sync.
import { seedState, seedNutrition } from "./seed-data.js";

const STORAGE_KEY = "trainingstracker:v1";

// Bereits gespeicherte Geräte behalten ihre Daten aus dem allerersten Start —
// spätere Änderungen an seed-data.js wirken sich sonst NICHT mehr aus, weil load()
// nur bei komplett leerem localStorage neu seeded. migrate() patcht bestehende
// Datenstände inkrementell nach, wenn sich Übungsdefinitionen strukturell ändern.
function migrate(state) {
  let changed = false;

  const nele = state.exercises && state.exercises.nele;
  if (nele) {
    const oldPilatesIds = ["n_hundred", "n_rollup", "n_leg_circles", "n_side_leg_series", "n_plank_pilates", "n_swimming", "n_bridge"];
    const hasOld = nele.some((e) => oldPilatesIds.includes(e.id));
    const hasNew = nele.some((e) => e.id === "n_pilates_oberkoerper");
    if (hasOld || !hasNew) {
      state.exercises.nele = nele.filter((e) => !oldPilatesIds.includes(e.id));
      if (!hasNew) {
        state.exercises.nele.push(
          { id: "n_pilates_unterkoerper", name: "Pilates-Video Unterkörper", type: "pilates", startWeight: null, loadStep: 0.5, safetyNote: null },
          { id: "n_pilates_oberkoerper", name: "Pilates-Video Oberkörper", type: "pilates", startWeight: null, loadStep: 0.5, safetyNote: null },
          { id: "n_pilates_ganzkoerper", name: "Pilates-Video Ganzkörper", type: "pilates", startWeight: null, loadStep: 0.5, safetyNote: null }
        );
      }
      changed = true;
    }
  }

  const days = state.workoutDays && state.workoutDays.nele;
  if (days) {
    const day1 = days.find((d) => d.id === "n_day1");
    if (day1 && day1.exerciseIds.includes("n_hundred")) {
      day1.exerciseIds = ["n_pilates_unterkoerper", "n_pilates_oberkoerper", "n_pilates_ganzkoerper"];
      day1.note = "Passendes YouTube-Video wählen (Unterkörper/Oberkörper/Ganzkörper, ~20-40 Min), durchführen, danach hier abhaken. Bodyweight oder mit ganz leichten Kurzhanteln — Gewicht ist optional.";
      changed = true;
    }
    const day4 = days.find((d) => d.id === "n_day4");
    if (day4 && day4.exerciseIds.includes("n_hundred")) {
      day4.exerciseIds = ["n_pilates_unterkoerper", "n_pilates_oberkoerper", "n_pilates_ganzkoerper", "n_lauf_tempo"];
      day4.note = "Wahlweise Pilates-Video wie Tag 1, oder Lauf mit Tempowechsel — wöchentlich abwechseln oder nach Lust wählen.";
      changed = true;
    }
  }

  // Ernährungsteil kam nach dem ersten Release dazu — Geräte mit älterem
  // Datenstand haben state.nutrition noch gar nicht.
  if (!state.nutrition) {
    state.nutrition = seedNutrition();
    changed = true;
  } else {
    const seeded = seedNutrition();
    if (!Array.isArray(state.nutrition.dishes) || state.nutrition.dishes.length === 0) {
      state.nutrition.dishes = seeded.dishes;
      changed = true;
    }
    if (!state.nutrition.targets) {
      state.nutrition.targets = seeded.targets;
      changed = true;
    }
    if (!state.nutrition.preferences) {
      state.nutrition.preferences = seeded.preferences;
      changed = true;
    }
    if (!state.nutrition.days) {
      state.nutrition.days = {};
      changed = true;
    }
  }

  return changed;
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = seedState();
    save(initial);
    return initial;
  }
  try {
    const state = JSON.parse(raw);
    if (migrate(state)) save(state);
    return state;
  } catch (e) {
    console.error("Konnte gespeicherte Daten nicht lesen, setze zurück.", e);
    const initial = seedState();
    save(initial);
    return initial;
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = load();

export const db = {
  raw() {
    return state;
  },

  replaceAll(newState) {
    state = newState;
    save(state);
  },

  resetToSeed() {
    state = seedState();
    save(state);
  },

  getCurrentUserId() {
    return state.currentUserId || null;
  },

  setCurrentUserId(id) {
    state.currentUserId = id;
    save(state);
  },

  getUser(id) {
    return state.users.find((u) => u.id === id) || null;
  },

  getUsers() {
    return state.users;
  },

  getWorkoutDays(userId) {
    return state.workoutDays[userId] || [];
  },

  getExercises(userId) {
    return state.exercises[userId] || [];
  },

  getExercise(userId, exerciseId) {
    return (state.exercises[userId] || []).find((e) => e.id === exerciseId) || null;
  },

  updateExercise(userId, exerciseId, patch) {
    const ex = this.getExercise(userId, exerciseId);
    if (!ex) return;
    Object.assign(ex, patch);
    save(state);
  },

  getSessions(userId) {
    return (state.sessionLogs[userId] || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  },

  getSessionsForExercise(userId, exerciseId) {
    return this.getSessions(userId).filter((s) => s.sets && s.sets[exerciseId]);
  },

  addSession(userId, session) {
    if (!state.sessionLogs[userId]) state.sessionLogs[userId] = [];
    state.sessionLogs[userId].push(session);
    save(state);
  },

  deleteSession(userId, sessionId) {
    state.sessionLogs[userId] = (state.sessionLogs[userId] || []).filter((s) => s.id !== sessionId);
    save(state);
  },

  getBlockStartDate(userId) {
    return state.blockStart[userId];
  },

  setBlockStartDate(userId, isoDate) {
    state.blockStart[userId] = isoDate;
    save(state);
  },

  exportJSON() {
    return JSON.stringify(state, null, 2);
  },

  importJSON(json) {
    const parsed = JSON.parse(json);
    if (!parsed.users || !parsed.exercises) throw new Error("Ungültiges Datenformat");
    state = parsed;
    save(state);
  },

  // --- Ernährung (gemeinsam, nicht pro Profil siloed) ---

  getNutritionState() {
    return state.nutrition;
  },

  getDishes() {
    return state.nutrition.dishes;
  },

  getDish(dishId) {
    return state.nutrition.dishes.find((d) => d.id === dishId) || null;
  },

  getNutritionTargets(userId) {
    return state.nutrition.targets[userId] || null;
  },

  getPreferences(userId) {
    return state.nutrition.preferences[userId] || { excludeTags: [] };
  },

  setPreferences(userId, patch) {
    state.nutrition.preferences[userId] = { ...this.getPreferences(userId), ...patch };
    save(state);
  },

  getDayPlanRaw(dateISO) {
    return state.nutrition.days[dateISO] || null;
  },

  saveNutritionState() {
    save(state);
  },
};

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}
