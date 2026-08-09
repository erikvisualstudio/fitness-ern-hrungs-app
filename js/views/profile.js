import { db } from "../db.js";
import { escapeHtml } from "../util.js";

export function mount(root, { navigate }) {
  const users = db.getUsers();

  root.innerHTML = `
    <div style="padding-top: 8px;">
      <h1 style="text-align:center; margin-top: 24px;">Trainingstracker</h1>
      <p style="text-align:center;">Wer trainiert gerade?</p>
      <div class="profile-pick">
        ${users
          .map(
            (u) => `<button class="profile-btn" data-user="${u.id}">${escapeHtml(u.name)}</button>`
          )
          .join("")}
      </div>
    </div>
  `;

  root.querySelectorAll("[data-user]").forEach((btn) => {
    btn.addEventListener("click", () => {
      db.setCurrentUserId(btn.dataset.user);
      navigate("#/dashboard");
    });
  });
}
