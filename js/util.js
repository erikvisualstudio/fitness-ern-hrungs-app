export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDateDE(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function fmtNum(n) {
  if (n == null || Number.isNaN(n)) return "–";
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace(".", ",");
}

let toastTimer = null;
// message darf HTML enthalten (z. B. ein Icon aus icons.js) — alle Aufrufer
// in dieser App übergeben nur selbst geschriebene, feste Texte, nie
// Nutzereingaben. options.celebrate zeigt einen betonten "Belohnungsmoment"-
// Toast (z. B. neuer Rekord) statt der normalen stillen Bestätigung.
export function showToast(message, options = {}) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.innerHTML = message;
  el.classList.toggle("celebrate", Boolean(options.celebrate));
  el.classList.remove("show");
  // Reflow erzwingen, damit die celebrate-Animation bei zwei schnell
  // aufeinanderfolgenden Toasts jedes Mal neu von vorne abspielt.
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), options.duration || (options.celebrate ? 3200 : 2200));
}
