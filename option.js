document.addEventListener("DOMContentLoaded", () => {
  console.log("🔍 Chargement du mot de passe...");
  loadBlockedSites()
  chrome.storage.local.get("adminPassword", (data) => {
    console.log("🧠 adminPassword récupéré :", data.adminPassword);
  });
  chrome.storage.local.get("adminPassword", (data) => {
    const currentPassword = data.adminPassword ?? null;

    if (!currentPassword) {
      alert("🔐 Aucun mot de passe défini. Veuillez en créer un pour sécuriser l’accès.");
      document.getElementById("old-password-section").style.display = "none";
      document.getElementById("new-password-section").style.display = "block";
    } else {
      document.getElementById("old-password-section").style.display = "block";
      document.getElementById("new-password-section").style.display = "none";

      document.getElementById("verify-old-password").addEventListener("click", () => {
        const inputOld = document.getElementById("old-password").value;
        if (inputOld === currentPassword) {
          document.getElementById("new-password-section").style.display = "block";
        } else {
          alert("❌ Mot de passe incorrect.");
        }
      });
    }

    document.getElementById("save-password").addEventListener("click", () => {
      const newPass = document.getElementById("new-password").value;
    
      if (newPass.length < 4) {
        alert("⚠️ Le mot de passe doit contenir au moins 4 caractères.");
        return;
      }
    
      const encoder = new TextEncoder();
      crypto.subtle.digest("SHA-256", encoder.encode(newPass)).then((buffer) => {
        const hash = Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");
    
        chrome.storage.local.set({ adminPasswordHash: hash }, () => {
          alert("✅ Nouveau mot de passe sauvegardé avec succès !");
          document.getElementById("new-password-section").style.display = "none";
          document.getElementById("old-password").value = "";
          document.getElementById("new-password").value = "";
        });
      });
    });    
  });
  function loadBlockedSites() {
    chrome.storage.local.get("blockedSites", (data) => {
      const sites = data.blockedSites || [];
      const list = document.getElementById("blocked-sites-list");
      list.innerHTML = "";
  
      sites.forEach((site, index) => {
        const li = document.createElement("li");
        li.textContent = site + " ";
  
        const btn = document.createElement("button");
        btn.textContent = "Débloquer";
        btn.addEventListener("click", () => {
          sites.splice(index, 1);
          chrome.storage.local.set({ blockedSites: sites }, () => {
            loadBlockedSites();
          });
        });
  
        li.appendChild(btn);
        list.appendChild(li);
      });
    });
  }
});
