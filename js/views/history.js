import { db } from "../db.js";
import { escapeHtml, formatDateDE, fmtNum, showToast } from "../util.js";

export function mount(root, { navigate, params }) {
  const exerciseId = params[0];
  if (exerciseId) {
    mountDetail(root, exerciseId, navigate);
  } else {
    mountList(root, navigate);
  }
}

function mountList(root, navigate) {
  const userId = db.getCurrentUserId();
  const exercises = db.getExercises(userId);
  const days = db.getWorkoutDays(userId);
  const sessions = db.getSessions(userId).slice().reverse().slice(0, 12);

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

    <div class="section-title">Nach Übung</div>
    <div class="list">
      ${exercises
        .map(
          (ex) => `
        <button class="list-item" data-exercise="${ex.id}">
          <div><strong>${escapeHtml(ex.name)}</strong></div>
          <span class="chev">›</span>
        </button>`
        )
        .join("")}
    </div>
  `;

  root.querySelectorAll("[data-exercise]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`#/history/${btn.dataset.exercise}`));
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
    ${ex.safetyNote ? `<div class="safety-banner">⚠️ ${escapeHtml(ex.safetyNote)}</div>` : ""}
    ${sessions.length ? `<div class="card">${sparklineSvg(ex, sessions)}</div>` : ""}
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
  return "";
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
  return null;
}

function sparklineSvg(ex, sessions) {
  const values = sessions.map((s) => metricForSession(ex, s.sets[ex.id])).filter((v) => v != null);
  if (values.length < 2) {
    const label = metricLabel(ex);
    return `<div class="meta">${label}: ${values[0] != null ? fmtNum(values[0]) : "–"} (noch zu wenig Daten für einen Trend)</div>`;
  }
  const w = 300;
  const h = 60;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * (h - 8) - 4).toFixed(1)}`)
    .join(" ");

  return `
    <div class="meta" style="margin-bottom:6px;">${metricLabel(ex)} über Zeit (letzter Wert: <strong>${fmtNum(values[values.length - 1])}</strong>)</div>
    <svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

function metricLabel(ex) {
  if (ex.type === "weighted") return "Gewicht (kg, max. Satz)";
  if (ex.type === "band") return "Wiederholungen (max. Satz)";
  if (ex.type === "bodyweight") return ex.holdBased ? "Gesamtdauer (Sek.)" : "Gesamtvolumen (Wdh.)";
  if (ex.type === "cardio") return "Dauer (Min)";
  return "";
}
