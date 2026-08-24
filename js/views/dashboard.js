import { db, todayISO } from "../db.js";
import { getBlockWeek, isDeloadWeek } from "../progression.js";
import { escapeHtml, formatDateDE } from "../util.js";
import { icons } from "../icons.js";

const MONTH_NAMES = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Modul-Zustand (bleibt über Re-Renders innerhalb derselben Seiten-Sitzung
// erhalten, wie selectedDate in nutrition.js) — welcher Monat gerade
// angezeigt wird und welcher Tag gerade im Detail aufgeklappt ist.
let monthOffset = 0;
let selectedCalDate = null;

export function mount(root, { navigate }) {
  render(root, navigate);
}

function render(root, navigate) {
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

    <div class="section-title">Kalender</div>
    <p class="meta" style="margin-top:-6px;">Zeigt, was an welchem Tag tatsächlich gemacht wurde — unabhängig von der festen Reihenfolge oben. Ein Tag antippen, um nachzutragen oder als Pausetag zu markieren.</p>
    <div id="calendar-holder"></div>
  `;

  root.querySelectorAll("[data-day]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`#/log/${btn.dataset.day}`));
  });

  const calHolder = root.querySelector("#calendar-holder");
  calHolder.appendChild(buildCalendar(userId, days, navigate, () => render(root, navigate)));
}

function dayName(days, dayId) {
  const d = days.find((x) => x.id === dayId);
  return d ? d.name : dayId;
}

// "Tag 3 — Beine" -> "T3"; Fallback auf die ersten beiden Zeichen, falls ein
// Tagesname mal nicht dem "Tag N"-Muster folgt.
function shortDayLabel(name) {
  const m = name.match(/Tag\s*(\d+)/);
  return m ? `T${m[1]}` : name.slice(0, 2);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function buildCalendar(userId, days, navigate, rerenderDashboard) {
  const wrap = document.createElement("div");
  wrap.className = "card";

  function draw() {
    const today = new Date();
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const todayIso = todayISO();

    const sessions = db.getSessions(userId);
    const sessionsByDate = new Map();
    sessions.forEach((s) => {
      if (!sessionsByDate.has(s.date)) sessionsByDate.set(s.date, []);
      sessionsByDate.get(s.date).push(s);
    });
    const restDays = db.getRestDays(userId);

    const firstOfMonth = new Date(year, month, 1);
    const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Montag = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let cellsHtml = "";
    for (let i = 0; i < startWeekday; i++) cellsHtml += `<div class="cal-cell empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateIso = `${year}-${pad2(month + 1)}-${pad2(d)}`;
      const daySessions = sessionsByDate.get(dateIso);
      const isRest = restDays.includes(dateIso);
      const isToday = dateIso === todayIso;
      const isFuture = dateIso > todayIso;

      let markHtml = "";
      let cellClass = "cal-cell";
      if (daySessions && daySessions.length) {
        const dayDef = days.find((x) => x.id === daySessions[daySessions.length - 1].dayId);
        markHtml = `<span class="cal-mark cal-mark-session">${escapeHtml(dayDef ? shortDayLabel(dayDef.name) : "?")}</span>`;
        cellClass += " has-session";
      } else if (isRest) {
        markHtml = `<span class="cal-mark cal-mark-rest">–</span>`;
        cellClass += " has-rest";
      }
      if (isToday) cellClass += " is-today";
      if (dateIso === selectedCalDate) cellClass += " is-selected";

      cellsHtml += `<button type="button" class="${cellClass}" data-cal-date="${dateIso}" ${isFuture ? "disabled" : ""}>
        <span class="cal-daynum">${d}</span>${markHtml}
      </button>`;
    }

    wrap.innerHTML = `
      <div class="row-between" style="margin-bottom:10px;">
        <button type="button" class="link-btn" data-cal-prev>${icons.chevronLeft(18)}</button>
        <strong>${MONTH_NAMES[month]} ${year}</strong>
        <button type="button" class="link-btn" data-cal-next ${monthOffset >= 0 ? "disabled" : ""}>${icons.chevronRight(18)}</button>
      </div>
      <div class="cal-weekdays">${WEEKDAY_LABELS.map((l) => `<span>${l}</span>`).join("")}</div>
      <div class="cal-grid">${cellsHtml}</div>
      <div id="cal-detail">${selectedCalDate ? calDetailHtml(selectedCalDate, userId, days) : ""}</div>
    `;

    wrap.querySelector("[data-cal-prev]").addEventListener("click", () => {
      monthOffset -= 1;
      draw();
    });
    const nextBtn = wrap.querySelector("[data-cal-next]");
    if (!nextBtn.disabled) {
      nextBtn.addEventListener("click", () => {
        monthOffset = Math.min(0, monthOffset + 1);
        draw();
      });
    }

    wrap.querySelectorAll("[data-cal-date]:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedCalDate = selectedCalDate === btn.dataset.calDate ? null : btn.dataset.calDate;
        draw();
      });
    });

    bindDetailEvents();
  }

  function bindDetailEvents() {
    const detail = wrap.querySelector("#cal-detail");
    if (!detail) return;

    detail.querySelectorAll("[data-cal-del-session]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Diese Session wirklich löschen?")) return;
        db.deleteSession(userId, btn.dataset.calDelSession);
        rerenderDashboard();
      });
    });

    detail.querySelectorAll("[data-cal-rest]").forEach((btn) => {
      btn.addEventListener("click", () => {
        db.toggleRestDay(userId, btn.dataset.calRest);
        rerenderDashboard();
      });
    });

    detail.querySelectorAll("[data-cal-unrest]").forEach((btn) => {
      btn.addEventListener("click", () => {
        db.toggleRestDay(userId, btn.dataset.calUnrest);
        rerenderDashboard();
      });
    });

    detail.querySelectorAll("[data-cal-log]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [dayId, dateIso] = btn.dataset.calLog.split("|");
        navigate(`#/log/${dayId}/${dateIso}`);
      });
    });
  }

  draw();
  return wrap;
}

function calDetailHtml(dateIso, userId, days) {
  const sessions = db.getSessions(userId).filter((s) => s.date === dateIso);
  const isRest = db.getRestDays(userId).includes(dateIso);

  if (sessions.length > 0) {
    return `
      <div class="cal-detail-box">
        <div class="meta" style="margin-bottom:6px;">${formatDateDE(dateIso)}</div>
        ${sessions
          .map(
            (s) => `
          <div class="row-between" style="margin-bottom:4px;">
            <span>${escapeHtml(dayName(days, s.dayId))}</span>
            <button type="button" class="link-btn" style="color:var(--danger);" data-cal-del-session="${s.id}">Löschen</button>
          </div>`
          )
          .join("")}
      </div>
    `;
  }

  if (isRest) {
    return `
      <div class="cal-detail-box">
        <div class="meta" style="margin-bottom:8px;">${formatDateDE(dateIso)} — Pausetag</div>
        <button type="button" class="link-btn" data-cal-unrest="${dateIso}">Pausetag aufheben</button>
      </div>
    `;
  }

  return `
    <div class="cal-detail-box">
      <div class="meta" style="margin-bottom:8px;">${formatDateDE(dateIso)} — nachtragen</div>
      <div class="cal-day-picks">
        ${days.map((d) => `<button type="button" class="btn btn-secondary btn-sm" data-cal-log="${d.id}|${dateIso}">${escapeHtml(shortDayLabel(d.name))}</button>`).join("")}
      </div>
      <button type="button" class="link-btn" style="margin-top:8px;" data-cal-rest="${dateIso}">Als Pausetag markieren</button>
    </div>
  `;
}
