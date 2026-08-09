// Lokale Datenschicht auf Basis von localStorage. Kein Backend, kein Sync.
import { seedState } from "./seed-data.js";

const STORAGE_KEY = "trainingstracker:v1";

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = seedState();
    save(initial);
    return initial;
  }
  try {
    return JSON.parse(raw);
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
