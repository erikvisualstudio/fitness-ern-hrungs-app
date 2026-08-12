import { db, todayISO } from "../db.js";
import { getBlockWeek, isDeloadWeek } from "../progression.js";
import { escapeHtml, formatDateDE } from "../util.js";

export function mount(root, { navigate }) {
  const userId = db.getCurrentUserId();
  const user = db.getUser(userId);
  const days = db.getWorkoutDays(userId);
  const sessions = db.getSessions(userId);
  const blockStart = db.getBlockStartDate(userId);
  const weekInBlock = getBlockWeek(blockStart, todayISO());
  const deload = isDeloadWeek(weekInBlock);

  const lastSession = sessions[sessions.length - 1];

  root.innerHTML = `
    <h1>Hallo ${escapeHtml(user.name)} 👋</h1>
    <p>${formatDateDE(todayISO())}</p>

    <div class="card" style="display:flex; align-items:center; justify-content:space-between;">
      <div>
        <div class="stat-label">Trainingsblock</div>
        <div class="stat-value">Woche ${weekInBlock}<span style="color:var(--text-dim); font-weight:700;"> / 4</span></div>
      </div>
      ${deload ? `<span class="badge badge-warn">Deload-Woche</span>` : `<span class="badge">Aufbauwoche</span>`}
    </div>

    ${
      lastSession
        ? `<div class="card">
            <div class="section-title" style="margin-top:0;">Letzte Session</div>
            <div class="row-between">
              <div>
                <strong>${escapeHtml(dayName(days, lastSession.dayId))}</strong>
                <div class="meta">${formatDateDE(lastSession.date)}</div>
              </div>
            </div>
          </div>`
        : ""
    }

    <div class="section-title">Trainingstage</div>
    <div class="list">
      ${days
        .map(
          (d) => `
        <button class="list-item" data-day="${d.id}">
          <div>
            <div><strong>${escapeHtml(d.name)}</strong></div>
            <div class="meta">${d.location ? escapeHtml(d.location) : "Session loggen"}</div>
          </div>
          <span class="chev">›</span>
        </button>`
        )
        .join("")}
    </div>
  `;

  root.querySelectorAll("[data-day]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`#/log/${btn.dataset.day}`));
  });
}

function dayName(days, dayId) {
  const d = days.find((x) => x.id === dayId);
  return d ? d.name : dayId;
}
