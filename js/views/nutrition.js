import { db, todayISO } from "../db.js";
import {
  MEAL_TYPES,
  MEAL_LABELS,
  CATEGORY_LABELS,
  ensureDayPlan,
  setSlotMode,
  rerollSlot,
  setChoice,
  partiesForMode,
  portionFor,
  getResolvedChoice,
  getPersonMacros,
  sumDailyActual,
  setOverride,
  setCustomEntry,
  clearActual,
  applyPermanentEdit,
  computeMacros,
  isSelected,
  addNewDish,
  assignChoice,
  CATEGORIES,
} from "../nutrition.js";
import { escapeHtml, fmtNum } from "../util.js";

let selectedDate = null;

export function mount(root, ctx) {
  if (!selectedDate) selectedDate = todayISO();
  render(root, ctx);
}

function shiftDate(dateISO, delta) {
  const d = new Date(`${dateISO}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function categoryBadgeClass(cat) {
  if (cat === "leicht") return "badge-ok";
  if (cat === "schnell") return "badge-warn";
  return "badge";
}

function render(root, ctx) {
  const nutritionState = db.getNutritionState();
  const ingredientsDB = db.getIngredients();
  const day = ensureDayPlan(nutritionState, selectedDate);
  db.saveNutritionState();

  const users = db.getUsers();

  root.innerHTML = `
    <h1>Ernährung</h1>
    <p>Vorausgeplante Tagesauswahl für den Haushalt — je Mahlzeit 3 Optionen aus unterschiedlichen Kategorien.</p>

    <div class="row-between" style="gap:10px; margin: 14px 0 14px;">
      <button class="btn btn-secondary btn-sm" id="prev-day">‹</button>
      <input type="date" id="nutrition-date" value="${selectedDate}" style="flex:1;" />
      <button class="btn btn-secondary btn-sm" id="next-day">›</button>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="section-title" style="margin-top:0;">Bisher heute (Hauptmahlzeiten)</div>
      ${users
        .map((u) => {
          const actual = sumDailyActual(nutritionState, ingredientsDB, selectedDate, u.id);
          const target = db.getNutritionTargets(u.id);
          const mealTarget = MEAL_TYPES.reduce(
            (acc, mt) => ({ kcal: acc.kcal + target.meals[mt].kcal, protein: acc.protein + target.meals[mt].protein }),
            { kcal: 0, protein: 0 }
          );
          return `<div class="row-between" style="margin-bottom:4px;">
            <span>${escapeHtml(u.name)}</span>
            <span>${fmtNum(actual.kcal)} / ${fmtNum(mealTarget.kcal)} kcal · ${fmtNum(actual.protein)} / ${fmtNum(mealTarget.protein)} g P</span>
          </div>`;
        })
        .join("")}
      <p class="meta" style="margin: 6px 0 0;">Nur die 3 Hauptmahlzeiten, Snacks/Rest-Budget nicht mitgerechnet.</p>
    </div>

    <div id="slots"></div>
  `;

  const slotsEl = root.querySelector("#slots");
  MEAL_TYPES.forEach((mealType) => {
    slotsEl.appendChild(buildSlotBlock(day[mealType], mealType, nutritionState, ingredientsDB, users));
  });

  wireEvents(root, ctx, nutritionState, ingredientsDB);
}

function wireEvents(root, ctx, nutritionState, ingredientsDB) {
  root.querySelector("#prev-day").addEventListener("click", () => {
    selectedDate = shiftDate(selectedDate, -1);
    render(root, ctx);
  });
  root.querySelector("#next-day").addEventListener("click", () => {
    selectedDate = shiftDate(selectedDate, 1);
    render(root, ctx);
  });
  root.querySelector("#nutrition-date").addEventListener("change", (e) => {
    selectedDate = e.target.value || todayISO();
    render(root, ctx);
  });

  root.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mealType = btn.closest(".mode-toggle").dataset.meal;
      setSlotMode(nutritionState, selectedDate, mealType, btn.dataset.mode);
      db.saveNutritionState();
      render(root, ctx);
    });
  });

  root.querySelectorAll("[data-reroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      rerollSlot(nutritionState, selectedDate, btn.dataset.meal, btn.dataset.reroll);
      db.saveNutritionState();
      render(root, ctx);
    });
  });

  root.querySelectorAll(".dish-card").forEach((card) => {
    card.addEventListener("click", () => {
      setChoice(nutritionState, selectedDate, card.dataset.meal, card.dataset.party, card.dataset.dishId);
      db.saveNutritionState();
      render(root, ctx);
    });
  });

  root.querySelectorAll("[data-toggle-adjust]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = root.querySelector(`#${btn.dataset.togglePanel}`);
      const isHidden = panel.style.display === "none";
      panel.style.display = isHidden ? "block" : "none";
      if (isHidden) updatePreview(panel, ingredientsDB);
    });
  });

  root.querySelectorAll("[data-cancel-adjust]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".adjust-panel").style.display = "none";
    });
  });

  root.querySelectorAll("[data-reset-actual]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [personId, mealType] = btn.dataset.resetActual.split("|");
      clearActual(nutritionState, selectedDate, mealType, personId);
      db.saveNutritionState();
      render(root, ctx);
    });
  });

  root.querySelectorAll(".adjust-panel").forEach((panel) => {
    panel.querySelector("[data-add-row]").addEventListener("click", () => {
      const rowsEl = panel.querySelector("[data-rows]");
      rowsEl.insertAdjacentHTML("beforeend", ingredientRowHtml(null, "", ingredientsDB));
      bindPanelRowEvents(panel, ingredientsDB);
      updatePreview(panel, ingredientsDB);
    });
    bindPanelRowEvents(panel, ingredientsDB);
    panel.addEventListener("input", () => updatePreview(panel, ingredientsDB));

    const saveTemp = panel.querySelector("[data-save-temp]");
    if (saveTemp) {
      saveTemp.addEventListener("click", () => {
        const { person: personId, meal: mealType } = saveTemp.dataset;
        const { ingredients, newlyAdded } = readIngredientRows(panel);
        if (ingredients.length === 0) return;
        newlyAdded.forEach((ing) => db.addIngredient(ing));
        const name = panel.querySelector("[data-name]").value.trim() || null;
        const note = panel.querySelector("[data-note]").value.trim() || null;
        const dishId = saveTemp.dataset.dish;
        if (dishId) {
          setOverride(nutritionState, selectedDate, mealType, personId, ingredients, note);
        } else {
          setCustomEntry(nutritionState, selectedDate, mealType, personId, name || "Eigener Eintrag", ingredients, note);
        }
        db.saveNutritionState();
        render(root, ctx);
      });
    }

    const savePermanent = panel.querySelector("[data-save-permanent]");
    if (savePermanent) {
      savePermanent.addEventListener("click", () => {
        const { person: personId, meal: mealType, dish } = savePermanent.dataset;
        const { ingredients, newlyAdded } = readIngredientRows(panel);
        if (ingredients.length === 0) return;
        newlyAdded.forEach((ing) => db.addIngredient(ing));
        applyPermanentEdit(nutritionState, dish, personId, ingredients);
        clearActual(nutritionState, selectedDate, mealType, personId);
        db.saveNutritionState();
        render(root, ctx);
      });
    }

    const saveRecipe = panel.querySelector("[data-save-recipe]");
    if (saveRecipe) {
      saveRecipe.addEventListener("click", () => {
        const { person: personId, meal: mealType } = saveRecipe.dataset;
        const { ingredients, newlyAdded } = readIngredientRows(panel);
        if (ingredients.length === 0) return;
        const name = panel.querySelector("[data-name]").value.trim();
        if (!name) {
          alert('Bitte einen Namen für das Rezept eingeben.');
          return;
        }
        const categories = [...panel.querySelectorAll("[data-cat]:checked")].map((cb) => cb.dataset.cat);
        if (categories.length === 0) {
          alert("Bitte mindestens eine Kategorie wählen (Deftig/Leicht/Schnell).");
          return;
        }
        newlyAdded.forEach((ing) => db.addIngredient(ing));
        const newDishId = addNewDish(nutritionState, mealType, name, categories, ingredients);
        assignChoice(nutritionState, selectedDate, mealType, personId, newDishId);
        clearActual(nutritionState, selectedDate, mealType, personId);
        db.saveNutritionState();
        render(root, ctx);
      });
    }
  });
}

function bindPanelRowEvents(panel, ingredientsDB) {
  panel.querySelectorAll("[data-row]").forEach((row) => {
    const select = row.querySelector("[data-ing]");
    const newFields = row.querySelector("[data-new-fields]");
    newFields.style.display = select.value === "__new__" ? "flex" : "none";
    select.onchange = () => {
      newFields.style.display = select.value === "__new__" ? "flex" : "none";
      updatePreview(panel, ingredientsDB);
    };
    const rmBtn = row.querySelector(".rm");
    rmBtn.onclick = () => {
      row.remove();
      updatePreview(panel, ingredientsDB);
    };
  });
}

function readIngredientRows(panel) {
  const rows = [...panel.querySelectorAll("[data-row]")];
  const ingredients = [];
  const newlyAdded = [];
  rows.forEach((row) => {
    const select = row.querySelector("[data-ing]");
    const amount = parseFloat(row.querySelector("[data-amt]").value);
    if (Number.isNaN(amount) || amount <= 0) return;
    if (select.value === "__new__") {
      const name = row.querySelector("[data-new-name]").value.trim();
      const kcalPer100 = parseFloat(row.querySelector("[data-new-kcal]").value);
      const proteinPer100 = parseFloat(row.querySelector("[data-new-protein]").value);
      if (!name || Number.isNaN(kcalPer100) || Number.isNaN(proteinPer100)) return;
      const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}_${Math.random().toString(36).slice(2, 6)}`;
      newlyAdded.push({ id, name, unit: "g", kcalPer100, proteinPer100 });
      ingredients.push({ ingredientId: id, amount });
    } else {
      ingredients.push({ ingredientId: select.value, amount });
    }
  });
  return { ingredients, newlyAdded };
}

function updatePreview(panel, ingredientsDB) {
  const { ingredients, newlyAdded } = readIngredientRows(panel);
  const combinedDB = ingredientsDB.concat(newlyAdded);
  const macros = computeMacros(ingredients, combinedDB);
  const preview = panel.querySelector("[data-preview]");
  if (preview) preview.textContent = `Vorschau: ${fmtNum(macros.kcal)} kcal · ${fmtNum(macros.protein)} g P`;
}

function ingredientOptions(ingredientsDB, selectedId) {
  const opts = ingredientsDB
    .map((i) => `<option value="${i.id}" ${i.id === selectedId ? "selected" : ""}>${escapeHtml(i.name)} (${i.unit})</option>`)
    .join("");
  return `<option value="__new__" ${selectedId === "__new__" || !selectedId ? "selected" : ""}>+ Neue Zutat…</option>${opts}`;
}

function ingredientRowHtml(ingredientId, amount, ingredientsDB) {
  return `
    <div class="ingredient-row" data-row>
      <select data-ing>${ingredientOptions(ingredientsDB, ingredientId)}</select>
      <input type="number" step="1" min="0" inputmode="decimal" data-amt value="${amount === "" ? "" : amount}" placeholder="Menge" />
      <button type="button" class="rm" aria-label="Zutat entfernen">×</button>
      <div class="new-ingredient-fields" data-new-fields>
        <input type="text" data-new-name placeholder="Name der Zutat" />
        <input type="number" step="1" data-new-kcal placeholder="kcal/100g" />
        <input type="number" step="0.1" data-new-protein placeholder="Protein/100g" />
      </div>
    </div>
  `;
}

function adjustPanelHtml(panelId, personId, mealType, dishId, prefillName, prefillIngredients, ingredientsDB) {
  const rowsHtml = prefillIngredients.length
    ? prefillIngredients.map((i) => ingredientRowHtml(i.ingredientId, i.amount, ingredientsDB)).join("")
    : ingredientRowHtml(null, "", ingredientsDB);
  return `
    <div class="adjust-panel" id="${panelId}" style="display:none;">
      <label>Name</label>
      <input type="text" data-name value="${escapeHtml(prefillName || "")}" placeholder="z. B. Sojahack-Pfanne" style="margin-bottom:10px;" />
      <div data-rows>${rowsHtml}</div>
      <button type="button" class="link-btn" data-add-row>+ Zutat hinzufügen</button>
      <div class="meta" data-preview style="margin: 8px 0;"></div>
      <label>Notiz (optional)</label>
      <input type="text" data-note placeholder="z. B. Sojajoghurt statt Skyr, oder 60g statt 80g Haferflocken" style="margin-bottom:10px;" />
      <label>Kategorie (nur für "Als neues Rezept speichern")</label>
      <div style="display:flex; gap:14px; flex-wrap:wrap; margin-bottom:10px;">
        ${CATEGORIES.map((c) => `<label style="display:flex; align-items:center; gap:5px; font-weight:400; font-size:0.85rem;"><input type="checkbox" data-cat="${c}" /> ${CATEGORY_LABELS[c]}</label>`).join("")}
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn btn-sm" data-save-temp data-person="${personId}" data-meal="${mealType}" data-dish="${dishId || ""}">Nur heute übernehmen</button>
        ${dishId ? `<button type="button" class="btn btn-sm btn-secondary" data-save-permanent data-person="${personId}" data-meal="${mealType}" data-dish="${dishId}">Dauerhaft in diesem Rezept ändern</button>` : ""}
        <button type="button" class="btn btn-sm btn-secondary" data-save-recipe data-person="${personId}" data-meal="${mealType}">Als neues Rezept speichern</button>
        <button type="button" class="link-btn" data-cancel-adjust>Abbrechen</button>
      </div>
    </div>
  `;
}

function buildSlotBlock(slot, mealType, nutritionState, ingredientsDB, users) {
  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.style.marginBottom = "14px";

  const erikTarget = db.getNutritionTargets("erik").meals[mealType];
  const neleTarget = db.getNutritionTargets("nele").meals[mealType];

  const header = document.createElement("div");
  header.innerHTML = `
    <div class="row-between" style="margin-bottom:6px;">
      <h2 style="margin:0;">${escapeHtml(MEAL_LABELS[mealType])}</h2>
      <div class="mode-toggle" data-meal="${mealType}">
        <button class="mode-btn ${slot.mode === "gemeinsam" ? "active" : ""}" data-mode="gemeinsam">Gemeinsam</button>
        <button class="mode-btn ${slot.mode === "getrennt" ? "active" : ""}" data-mode="getrennt">Getrennt</button>
      </div>
    </div>
    <p class="meta" style="margin-bottom:12px;">Ziel — Nele: ~${fmtNum(neleTarget.kcal)} kcal / ${fmtNum(neleTarget.protein)} g P · Erik: ~${fmtNum(erikTarget.kcal)} kcal / ${fmtNum(erikTarget.protein)} g P</p>
  `;
  wrap.appendChild(header);

  const parties = partiesForMode(slot.mode);
  parties.forEach((party) => {
    const section = document.createElement("div");
    section.style.marginBottom = "6px";

    if (party !== "shared") {
      const user = users.find((u) => u.id === party);
      const label = document.createElement("div");
      label.className = "section-title";
      label.style.marginTop = "10px";
      label.textContent = user ? user.name : party;
      section.appendChild(label);
    }

    const grid = document.createElement("div");
    grid.className = "dish-grid";
    const dishIds = slot.proposals[party] || [];
    if (dishIds.length === 0) {
      const empty = document.createElement("p");
      empty.className = "meta";
      empty.textContent = "Keine passenden Gerichte im Pool (Präferenzen prüfen).";
      section.appendChild(empty);
    } else {
      dishIds.forEach((dishId) => {
        const dish = db.getDish(dishId);
        if (!dish) return;
        grid.appendChild(buildDishCard(dish, party, mealType, isSelected(slot, party, dishId), ingredientsDB));
      });
      section.appendChild(grid);
    }

    const rerollBtn = document.createElement("button");
    rerollBtn.className = "link-btn";
    rerollBtn.dataset.reroll = party;
    rerollBtn.dataset.meal = mealType;
    rerollBtn.textContent = "🔀 Andere Vorschläge";
    section.appendChild(rerollBtn);

    wrap.appendChild(section);
  });

  const actualTitle = document.createElement("div");
  actualTitle.className = "section-title";
  actualTitle.textContent = "Tatsächlich gegessen";
  wrap.appendChild(actualTitle);

  users.forEach((user) => {
    wrap.appendChild(buildActualBlock(nutritionState, ingredientsDB, mealType, user));
  });

  return wrap;
}

function buildDishCard(dish, party, mealType, selected, ingredientsDB) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "dish-card" + (selected ? " selected" : "");
  card.dataset.dishId = dish.id;
  card.dataset.party = party;
  card.dataset.meal = mealType;

  const badges = dish.categories.map((c) => `<span class="badge ${categoryBadgeClass(c)}">${CATEGORY_LABELS[c]}</span>`).join(" ");

  const nele = portionFor(dish, "nele", ingredientsDB);
  let portionHtml;
  if (party === "shared") {
    const erik = portionFor(dish, "erik", ingredientsDB);
    portionHtml = `
      <div class="dish-macro">Nele: <strong>${fmtNum(nele.kcal)} kcal</strong> · ${fmtNum(nele.protein)} g P</div>
      <div class="dish-macro">Erik: <strong>${fmtNum(erik.kcal)} kcal</strong> · ${fmtNum(erik.protein)} g P${erik.addDescription ? ` <span class="meta">(${escapeHtml(erik.addDescription)})</span>` : ""}</div>
    `;
  } else {
    const p = portionFor(dish, party, ingredientsDB);
    portionHtml = `<div class="dish-macro"><strong>${fmtNum(p.kcal)} kcal</strong> · ${fmtNum(p.protein)} g P${p.addDescription ? `<br/><span class="meta">${escapeHtml(p.addDescription)}</span>` : ""}</div>`;
  }

  card.innerHTML = `
    <div class="dish-card-header">
      <span class="dish-name">${escapeHtml(dish.name)}</span>
      <span>${badges}</span>
    </div>
    <div class="dish-desc">${escapeHtml(nele.description)}</div>
    ${portionHtml}
  `;
  return card;
}

function buildActualBlock(nutritionState, ingredientsDB, mealType, user) {
  const personId = user.id;
  const dishId = getResolvedChoice(nutritionState, selectedDate, mealType, personId);
  const macros = getPersonMacros(nutritionState, ingredientsDB, selectedDate, mealType, personId);
  const panelId = `adjust-${personId}-${mealType}`;

  const wrap = document.createElement("div");
  wrap.className = "actual-row";

  if (!macros) {
    wrap.innerHTML = `
      <div class="row-between">
        <span class="meta">${escapeHtml(user.name)}: noch nichts gewählt</span>
        <button class="link-btn" data-toggle-adjust data-toggle-panel="${panelId}">Eigener Eintrag</button>
      </div>
      ${adjustPanelHtml(panelId, personId, mealType, null, "", [], ingredientsDB)}
    `;
    return wrap;
  }

  const sourceLabel = macros.source === "override" ? "angepasst" : macros.source === "custom" ? "eigener Eintrag" : null;

  wrap.innerHTML = `
    <div class="row-between">
      <div>
        <strong>${escapeHtml(user.name)}:</strong> ${escapeHtml(macros.name)}
        ${sourceLabel ? `<span class="badge badge-warn">${sourceLabel}</span>` : ""}
        <div class="meta">${fmtNum(macros.kcal)} kcal · ${fmtNum(macros.protein)} g P${macros.note ? ` — ${escapeHtml(macros.note)}` : ""}</div>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
        <button class="link-btn" data-toggle-adjust data-toggle-panel="${panelId}">Anpassen</button>
        ${macros.source !== "plan" ? `<button class="link-btn" style="color:var(--danger);" data-reset-actual="${personId}|${mealType}">Zurücksetzen</button>` : ""}
      </div>
    </div>
    ${adjustPanelHtml(panelId, personId, mealType, dishId, macros.name, macros.ingredients, ingredientsDB)}
  `;
  return wrap;
}
