document.addEventListener("DOMContentLoaded", async () => {

  loadBlockedSites();

  chrome.storage.local.get(["consentGiven", "toxicityThreshold"], (result) => {
    if (typeof result.consentGiven !== "undefined") {
      document.getElementById("consentGiven").checked = result.consentGiven;
    }

    if (typeof result.toxicityThreshold !== "undefined") {
      const toxicityInput = document.getElementById("toxicityThreshold");
      toxicityInput.value = result.toxicityThreshold;
      document.getElementById("threshold-value").textContent = `${result.toxicityThreshold}%`;
    }
  });

  chrome.storage.local.get("isAuthenticated", (authResult) => {
    if (authResult.isAuthenticated) {
      chrome.storage.local.get("openParameters", (param) => {
        if (param.openParameters === true) {
          // Ouverture des Paramètres
          document.getElementById("setParams").style.display = "none";
          document.getElementById("getRightToAccess").style.display = "none";
          document.getElementById("createPassword").style.display = "block";
          document.getElementById("blockedSites").style.display = "block";
        } else {
          // L'utilisateur est authentifié
          document.getElementById("setParams").style.display = "block";
          document.getElementById("getRightToAccess").style.display = "none";
          document.getElementById("createPassword").style.display = "none";
          document.getElementById("blockedSites").style.display = "none";
        }
      })
    } else {
      // L'utilisateur n'est pas authentifié
      document.getElementById("setParams").style.display = "none";
      document.getElementById("blockedSites").style.display = "none";

      // Vérifie uniquement si le mot de passe administrateur existe
      chrome.storage.local.get("adminPasswordHash", (passwordResult) => {
        document.getElementById("setParams").style.display = "none";
        document.getElementById("blockedSites").style.display = "none";
        if (passwordResult.adminPasswordHash) {
          // Le mot de passe existe
          document.getElementById("getRightToAccess").style.display = "block";
          document.getElementById("createPassword").style.display = "none";
        } else {
          // Le mot de passe doit être créé
          document.getElementById("getRightToAccess").style.display = "none";
          document.getElementById("createPassword").style.display = "block";
        }
      });
    }
  });

  // Ajoute la version de l'extension
  const manifest = chrome.runtime.getManifest();
  document.getElementById("appVersion").textContent = "V" + manifest.version;
});

document.getElementById("toxicityThreshold").addEventListener("input", (event) => {
  const thresholdValue = document.getElementById("threshold-value");
  thresholdValue.textContent = `${event.target.value}%`;
});

document.getElementById("saveConsentAndSeuil").addEventListener("click", () => {

  const consentGiven = document.getElementById("consentGiven").checked;
  const toxicityThreshold = document.getElementById("toxicityThreshold").value;

  chrome.storage.local.set(
    {
      consentGiven: consentGiven,
      toxicityThreshold: toxicityThreshold
    },
    () => {
      alert("Vos paramètres ont été sauvegardés !");
    }
  );
});

//Soumission du mot de passe Administrateur
document.getElementById("save-password").addEventListener("click", async () => {
  const newPass = document.getElementById("new-password").value;
  const confirmPass = document.getElementById("confirm-password").value;

  if (newPass.length < 4) {
    document.getElementById("message").textContent = "⚠️ Le mot de passe doit contenir au moins 4 caractères.";
    return;
  }

  if (newPass !== confirmPass) {
    document.getElementById("message").textContent = "⚠️ Les mots de passe ne correspondent pas.";
    return;
  }

  const hash = await hashPassword(newPass);

  chrome.storage.local.set({ adminPasswordHash: hash }, () => {
    alert("✅ Mot de passe sauvegardé avec succès !");
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
    try {
      chrome.storage.local.remove("openParameters");
    } catch (error) {
      console.error("Erreur lors de la suppression de openParameters :", error);
    }
    logoutUser();
  });
});

//Annulation du changement de mot de passe Administrateur
document.getElementById("cancel-password").addEventListener("click", async () => {
  chrome.storage.local.remove("openParameters");
  window.close();
});

function loadBlockedSites() {
  chrome.storage.local.get("blockedSites", (data) => {
    const sitesObj = data.blockedSites || {};
    const list = document.getElementById("blocked-sites-list");
    list.innerHTML = "";

    if (Object.keys(sitesObj).length === 0) {
      // Si aucun site bloqué n'est trouvé
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "Aucun site bloqué.";
      emptyMessage.style.color = "gray";
      emptyMessage.style.fontStyle = "italic";
      list.appendChild(emptyMessage);
    } else {
      // Si des sites bloqués sont trouvés
      Object.entries(sitesObj).forEach(([site, details]) => {
        const li = document.createElement("li");
        li.textContent = site + " ";

        const btn = document.createElement("button");
        btn.textContent = "Débloquer";
        btn.addEventListener("click", () => {
          delete sitesObj[site];
          chrome.storage.local.set({ blockedSites: sitesObj }, () => {
            loadBlockedSites(); // recharge la liste après suppression
          });
        });

        li.appendChild(btn);
        list.appendChild(li);
      });
    }
  });
}


async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
// });

// Vérification du mot de passe saisi au login
document.getElementById("submit").addEventListener("click", async () => {
  const password = document.getElementById("password").value;
  const storage = await chrome.storage.local.get("adminPasswordHash");
  const inputHash = await hashPassword(password);
  if (inputHash === storage.adminPasswordHash) {
    await chrome.storage.local.set({ isAuthenticated: true });
    // Programmer la suppression du droit d'accès (voir background.js)
    chrome.runtime.sendMessage({ action: "startTimer" });
    window.close();
  } else if (password.length === 0) {
    document.getElementById("message2").textContent = "⚠️ Veuillez saisir un mot de passe.";
  } else {
    document.getElementById("message2").textContent = "⚠️ Mot de passe incorrect.";
  }
});

// Evénement qui déconnecte l'Administrateur
// sur clic du bouton "Déconnexion"
document.getElementById("logout").addEventListener("click", logoutUser);

// Fonction pour déconnecter l'Administrateur
async function logoutUser() {
  try {
    await chrome.storage.local.remove("isAuthenticated");
    //alert("Vous êtes déconnecté(e)!");
    window.close();
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
  }
}

document.getElementById("open-options").addEventListener("click", async () => {
  await chrome.storage.local.set({ openParameters: true });
});

chrome.storage.local.get("openParameters", (param) => {
  if (param.openParameters !== undefined && param.openParameters === true) {
    document.getElementById("titleChangePassword").textContent = "Modification du mot de passe Admin";
    document.getElementById("cancel-password").style.display = "block";
  } else {
    document.getElementById("titleChangePassword").textContent = "Création du mot de passe Admin";
    document.getElementById("cancel-password").style.display = "none";
  }
});

// Listener qui permet de fermer la popup à l'expiration du délai
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "closePopup") {
    window.close();
  }
});