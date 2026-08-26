// Cloud-Sync für den Ernährungs-Datenstand (NUR "Ernährung", nicht Fitness) über
// Firebase Firestore, damit Erik und Nele auf getrennten Geräten denselben
// Mahlzeitenplan und gegenseitig die Nährwert-Scores sehen.
//
// Bewusst einfach gehalten: EIN gemeinsames Haushalts-Dokument, "Last write wins"
// anhand von state.nutrition.updatedAt (kein Feld-für-Feld-Merge). Für zwei
// Personen, die selten exakt zur selben Sekunde etwas ändern, ist das ausreichend
// robust — bei einem echten Gleichzeitig-Konflikt gewinnt der spätere Schreibzugriff
// und der andere geht verloren.
//
// Ausnahme: Fixierungen (pins) werden gezielt personenweise gemerged (siehe
// mergePinsByPerson in nutrition.js) — UND das beim Hochladen per Firestore-
// TRANSAKTION statt nur anhand eines zwischengespeicherten "letzten bekannten"
// Standes. Grund: eine reine Zwischenspeicher-Lösung (frühere Version dieser
// Datei) schützt nur gegen einen Push mit einem BEWUSST veralteten eigenen
// Wert — nicht aber davor, dass das eigene Gerät den Cloud-Stand des ANDEREN
// Geräts noch gar nicht empfangen hat (Listener-Verzögerung), dann selbst
// speichert und dabei die gerade erst gesetzte Fixierung der anderen Person
// überschreibt, weil der eigene "letzte bekannte Stand" ebenfalls veraltet
// war. Eine Transaktion liest den ECHTEN aktuellen Server-Stand im Moment
// des Schreibens, nicht einen zwischengespeicherten — das schließt die Lücke
// unabhängig von Netzwerk-Timing.
//
// Läuft komplett optional im Hintergrund: ohne Internet/Firebase bleibt die App wie
// bisher rein lokal nutzbar, initSync() blockiert das erste Rendern nicht.
import { db, onNutritionSaved } from "./db.js";
import { mergePinsByPerson } from "./nutrition.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCetyeLXnNRlqZoqnnsmLmGJ8XMBR10Gm8",
  authDomain: "erik-nele-ernaehrung.firebaseapp.com",
  projectId: "erik-nele-ernaehrung",
  storageBucket: "erik-nele-ernaehrung.firebasestorage.app",
  messagingSenderId: "451040989946",
  appId: "1:451040989946:web:6fdb65181ccf8768562f43",
};

const SDK_VERSION = "10.14.1";
const HOUSEHOLD_ID = "erik-nele";
const PUSH_DEBOUNCE_MS = 800;

let docRef = null;
let runTransactionFn = null;
let applyingRemote = false;
let pushTimer = null;

function setStatus(status) {
  window.dispatchEvent(new CustomEvent("app:sync-status", { detail: { status } }));
}

export async function initSync() {
  setStatus("connecting");
  try {
    const [{ initializeApp }, { getAuth, signInAnonymously }, { getFirestore, doc, onSnapshot, runTransaction }] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`),
    ]);

    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    await signInAnonymously(auth);

    docRef = doc(firestore, "households", HOUSEHOLD_ID);
    runTransactionFn = (updater) => runTransaction(firestore, updater);

    onSnapshot(
      docRef,
      (snap) => {
        setStatus("connected");
        const remote = snap.data();
        if (!remote || !remote.nutrition) {
          pushNow(db.getNutritionState());
          return;
        }
        const local = db.getNutritionState();
        if ((remote.nutrition.updatedAt || 0) > (local.updatedAt || 0)) {
          applyingRemote = true;
          db.applyRemoteNutrition(remote.nutrition);
          applyingRemote = false;
          window.dispatchEvent(new CustomEvent("app:nutrition-synced"));
        }
      },
      (err) => {
        console.warn("Firestore-Sync-Fehler:", err);
        setStatus("offline");
      }
    );

    onNutritionSaved((nutrition) => {
      if (applyingRemote) return;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => pushNow(nutrition), PUSH_DEBOUNCE_MS);
    });
  } catch (err) {
    console.warn("Cloud-Sync nicht verfügbar (offline oder Firebase nicht erreichbar):", err);
    setStatus("offline");
  }
}

async function pushNow(nutrition) {
  if (!docRef || !runTransactionFn) return;
  try {
    await runTransactionFn(async (transaction) => {
      const snap = await transaction.get(docRef);
      const remoteData = snap.exists() ? snap.data() : null;
      const remoteNutrition = remoteData ? remoteData.nutrition : null;

      const payload = { ...nutrition };
      if (remoteNutrition && remoteNutrition.pins && payload.pins) {
        payload.pins = mergePinsByPerson(payload.pins, remoteNutrition.pins);
      }
      transaction.set(docRef, { nutrition: payload });
    });
  } catch (err) {
    console.warn("Konnte Ernährungsdaten nicht synchronisieren:", err);
    setStatus("offline");
  }
}
