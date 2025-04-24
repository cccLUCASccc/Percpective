(function () {

  // console.log("Extension CyberProtect injectée !");

  const currentDomain = window.location.hostname;

  if (!currentDomain || currentDomain.includes("discord.com") || currentDomain.includes("instagram.com") || currentDomain.includes("reddit.com")) {
    // Si on n'est pas sur un site web valide ou un où l'extension n'est pas fonctionnelle
    return;
  }

  // console.log("CyberProtect inspecte le domaine : " + currentDomain);

  const DIX_JOURS_EN_MS = 10 * 24 * 60 * 60 * 1000; //Temps de bloçage des sites (10 jours par défaut)
  const defaultThreshold = 30; //Seuil de toxicité
  const redirectionUrl = 'https://www.youtube.com/embed/blar1yAMXWQ?autoplay=1&controls=0&rel=0&showinfo=0&modestbranding=1'; //Vidéo de sensibilisation

  // On récupère la liste des sites bloqués à partir du Local Storage
  // Si le site courant est bloqué on calcule le temps écoulé
  // Si le blocage est encore actif on appelle la fonction Blocage()
  // Sinon on supprime le blocage et on démarre l'analyse si le consentement a été donné
  chrome.storage.sync.get(['blockedSites'], (result) => {
    const blockedSites = result.blockedSites || {};
    const blocage = blockedSites[currentDomain];

    if (blocage.manual !== undefined && blocage.manual) {
      BlocageManuel("Vous n'avez pas accès à ce site");
      allBloqued = true;
    } else if (blocage && blocage.timestamp) {
      const tempsEcoule = Date.now() - blocage.timestamp;
      const tempsRestant = DIX_JOURS_EN_MS - tempsEcoule;

      if (tempsRestant > 0) {
        Blocage(`Vous êtes bloqué sur ce site pour comportements toxiques répétés.<br><br>⏳ Temps restant : <strong id="countdown"></strong>`, false, tempsRestant);
      } else {
        delete blockedSites[currentDomain];
        chrome.storage.sync.set({ blockedSites });
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
    chrome.storage.sync.get(['consentGiven', 'toxicityThreshold'], function (result) {
      const consentGiven = result.consentGiven;
      seuil = result.toxicityThreshold !== undefined ? result.toxicityThreshold : defaultThreshold;
      if (consentGiven === false || consentGiven === undefined) {
        // console.log("L'extension est désactivée car consentGiven est défini sur false.");
        clearInterval(intervalId);
        callback(false);
      } else {
        // console.log("L'extension est activée.");
        if (!intervalId) {
          startInterval();
        }
        callback(true);
      }
    });
  }

  let intervalId = null; //L'interval de temps entre 2 soumissions
  let allBloqued = false; //Bloçage de la saisie pendant la soumission du texte saisi

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
          // console.log("📝 Nouveau message détecté :", currentText.trim());
          lastText = currentText.trim();

          if (currentText.trim().length > 2) {
            analyze(currentText.trim());
          }
        }
      }
    }, 1000);
  }

  // Active la détection
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
        // console.log("Le seuil de toxicité a été mis à jour :", seuil);
      }
    }
  });

  let lastText = ""; //Le contenu du dernier message saisi soumis
  let enterBlocked = false; //Est-ce que la touche Enter est bloquée ?
  let controller = new AbortController();
  let essais = 3; //Nombre d'essai avant bloçage du site
  let lastEditableElement = null; //Référence à l'élément dans lequel a été saisi le message

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
        // console.log("⛔ Touche Enter bloquée après détection d'un message toxique !");
      } else if (event.key !== "Enter") {
        enterBlocked = false;
      }
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Fonction qui simule des Backspace
  function simulateBackspaces(element, count, currentDomain) {
    const isInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
    const nativeSetter = Object.getOwnPropertyDescriptor(
      isInput ? window[element.tagName === 'INPUT' ? 'HTMLInputElement' : 'HTMLTextAreaElement'].prototype : element,
      'value'
    )?.set;

    element.focus();

    for (let i = 0; i < count; i++) {
      ['keydown', 'keypress', 'keyup'].forEach(type => {
        const event = new KeyboardEvent(type, {
          key: 'Backspace',
          code: 'Backspace',
          keyCode: 8,
          which: 8,
          bubbles: true,
          cancelable: true
        });
        element.dispatchEvent(event);
      });

      //N'exécuter ce code que sur certains sites (ne fonctionne pas avec les autres)
      if (currentDomain.includes("telegram.com") || currentDomain.includes("tiktok.com") || currentDomain.includes("snapchat.com")) {
        // Appliquer la suppression proprement
        if (nativeSetter && 'value' in element) {
          nativeSetter.call(element, element.value.slice(0, -1));
        } else if ('textContent' in element) {
          element.textContent = element.textContent.slice(0, -1);
        }

        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
      }
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
      Il vous reste <strong>${essais}</strong> tentative${essais > 1 ? `s` : ``} avant blocage.
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

          simulateBackspaces(lastEditableElement, text.length, currentDomain);
          lastText = "";
        }
      }
    }, 6000);
  }

  // Fonction pour les bloçages automatiques :
  // Affiche une page noire bloquante sur le site.
  // Sauvegarde la date de blocage.
  // Redirige vers une vidéo "éducative" lorsque l'utilisateur bouge sa souris
  function Blocage(message, activeVideo, tempsRestant) {
    const blocage = document.createElement('div');
    blocage.innerHTML = message;
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
    blocage.style.fontSize = '24px';
    blocage.style.fontFamily = "Arial, sans-serif";
    blocage.style.lineHeight = '1.2';
    blocage.style.textAlign = 'center';
    blocage.style.zIndex = '9999';

    blocage.innerHTML = `
    <p><span style="font-size: 180px;">💀</span></p>
    <p style="padding-top: 15px">${message}</p>
  `;

    document.body.appendChild(blocage);

    const currentDomain = window.location.hostname;
    // Vérifie si le blocage existe déjà pour éviter de mettre à jour le timestamp
    chrome.storage.sync.get(['blockedSites'], (result) => {
      const blockedSites = result.blockedSites || {};
      if (!blockedSites[currentDomain]) {
        blockedSites[currentDomain] = {
          timestamp: Date.now()
        };
        chrome.storage.sync.set({ blockedSites });
      }
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

    // Démarre le compte à rebours
    startCountdown(tempsRestant);
  }

  // Fonction pour les bloçages manuels :
  // Affiche une page noire bloquante sur le site.
  function BlocageManuel(message) {
    const blocage = document.createElement('div');
    blocage.innerHTML = message;
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
    blocage.style.fontSize = '24px';
    blocage.style.fontFamily = "Arial, sans-serif";
    blocage.style.lineHeight = '1.2';
    blocage.style.textAlign = 'center';
    blocage.style.zIndex = '9999';

    blocage.innerHTML = `
    <p><span style="font-size: 180px;">🔒</span></p>
    <p style="padding-top: 15px">${message}</p>
  `;
    document.body.appendChild(blocage);
  }

  // Fonction qui démarre le compte à rebours
  function startCountdown(tempsRestant) {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    function updateCountdown() {
      const jours = Math.floor(tempsRestant / (1000 * 60 * 60 * 24));
      const heures = Math.floor((tempsRestant % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((tempsRestant % (1000 * 60 * 60)) / (1000 * 60));
      const secondes = Math.floor((tempsRestant % (1000 * 60)) / 1000);

      countdownElement.innerHTML = `${jours}j ${heures}h ${minutes}m ${secondes}s`;

      tempsRestant -= 1000;
      if (tempsRestant < 0) {
        clearInterval(countdownInterval);
        location.reload(); // Rafraîchit la page pour redonner accès à l'utilisateur
      }
    }

    updateCountdown(); // Met à jour immédiatement le compte à rebours
    const countdownInterval = setInterval(updateCountdown, 1000);
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
          languages: ["fr", "en"],
          requestedAttributes: { TOXICITY: {} }
        })
      });

      const result = await response.json();
      const toxicityScore = result.attributeScores?.TOXICITY?.summaryScore?.value;

      if (toxicityScore !== undefined) {
        // console.log(`Toxicité détectée : ${toxicityScore * 100}%`);
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
