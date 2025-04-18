let currentPassword = null;

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("adminPassword", (data) => {
    currentPassword = data.adminPassword ?? null;

    if (!currentPassword) {
      alert("🔐 Aucun mot de passe défini. Veuillez en créer un pour sécuriser l’accès.");
      document.getElementById("old-password-section").style.display = "none";
      document.getElementById("new-password-section").style.display = "block";
    } else {
      document.getElementById("old-password-section").style.display = "block";
      document.getElementById("new-password-section").style.display = "none";
    }
  });

  document.getElementById("verify-old-password").addEventListener("click", () => {
    const inputOld = document.getElementById("old-password").value;

    if (inputOld === currentPassword) {
      document.getElementById("new-password-section").style.display = "block";
    } else {
      alert("❌ Mot de passe incorrect.");
    }
  });

  document.getElementById("save-password").addEventListener("click", () => {
    const newPass = document.getElementById("new-password").value;

    if (newPass.length < 4) {
      alert("⚠️ Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    chrome.storage.local.set({ adminPassword: newPass }, () => {
      alert("✅ Nouveau mot de passe sauvegardé avec succès !");
      currentPassword = newPass;
      document.getElementById("new-password-section").style.display = "none";
      document.getElementById("old-password").value = "";
      document.getElementById("new-password").value = "";
    });
  });
});
