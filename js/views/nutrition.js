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
  isPinned,
  togglePin,
  clearChoice,
} from "../nutrition.js";
import { escapeHtml, fmtNum } from "../util.js";
import { icons } from "../icons.js";

let selectedDate = null;
let syncStatus = "connecting";

const SYNC_STATUS = {
  connecting: { icon: icons.sync, label: "Verbinde mit Cloud…" },
  connected: { icon: icons.cloud, label: "Synchronisiert" },
  offline: { icon: icons.cloudOff, label: "Offline (nur lokal gespeichert)" },
};

function syncStatusHtml(status) {
  const s = SYNC_STATUS[status] || SYNC_STATUS.connecting;
  return `<span class="status-inline">${s.icon(15)}${s.label}</span>`;
}

// Ein einziger, dauerhafter Listener (Modul wird nur einmal ausgewertet) statt
// einer Neu-Registrierung bei jedem render() — aktualisiert das Status-Element
// direkt im DOM, falls die Ernährungsseite gerade sichtbar ist.
window.addEventListener("app:sync-status", (e) => {
  syncStatus = e.detail.status;
  const el = document.getElementById("sync-status");
  if (el) el.innerHTML = syncStatusHtml(syncStatus);
});

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
  db.persistNutritionCache();

  const users = db.getUsers();

  root.innerHTML = `
    <h1>Ernährung</h1>
    <p>Vorausgeplante Tagesauswahl für den Haushalt — je Mahlzeit 3 Optionen aus unterschiedlichen Kategorien.</p>
    <p class="meta" id="sync-status" style="margin-top:-8px;">${syncStatusHtml(syncStatus)}</p>

    <div class="row-between" style="gap:10px; margin: 14px 0 14px;">
      <button class="btn btn-secondary btn-sm" id="prev-day">‹</button>
      <input type="date" id="nutrition-date" value="${selectedDate}" style="flex:1;" />
      <button class="btn btn-secondary btn-sm" id="next-day">›</button>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="stat-label">Bisher heute (Hauptmahlzeiten)</div>
      ${users
        .map((u, i) => {
          const actual = sumDailyActual(nutritionState, ingredientsDB, selectedDate, u.id);
          const target = db.getNutritionTargets(u.id);
          const mealTarget = MEAL_TYPES.reduce(
            (acc, mt) => ({ kcal: acc.kcal + target.meals[mt].kcal, protein: acc.protein + target.meals[mt].protein }),
            { kcal: 0, protein: 0 }
          );
          return `<div class="row-between" style="align-items:baseline; margin-top:${i === 0 ? "10px" : "12px"};">
            <div>
              <div style="font-weight:700; font-size:0.9rem;">${escapeHtml(u.name)}</div>
              <div class="meta" style="font-size:0.76rem; margin-top:1px;">${fmtNum(actual.protein)} / ${fmtNum(mealTarget.protein)} g Protein</div>
            </div>
            <div style="text-align:right;">
              <span class="stat-value" style="font-size:1.5rem;">${fmtNum(actual.kcal)}</span><span class="meta" style="font-size:0.78rem;"> / ${fmtNum(mealTarget.kcal)} kcal</span>
            </div>
          </div>`;
        })
        .join("")}
      <p class="meta" style="margin: 12px 0 0;">Nur die 3 Hauptmahlzeiten, Snacks/Rest-Budget nicht mitgerechnet.</p>
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
    bindDishCardInteractions(card, nutritionState, root, ctx);
  });

  // Suchleiste je Mahlzeit/Party: durchsucht ALLE Gerichte des Pools (nicht
  // nur die 3 Vorschläge) per Namens-Teilstring — blendet währenddessen die
  // Vorschlagskarten aus und zeigt stattdessen die Treffer. Leeres Suchfeld
  // schaltet zurück auf die normale Vorschlagsansicht.
  root.querySelectorAll("[data-dish-search]").forEach((input) => {
    input.addEventListener("input", () => {
      const scope = input.closest("[data-search-scope]");
      const mealType = input.dataset.meal;
      const party = input.dataset.party;
      const query = input.value.trim();
      const hideEls = scope.querySelectorAll(".hide-on-search");
      const resultsEl = scope.querySelector("[data-search-results]");

      if (!query) {
        hideEls.forEach((el) => (el.style.display = ""));
        resultsEl.style.display = "none";
        resultsEl.innerHTML = "";
        return;
      }

      hideEls.forEach((el) => (el.style.display = "none"));
      resultsEl.style.display = "";
      const q = normalizeSearch(query);
      const slot = nutritionState.days[selectedDate][mealType];
      const matches = nutritionState.dishes
        .filter((d) => d.mealType === mealType && normalizeSearch(d.name).includes(q))
        .sort((a, b) => a.name.localeCompare(b.name, "de"));

      resultsEl.innerHTML = "";
      if (matches.length === 0) {
        resultsEl.innerHTML = `<p class="meta">Keine Gerichte gefunden.</p>`;
        return;
      }
      matches.forEach((dish) => {
        const card = buildDishCard(
          dish,
          party,
          mealType,
          isSelected(slot, party, dish.id),
          isPinned(nutritionState, party, mealType, dish.id),
          ingredientsDB
        );
        bindDishCardInteractions(card, nutritionState, root, ctx);
        resultsEl.appendChild(card);
      });
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

  root.querySelectorAll("[data-clear-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [personId, mealType] = btn.dataset.clearChoice.split("|");
      clearChoice(nutritionState, selectedDate, mealType, personId);
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

// Zutaten-Suche: Freitext statt <select>, weil die Datenbank auf ~250+
// Zutaten gewachsen ist — eine lange Dropdown-Liste wäre auf dem Handy kaum
// noch bedienbar. Tippen filtert per Teilstring-Suche (umlaut-normalisiert),
// Klick auf ein Ergebnis übernimmt die Zutat; ein eigener Listeneintrag
// "+ Neue Zutat anlegen" springt in den manuellen kcal/Protein-Modus.
function normalizeSearch(str) {
  return str
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] || c));
}

function hideResults(row) {
  const resultsEl = row.querySelector("[data-ing-results]");
  resultsEl.style.display = "none";
  resultsEl.innerHTML = "";
}

function renderIngredientResults(row, ingredientsDB, query) {
  const resultsEl = row.querySelector("[data-ing-results]");
  const q = normalizeSearch(query.trim());
  if (q.length === 0) {
    hideResults(row);
    return;
  }
  const matches = ingredientsDB.filter((i) => normalizeSearch(i.name).includes(q)).slice(0, 20);
  const itemsHtml = matches
    .map(
      (i) =>
        `<div class="ing-result-item" data-ing-option="${i.id}">${escapeHtml(i.name)}${i.category ? `<span class="meta">${escapeHtml(i.category)}</span>` : ""}</div>`
    )
    .join("");
  const newHtml = `<div class="ing-result-item ing-result-new" data-ing-new>+ Neue Zutat „${escapeHtml(query.trim())}" anlegen</div>`;
  resultsEl.innerHTML = itemsHtml + newHtml;
  resultsEl.style.display = "block";
}

function selectIngredientForRow(row, ingredientId, ingredientsDB) {
  const ing = ingredientsDB.find((i) => i.id === ingredientId);
  row.querySelector("[data-ing-search]").value = ing ? ing.name : "";
  row.querySelector("[data-ing-id]").value = ingredientId;
  row.querySelector("[data-new-fields]").style.display = "none";
  hideResults(row);
}

function startNewIngredientForRow(row, query) {
  row.querySelector("[data-ing-id]").value = "";
  row.querySelector("[data-new-fields]").style.display = "flex";
  row.querySelector("[data-new-name]").value = query.trim();
  hideResults(row);
}

function bindPanelRowEvents(panel, ingredientsDB) {
  panel.querySelectorAll("[data-row]").forEach((row) => {
    const searchInput = row.querySelector("[data-ing-search]");
    const idInput = row.querySelector("[data-ing-id]");
    const resultsEl = row.querySelector("[data-ing-results]");

    searchInput.oninput = () => {
      idInput.value = "";
      renderIngredientResults(row, ingredientsDB, searchInput.value);
    };
    searchInput.onfocus = () => {
      if (searchInput.value.trim()) renderIngredientResults(row, ingredientsDB, searchInput.value);
    };
    searchInput.onblur = () => {
      setTimeout(() => hideResults(row), 150);
    };

    resultsEl.onclick = (e) => {
      const optionEl = e.target.closest("[data-ing-option]");
      if (optionEl) {
        selectIngredientForRow(row, optionEl.dataset.ingOption, ingredientsDB);
        updatePreview(panel, ingredientsDB);
        return;
      }
      if (e.target.closest("[data-ing-new]")) {
        startNewIngredientForRow(row, searchInput.value);
      }
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
    const amount = parseFloat(row.querySelector("[data-amt]").value);
    if (Number.isNaN(amount) || amount <= 0) return;
    const ingId = row.querySelector("[data-ing-id]").value;
    if (!ingId) {
      const name = row.querySelector("[data-new-name]").value.trim();
      const kcalPer100 = parseFloat(row.querySelector("[data-new-kcal]").value);
      const proteinPer100 = parseFloat(row.querySelector("[data-new-protein]").value);
      if (!name || Number.isNaN(kcalPer100) || Number.isNaN(proteinPer100)) return;
      const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}_${Math.random().toString(36).slice(2, 6)}`;
      newlyAdded.push({ id, name, unit: "g", kcalPer100, proteinPer100 });
      ingredients.push({ ingredientId: id, amount });
    } else {
      ingredients.push({ ingredientId: ingId, amount });
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

function ingredientRowHtml(ingredientId, amount, ingredientsDB) {
  const ing = ingredientId ? ingredientsDB.find((i) => i.id === ingredientId) : null;
  return `
    <div class="ingredient-row" data-row>
      <div class="ing-search-wrap">
        <input type="text" data-ing-search autocomplete="off" placeholder="Zutat suchen…" value="${escapeHtml(ing ? ing.name : "")}" />
        <input type="hidden" data-ing-id value="${ingredientId || ""}" />
        <div class="ing-results" data-ing-results></div>
      </div>
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
      <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:10px;">
        ${CATEGORIES.map((c) => `<label class="category-check"><input type="checkbox" data-cat="${c}" /><span>${CATEGORY_LABELS[c]}</span></label>`).join("")}
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

  // Im Modus "getrennt" sieht jede Person ihre eigene Vorschlagsspalte
  // sowieso nur auf dem eigenen Gerät — die Spalte der anderen Person wäre
  // hier nur Ballast, deshalb wird sie ausgeblendet. Die "Tatsächlich
  // gegessen"-Übersicht weiter unten bleibt davon unberührt und zeigt
  // weiterhin beide Personen, damit ihr euch gegenseitig seht.
  const currentUserId = db.getCurrentUserId();
  const allParties = partiesForMode(slot.mode);
  const parties = slot.mode === "getrennt" ? allParties.filter((p) => p === currentUserId) : allParties;
  parties.forEach((party) => {
    const section = document.createElement("div");
    section.style.marginBottom = "6px";
    section.dataset.searchScope = `${mealType}|${party}`;

    if (party !== "shared") {
      const user = users.find((u) => u.id === party);
      const label = document.createElement("div");
      label.className = "section-title";
      label.style.marginTop = "10px";
      label.textContent = user ? user.name : party;
      section.appendChild(label);
    }

    const searchWrap = document.createElement("div");
    searchWrap.className = "dish-search-bar";
    searchWrap.innerHTML = `<div class="search-input-wrap">${icons.search(16)}<input type="text" class="dish-search-input" data-dish-search data-meal="${mealType}" data-party="${party}" placeholder="Alle ${escapeHtml(MEAL_LABELS[mealType])}-Gerichte durchsuchen…" /></div>`;
    section.appendChild(searchWrap);

    const grid = document.createElement("div");
    grid.className = "dish-grid hide-on-search";
    const dishIds = slot.proposals[party] || [];
    if (dishIds.length === 0) {
      const empty = document.createElement("p");
      empty.className = "meta hide-on-search";
      empty.textContent = "Keine passenden Gerichte im Pool (Präferenzen prüfen).";
      section.appendChild(empty);
    } else {
      dishIds.forEach((dishId) => {
        const dish = db.getDish(dishId);
        if (!dish) return;
        grid.appendChild(buildDishCard(dish, party, mealType, isSelected(slot, party, dishId), isPinned(nutritionState, party, mealType, dishId), ingredientsDB));
      });
      section.appendChild(grid);
    }

    const searchResults = document.createElement("div");
    searchResults.className = "dish-grid";
    searchResults.dataset.searchResults = "1";
    searchResults.style.display = "none";
    section.appendChild(searchResults);

    const rerollBtn = document.createElement("button");
    rerollBtn.className = "link-btn hide-on-search";
    rerollBtn.dataset.reroll = party;
    rerollBtn.dataset.meal = mealType;
    rerollBtn.innerHTML = `<span class="status-inline">${icons.shuffle(15)}Andere Vorschläge</span>`;
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

// Verdrahtet Auswahl-Klick + Pin-Toggle für eine einzelne Gerichte-Karte.
// Eigene Funktion statt einer globalen querySelectorAll-Bindung in
// wireEvents, weil Suchergebnis-Karten dynamisch (bei jedem Tastenanschlag,
// ohne vollständigen render()) neu erzeugt werden und direkt beim Erzeugen
// ihre Listener brauchen.
function bindDishCardInteractions(card, nutritionState, root, ctx) {
  card.addEventListener("click", () => {
    setChoice(nutritionState, selectedDate, card.dataset.meal, card.dataset.party, card.dataset.dishId);
    db.saveNutritionState();
    render(root, ctx);
  });
  const pinBtn = card.querySelector("[data-pin-toggle]");
  if (pinBtn) {
    pinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePin(nutritionState, selectedDate, pinBtn.dataset.meal, pinBtn.dataset.party, pinBtn.dataset.dishId);
      db.saveNutritionState();
      render(root, ctx);
    });
  }
}

function buildDishCard(dish, party, mealType, selected, pinned, ingredientsDB) {
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
    <span class="pin-btn ${pinned ? "active" : ""}" data-pin-toggle data-dish-id="${dish.id}" data-party="${party}" data-meal="${mealType}">
      <span class="status-inline">${icons.pin(13)}${pinned ? "Fixiert — immer vorschlagen" : "Fixieren"}</span>
    </span>
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
        ${
          macros.source !== "plan"
            ? `<button class="link-btn" style="color:var(--danger);" data-reset-actual="${personId}|${mealType}">Zurücksetzen</button>`
            : dishId
              ? `<button class="link-btn" style="color:var(--danger);" data-clear-choice="${personId}|${mealType}">Auswahl aufheben</button>`
              : ""
        }
      </div>
    </div>
    ${adjustPanelHtml(panelId, personId, mealType, dishId, macros.name, macros.ingredients, ingredientsDB)}
  `;
  return wrap;
}
