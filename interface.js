document.addEventListener("DOMContentLoaded", async () => {

  loadBlockedSites();


  chrome.storage.sync.get(["consentGiven", "toxicityThreshold"], (result) => {
    if (typeof result.consentGiven !== "undefined") {
      document.getElementById("consentGiven").checked = result.consentGiven;
    }

    if (typeof result.toxicityThreshold !== "undefined") {
      const toxicityInput = document.getElementById("toxicityThreshold");
      toxicityInput.value = result.toxicityThreshold;
      document.getElementById("threshold-value").textContent = `${result.toxicityThreshold}%`;
    }
  });

  chrome.storage.sync.get("isAuthenticated", (authResult) => {
    if (authResult.isAuthenticated) {
      chrome.storage.sync.get("openParameters", (param) => {
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
      chrome.storage.sync.get("adminPasswordHash", (passwordResult) => {
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

  chrome.storage.sync.set(
    {
      consentGiven: consentGiven,
      toxicityThreshold: toxicityThreshold
    },
    () => {
      alert("Vos paramètres ont été sauvegardés !");
    }
  );
});

function containsUpperCase(str) {
  return /[A-Z]/.test(str);
}

function containsLowerCase(str) {
  return /[a-z]/.test(str);
}

function containsSpecial(str) {
  return /[-&@#§!%£*$=+~?\/\\]/.test(str);
}
//Soumission du mot de passe Administrateur
document.getElementById("save-password").addEventListener("click", async () => {
  const question = document.getElementById("secret-question").value.trim();
  const answer = document.getElementById("secret-answer").value.trim();
  const newPass = document.getElementById("new-password").value;
  const confirmPass = document.getElementById("confirm-password").value;
  if (!question || !answer) {
    document.getElementById("message").textContent = "⚠️ La question et la réponse secrètes doivent être renseignées.";
    return;
  }

  if (newPass !== confirmPass) {
    document.getElementById("message").textContent = "⚠️ Les mots de passe ne correspondent pas.";
    return;
  }

  if (newPass.length < 6 || !containsUpperCase(newPass) || !containsLowerCase(newPass) || !containsSpecial(newPass)) {
    document.getElementById("message").textContent = "⚠️ Le mot de passe doit contenir au moins 6 caractères, dont 1 majuscule, 1 minuscule et 1 caractère spécial.";
    return;
  }



  const hash = await hashPassword(newPass);
  const answerHash = await hashPassword(answer);

  document.getElementById("setParams").style.display = "block";
  document.getElementById("getRightToAccess").style.display = "none";
  document.getElementById("createPassword").style.display = "none";
  document.getElementById("blockedSites").style.display = "none";

  chrome.storage.sync.set({
    adminPasswordHash: hash,
    secretQuestion: question,
    secretAnswerHash: answerHash,
    isAuthenticated: true
  }, () => {
    alert("✅ Mot de passe et question secrète sauvegardés avec succès !");
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
    document.getElementById("secret-question").value = "";
    document.getElementById("secret-answer").value = "";
    try {
      chrome.storage.sync.remove("openParameters");
    } catch (error) {
      console.error("Erreur lors de la suppression de openParameters :", error);
    }
  });
});

//Annulation du changement de mot de passe Administrateur
document.getElementById("cancel-password").addEventListener("click", async () => {
  chrome.storage.sync.remove("openParameters");
  document.getElementById("setParams").style.display = "block";
  document.getElementById("getRightToAccess").style.display = "none";
  document.getElementById("createPassword").style.display = "none";
  document.getElementById("blockedSites").style.display = "none";
});

//Annulation du changement de mot de passe en cas de perte de celui-ci
document.getElementById("cancel-password2").addEventListener("click", async () => {
  location.reload();
});

function loadBlockedSites() {
  chrome.storage.sync.get("blockedSites", (data) => {
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
          chrome.storage.sync.set({ blockedSites: sitesObj }, () => {
            loadBlockedSites();
          });
        });

        li.appendChild(btn);
        list.appendChild(li);
      });
    }
  });
}

document.getElementById("add-blocked-site-btn").addEventListener("click", () => {
  const input = document.getElementById("new-blocked-site");
  const newSite = input.value.trim();
  const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,11}?$/;

  if (!domainRegex.test(newSite)) {
    alert("⚠️ Veuillez entrer un domaine valide (ex: www.exemple.com)");
    return;
  }

  chrome.storage.sync.get(['blockedSites'], (result) => {
    const blockedSites = result.blockedSites || {};

    // Ajouter le nouveau site à la liste des sites bloqués avec :
    // - un timestamp,
    // - information de l'ajout manuel
    blockedSites[newSite] = { timestamp: Date.now(), manual: true };

    chrome.storage.sync.set({ blockedSites }, () => {
      loadBlockedSites();  // Mettre à jour la liste après l'ajout
      input.value = "";  // Effacer le champ de texte
    });
  });
});



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
  const storage = await chrome.storage.sync.get("adminPasswordHash");
  const inputHash = await hashPassword(password);
  if (inputHash === storage.adminPasswordHash) {
    await chrome.storage.sync.set({ isAuthenticated: true });
    // Programmer la suppression du droit d'accès (voir background.js)
    chrome.runtime.sendMessage({ action: "startTimer" });
    document.getElementById("setParams").style.display = "block";
    document.getElementById("getRightToAccess").style.display = "none";
    document.getElementById("createPassword").style.display = "none";
    document.getElementById("blockedSites").style.display = "none";

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
    await chrome.storage.sync.remove("isAuthenticated");
    //alert("Vous êtes déconnecté(e)!");
    window.close();
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
  }
}

document.getElementById("open-options").addEventListener("click", async () => {
  await chrome.storage.sync.set({ openParameters: true });
});

chrome.storage.sync.get("openParameters", (param) => {
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

// Ouvre le fichier README.md converti en html
document.getElementById('open-readme').addEventListener('click', () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('readme.html') // ou 'readme.md' si tu veux le brut
  });
});

// Récupération du mot de passe via la question secrète
document.getElementById("recover-password-link").addEventListener("click", () => {
  chrome.storage.sync.get(["secretQuestion"], (data) => {
    const question = data.secretQuestion;
    if (question) {
      document.getElementById("recovery-section").style.display = "block";
    } else {
      alert("⚠️ Aucune question secrète n'a été définie.");
    }
  });
});

document.getElementById("submit-recovery-answer").addEventListener("click", async () => {
  const answer = document.getElementById("recovery-answer").value.trim();
  const answerHash = await hashPassword(answer);

  chrome.storage.sync.get(["secretAnswerHash"], (data) => {
    if (data.secretAnswerHash === answerHash) {
      alert("✅ Réponse correcte ! Vous pouvez maintenant modifier le mot de passe.");
      // Rediriger vers l'écran de modification du mot de passe
      document.getElementById("createPassword").style.display = "block";
      document.getElementById("getRightToAccess").style.display = "none";
    } else {
      alert("⚠️ Réponse incorrecte. Veuillez réessayer.");
    }
  });
});
