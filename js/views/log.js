import { db, uid, todayISO } from "../db.js";
import { getBlockWeek, isDeloadWeek, getSuggestion } from "../progression.js";
import { escapeHtml, fmtNum, showToast } from "../util.js";

const BAND_LEVELS = ["leicht", "mittel", "schwer"];
const PACE_OPTIONS = ["locker", "moderat", "zügig"];

export function mount(root, { navigate, params }) {
  const dayId = params[0];
  const userId = db.getCurrentUserId();
  const days = db.getWorkoutDays(userId);
  const day = days.find((d) => d.id === dayId);

  if (!day) {
    root.innerHTML = `<div class="empty-state"><div class="icon">🤔</div><p>Trainingstag nicht gefunden.</p></div>`;
    return;
  }

  const blockStart = db.getBlockStartDate(userId);
  const weekInBlock = getBlockWeek(blockStart, todayISO());
  const deload = isDeloadWeek(weekInBlock);

  const exercises = day.exerciseIds
    .map((id) => db.getExercise(userId, id))
    .filter(Boolean);

  const suggestions = new Map();
  exercises.forEach((ex) => {
    const sessions = db.getSessionsForExercise(userId, ex.id);
    suggestions.set(ex.id, getSuggestion(ex, sessions, weekInBlock));
  });

  root.innerHTML = `
    <h1>${escapeHtml(day.name)}</h1>
    ${deload ? `<div class="deload-banner">🟡 Deload-Woche — bewusst reduziertes Gewicht/Volumen, kein neuer Bestwert-Versuch.</div>` : ""}
    ${day.note ? `<p>${escapeHtml(day.note)}</p>` : ""}

    <div class="field-row" style="margin: 14px 0 20px;">
      <div>
        <label for="log-date">Datum</label>
        <input type="date" id="log-date" value="${todayISO()}" max="${todayISO()}" />
      </div>
    </div>

    <div id="exercise-list"></div>

    <button class="btn" id="save-session" style="margin-top: 8px;">Session speichern</button>
  `;

  const list = root.querySelector("#exercise-list");
  let pilatesBlockInserted = false;
  exercises.forEach((ex) => {
    if (ex.type === "pilates") {
      if (!pilatesBlockInserted) {
        const pilatesExercises = exercises.filter((e) => e.type === "pilates");
        list.appendChild(buildPilatesGroupBlock(pilatesExercises, suggestions));
        pilatesBlockInserted = true;
      }
      return;
    }
    list.appendChild(buildExerciseBlock(ex, suggestions.get(ex.id), deload));
  });

  root.querySelectorAll("[data-add-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exId = btn.dataset.addSet;
      const ex = exercises.find((e) => e.id === exId);
      const container = root.querySelector(`.sets-container[data-exercise="${exId}"]`);
      const nextIndex = container.querySelectorAll(".set-row").length + 1;
      container.insertAdjacentHTML("beforeend", setRowHtml(ex, nextIndex, {}));
      bindRemove(root, container);
    });
  });
  root.querySelectorAll(".sets-container").forEach((container) => bindRemove(root, container));

  root.querySelector("#save-session").addEventListener("click", () => {
    const date = root.querySelector("#log-date").value || todayISO();
    const sets = {};

    exercises.forEach((ex) => {
      const container = root.querySelector(`.sets-container[data-exercise="${ex.id}"]`);
      if (!container) return;
      const rows = Array.from(container.querySelectorAll(".set-row"));
      const entries = [];

      rows.forEach((row) => {
        if (ex.type === "weighted") {
          const weight = parseFloat(row.querySelector('[data-field="weight"]').value);
          const reps = parseInt(row.querySelector('[data-field="reps"]').value, 10);
          if (!Number.isNaN(weight) && !Number.isNaN(reps)) entries.push({ weight, reps });
        } else if (ex.type === "band") {
          const reps = parseInt(row.querySelector('[data-field="reps"]').value, 10);
          const level = row.querySelector('[data-field="level"]').value;
          if (!Number.isNaN(reps)) entries.push({ reps, level });
        } else if (ex.type === "bodyweight") {
          const key = ex.holdBased ? "seconds" : "reps";
          const val = parseInt(row.querySelector(`[data-field="${key}"]`).value, 10);
          if (!Number.isNaN(val)) entries.push({ [key]: val });
        } else if (ex.type === "cardio") {
          const duration = parseInt(row.querySelector('[data-field="duration"]').value, 10);
          const pace = row.querySelector('[data-field="pace"]').value;
          if (!Number.isNaN(duration)) entries.push({ duration, pace });
        } else if (ex.type === "pilates") {
          const duration = parseInt(row.querySelector('[data-field="duration"]').value, 10);
          const weightRaw = row.querySelector('[data-field="weight"]').value;
          if (!Number.isNaN(duration)) {
            const weight = weightRaw === "" ? null : parseFloat(weightRaw);
            const hasWeight = weight != null && !Number.isNaN(weight);
            entries.push({ loadMode: hasWeight ? "gewicht" : "bodyweight", weight: hasWeight ? weight : null, duration });
          }
        }
      });

      if (entries.length) sets[ex.id] = entries;
    });

    if (Object.keys(sets).length === 0) {
      showToast("Nichts eingetragen — Session nicht gespeichert.");
      return;
    }

    db.addSession(userId, {
      id: uid("session"),
      date,
      dayId: day.id,
      weekInBlock,
      sets,
    });

    showToast("Session gespeichert 💪");
    navigate("#/dashboard");
  });
}

function bindRemove(root, container) {
  container.querySelectorAll(".rm").forEach((btn) => {
    btn.onclick = () => {
      if (container.querySelectorAll(".set-row").length <= 1) return;
      btn.closest(".set-row").remove();
      renumber(container);
    };
  });
}

function renumber(container) {
  container.querySelectorAll(".set-row .set-num").forEach((el, i) => {
    el.textContent = `${i + 1}.`;
  });
}

function buildExerciseBlock(ex, suggestion, deload) {
  const wrap = document.createElement("div");
  wrap.className = "exercise-block";

  const header = document.createElement("div");
  header.innerHTML = `<h3>${escapeHtml(ex.name)}${ex.perSide ? ' <span class="meta" style="font-weight:400;">(pro Seite/Bein)</span>' : ""}</h3>`;
  wrap.appendChild(header);

  if (ex.safetyNote) {
    const note = document.createElement("div");
    note.className = "safety-banner";
    note.textContent = `⚠️ ${ex.safetyNote}`;
    wrap.appendChild(note);
  }

  const sugg = document.createElement("div");
  sugg.className = "suggestion";
  sugg.innerHTML = suggestionText(ex, suggestion);
  wrap.appendChild(sugg);

  const container = document.createElement("div");
  container.className = "sets-container";
  container.dataset.exercise = ex.id;

  const setCount = ex.type === "cardio" || ex.type === "pilates" ? 1 : ex.sets || 1;
  let rowsHtml = "";
  for (let i = 1; i <= setCount; i++) {
    rowsHtml += setRowHtml(ex, i, suggestion);
  }
  container.innerHTML = rowsHtml;
  wrap.appendChild(container);

  if (ex.type !== "cardio" && ex.type !== "pilates") {
    const addBtn = document.createElement("button");
    addBtn.className = "link-btn";
    addBtn.dataset.addSet = ex.id;
    addBtn.textContent = "+ Satz hinzufügen";
    wrap.appendChild(addBtn);
  }

  return wrap;
}

function categoryLabel(ex) {
  return ex.name.replace(/^Pilates-Video\s*/, "");
}

function buildPilatesGroupBlock(pilatesExercises, suggestions) {
  const wrap = document.createElement("div");
  wrap.className = "exercise-block";

  wrap.innerHTML = `
    <h3>Pilates-Video</h3>
    <p style="margin-top:-4px;">Ein Video für den ganzen Tag — nicht mehrere Kategorien mischen. Passende Länge wählen (z. B. 20-40 Min), die sich auf den gewählten Bereich konzentriert.</p>
    <div class="field-row">
      <div>
        <label for="pilates-category-select">Kategorie heute</label>
        <select id="pilates-category-select">
          ${pilatesExercises.map((ex) => `<option value="${ex.id}">${escapeHtml(categoryLabel(ex))}</option>`).join("")}
        </select>
      </div>
    </div>
    <div id="pilates-safety"></div>
    <div class="suggestion" id="pilates-suggestion"></div>
    <div class="sets-container" id="pilates-sets-container"></div>
  `;

  const select = wrap.querySelector("#pilates-category-select");
  const safetyHolder = wrap.querySelector("#pilates-safety");
  const sugg = wrap.querySelector("#pilates-suggestion");
  const container = wrap.querySelector("#pilates-sets-container");

  function renderForSelected() {
    const ex = pilatesExercises.find((e) => e.id === select.value);
    const suggestion = suggestions.get(ex.id);
    container.dataset.exercise = ex.id;
    container.innerHTML = setRowHtml(ex, 1, suggestion);
    sugg.innerHTML = suggestionText(ex, suggestion);
    safetyHolder.innerHTML = ex.safetyNote ? `<div class="safety-banner">⚠️ ${escapeHtml(ex.safetyNote)}</div>` : "";
  }

  select.addEventListener("change", renderForSelected);
  renderForSelected();

  return wrap;
}

function suggestionText(ex, s) {
  if (ex.type === "weighted") {
    const loadTxt = s.load == null ? "Startgewicht frei wählen" : `<strong>${fmtNum(s.load)} kg</strong>`;
    const cappedTxt = s.capped ? ` <span class="badge badge-danger">Obergrenze erreicht</span>` : "";
    return `Ziel: ${loadTxt} × <strong>${s.repMin}-${s.repMax} Wdh.</strong>${cappedTxt}`;
  }
  if (ex.type === "band") {
    return `Ziel: Band <strong>${escapeHtml(s.bandLevel)}</strong> × <strong>${s.repMin}-${s.repMax} Wdh.</strong>`;
  }
  if (ex.type === "bodyweight") {
    const unit = ex.holdBased ? "Sek. gesamt" : ex.unitLabel ? ex.unitLabel + " gesamt" : "Wdh. gesamt";
    const bump = s.suggestLoadBump
      ? `<br/><strong>Ziel stabil erreicht</strong> — ${ex.loadType === "rucksack" ? "Zusatzgewicht im Rucksack einführen (z. B. 2,5-5 kg)?" : "Steigerung einführen?"}`
      : "";
    return `Ziel-Volumen: <strong>${s.targetVolume} ${unit}</strong> (verteilt auf ${ex.sets} Sätze)${bump}`;
  }
  if (ex.type === "cardio") {
    return s.duration ? `Referenz: <strong>${s.duration} Min</strong>, ${escapeHtml(s.pace || "")}` : "Dauer & Tempo eintragen";
  }
  if (ex.type === "pilates") {
    const weightTxt =
      s.weight != null
        ? `Vorschlag falls mit Gewicht: <strong>${fmtNum(s.weight)} kg pro Hantel</strong>`
        : "Bodyweight oder ganz leichtes Gewicht — dir überlassen";
    const deloadTxt = s.deload && s.deloadHint ? `<br/>${escapeHtml(s.deloadHint)}` : "";
    return `Passendes Video wählen und Dauer eintragen. ${weightTxt}${deloadTxt}`;
  }
  return "";
}

function setRowHtml(ex, index, suggestion) {
  const num = `<span class="set-num">${index}.</span>`;

  if (ex.type === "weighted") {
    const w = suggestion && suggestion.load != null ? suggestion.load : "";
    return `<div class="set-row">${num}
      <div class="field"><label>kg</label><input type="number" step="0.5" min="0" inputmode="decimal" data-field="weight" value="${w}" /></div>
      <div class="field"><label>Wdh.</label><input type="number" min="0" inputmode="numeric" data-field="reps" placeholder="${suggestion ? suggestion.repMax : ""}" /></div>
      <button class="rm" aria-label="Satz entfernen">×</button>
    </div>`;
  }
  if (ex.type === "band") {
    const level = (suggestion && suggestion.bandLevel) || ex.bandLevel || "mittel";
    return `<div class="set-row">${num}
      <div class="field"><label>Wdh.</label><input type="number" min="0" inputmode="numeric" data-field="reps" placeholder="${suggestion ? suggestion.repMax : ""}" /></div>
      <div class="field"><label>Band</label>
        <select data-field="level">
          ${BAND_LEVELS.map((l) => `<option value="${l}" ${l === level ? "selected" : ""}>${l}</option>`).join("")}
        </select>
      </div>
      <button class="rm" aria-label="Satz entfernen">×</button>
    </div>`;
  }
  if (ex.type === "bodyweight") {
    const key = ex.holdBased ? "seconds" : "reps";
    const label = ex.holdBased ? "Sek." : ex.unitLabel || "Wdh.";
    const perSetGuess = suggestion && suggestion.targetVolume ? Math.round(suggestion.targetVolume / (ex.sets || 1)) : "";
    return `<div class="set-row">${num}
      <div class="field"><label>${escapeHtml(label)}</label><input type="number" min="0" inputmode="numeric" data-field="${key}" placeholder="${perSetGuess}" /></div>
      <button class="rm" aria-label="Satz entfernen">×</button>
    </div>`;
  }
  if (ex.type === "cardio") {
    const dur = (suggestion && suggestion.duration) || "";
    const pace = (suggestion && suggestion.pace) || "locker";
    return `<div class="set-row">
      <div class="field"><label>Minuten</label><input type="number" min="0" inputmode="numeric" data-field="duration" value="${dur}" /></div>
      <div class="field"><label>Tempo</label>
        <input list="pace-options" data-field="pace" value="${escapeHtml(pace)}" />
        <datalist id="pace-options">${PACE_OPTIONS.map((p) => `<option value="${p}">`).join("")}</datalist>
      </div>
    </div>`;
  }
  if (ex.type === "pilates") {
    const w = suggestion && suggestion.weight != null ? suggestion.weight : "";
    return `<div class="set-row">
      <div class="field"><label>Minuten</label><input type="number" min="0" inputmode="numeric" data-field="duration" list="pilates-duration-options" />
        <datalist id="pilates-duration-options"><option value="20"><option value="30"><option value="40"></datalist>
      </div>
      <div class="field"><label>kg pro Hantel (optional)</label><input type="number" step="0.5" min="0" inputmode="decimal" data-field="weight" placeholder="${w !== "" ? fmtNum(w) : "Bodyweight"}" /></div>
    </div>`;
  }
  return "";
}
