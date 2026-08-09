import { db, todayISO } from "../db.js";
import { getBlockWeek } from "../progression.js";
import { escapeHtml, showToast } from "../util.js";

export function mount(root, { navigate }) {
  render(root, navigate);
}

function render(root, navigate) {
  const userId = db.getCurrentUserId();
  const user = db.getUser(userId);
  const exercises = db.getExercises(userId);
  const blockStart = db.getBlockStartDate(userId);
  const weekInBlock = getBlockWeek(blockStart, todayISO());

  root.innerHTML = `
    <h1>Einstellungen</h1>

    <div class="section-title" style="margin-top:0;">Profil</div>
    <div class="card row-between">
      <div><strong>${escapeHtml(user.name)}</strong><div class="meta">Aktives Profil</div></div>
      <button class="btn btn-secondary btn-sm" id="switch-profile">Wechseln</button>
    </div>
    ${user.healthNote ? `<div class="safety-banner">ℹ️ ${escapeHtml(user.healthNote)}</div>` : ""}

    <div class="section-title">Trainingsblock</div>
    <div class="card">
      <p style="margin-bottom:10px;">Aktuell: Woche ${weekInBlock} / 4 ${weekInBlock === 4 ? "(Deload)" : ""}. Blockstart: ${blockStart}.</p>
      <div class="field-row">
        <div>
          <label for="block-start-input">Blockstart-Datum</label>
          <input type="date" id="block-start-input" value="${blockStart}" max="${todayISO()}" />
        </div>
      </div>
      <button class="btn btn-secondary" id="save-block-start">Blockstart setzen</button>
    </div>

    <div class="section-title">Übungen anpassen</div>
    <div class="list" id="exercise-list">
      ${exercises.map((ex) => exerciseRow(ex)).join("")}
    </div>

    <div class="section-title">Daten</div>
    <div class="card">
      <button class="btn btn-secondary" id="export-data" style="margin-bottom:10px;">Daten exportieren (JSON)</button>
      <label for="import-file">Daten importieren</label>
      <input type="file" id="import-file" accept="application/json" style="margin-bottom:10px;" />
      <button class="btn btn-danger" id="reset-data">Alle Daten zurücksetzen</button>
    </div>
  `;

  root.querySelector("#switch-profile").addEventListener("click", () => navigate("#/profile"));

  root.querySelector("#save-block-start").addEventListener("click", () => {
    const val = root.querySelector("#block-start-input").value;
    if (!val) return;
    db.setBlockStartDate(userId, val);
    showToast("Blockstart aktualisiert");
    render(root, navigate);
  });

  root.querySelectorAll("[data-toggle-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = root.querySelector(`#edit-${btn.dataset.toggleEdit}`);
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
  });

  root.querySelectorAll("[data-save-exercise]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.saveExercise;
      const ex = db.getExercise(userId, id);
      const panel = root.querySelector(`#edit-${id}`);
      const patch = {};

      if (ex.type === "weighted") {
        const load = panel.querySelector('[data-f="startLoad"]').value;
        const step = panel.querySelector('[data-f="loadStep"]').value;
        const cap = panel.querySelector('[data-f="cap"]').value;
        const repMin = panel.querySelector('[data-f="repMin"]').value;
        const repMax = panel.querySelector('[data-f="repMax"]').value;
        patch.startLoad = load === "" ? null : parseFloat(load);
        patch.loadStep = parseFloat(step) || ex.loadStep;
        patch.cap = cap === "" ? null : parseFloat(cap);
        patch.repMin = parseInt(repMin, 10) || ex.repMin;
        patch.repMax = parseInt(repMax, 10) || ex.repMax;
      } else if (ex.type === "band") {
        const repMin = panel.querySelector('[data-f="repMin"]').value;
        const repMax = panel.querySelector('[data-f="repMax"]').value;
        const bandLevel = panel.querySelector('[data-f="bandLevel"]').value;
        patch.repMin = parseInt(repMin, 10) || ex.repMin;
        patch.repMax = parseInt(repMax, 10) || ex.repMax;
        patch.bandLevel = bandLevel;
      } else if (ex.type === "bodyweight") {
        const targetVolume = panel.querySelector('[data-f="targetVolume"]').value;
        const incrementAmount = panel.querySelector('[data-f="incrementAmount"]').value;
        patch.targetVolume = parseInt(targetVolume, 10) || ex.targetVolume;
        patch.incrementAmount = parseInt(incrementAmount, 10) || ex.incrementAmount;
      } else if (ex.type === "pilates") {
        const startWeight = panel.querySelector('[data-f="startWeight"]').value;
        const loadStep = panel.querySelector('[data-f="loadStep"]').value;
        patch.startWeight = startWeight === "" ? null : parseFloat(startWeight);
        patch.loadStep = parseFloat(loadStep) || ex.loadStep;
      }

      const safetyNote = panel.querySelector('[data-f="safetyNote"]');
      if (safetyNote) patch.safetyNote = safetyNote.value.trim() || null;

      db.updateExercise(userId, id, patch);
      showToast("Übung aktualisiert");
      render(root, navigate);
    });
  });

  root.querySelector("#export-data").addEventListener("click", () => {
    const blob = new Blob([db.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trainingstracker-export-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  root.querySelector("#import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("Import überschreibt alle aktuell gespeicherten Daten. Fortfahren?")) {
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        db.importJSON(reader.result);
        showToast("Daten importiert");
        navigate("#/dashboard");
      } catch (err) {
        alert("Import fehlgeschlagen: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  root.querySelector("#reset-data").addEventListener("click", () => {
    if (!confirm("Wirklich ALLE Profile, Übungen und Sessions löschen und auf die Ausgangspläne zurücksetzen?")) return;
    db.resetToSeed();
    showToast("Zurückgesetzt");
    navigate("#/profile");
  });
}

function exerciseRow(ex) {
  return `
    <div class="list-item" style="flex-direction:column; align-items:stretch;">
      <div class="row-between" data-toggle-edit="${ex.id}" style="cursor:pointer;">
        <div><strong>${escapeHtml(ex.name)}</strong><div class="meta">${typeLabel(ex.type)}</div></div>
        <span class="chev">▾</span>
      </div>
      <div id="edit-${ex.id}" style="display:none; margin-top:12px;">
        ${editFields(ex)}
        ${ex.type !== "cardio" ? `<label>Sicherheits-Hinweis</label><input type="text" data-f="safetyNote" value="${escapeHtml(ex.safetyNote || "")}" style="margin-bottom:10px;" />` : ""}
        <button class="btn btn-sm" data-save-exercise="${ex.id}">Speichern</button>
      </div>
    </div>
  `;
}

function typeLabel(type) {
  return { weighted: "Freies Gewicht", band: "Band", bodyweight: "Bodyweight", cardio: "Cardio", pilates: "Video-Workout" }[type] || type;
}

function editFields(ex) {
  if (ex.type === "weighted") {
    return `
      <div class="field-row">
        <div><label>Aktuelles Gewicht (kg)</label><input type="number" step="0.5" data-f="startLoad" value="${ex.startLoad ?? ""}" /></div>
        <div><label>Steigerungsschritt (kg)</label><input type="number" step="0.5" data-f="loadStep" value="${ex.loadStep}" /></div>
      </div>
      <div class="field-row">
        <div><label>Zielbereich min</label><input type="number" data-f="repMin" value="${ex.repMin}" /></div>
        <div><label>Zielbereich max</label><input type="number" data-f="repMax" value="${ex.repMax}" /></div>
      </div>
      <div class="field-row">
        <div><label>Obergrenze (kg, optional)</label><input type="number" step="0.5" data-f="cap" value="${ex.cap ?? ""}" /></div>
      </div>
    `;
  }
  if (ex.type === "band") {
    return `
      <div class="field-row">
        <div><label>Band-Stufe</label>
          <select data-f="bandLevel">
            ${["leicht", "mittel", "schwer"].map((l) => `<option value="${l}" ${l === ex.bandLevel ? "selected" : ""}>${l}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="field-row">
        <div><label>Zielbereich min</label><input type="number" data-f="repMin" value="${ex.repMin}" /></div>
        <div><label>Zielbereich max</label><input type="number" data-f="repMax" value="${ex.repMax}" /></div>
      </div>
    `;
  }
  if (ex.type === "bodyweight") {
    return `
      <div class="field-row">
        <div><label>Ziel-Gesamtvolumen</label><input type="number" data-f="targetVolume" value="${ex.targetVolume}" /></div>
        <div><label>Steigerungsschritt</label><input type="number" data-f="incrementAmount" value="${ex.incrementAmount}" /></div>
      </div>
    `;
  }
  if (ex.type === "pilates") {
    return `
      <div class="field-row">
        <div><label>Aktuelles Gewicht (kg pro Hantel, optional)</label><input type="number" step="0.5" data-f="startWeight" value="${ex.startWeight ?? ""}" /></div>
        <div><label>Steigerungsschritt (kg)</label><input type="number" step="0.5" data-f="loadStep" value="${ex.loadStep}" /></div>
      </div>
    `;
  }
  return "";
}
