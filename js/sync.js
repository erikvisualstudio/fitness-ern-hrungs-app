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
// Läuft komplett optional im Hintergrund: ohne Internet/Firebase bleibt die App wie
// bisher rein lokal nutzbar, initSync() blockiert das erste Rendern nicht.
import { db, onNutritionSaved } from "./db.js";

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
let setDocFn = null;
let applyingRemote = false;
let pushTimer = null;

function setStatus(status) {
  window.dispatchEvent(new CustomEvent("app:sync-status", { detail: { status } }));
}

export async function initSync() {
  setStatus("connecting");
  try {
    const [{ initializeApp }, { getAuth, signInAnonymously }, { getFirestore, doc, onSnapshot, setDoc }] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`),
    ]);

    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    await signInAnonymously(auth);

    docRef = doc(firestore, "households", HOUSEHOLD_ID);
    setDocFn = setDoc;

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

function pushNow(nutrition) {
  if (!docRef || !setDocFn) return;
  setDocFn(docRef, { nutrition }).catch((err) => {
    console.warn("Konnte Ernährungsdaten nicht synchronisieren:", err);
    setStatus("offline");
  });
}
