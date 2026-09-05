// Cloud-Sync über Firebase Firestore, EIN gemeinsames Haushalts-Dokument mit
// zwei unabhängigen Bereichen:
//
// - "nutrition": gemeinsamer Ernährungs-/Mahlzeitenplan (siehe unten), von
//   beiden Geräten gleichermaßen bearbeitet.
// - "fitness.<person>": Trainingsdaten JE Person — dient primär als Backup/
//   Wiederherstellung (z. B. nach gelöschtem Browser-Cache), nicht als
//   Kollaborationsfläche, da jede Person nur ihre eigenen Trainingsdaten auf
//   ihrem eigenen Gerät schreibt.
//
// Beide Bereiche werden per Firestore-TRANSAKTION geschrieben (liest den
// echten aktuellen Server-Stand im Moment des Schreibens) UND mit
// {merge: true} — sonst würde jeder Push den kompletten Dokumentinhalt
// ersetzen und damit den jeweils ANDEREN Bereich (nutrition bzw. fitness)
// im selben Dokument löschen.
//
// Nährwert-"Last write wins" anhand von state.nutrition.updatedAt (kein
// Feld-für-Feld-Merge) — Ausnahme: Fixierungen (pins) werden gezielt
// personenweise gemerged (siehe mergePinsByPerson in nutrition.js), weil
// hier zwei Personen wirklich gleichzeitig denselben Datensatz bearbeiten.
// Für Training genügt ein einfacher Zeitstempel-Vergleich PRO PERSON, da
// niemand die Trainingsdaten einer anderen Person schreibt.
//
// Läuft komplett optional im Hintergrund: ohne Internet/Firebase bleibt die App wie
// bisher rein lokal nutzbar, initSync() blockiert das erste Rendern nicht.
import { db, onNutritionSaved, onFitnessSaved } from "./db.js";
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
const FITNESS_PERSONS = ["erik", "nele"];

let docRef = null;
let runTransactionFn = null;
let applyingRemote = false;
let pushTimer = null;
let fitnessPushTimers = {};

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
        const remote = snap.data() || null;

        // Ernährung
        if (!remote || !remote.nutrition) {
          pushNow(db.getNutritionState());
        } else {
          const local = db.getNutritionState();
          if ((remote.nutrition.updatedAt || 0) > (local.updatedAt || 0)) {
            applyingRemote = true;
            db.applyRemoteNutrition(remote.nutrition);
            applyingRemote = false;
            window.dispatchEvent(new CustomEvent("app:nutrition-synced"));
          }
        }

        // Training — pro Person unabhängig, siehe Kommentar oben.
        FITNESS_PERSONS.forEach((person) => {
          const remoteFitness = remote && remote.fitness && remote.fitness[person];
          if (!remoteFitness) {
            pushFitnessNow(person, db.getFitnessState(person));
            return;
          }
          const localFitness = db.getFitnessState(person);
          if ((remoteFitness.updatedAt || 0) > (localFitness.updatedAt || 0)) {
            applyingRemote = true;
            db.applyRemoteFitness(person, remoteFitness);
            applyingRemote = false;
            window.dispatchEvent(new CustomEvent("app:fitness-synced", { detail: { userId: person } }));
          }
        });
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

    onFitnessSaved((userId, fitness) => {
      if (applyingRemote) return;
      clearTimeout(fitnessPushTimers[userId]);
      fitnessPushTimers[userId] = setTimeout(() => pushFitnessNow(userId, fitness), PUSH_DEBOUNCE_MS);
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
      transaction.set(docRef, { nutrition: payload }, { merge: true });
    });
  } catch (err) {
    console.warn("Konnte Ernährungsdaten nicht synchronisieren:", err);
    setStatus("offline");
  }
}

// Schreibt NUR die Trainingsdaten der übergebenen Person. Der zuvor per
// Transaktion frisch gelesene Cloud-Stand der jeweils ANDEREN Person wird
// unverändert übernommen (nicht einfach per Firestore-merge dem Zufall
// überlassen, sondern explizit hier zusammengesetzt) — so kann ein Push von
// Erik niemals Neles Trainingsdaten im selben Dokument überschreiben.
async function pushFitnessNow(userId, fitness) {
  if (!docRef || !runTransactionFn) return;
  try {
    await runTransactionFn(async (transaction) => {
      const snap = await transaction.get(docRef);
      const remoteData = snap.exists() ? snap.data() : null;
      const remoteFitness = (remoteData && remoteData.fitness) || {};
      transaction.set(docRef, { fitness: { ...remoteFitness, [userId]: fitness } }, { merge: true });
    });
  } catch (err) {
    console.warn("Konnte Trainingsdaten nicht synchronisieren:", err);
    setStatus("offline");
  }
}
