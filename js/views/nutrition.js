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
  const day = ensureDayPlan(nutritionState, selectedDate);
  db.saveNutritionState();

  const users = db.getUsers();

  root.innerHTML = `
    <h1>Ernährung</h1>
    <p>Vorausgeplante Tagesauswahl für den Haushalt — je Mahlzeit 3 Optionen aus unterschiedlichen Kategorien.</p>

    <div class="row-between" style="gap:10px; margin: 14px 0 20px;">
      <button class="btn btn-secondary btn-sm" id="prev-day">‹</button>
      <input type="date" id="nutrition-date" value="${selectedDate}" style="flex:1;" />
      <button class="btn btn-secondary btn-sm" id="next-day">›</button>
    </div>

    <div id="slots"></div>
  `;

  const slotsEl = root.querySelector("#slots");
  MEAL_TYPES.forEach((mealType) => {
    slotsEl.appendChild(buildSlotBlock(day[mealType], mealType, nutritionState, users));
  });

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
}

function buildSlotBlock(slot, mealType, nutritionState, users) {
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
        grid.appendChild(buildDishCard(dish, party, mealType, slot.choice[party] === dishId));
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

  return wrap;
}

function buildDishCard(dish, party, mealType, selected) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "dish-card" + (selected ? " selected" : "");
  card.dataset.dishId = dish.id;
  card.dataset.party = party;
  card.dataset.meal = mealType;

  const badges = dish.categories.map((c) => `<span class="badge ${categoryBadgeClass(c)}">${CATEGORY_LABELS[c]}</span>`).join(" ");

  let portionHtml;
  if (party === "shared") {
    const nele = portionFor(dish, "nele");
    const erik = portionFor(dish, "erik");
    portionHtml = `
      <div class="dish-macro">Nele: <strong>${fmtNum(nele.kcal)} kcal</strong> · ${fmtNum(nele.protein)} g P</div>
      <div class="dish-macro">Erik: <strong>${fmtNum(erik.kcal)} kcal</strong> · ${fmtNum(erik.protein)} g P${erik.addDescription ? ` <span class="meta">(${escapeHtml(erik.addDescription)})</span>` : ""}</div>
    `;
  } else {
    const p = portionFor(dish, party);
    portionHtml = `<div class="dish-macro"><strong>${fmtNum(p.kcal)} kcal</strong> · ${fmtNum(p.protein)} g P${p.addDescription ? `<br/><span class="meta">${escapeHtml(p.addDescription)}</span>` : ""}</div>`;
  }

  card.innerHTML = `
    <div class="dish-card-header">
      <span class="dish-name">${escapeHtml(dish.name)}</span>
      <span>${badges}</span>
    </div>
    <div class="dish-desc">${escapeHtml(dish.base.description)}</div>
    ${portionHtml}
  `;
  return card;
}
