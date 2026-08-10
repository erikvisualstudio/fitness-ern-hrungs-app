// Mahlzeitenplanung: reine Logik, unabhängig von der UI. Mutiert das übergebene
// nutrition-Objekt (state.nutrition aus db.js) direkt — Aufrufer speichert danach
// über db.saveNutritionState().
//
// Grundprinzip: "vorausgeplant, nicht frei durchsuchbar" — pro Tag/Mahlzeit/Party
// wird EINMAL ein 3er-Vorschlag deterministisch generiert und in state.nutrition.days
// persistiert. Ein Reload am selben Tag zeigt denselben Vorschlag; nur ein expliziter
// Reroll erzeugt einen neuen (via hochgezähltem rerollSeed pro Party).
//
// Party-Konzept: "shared" für Modus "gemeinsam" (eine Wahl für beide), oder die
// jeweilige userId ("erik"/"nele") für Modus "getrennt" (unabhängige Wahl pro Person).
// Das ist rein für die PLANUNG (welche 3 Optionen, welche Wahl gilt "offiziell").
//
// "Tatsächlich gegessen" (actual) ist davon unabhängig IMMER pro echter Person
// (erik/nele) — auch bei einer gemeinsamen Wahl kann jede Person individuell
// abweichen (weniger Haferflocken geschafft, Zutat ersetzt, komplett anderes
// Gericht). actual[personId] überschreibt für den Tag die aus dem Plan
// berechneten Werte; bleibt es leer, gilt einfach die Portion aus dem Plan.

export const MEAL_TYPES = ["breakfast", "lunch", "dinner"];
export const MEAL_LABELS = { breakfast: "Frühstück", lunch: "Mittag", dinner: "Abend" };
export const CATEGORIES = ["deftig", "leicht", "schnell"];
export const CATEGORY_LABELS = { deftig: "Deftig", leicht: "Leicht", schnell: "Schnell" };
const DEFAULT_MODE = { breakfast: "getrennt", lunch: "gemeinsam", dinner: "gemeinsam" };
const RECENCY_LOOKBACK_DAYS = 21;

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

function fmtAmt(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

export function partiesForMode(mode) {
  return mode === "gemeinsam" ? ["shared"] : ["erik", "nele"];
}

function getExcludeTagsForParty(nutrition, party) {
  if (party === "shared") {
    const erik = nutrition.preferences.erik ? nutrition.preferences.erik.excludeTags : [];
    const nele = nutrition.preferences.nele ? nutrition.preferences.nele.excludeTags : [];
    return Array.from(new Set([...erik, ...nele]));
  }
  const prefs = nutrition.preferences[party];
  return prefs ? prefs.excludeTags : [];
}

function getRecentDishIds(nutrition, party, mealType, beforeDateISO) {
  const dates = Object.keys(nutrition.days)
    .filter((d) => d < beforeDateISO)
    .sort()
    .reverse()
    .slice(0, RECENCY_LOOKBACK_DAYS);

  const result = [];
  for (const date of dates) {
    const slot = nutrition.days[date] && nutrition.days[date][mealType];
    if (!slot || !slot.choice) continue;
    if (party === "shared") {
      if (slot.choice.erik) result.push(slot.choice.erik);
      if (slot.choice.nele) result.push(slot.choice.nele);
    } else if (slot.choice[party]) {
      result.push(slot.choice[party]);
    }
  }
  return result;
}

function pickProposalIds(dishes, mealType, excludeTags, recentIds, seedStr) {
  const pool = dishes.filter((d) => d.mealType === mealType && !d.excludeTags.some((t) => excludeTags.includes(t)));
  if (pool.length === 0) return [];

  const rand = mulberry32(hashStringToSeed(seedStr));
  const withRandom = pool.map((d) => ({ d, r: rand() }));

  function recencyPenalty(dishId) {
    const idx = recentIds.indexOf(dishId);
    return idx === -1 ? 0 : recentIds.length - idx;
  }

  withRandom.sort((a, b) => {
    const pa = recencyPenalty(a.d.id);
    const pb = recencyPenalty(b.d.id);
    if (pa !== pb) return pa - pb;
    return a.r - b.r;
  });
  const ordered = withRandom.map((x) => x.d);

  const used = new Set();
  const result = [];
  CATEGORIES.forEach((cat) => {
    const pick = ordered.find((d) => d.categories.includes(cat) && !used.has(d.id));
    if (pick) {
      result.push(pick);
      used.add(pick.id);
    }
  });
  for (const d of ordered) {
    if (result.length >= 3) break;
    if (!used.has(d.id)) {
      result.push(d);
      used.add(d.id);
    }
  }
  return result.slice(0, 3).map((d) => d.id);
}

function computeProposal(nutrition, dateISO, mealType, party, rerollSeed) {
  const excludeTags = getExcludeTagsForParty(nutrition, party);
  const recentIds = getRecentDishIds(nutrition, party, mealType, dateISO);
  const seedStr = `${dateISO}|${mealType}|${party}|${rerollSeed || 0}`;
  return pickProposalIds(nutrition.dishes, mealType, excludeTags, recentIds, seedStr);
}

function ensureProposals(nutrition, dateISO, mealType) {
  const slot = nutrition.days[dateISO][mealType];
  const parties = partiesForMode(slot.mode);
  parties.forEach((party) => {
    if (!slot.proposals[party] || !slot.proposals[party].length) {
      slot.rerollSeed[party] = slot.rerollSeed[party] || 0;
      slot.proposals[party] = computeProposal(nutrition, dateISO, mealType, party, slot.rerollSeed[party]);
    }
  });
}

export function ensureDayPlan(nutrition, dateISO) {
  if (!nutrition.days[dateISO]) nutrition.days[dateISO] = {};
  const day = nutrition.days[dateISO];
  MEAL_TYPES.forEach((mealType) => {
    if (!day[mealType]) {
      day[mealType] = {
        mode: DEFAULT_MODE[mealType],
        rerollSeed: {},
        proposals: {},
        choice: { erik: null, nele: null },
        actual: { erik: null, nele: null },
      };
    }
    if (!day[mealType].actual) day[mealType].actual = { erik: null, nele: null };
    if (!day[mealType].choice) day[mealType].choice = { erik: null, nele: null };
    ensureProposals(nutrition, dateISO, mealType);
  });
  return day;
}

// Modus-Wechsel ändert NUR, wie viele Vorschlags-Spalten angezeigt werden
// (eine gemeinsame vs. zwei getrennte) — wer welches Gericht tatsächlich
// gewählt hat (slot.choice, immer pro Person) bleibt dabei erhalten. Nur die
// Vorschlagslisten für den neuen Modus werden neu generiert, falls sie noch
// nicht existieren.
export function setSlotMode(nutrition, dateISO, mealType, mode) {
  ensureDayPlan(nutrition, dateISO);
  const slot = nutrition.days[dateISO][mealType];
  if (slot.mode === mode) return;
  slot.mode = mode;
  ensureProposals(nutrition, dateISO, mealType);
}

export function rerollSlot(nutrition, dateISO, mealType, party) {
  const slot = nutrition.days[dateISO][mealType];
  slot.rerollSeed[party] = (slot.rerollSeed[party] || 0) + 1;
  slot.proposals[party] = computeProposal(nutrition, dateISO, mealType, party, slot.rerollSeed[party]);
  if (party === "shared") {
    slot.choice.erik = null;
    slot.choice.nele = null;
  } else {
    slot.choice[party] = null;
  }
}

// party ist "shared" (Modus gemeinsam, setzt beide Personen gleichzeitig auf
// dasselbe Gericht) oder eine konkrete Person (Modus getrennt). slot.choice
// selbst ist immer pro echter Person gespeichert, damit ein Moduswechsel
// nichts verwirft (siehe setSlotMode).
export function setChoice(nutrition, dateISO, mealType, party, dishId) {
  const slot = nutrition.days[dateISO][mealType];
  if (party === "shared") {
    const alreadySelected = slot.choice.erik === dishId && slot.choice.nele === dishId;
    slot.choice.erik = alreadySelected ? null : dishId;
    slot.choice.nele = alreadySelected ? null : dishId;
  } else {
    slot.choice[party] = slot.choice[party] === dishId ? null : dishId;
  }
}

export function isSelected(slot, party, dishId) {
  if (party === "shared") return slot.choice.erik === dishId && slot.choice.nele === dishId;
  return slot.choice[party] === dishId;
}

// --- Zutaten / Makro-Berechnung ---

export function computeMacros(ingredientList, ingredientsDB) {
  let kcal = 0;
  let protein = 0;
  ingredientList.forEach(({ ingredientId, amount }) => {
    const ing = ingredientsDB.find((x) => x.id === ingredientId);
    if (!ing) return;
    kcal += (ing.kcalPer100 * amount) / 100;
    protein += (ing.proteinPer100 * amount) / 100;
  });
  return { kcal: Math.round(kcal), protein: Math.round(protein * 10) / 10 };
}

export function formatIngredientList(list, ingredientsDB, signed = false) {
  return list
    .filter((i) => i.amount !== 0)
    .map(({ ingredientId, amount }) => {
      const ing = ingredientsDB.find((x) => x.id === ingredientId);
      if (!ing) return null;
      const sign = signed ? (amount >= 0 ? "+" : "−") : "";
      const amt = signed ? Math.abs(amount) : amount;
      return `${sign}${ing.name} ${fmtAmt(amt)}${ing.unit}`;
    })
    .filter(Boolean)
    .join(", ");
}

export function mergeIngredients(baseList, deltaList) {
  const map = new Map(baseList.map((i) => [i.ingredientId, i.amount]));
  deltaList.forEach(({ ingredientId, amount }) => {
    map.set(ingredientId, (map.get(ingredientId) || 0) + amount);
  });
  const result = [];
  map.forEach((amount, ingredientId) => {
    if (amount > 0) result.push({ ingredientId, amount });
  });
  return result;
}

export function diffIngredientLists(newList, baseList) {
  const baseMap = new Map(baseList.map((i) => [i.ingredientId, i.amount]));
  const newMap = new Map(newList.map((i) => [i.ingredientId, i.amount]));
  const ids = new Set([...baseMap.keys(), ...newMap.keys()]);
  const result = [];
  ids.forEach((id) => {
    const delta = (newMap.get(id) || 0) - (baseMap.get(id) || 0);
    if (delta !== 0) result.push({ ingredientId: id, amount: delta });
  });
  return result;
}

// Voll aufgelöste Zutatenliste für die Portion einer Person bei einem Gericht
// (Basis, oder Basis + Zusatz-Delta falls für diese Person ein extras-Eintrag existiert).
export function resolvePersonIngredients(dish, userId) {
  const extra = dish.extras && dish.extras[userId];
  if (extra) return mergeIngredients(dish.base.ingredients, extra.addIngredients);
  return dish.base.ingredients.slice();
}

export function portionFor(dish, userId, ingredientsDB) {
  const fullList = resolvePersonIngredients(dish, userId);
  const macros = computeMacros(fullList, ingredientsDB);
  const description = formatIngredientList(dish.base.ingredients, ingredientsDB);
  const extra = dish.extras && dish.extras[userId];
  const addDescription = extra ? formatIngredientList(extra.addIngredients, ingredientsDB, true) : null;
  return { kcal: macros.kcal, protein: macros.protein, description, addDescription, ingredients: fullList };
}

// Schreibt eine dauerhafte Änderung ins Rezept zurück: bei einer Person mit
// eigenem extras-Eintrag (z. B. Erik) wird nur das Delta zur Basis aktualisiert
// (die Basis-Portion bleibt für alle anderen Personen unverändert), sonst wird
// direkt die Basis-Portion überschrieben (wirkt sich dann auf alle Personen aus,
// die keine eigene extras-Portion haben).
export function applyPermanentEdit(nutrition, dishId, userId, newIngredients) {
  const dish = nutrition.dishes.find((d) => d.id === dishId);
  if (!dish) return;
  if (dish.extras && dish.extras[userId]) {
    dish.extras[userId].addIngredients = diffIngredientLists(newIngredients, dish.base.ingredients);
  } else {
    dish.base.ingredients = newIngredients;
  }
}

// --- "Tatsächlich gegessen" pro Person (unabhängig vom Modus) ---

export function getResolvedChoice(nutrition, dateISO, mealType, personId) {
  const slot = nutrition.days[dateISO] && nutrition.days[dateISO][mealType];
  if (!slot || !slot.choice) return null;
  return slot.choice[personId] || null;
}

// Setzt die Wahl einer Person direkt, ohne Toggle-Semantik (z. B. nachdem ein
// neuer Eintrag als Rezept gespeichert wurde und sofort als heutige Wahl gilt).
export function assignChoice(nutrition, dateISO, mealType, personId, dishId) {
  const slot = nutrition.days[dateISO][mealType];
  slot.choice[personId] = dishId;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c]))
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Legt aus einem freien Eintrag ein dauerhaftes, wiederverwendbares Gericht im
// Pool an (statt nur einer einmaligen Tages-Notiz). Keine Erik-Zusatz-Portion
// beim Anlegen — kann später ganz normal über "Anpassen → Dauerhaft ändern"
// ergänzt werden.
export function addNewDish(nutrition, mealType, name, categories, ingredients) {
  const id = `custom_${slugify(name)}_${Math.random().toString(36).slice(2, 6)}`;
  const dish = { id, mealType, name, categories, excludeTags: [], base: { ingredients }, extras: {} };
  nutrition.dishes.push(dish);
  return id;
}

export function setOverride(nutrition, dateISO, mealType, personId, ingredients, note) {
  const slot = nutrition.days[dateISO][mealType];
  if (!slot.actual) slot.actual = {};
  slot.actual[personId] = { source: "override", name: null, ingredients, note: note || null };
}

export function setCustomEntry(nutrition, dateISO, mealType, personId, name, ingredients, note) {
  const slot = nutrition.days[dateISO][mealType];
  if (!slot.actual) slot.actual = {};
  slot.actual[personId] = { source: "custom", name, ingredients, note: note || null };
}

export function clearActual(nutrition, dateISO, mealType, personId) {
  const slot = nutrition.days[dateISO][mealType];
  if (slot.actual) slot.actual[personId] = null;
}

// Liefert {kcal, protein, name, source, note, ingredients} für das, was eine
// Person bei dieser Mahlzeit tatsächlich isst — override/custom falls gesetzt,
// sonst aus dem Plan berechnet. null, wenn noch gar nichts gewählt wurde.
export function getPersonMacros(nutrition, ingredientsDB, dateISO, mealType, personId) {
  const slot = nutrition.days[dateISO] && nutrition.days[dateISO][mealType];
  if (!slot) return null;

  const actual = slot.actual && slot.actual[personId];
  if (actual) {
    const macros = computeMacros(actual.ingredients, ingredientsDB);
    return { kcal: macros.kcal, protein: macros.protein, name: actual.name, source: actual.source, note: actual.note, ingredients: actual.ingredients };
  }

  const dishId = getResolvedChoice(nutrition, dateISO, mealType, personId);
  if (!dishId) return null;
  const dish = nutrition.dishes.find((d) => d.id === dishId);
  if (!dish) return null;
  const portion = portionFor(dish, personId, ingredientsDB);
  return { kcal: portion.kcal, protein: portion.protein, name: dish.name, source: "plan", note: null, ingredients: portion.ingredients };
}

export function sumDailyActual(nutrition, ingredientsDB, dateISO, personId) {
  let kcal = 0;
  let protein = 0;
  MEAL_TYPES.forEach((mealType) => {
    const m = getPersonMacros(nutrition, ingredientsDB, dateISO, mealType, personId);
    if (m) {
      kcal += m.kcal;
      protein += m.protein;
    }
  });
  return { kcal: Math.round(kcal), protein: Math.round(protein * 10) / 10 };
}
