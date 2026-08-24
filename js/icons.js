// Eigenes, konsistentes Icon-Set (dünne Linien-Icons, gleiche Bildsprache wie
// das Balken-Logo) statt Emoji für UI-Chrome (Tableiste, Status-/Aktions-
// Icons) — Emoji sehen je nach Betriebssystem unterschiedlich aus und wirken
// dadurch inkonsistent mit dem Rest der App. `currentColor` heißt: das Icon
// übernimmt automatisch die Textfarbe der Umgebung (aktiver Tab, Dark Mode,
// etc.), ohne eigene Farblogik.
function icon(paths) {
  return (size = 20) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export const icons = {
  home: icon(`<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20a1 1 0 0 0 1 1h3.5v-5.5a1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5V21H17a1 1 0 0 0 1-1v-9.5"/>`),

  nutrition: icon(`<path d="M4 11a8 8 0 0 0 16 0Z"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="12" y1="4.5" x2="12" y2="7"/>`),

  cart: icon(`<circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2.2l2.1 11.6a1.6 1.6 0 0 0 1.6 1.4h8.4a1.6 1.6 0 0 0 1.58-1.34L20.5 8H6.2"/>`),

  // Selbes Balken-Motiv wie das App-Icon — Wiedererkennung.
  trending: icon(`<rect x="4" y="14" width="4" height="7" rx="1.3"/><rect x="10" y="9" width="4" height="12" rx="1.3"/><rect x="16" y="4" width="4" height="17" rx="1.3"/>`),

  settings: icon(`<line x1="4" y1="7" x2="20" y2="7"/><circle cx="14.5" cy="7" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="8.5" cy="12" r="2"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="15.5" cy="17" r="2"/>`),

  sync: icon(`<path d="M20 12a8 8 0 1 1-2.34-5.66"/><polyline points="20 4 20 8 16 8"/>`),

  cloud: icon(`<path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.9-1A4.5 4.5 0 0 1 17 18H7Z"/>`),

  cloudOff: icon(`<path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.9-1A4.5 4.5 0 0 1 17 18H7Z"/><line x1="3.5" y1="3.5" x2="20.5" y2="20.5"/>`),

  shuffle: icon(`<path d="M4 7h3.5l9 10H20"/><path d="M4 17h3.5l2.3-2.6"/><polyline points="17 4 21 7 17 10"/><polyline points="17 14 21 17 17 20"/>`),

  pin: icon(`<path d="M12 21c-3.8-4-6.5-7.4-6.5-10.5a6.5 6.5 0 1 1 13 0c0 3.1-2.7 6.5-6.5 10.5Z"/><circle cx="12" cy="10.3" r="2.1"/>`),

  check: icon(`<circle cx="12" cy="12" r="9"/><polyline points="8 12.3 11 15.3 16 9.3"/>`),

  warning: icon(`<path d="M12 3.5 21.5 20h-19L12 3.5Z"/><line x1="12" y1="9.5" x2="12" y2="13.7"/><circle cx="12" cy="16.8" r="0.6" fill="currentColor" stroke="none"/>`),

  search: icon(`<circle cx="10.3" cy="10.3" r="6.3"/><line x1="19" y1="19" x2="14.8" y2="14.8"/>`),
};
