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

  // Zwischenspeicherte Trainingseinheiten kamen später dazu.
  if (!state.drafts) {
    state.drafts = { erik: {}, nele: {} };
    changed = true;
  }

  // Ernährungsteil kam nach dem ersten Release dazu — Geräte mit älterem
  // Datenstand haben state.nutrition noch gar nicht.
  if (!state.nutrition) {
    state.nutrition = seedNutrition();
    changed = true;
  } else {
    const seeded = seedNutrition();
    // Alte Gerichte-Struktur (fixe base.kcal/protein + Textbeschreibung) durch die
    // Zutaten-basierte Struktur ersetzen. Noch niemand konnte Gerichte im alten
    // Format bearbeiten (Feature gab es nicht) — ein Wholesale-Ersatz ist also
    // verlustfrei, nur bereits geloggte Tageswahlen (choice: dishId) bleiben über
    // die unveränderten IDs (f1..f6/m1..m6/a1..a6) gültig.
    const hasStructuredDishes =
      Array.isArray(state.nutrition.dishes) &&
      state.nutrition.dishes.length > 0 &&
      state.nutrition.dishes.every((d) => d.base && Array.isArray(d.base.ingredients));
    if (!hasStructuredDishes) {
      state.nutrition.dishes = seeded.dishes;
      changed = true;
    } else {
      // Der Gerichte-Pool wächst mit der Zeit (siehe seed-data.js) — fehlende
      // Seed-Gerichte werden per ID nachgetragen, bereits existierende (ggf.
      // vom Nutzer dauerhaft angepasste) Gerichte bleiben unangetastet.
      const existingDishIds = new Set(state.nutrition.dishes.map((d) => d.id));
      const missingDishes = seeded.dishes.filter((d) => !existingDishIds.has(d.id));
      if (missingDishes.length > 0) {
        state.nutrition.dishes.push(...missingDishes);
        changed = true;
      }

      // Erik mag keine Kuhmilch-Trinkmilch/-Joghurt/-Quark (Käse ist okay) —
      // f1/f3/f4/f6/f24 wurden deshalb auf Sojajoghurt umgestellt. Geräte, die
      // diese Gerichte schon unter derselben ID gespeichert hatten, bekommen
      // sonst nie die neue Zutatenliste (Merge-per-ID ergänzt nur Fehlendes).
      // Hier gezielt nachziehen, aber nur falls noch die alte Milch-Zutat drin
      // ist — eine eigene dauerhafte Anpassung des Nutzers bleibt unangetastet.
      const dairyToReplace = ["skyr", "magerquark", "joghurt_natur", "joghurt_griechisch", "vollmilch", "milch_fettarm", "buttermilch", "kefir", "kondensmilch", "ziegenmilch"];
      const dishesToResync = ["f1", "f3", "f4", "f6", "f24"];
      dishesToResync.forEach((id) => {
        const current = state.nutrition.dishes.find((d) => d.id === id);
        const fresh = seeded.dishes.find((d) => d.id === id);
        if (!current || !fresh) return;
        const stillHasDairy =
          current.base.ingredients.some((i) => dairyToReplace.includes(i.ingredientId)) ||
          (current.extras && current.extras.erik && current.extras.erik.addIngredients.some((i) => dairyToReplace.includes(i.ingredientId)));
        if (stillHasDairy) {
          current.name = fresh.name;
          current.vegan = fresh.vegan;
          current.base = fresh.base;
          current.extras = fresh.extras;
          changed = true;
        }
      });
    }
    // Zutaten-Datenbank wächst mit der Zeit (siehe seed-data.js) — fehlende
    // Seed-Zutaten werden per ID nachgetragen statt die Liste zu ersetzen,
    // damit selbst angelegte Zutaten (z. B. über "+ Neue Zutat") erhalten bleiben.
    if (!Array.isArray(state.nutrition.ingredients)) {
      state.nutrition.ingredients = seeded.ingredients;
      changed = true;
    } else {
      const existingIds = new Set(state.nutrition.ingredients.map((i) => i.id));
      const missing = seeded.ingredients.filter((i) => !existingIds.has(i.id));
      if (missing.length > 0) {
        state.nutrition.ingredients.push(...missing);
        changed = true;
      }
    }
    if (!state.nutrition.targets) {
      state.nutrition.targets = seeded.targets;
      changed = true;
    }
    if (!state.nutrition.preferences) {
      state.nutrition.preferences = seeded.preferences;
      changed = true;
    }
    if (state.nutrition.updatedAt === undefined) {
      state.nutrition.updatedAt = 0;
      changed = true;
    }
    if (!state.nutrition.pins) {
      state.nutrition.pins = { erik: {}, nele: {} };
      changed = true;
    }
    if (!state.nutrition.shoppingList) {
      state.nutrition.shoppingList = { lunchDishIds: [], dinnerDishIds: [], checked: {} };
      changed = true;
    }
    if (!state.nutrition.days) {
      state.nutrition.days = {};
      changed = true;
    } else {
      // Ältere Tagespläne haben noch kein "actual"-Feld pro Slot, und "choice"
      // war früher je nach Modus mal unter "shared", mal unter "erik"/"nele"
      // abgelegt — das führte dazu, dass ein Moduswechsel (gemeinsam↔getrennt)
      // die bereits getroffene Wahl gelöscht hat. choice ist jetzt IMMER pro
      // Person gespeichert (siehe nutrition.js), unabhängig vom Modus.
      Object.values(state.nutrition.days).forEach((day) => {
        Object.values(day).forEach((slot) => {
          if (!slot) return;
          if (!slot.actual) {
            slot.actual = { erik: null, nele: null };
            changed = true;
          }
          if (!slot.choice) slot.choice = {};
          if (Object.prototype.hasOwnProperty.call(slot.choice, "shared")) {
            const sharedDish = slot.choice.shared;
            if (!slot.choice.erik) slot.choice.erik = sharedDish;
            if (!slot.choice.nele) slot.choice.nele = sharedDish;
            delete slot.choice.shared;
            changed = true;
          }
          if (slot.choice.erik === undefined) {
            slot.choice.erik = null;
            changed = true;
          }
          if (slot.choice.nele === undefined) {
            slot.choice.nele = null;
            changed = true;
          }
        });
      });
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

// Cloud-Sync (js/sync.js) hängt sich hier ein, um lokale Ernährungs-Änderungen zu
// pushen, ohne dass db.js selbst etwas von Firebase wissen muss.
let nutritionSaveListeners = [];
export function onNutritionSaved(cb) {
  nutritionSaveListeners.push(cb);
}

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

  // --- Zwischengespeicherte, noch nicht abgeschlossene Trainingseinheiten ---
  // Rein lokal (kein Sync) — schützt gegen Datenverlust, wenn die App
  // zwischen dem Eintragen einzelner Übungen beendet/vom System aus dem
  // Hintergrund geräumt wird, bevor die ganze Einheit fertig ist.

  getDraft(userId, dayId) {
    return (state.drafts[userId] && state.drafts[userId][dayId]) || null;
  },

  // entries = geparste Sätze einer Übung. Legt die Übung als "zwischen-
  // gespeichert" (locked) fest — Werte bleiben aber erhalten, falls über
  // unlockDraftExercise() nochmal bearbeitet wird.
  saveDraftExercise(userId, dayId, date, weekInBlock, exerciseId, entries) {
    if (!state.drafts[userId]) state.drafts[userId] = {};
    if (!state.drafts[userId][dayId]) {
      state.drafts[userId][dayId] = { date, weekInBlock, sets: {}, locked: {} };
    }
    const draft = state.drafts[userId][dayId];
    draft.date = date;
    draft.weekInBlock = weekInBlock;
    draft.sets[exerciseId] = entries;
    draft.locked[exerciseId] = true;
    save(state);
  },

  // Hebt die Sperre wieder auf, ohne die zuletzt gespeicherten Werte zu
  // löschen — sie bleiben als Vorbelegung stehen, bis erneut zwischen-
  // gespeichert wird.
  unlockDraftExercise(userId, dayId, exerciseId) {
    const draft = state.drafts[userId] && state.drafts[userId][dayId];
    if (!draft) return;
    if (draft.locked) draft.locked[exerciseId] = false;
    save(state);
  },

  // Wird aufgerufen, sobald die ganze Einheit final in den Trainingsverlauf
  // übertragen wurde — der Entwurf wird dann nicht mehr gebraucht.
  clearDraft(userId, dayId) {
    if (state.drafts[userId] && state.drafts[userId][dayId]) {
      delete state.drafts[userId][dayId];
      save(state);
    }
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

  getIngredients() {
    return state.nutrition.ingredients;
  },

  getIngredient(ingredientId) {
    return state.nutrition.ingredients.find((i) => i.id === ingredientId) || null;
  },

  // Legt eine neue Zutat an (z. B. beim freien Eintrag "Sojahack"), falls sie
  // noch nicht existiert — danach in der gemeinsamen Datenbank für alle Gerichte
  // und weitere freie Einträge wiederverwendbar.
  addIngredient({ id, name, unit, kcalPer100, proteinPer100 }) {
    if (this.getIngredient(id)) return;
    state.nutrition.ingredients.push({ id, name, unit, kcalPer100, proteinPer100 });
    save(state);
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
    state.nutrition.updatedAt = Date.now();
    save(state);
    nutritionSaveListeners.forEach((cb) => cb(state.nutrition));
  },

  // Rein lokales Speichern OHNE updatedAt-Bump und OHNE Cloud-Push — für
  // Fälle, in denen sich nur ein lokal berechneter Cache-Wert ändert (z. B.
  // frisch generierte Tagesvorschläge beim Aufruf der Seite), aber keine
  // echte Nutzer-Aktion stattfand. Wichtig, damit bloßes Öffnen der
  // Ernährungsseite auf einem Gerät nicht den Sync-Zeitstempel hochsetzt und
  // dadurch die echten Auswahlen des anderen Geräts beim nächsten Abgleich
  // überschreibt, obwohl gar nichts geändert wurde.
  persistNutritionCache() {
    save(state);
  },

  // Übernimmt einen Ernährungs-Datenstand von einem anderen Gerät (Cloud-Sync).
  // Bewusst OHNE nutritionSaveListeners-Aufruf, sonst würde der gerade erst
  // empfangene Stand sofort wieder zurück in die Cloud gepusht (Endlosschleife).
  applyRemoteNutrition(remoteNutrition) {
    state.nutrition = remoteNutrition;
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
