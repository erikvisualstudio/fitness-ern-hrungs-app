import { db } from "../db.js";
import {
  SHOPPING_MEAL_TYPES,
  getShoppingList,
  toggleShoppingDish,
  toggleShoppingChecked,
  resetShoppingWeek,
  computeShoppingIngredients,
  fmtAmt,
} from "../nutrition.js";
import { escapeHtml } from "../util.js";

const MEAL_LABEL = { lunch: "Mittagsgerichte", dinner: "Abendgerichte" };

// Eigener, lokaler Suchtext pro Mahlzeit-Typ (nicht Teil des gespeicherten
// Zustands — nur UI-Filter für die Gerichte-Auswahl unten).
let weekSearch = { lunch: "", dinner: "" };

export function mount(root, ctx) {
  render(root, ctx);
}

function normalizeSearch(str) {
  return str.toLowerCase().replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] || c));
}

function render(root, ctx) {
  const nutritionState = db.getNutritionState();
  const ingredientsDB = db.getIngredients();
  const list = getShoppingList(nutritionState);

  root.innerHTML = `
    <h1>Einkaufsliste</h1>
    <p>Vor dem Wocheneinkauf: Mittag- und Abendgerichte für die kommende Woche wählen — daraus wird automatisch die Zutatenliste berechnet.</p>
    <p class="meta" style="margin-top:-8px;">📌 Gewählte Gerichte werden automatisch für Erik &amp; Nele fixiert — sie tauchen dadurch in der Ernährung als Tagesvorschlag auf, ohne dass ihr sie extra suchen müsst. Beim Abwählen hier wird das genauso automatisch wieder aufgehoben.</p>

    ${SHOPPING_MEAL_TYPES.map((mealType) => mealPickerShellHtml(mealType, list)).join("")}

    <div id="shopping-result"></div>
  `;

  SHOPPING_MEAL_TYPES.forEach((mealType) => {
    const listEl = root.querySelector(`[data-week-list="${mealType}"]`);
    renderWeekList(listEl, mealType, nutritionState, list);
  });

  root.querySelector("#shopping-result").appendChild(buildShoppingResult(nutritionState, ingredientsDB, list));

  wireEvents(root, ctx, nutritionState, ingredientsDB);
}

function mealPickerShellHtml(mealType, list) {
  const key = mealType === "lunch" ? "lunchDishIds" : "dinnerDishIds";
  return `
    <div class="card" style="margin-bottom:14px;">
      <div class="row-between" style="margin-bottom:8px;">
        <div class="section-title" style="margin:0;">${MEAL_LABEL[mealType]} für die Woche</div>
        <span class="meta">${list[key].length} gewählt</span>
      </div>
      <input type="text" class="dish-search-input" data-week-search="${mealType}" placeholder="🔍 Gericht suchen…" />
      <div class="week-dish-list" data-week-list="${mealType}"></div>
    </div>
  `;
}

function renderWeekList(listEl, mealType, nutritionState, list) {
  if (!listEl) return;
  const key = mealType === "lunch" ? "lunchDishIds" : "dinnerDishIds";
  const q = normalizeSearch(weekSearch[mealType]);
  const dishes = nutritionState.dishes
    .filter((d) => d.mealType === mealType)
    .filter((d) => !q || normalizeSearch(d.name).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  listEl.innerHTML = dishes.length
    ? dishes
        .map(
          (d) => `<label class="week-dish-row">
            <input type="checkbox" data-week-toggle="${mealType}" data-dish-id="${d.id}" ${list[key].includes(d.id) ? "checked" : ""} />
            <span>${escapeHtml(d.name)}</span>
          </label>`
        )
        .join("")
    : `<p class="meta">Keine Gerichte gefunden.</p>`;
}

function buildShoppingResult(nutritionState, ingredientsDB, list) {
  const wrap = document.createElement("div");
  wrap.className = "card";

  const totalDishes = list.lunchDishIds.length + list.dinnerDishIds.length;
  if (totalDishes === 0) {
    wrap.innerHTML = `
      <div class="section-title" style="margin-top:0;">Einkaufsliste</div>
      <p class="meta">Noch keine Gerichte für die Woche gewählt.</p>
    `;
    return wrap;
  }

  const combined = computeShoppingIngredients(nutritionState);
  const byCategory = new Map();
  combined.forEach(({ ingredientId, amount }) => {
    const ing = ingredientsDB.find((i) => i.id === ingredientId);
    if (!ing) return;
    const cat = ing.category || "Sonstiges";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push({ ing, amount });
  });
  const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b, "de"));
  const checkedCount = combined.filter(({ ingredientId }) => list.checked[ingredientId]).length;

  let html = `
    <div class="row-between" style="margin-bottom:2px;">
      <div class="section-title" style="margin:0;">Einkaufsliste</div>
      <button class="link-btn" style="color:var(--danger);" data-reset-week>Woche zurücksetzen</button>
    </div>
    <p class="meta" style="margin-bottom:10px;">${checkedCount} / ${combined.length} erledigt</p>
  `;

  categories.forEach((cat) => {
    const items = byCategory.get(cat).sort((a, b) => a.ing.name.localeCompare(b.ing.name, "de"));
    const unchecked = items.filter(({ ing }) => !list.checked[ing.id]);
    const checkedItems = items.filter(({ ing }) => list.checked[ing.id]);
    const ordered = [...unchecked, ...checkedItems];
    html += `
      <div class="shopping-category">
        <div class="shopping-category-title">${escapeHtml(cat)}</div>
        ${ordered
          .map(
            ({ ing, amount }) => `
          <label class="shopping-item${list.checked[ing.id] ? " checked" : ""}">
            <input type="checkbox" data-shopping-check="${ing.id}" ${list.checked[ing.id] ? "checked" : ""} />
            <span class="shopping-item-name">${escapeHtml(ing.name)}</span>
            <span class="shopping-item-amount">${fmtAmt(amount)}${escapeHtml(ing.unit)}</span>
          </label>
        `
          )
          .join("")}
      </div>
    `;
  });

  wrap.innerHTML = html;
  return wrap;
}

function wireEvents(root, ctx, nutritionState, ingredientsDB) {
  SHOPPING_MEAL_TYPES.forEach((mealType) => {
    const input = root.querySelector(`[data-week-search="${mealType}"]`);
    const listEl = root.querySelector(`[data-week-list="${mealType}"]`);
    if (!input || !listEl) return;

    function bindCheckboxes() {
      listEl.querySelectorAll("[data-week-toggle]").forEach((cb) => {
        cb.addEventListener("change", () => {
          toggleShoppingDish(nutritionState, cb.dataset.weekToggle, cb.dataset.dishId);
          db.saveNutritionState();
          render(root, ctx);
        });
      });
    }
    bindCheckboxes();

    input.addEventListener("input", () => {
      weekSearch[mealType] = input.value;
      renderWeekList(listEl, mealType, nutritionState, getShoppingList(nutritionState));
      bindCheckboxes();
    });
  });

  root.querySelectorAll("[data-shopping-check]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      toggleShoppingChecked(nutritionState, checkbox.dataset.shoppingCheck);
      db.saveNutritionState();
      render(root, ctx);
    });
  });

  const resetBtn = root.querySelector("[data-reset-week]");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!confirm("Woche zurücksetzen? Das entfernt die gewählten Gerichte und den Fortschritt der Einkaufsliste.")) return;
      resetShoppingWeek(nutritionState);
      db.saveNutritionState();
      render(root, ctx);
    });
  }
}
