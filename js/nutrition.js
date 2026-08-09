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
    if (!slot) continue;
    if (slot.mode === "gemeinsam") {
      if (slot.choice.shared) result.push(slot.choice.shared);
    } else if (party === "shared") {
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
        choice: {},
      };
    }
    ensureProposals(nutrition, dateISO, mealType);
  });
  return day;
}

export function setSlotMode(nutrition, dateISO, mealType, mode) {
  ensureDayPlan(nutrition, dateISO);
  const slot = nutrition.days[dateISO][mealType];
  if (slot.mode === mode) return;
  slot.mode = mode;
  slot.rerollSeed = {};
  slot.proposals = {};
  slot.choice = {};
  ensureProposals(nutrition, dateISO, mealType);
}

export function rerollSlot(nutrition, dateISO, mealType, party) {
  const slot = nutrition.days[dateISO][mealType];
  slot.rerollSeed[party] = (slot.rerollSeed[party] || 0) + 1;
  slot.proposals[party] = computeProposal(nutrition, dateISO, mealType, party, slot.rerollSeed[party]);
  slot.choice[party] = null;
}

export function setChoice(nutrition, dateISO, mealType, party, dishId) {
  const slot = nutrition.days[dateISO][mealType];
  slot.choice[party] = slot.choice[party] === dishId ? null : dishId;
}

// Liefert {kcal, protein, description} für die Portion einer Person bei einem
// Gericht — Basis-Portion für Nele (bzw. jede Person ohne eigenen extras-Eintrag),
// sonst die Gesamt-Portion aus extras[userId].
export function portionFor(dish, userId) {
  const extra = dish.extras && dish.extras[userId];
  if (extra) {
    return { kcal: extra.totalKcal, protein: extra.totalProtein, description: dish.base.description, addDescription: extra.addDescription };
  }
  return { kcal: dish.base.kcal, protein: dish.base.protein, description: dish.base.description, addDescription: null };
}
