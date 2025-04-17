import value from "./popup";

console.log("Extension CyberProtect injectée !");

function toggleExtensionBasedOnConsent(callback) {
  chrome.storage.local.get(['consentGiven'], function (result) {
    const consentGiven = result.consentGiven;
    if (consentGiven === false || consentGiven === undefined) {
      console.log("Extension CyberProtect désactivée (consentement non donné!).");
      clearInterval(intervalId);
      callback(false);
    } else {
      console.log("Extension CyberProtect activée!");
      if (!intervalId) {
        startInterval();
      }
      callback(true);
    }
  });
}

let intervalId = null;

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

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.toxicityThreshold) {
    seuil = changes.toxicityThreshold.newValue;
    console.log("🔄 Seuil de toxicité mis à jour :", seuil);
  }
});

let lastText = "";
let enterBlocked = false;
let allBloqued = false;
let seuil = 50;
let controller = new AbortController();
let essais = 3;
let lastEditableElement = null;

chrome.storage.local.get(['toxicityThreshold'], (result) => {
  if (result.toxicityThreshold !== undefined) {
    seuil = result.toxicityThreshold;
    console.log("🎚️ Seuil de toxicité récupéré :", seuil);
  }
});

function getActiveEditableElement() {
  const active = document.activeElement;
  if (active && active.isContentEditable) return active;
  if (active && active.tagName === "TEXTAREA") return active;
  return null;
}

function blockEnterTemporarily() {
  enterBlocked = true;
}

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

function showWarningPopup(score) {
  const existing = document.querySelector("#cyber-popup");
  if (existing) existing.remove();

  allBloqued = true;

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
      const currentEditable = getActiveEditableElement();

      if (currentEditable && currentEditable === lastEditableElement) {
        const text = currentEditable.isContentEditable
          ? currentEditable.innerText
          : currentEditable.value;

        simulateBackspaces(currentEditable, text.length);
        lastText = "";
      } else {
        console.log("⚠️ L'élément actif a changé, annulation de l'effacement.");
        lastText = "";
      }
    }
  }, 10000);
}

function Blocage(message) {
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

  allBloqued = true;

  let alreadyRedirected = false;

  blocage.addEventListener('mousemove', function () {
    if (alreadyRedirected) return;
    alreadyRedirected = true;

    const a = document.createElement('a');
    a.href = 'https://www.youtube.com/embed/blar1yAMXWQ?autoplay=1&controls=0&rel=0&showinfo=0&modestbranding=1';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}

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

        if (essais > 0) {
          essais--;
          showWarningPopup(toxicityScore);
        } else {
          Blocage('On vous avait prévenu.');
        }
      }
    }
  } catch (error) {
    console.error("❌ Erreur analyse toxicité :", error);
  }
}
