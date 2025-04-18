(function () {

  console.log("Extension CyberProtect injectée !");

  // Garde fou complémentaire au manifest pour être certain que l'extension ne s'exécute pas sur des sites autres
  // que ceux définis ci-dessous
  const authorizedDomains = ["instagram.com", "facebook.com", "twitter.com",
    "messenger.com", "snapchat.com", "telegram.org", "whatsapp.com",
    "tiktok.com"];
  const currentDomain = window.location.hostname;

  if (!currentDomain || !authorizedDomains.some(domain => currentDomain.includes(domain))) {
    console.log("CyberProtect : domaine non autorisé ou vide. Arrêt du script.");
    return;
  }

  console.log("CyberProtect inspecte le domaine : " + currentDomain);

  const DIX_JOURS_EN_MS = 10 * 24 * 60 * 60 * 1000;
  const defaultThreshold = 30;
  const redirectionUrl = 'https://www.youtube.com/embed/blar1yAMXWQ?autoplay=1&controls=0&rel=0&showinfo=0&modestbranding=1';

  // On récupère la liste des sites bloqués à partir du Local Storage
  // Si le site courant est bloqué on calcule le temps écoulé
  // Si le blocage est encore actif on appelle la fonction Blocage()
  // Sinon on supprime le blocage et on démarre l'analyse si le consentement a été donné
  chrome.storage.local.get(['blockedSites'], (result) => {
    const blockedSites = result.blockedSites || {};
    const blocage = blockedSites[currentDomain];

    if (blocage && blocage.timestamp) {
      const tempsEcoule = Date.now() - blocage.timestamp;
      const tempsRestant = DIX_JOURS_EN_MS - tempsEcoule;

      if (tempsRestant > 0) {
        const joursRestants = Math.ceil(tempsRestant / (24 * 60 * 60 * 1000));
        Blocage(`Vous êtes bloqué sur ce site pour comportements toxiques répétés.<br><br>⏳ Temps restant : <strong>${joursRestants} jour(s)</strong>`, false);
      } else {
        delete blockedSites[currentDomain];
        chrome.storage.local.set({ blockedSites });
        toggleExtensionBasedOnConsent((isActive) => {
          if (isActive) startInterval();
        });
      }
    } else {
      toggleExtensionBasedOnConsent((isActive) => {
        if (isActive) startInterval();
      });
    }
  });

  // Définition du Seuil par défaut
  let seuil = defaultThreshold;

  // On récupère dans le Local Storage
  // consentGiven : si le consentement a été donné
  // toxicityThreshold : le degré de toxicité à atteindre pour être avertir
  // Si le consentement n'a pas été donné : l’extension est désactivée (pas de surveillance).
  // Sinon, elle démarre : la détection est régulière via startInterval().
  function toggleExtensionBasedOnConsent(callback) {
    chrome.storage.local.get(['consentGiven', 'toxicityThreshold'], function (result) {
      const consentGiven = result.consentGiven;
      seuil = result.toxicityThreshold !== undefined ? result.toxicityThreshold : defaultThreshold;
      if (consentGiven === false || consentGiven === undefined) {
        console.log("L'extension est désactivée car consentGiven est défini sur false.");
        clearInterval(intervalId);
        callback(false);
      } else {
        console.log("L'extension est activée.");
        if (!intervalId) {
          startInterval();
        }
        callback(true);
      }
    });
  }

  let intervalId = null;
  let allBloqued = false;

  // Concerne l'interval
  // Toutes les secondes : on récupère l’élément actuellement édité.
  // Si le texte a changé, l’analyse est relancée.
  function startInterval() {
    intervalId = setInterval(() => {
      if (!allBloqued) {
        const editable = getActiveEditableElement();
        if (!editable) return;

        lastEditableElement = editable;

        const currentText = editable.innerText || editable.value || "";
        if (currentText.trim() !== lastText) {
          console.log("📝 Nouveau message détecté :", currentText.trim());
          lastText = currentText.trim();

          if (currentText.trim().length > 2) {
            analyze(currentText.trim());
          }
        }
      }
    }, 1000);
  }


  toggleExtensionBasedOnConsent((isActive) => {
    if (isActive) {
      startInterval();
    }
  });

  // Listener qui redémarre l’analyse ou met à jour le seuil 
  // si consentGiven ou toxicityThreshold changent
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.consentGiven && userBlocked == false) {
        toggleExtensionBasedOnConsent((isActive) => {
          if (isActive) {
            startInterval();
          }
        });
      }
      if (changes.toxicityThreshold) {
        seuil = changes.toxicityThreshold.newValue !== undefined ? changes.toxicityThreshold.newValue : defaultThreshold;
        console.log("Le seuil de toxicité a été mis à jour :", seuil);
      }
    }
  });

  let lastText = "";
  let enterBlocked = false;
  let controller = new AbortController();
  let essais = 3;
  let lastEditableElement = null;

  //Fonction qui retourne l'élément actif
  function getActiveEditableElement() {
    const active = document.activeElement;
    if (active && active.isContentEditable) return active;
    if (active && active.tagName === "TEXTAREA") return active;
    return null;
  }

  //Fonction qui bloque temporairement la touche Enter
  function blockEnterTemporarily() {
    enterBlocked = true;
  }

  // Listener :
  // Si un message est considéré toxique, Enter est bloqué.
  // Est réactivé quand l’utilisateur recommence à écrire.
  document.addEventListener("keydown", function (event) {
    if (!allBloqued) {
      if (event.key === "Enter" && enterBlocked) {
        event.preventDefault();
        event.stopPropagation();
        console.log("⛔ Touche Enter bloquée après détection d'un message toxique !");
      } else if (event.key !== "Enter") {
        enterBlocked = false;
      }
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Fonction qui simule des Backspace
  function simulateBackspaces(element, count) {
    element.focus();
    for (let i = 0; i < count; i++) {
      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        which: 8,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
    }
  }

  // Fonction qui :
  // Affiche un message si la toxicité dépasse le seuil.
  // Supprime le texte de manière visuelle après 4 secondes.
  // Gère le nombre de tentatives restantes (essais).
  function showWarningPopup(score) {
    const existing = document.querySelector("#cyber-popup");
    if (existing) existing.remove();

    allBloqued = true;
    //chrome.storage.local.set({ userBlocked: true }); // NE PEUT PAS FONCTIONNER

    const popup = document.createElement("div");
    popup.id = "cyber-popup";
    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.right = "20px";
    popup.style.backgroundColor = "#0c0c0c";
    popup.style.border = "1px solid #0df024";
    popup.style.borderRadius = "10px";
    popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    popup.style.padding = "16px 24px";
    popup.style.fontSize = "14px";
    popup.style.fontFamily = "Arial, sans-serif";
    popup.style.color = "#cee4cc";
    popup.style.zIndex = "999999";
    popup.style.maxWidth = "300px";

    popup.innerHTML = `
    <strong style="color:#d9534f;">⚠️ Alerte de cyberharcèlement</strong>
    <p style="margin: 8px 0;">
      Votre message a un <strong>score de toxicité de ${Math.round(score * 100)}%</strong>.<br/>
      Il va être supprimé car il pourrait être interprété comme une forme de cyberharcèlement.
    </p>
    <p style="margin: 4px 0;">
      Il vous reste <strong>${essais}</strong> tentative(s) avant blocage.
    </p>
  `;

    document.body.appendChild(popup);

    setTimeout(() => {
      if (document.querySelector("#cyber-popup")) {
        allBloqued = false;
        popup.remove();
        if (lastEditableElement) {
          const text = lastEditableElement.isContentEditable
            ? lastEditableElement.innerText
            : lastEditableElement.value;

          simulateBackspaces(lastEditableElement, text.length);
          lastText = "";
        }
      }
    }, 4000);
  }

  // Fonction qui :
  // Affiche une page noire bloquante sur le site.
  // Sauvegarde la date de blocage.
  // Redirige vers une vidéo "éducative" lorsque l'utilisateur bouge sa souris 
  function Blocage(message, activeVideo) {
    const blocage = document.createElement('div');
    blocage.textContent = message;
    blocage.style.position = 'fixed';
    blocage.style.top = '0';
    blocage.style.left = '0';
    blocage.style.width = '100vw';
    blocage.style.height = '100vh';
    blocage.style.backgroundColor = '#0c0c0c';
    blocage.style.color = '#cee4cc';
    blocage.style.display = 'flex';
    blocage.style.flexDirection = 'column';
    blocage.style.justifyContent = 'center';
    blocage.style.alignItems = 'center';
    blocage.style.fontSize = '1.5rem';
    blocage.style.textAlign = 'center';
    blocage.style.padding = '20px';
    blocage.style.zIndex = '9999';

    blocage.innerHTML = `
    <p><span style="font-size: 180px;">💀</span></p>
    <p>${message}</p>
  `;

    document.body.appendChild(blocage);

    const currentDomain = window.location.hostname;
    const blockTimestamp = Date.now();

    chrome.storage.local.get(['blockedSites'], (result) => {
      const blockedSites = result.blockedSites || {};
      blockedSites[currentDomain] = {
        timestamp: blockTimestamp
      };
      chrome.storage.local.set({ blockedSites });
    });

    allBloqued = true;

    let alreadyRedirected = false;

    if (activeVideo) {
      blocage.addEventListener('mousemove', function () {
        if (alreadyRedirected) return;
        alreadyRedirected = true;

        const a = document.createElement('a');
        a.href = redirectionUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }
  }

  // Fonction qui :
  // Envoie le texte à l’API de Google pour analyse.
  // Si la toxicité dépasse le seuil, bloque Enter + décrémente essais.
  // Si plus de tentatives, l’utilisateur est bloqué via Blocage().
  async function analyze(text) {
    if (!text || text.trim() === '') return;

    try {
      controller = new AbortController();
      const response = await fetch("https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=AIzaSyAs3EeoKDFSXJwRuuvgN1Y97I4dhFBqtDw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          comment: { text },
          languages: ["fr"],
          requestedAttributes: { TOXICITY: {} }
        })
      });

      const result = await response.json();
      const toxicityScore = result.attributeScores?.TOXICITY?.summaryScore?.value;

      if (toxicityScore !== undefined) {
        console.log(`Toxicité détectée : ${toxicityScore * 100}%`);
        if (toxicityScore > seuil / 100) {
          blockEnterTemporarily();
          --essais;
          if (essais > 0) {
            showWarningPopup(toxicityScore);
          } else {
            Blocage('On vous avait prévenu.', true);
          }
        }
      }
    } catch (error) {
      console.error("❌ Erreur analyse toxicité :", error);
    }
  }
})();
