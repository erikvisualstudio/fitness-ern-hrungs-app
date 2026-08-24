import { db } from "./db.js";
import * as profileView from "./views/profile.js";
import * as dashboardView from "./views/dashboard.js";
import * as logView from "./views/log.js";
import * as historyView from "./views/history.js";
import * as settingsView from "./views/settings.js";
import * as nutritionView from "./views/nutrition.js";
import * as shoppingView from "./views/shopping.js";
import { initSync } from "./sync.js";
import { icons } from "./icons.js";

const appEl = document.getElementById("app");
const topbarEl = document.getElementById("topbar");
const tabbarEl = document.getElementById("tabbar");

const TABS = [
  { key: "dashboard", label: "Heute", icon: icons.home, href: "#/dashboard" },
  { key: "nutrition", label: "Ernährung", icon: icons.nutrition, href: "#/nutrition" },
  { key: "shopping", label: "Einkauf", icon: icons.cart, href: "#/shopping" },
  { key: "history", label: "Verlauf", icon: icons.trending, href: "#/history" },
  { key: "settings", label: "Einstellungen", icon: icons.settings, href: "#/settings" },
];

function navigate(hash) {
  if (location.hash === hash) {
    render();
  } else {
    location.hash = hash;
  }
}

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "dashboard", params: [] };
  return { name: parts[0], params: parts.slice(1) };
}

function renderChrome(routeName, title, showBack) {
  const showTabs = Boolean(db.getCurrentUserId()) && routeName !== "profile";

  if (!showTabs) {
    topbarEl.style.display = "none";
    tabbarEl.style.display = "none";
    document.body.style.paddingBottom = "0";
    return;
  }

  topbarEl.style.display = "flex";
  document.body.style.paddingBottom = "";

  if (showBack) {
    topbarEl.innerHTML = `
      <button class="back" id="back-btn">‹ Zurück</button>
      <span class="title">${title || ""}</span>
      <span class="spacer"></span>
    `;
    topbarEl.querySelector("#back-btn").addEventListener("click", () => {
      const activeTab = TABS.find((t) => t.key === activeTabFor(routeName));
      navigate(activeTab ? activeTab.href : "#/dashboard");
    });
  } else {
    const user = db.getUser(db.getCurrentUserId());
    topbarEl.innerHTML = `
      <span class="title">Trainingstracker</span>
      <span style="font-size:0.85rem; color:var(--text-dim); font-weight:600;">${user ? user.name : ""}</span>
    `;
  }

  tabbarEl.style.display = "flex";
  const active = activeTabFor(routeName);
  tabbarEl.innerHTML = TABS.map(
    (t) => `<button class="${t.key === active ? "active" : ""}" data-tab="${t.href}">
      <span class="icon">${t.icon(21)}</span>${t.label}
    </button>`
  ).join("");
  tabbarEl.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.tab));
  });
}

function activeTabFor(routeName) {
  if (routeName === "dashboard" || routeName === "log") return "dashboard";
  if (routeName === "nutrition") return "nutrition";
  if (routeName === "shopping") return "shopping";
  if (routeName === "history") return "history";
  if (routeName === "settings") return "settings";
  return null;
}

function renderNow() {
  const { name, params } = parseRoute();
  const currentUserId = db.getCurrentUserId();

  if (name !== "profile" && !currentUserId) {
    location.hash = "#/profile";
    return;
  }
  if (name === "profile" && currentUserId && !location.hash.includes("force")) {
    // Erlaubt manuelles Aufrufen von #/profile zum Wechseln, kein Auto-Redirect nötig.
  }

  const ctx = { navigate, params };

  const routes = {
    profile: { view: profileView, title: "Profil", back: false },
    dashboard: { view: dashboardView, title: "Heute", back: false },
    log: { view: logView, title: "Session loggen", back: true },
    nutrition: { view: nutritionView, title: "Ernährung", back: false },
    shopping: { view: shoppingView, title: "Einkaufsliste", back: false },
    history: {
      view: historyView,
      title: params[0] === "muscle" ? params[1] || "Muskelgruppe" : params[0] ? "Übung" : "Verlauf",
      back: Boolean(params[0]),
    },
    settings: { view: settingsView, title: "Einstellungen", back: false },
  };

  const route = routes[name] || routes.dashboard;
  renderChrome(name, route.title, route.back);
  appEl.innerHTML = "";
  route.view.mount(appEl, ctx);
  window.scrollTo(0, 0);
}

let firstRender = true;
let currentTransition = null;

// Seitenwechsel bekommen einen sanften Übergang statt eines harten Schnitts
// — genau das Detail, das eine Web-App optisch von einer echten App
// unterscheidet. Fällt bei fehlender Browser-Unterstützung automatisch auf
// den harten Wechsel zurück; der allererste Seitenaufbau bleibt bewusst
// ohne Übergang (App-Start soll sofort da sein, nicht erst einblenden).
//
// Läuft bereits ein Übergang (z. B. schneller Doppel-Tap oder ein
// Profilwechsel, der sofort weiterleitet), wird er explizit übersprungen
// statt zu überlappen — sonst bricht der Browser ihn selbst ab und wirft
// einen unbehandelten Promise-Fehler.
function render() {
  if (firstRender || !document.startViewTransition) {
    firstRender = false;
    renderNow();
    return;
  }
  if (currentTransition) currentTransition.skipTransition();
  try {
    currentTransition = document.startViewTransition(() => renderNow());
    // Die View-Transition-API hat mehrere interne Promises (ready,
    // updateCallbackDone, finished) — ein übersprungener/abgebrochener
    // Übergang lässt "ready" ablehnen, auch wenn "finished" trotzdem noch
    // erfüllt wird. Alle drei müssen abgefangen werden, sonst landet eine
    // abgelehnte Promise unbehandelt in der Konsole.
    currentTransition.ready.catch(() => {});
    currentTransition.updateCallbackDone.catch(() => {});
    currentTransition.finished.catch(() => {}).finally(() => {
      currentTransition = null;
    });
  } catch (err) {
    currentTransition = null;
    renderNow();
  }
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);
if (document.readyState !== "loading") render();

// Wenn ein anderes Gerät die Ernährungsdaten aktualisiert hat, nur neu rendern
// wenn die Ernährungsseite gerade offen ist — sonst würden z. B. gerade
// ausgefüllte Formulare auf anderen Seiten mitten im Tippen zurückgesetzt.
// Ohne Seitenübergang, da das im Hintergrund passiert (kein Nutzer-Klick).
window.addEventListener("app:nutrition-synced", () => {
  if (parseRoute().name === "nutrition") renderNow();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("Service Worker Registrierung fehlgeschlagen:", err);
    });
  });
}

// Cloud-Sync (nur Ernährung) im Hintergrund starten — blockiert das erste
// Rendern nicht, degradiert bei fehlendem Internet einfach zu rein lokal.
initSync();
