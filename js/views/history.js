import { db } from "../db.js";
import { escapeHtml, formatDateDE, fmtNum, showToast } from "../util.js";
import { icons } from "../icons.js";

function safetyBannerHtml(note) {
  return `<div class="safety-banner"><span class="status-inline">${icons.warning(15)}${escapeHtml(note)}</span></div>`;
}

export function mount(root, { navigate, params }) {
  if (params[0] === "muscle") {
    mountMuscleGroup(root, params[1], navigate);
  } else if (params[0]) {
    mountDetail(root, params[0], navigate);
  } else {
    mountList(root, navigate);
  }
}

function muscleGroupsFor(exercises) {
  const groups = new Map();
  exercises.forEach((ex) => {
    const group = ex.muscleGroup || "Sonstiges";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(ex);
  });
  return groups;
}

function mountList(root, navigate) {
  const userId = db.getCurrentUserId();
  const exercises = db.getExercises(userId);
  const days = db.getWorkoutDays(userId);
  const sessions = db.getSessions(userId).slice().reverse().slice(0, 12);
  const groups = muscleGroupsFor(exercises);
  const groupNames = [...groups.keys()].sort((a, b) => a.localeCompare(b, "de"));

  root.innerHTML = `
    <h1>Verlauf</h1>

    <div class="section-title">Letzte Sessions</div>
    ${
      sessions.length
        ? `<div class="list" id="recent-sessions">
          ${sessions
            .map(
              (s) => `
            <div class="list-item">
              <div>
                <div><strong>${escapeHtml(dayName(days, s.dayId))}</strong></div>
                <div class="meta">${formatDateDE(s.date)} · ${Object.keys(s.sets).length} Übung(en)</div>
              </div>
              <button class="link-btn" data-del-session="${s.id}" style="color: var(--danger);">Löschen</button>
            </div>`
            )
            .join("")}
        </div>`
        : `<p>Noch keine Sessions geloggt.</p>`
    }

    <div class="section-title">Nach Muskelgruppe</div>
    <p class="meta" style="margin-top:-6px;">Steigerung bei Gewicht &amp; Wiederholungen im Zeitverlauf, gebündelt nach Muskelgruppe.</p>
    <div class="muscle-chip-row">
      ${groupNames
        .map(
          (g) => `<button class="muscle-chip" data-muscle="${escapeHtml(g)}">${escapeHtml(g)} <span class="meta">${groups.get(g).length}</span></button>`
        )
        .join("")}
    </div>

    <div class="section-title">Nach Übung</div>
    <div class="list">
      ${exercises
        .map(
          (ex) => `
        <button class="list-item" data-exercise="${ex.id}">
          <div><strong>${escapeHtml(ex.name)}</strong>${ex.muscleGroup ? `<div class="meta">${escapeHtml(ex.muscleGroup)}</div>` : ""}</div>
          <span class="chev">›</span>
        </button>`
        )
        .join("")}
    </div>
  `;

  root.querySelectorAll("[data-exercise]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`#/history/${btn.dataset.exercise}`));
  });

  root.querySelectorAll("[data-muscle]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`#/history/muscle/${encodeURIComponent(btn.dataset.muscle)}`));
  });

  root.querySelectorAll("[data-del-session]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Diese Session wirklich löschen?")) return;
      db.deleteSession(userId, btn.dataset.delSession);
      showToast("Session gelöscht");
      mountList(root, navigate);
    });
  });
}

function mountMuscleGroup(root, groupNameRaw, navigate) {
  const groupName = decodeURIComponent(groupNameRaw || "");
  const userId = db.getCurrentUserId();
  const exercises = db.getExercises(userId).filter((ex) => (ex.muscleGroup || "Sonstiges") === groupName);

  if (exercises.length === 0) {
    root.innerHTML = `<div class="empty-state"><div class="icon">🤔</div><p>Keine Übungen in dieser Muskelgruppe.</p></div>`;
    return;
  }

  const wrap = document.createElement("div");
  wrap.innerHTML = `<h1>${escapeHtml(groupName)}</h1><p>Fortschritt aller Übungen dieser Muskelgruppe im Überblick.</p>`;
  root.innerHTML = "";
  root.appendChild(wrap);

  exercises.forEach((ex) => {
    const sessions = db.getSessionsForExercise(userId, ex.id);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="row-between" style="margin-bottom: ${sessions.length ? "4" : "0"}px;">
        <h3 style="margin:0;">${escapeHtml(ex.name)}</h3>
        <button class="link-btn" data-open="${ex.id}">Details ›</button>
      </div>
      ${sessions.length ? comboChartSvg(ex, sessions) : `<p class="meta" style="margin:0;">Noch keine Einträge.</p>`}
    `;
    root.appendChild(card);
  });

  root.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`#/history/${btn.dataset.open}`));
  });
}

function mountDetail(root, exerciseId, navigate) {
  const userId = db.getCurrentUserId();
  const ex = db.getExercise(userId, exerciseId);
  if (!ex) {
    root.innerHTML = `<div class="empty-state"><div class="icon">🤔</div><p>Übung nicht gefunden.</p></div>`;
    return;
  }
  const sessions = db.getSessionsForExercise(userId, exerciseId);

  root.innerHTML = `
    <h1>${escapeHtml(ex.name)}</h1>
    ${ex.muscleGroup ? `<button class="link-btn" id="to-muscle" style="margin-top:-8px;">${escapeHtml(ex.muscleGroup)} — alle Übungen ›</button>` : ""}
    ${ex.safetyNote ? safetyBannerHtml(ex.safetyNote) : ""}
    ${sessions.length ? `<div class="card">${comboChartSvg(ex, sessions)}</div>` : ""}
    ${
      sessions.length
        ? `<table class="hist-table">
        <thead><tr><th>Datum</th><th>Sätze</th></tr></thead>
        <tbody>
          ${sessions
            .slice()
            .reverse()
            .map((s) => `<tr><td>${formatDateDE(s.date)}</td><td>${formatSets(ex, s.sets[exerciseId])}</td></tr>`)
            .join("")}
        </tbody>
      </table>`
        : `<div class="empty-state"><div class="icon">📭</div><p>Noch keine Einträge für diese Übung.</p></div>`
    }
  `;

  const toMuscle = root.querySelector("#to-muscle");
  if (toMuscle) {
    toMuscle.addEventListener("click", () => navigate(`#/history/muscle/${encodeURIComponent(ex.muscleGroup)}`));
  }
}

function dayName(days, dayId) {
  const d = days.find((x) => x.id === dayId);
  return d ? d.name : dayId;
}

function formatSets(ex, sets) {
  if (!sets) return "–";
  if (ex.type === "weighted") return sets.map((s) => `${fmtNum(s.weight)}kg×${s.reps}`).join(", ");
  if (ex.type === "band") return sets.map((s) => `${s.reps} (${escapeHtml(s.level || "")})`).join(", ");
  if (ex.type === "bodyweight") {
    const key = ex.holdBased ? "seconds" : "reps";
    const total = sets.reduce((sum, s) => sum + (Number(s[key]) || 0), 0);
    return `${sets.map((s) => s[key]).join("+")} = ${total}`;
  }
  if (ex.type === "cardio") return sets.map((s) => `${s.duration} Min, ${escapeHtml(s.pace || "")}`).join(", ");
  if (ex.type === "pilates") {
    return sets
      .map((s) => `${s.duration} Min, ${s.loadMode === "gewicht" ? `${fmtNum(s.weight)}kg/Hantel` : "Bodyweight"}`)
      .join(", ");
  }
  return "";
}

// Für weighted-Übungen: den Satz mit dem höchsten Gewicht dieser Session
// finden und dessen Gewicht+Wiederholungen zusammen zurückgeben (nicht
// unabhängig voneinander das Maximum je Feld, sonst könnten Werte aus
// unterschiedlichen Sätzen gemischt werden).
function topSet(ex, sets) {
  if (!sets || !sets.length) return null;
  if (ex.type === "weighted") {
    return sets.reduce((best, s) => (best == null || s.weight > best.weight ? s : best), null);
  }
  return null;
}

function metricForSession(ex, sets) {
  if (!sets) return null;
  if (ex.type === "weighted") return Math.max(...sets.map((s) => s.weight));
  if (ex.type === "band") return Math.max(...sets.map((s) => s.reps));
  if (ex.type === "bodyweight") {
    const key = ex.holdBased ? "seconds" : "reps";
    return sets.reduce((sum, s) => sum + (Number(s[key]) || 0), 0);
  }
  if (ex.type === "cardio") return sets[0] ? sets[0].duration : null;
  if (ex.type === "pilates") return sets[0] ? sets[0].duration : null;
  return null;
}

function metricLabel(ex) {
  if (ex.type === "weighted") return "Gewicht (kg, Bestsatz)";
  if (ex.type === "band") return "Wiederholungen (max. Satz)";
  if (ex.type === "bodyweight") return ex.holdBased ? "Gesamtdauer (Sek.)" : "Gesamtvolumen (Wdh.)";
  if (ex.type === "cardio") return "Dauer (Min)";
  if (ex.type === "pilates") return "Dauer (Min)";
  return "";
}

// Liniendiagramm mit Füllfläche, Gitterlinien und betontem letzten Punkt.
// Bei Gewichts-Übungen wird zusätzlich die Wiederholungszahl des Bestsatzes
// als kleine Beschriftung über jedem Punkt angezeigt — "Gewicht UND
// Wiederholungen" auf einen Blick, ohne eine zweite, verwirrende Linie.
function comboChartSvg(ex, sessions) {
  const points = sessions
    .map((s) => ({
      date: s.date,
      value: metricForSession(ex, s.sets[ex.id]),
      reps: ex.type === "weighted" ? (topSet(ex, s.sets[ex.id]) || {}).reps : null,
    }))
    .filter((p) => p.value != null);

  if (points.length < 2) {
    return `<div class="meta">${metricLabel(ex)}: ${points[0] ? fmtNum(points[0].value) : "–"} (noch zu wenig Daten für einen Trend)</div>`;
  }

  const w = 320;
  const h = 130;
  const padTop = 22;
  const padBottom = 22;
  const padX = 4;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotH = h - padTop - padBottom;
  const step = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;

  const xy = (v, i) => ({
    x: padX + i * step,
    y: padTop + plotH - ((v - min) / range) * plotH,
  });

  const coords = points.map((p, i) => xy(p.value, i));
  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPoints = `${padX},${padTop + plotH} ${linePoints} ${(padX + (points.length - 1) * step).toFixed(1)},${padTop + plotH}`;

  const gridLines = [0, 0.5, 1]
    .map((f) => {
      const y = padTop + plotH * f;
      const label = fmtNum(max - range * f);
      return `<line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" stroke="var(--border)" stroke-width="1" />
        <text x="${w - padX}" y="${y - 3}" text-anchor="end" font-size="9" fill="var(--text-dim)">${label}</text>`;
    })
    .join("");

  const dots = coords
    .map((c, i) => {
      const isLast = i === coords.length - 1;
      const r = isLast ? 4 : 2.5;
      const repsLabel =
        points[i].reps != null
          ? `<text x="${c.x}" y="${c.y - 8}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-dim)">${points[i].reps}×</text>`
          : "";
      return `${repsLabel}<circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${isLast ? "var(--accent)" : "var(--surface)"}" stroke="var(--accent)" stroke-width="2" />`;
    })
    .join("");

  const firstDate = formatDateDE(points[0].date);
  const lastDate = formatDateDE(points[points.length - 1].date);

  return `
    <div class="row-between meta" style="margin-bottom:6px;">
      <span>${metricLabel(ex)}</span>
      <span><strong style="color:var(--text);">${fmtNum(points[points.length - 1].value)}</strong></span>
    </div>
    <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill-${ex.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35" />
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
        </linearGradient>
      </defs>
      ${gridLines}
      <polygon points="${areaPoints}" fill="url(#chartFill-${ex.id})" />
      <polyline points="${linePoints}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
    </svg>
    <div class="row-between meta" style="margin-top:2px;">
      <span>${firstDate}</span>
      <span>${lastDate}</span>
    </div>
  `;
}
