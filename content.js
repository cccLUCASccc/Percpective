console.log("Extension de cyber-prévention injectée !");

let lastText = "";
let enterBlocked = false;
let allBloqued = false;
let seuil = 30;
let controller = new AbortController();
let essais = 3;
let lastEditableElement = null;

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
      Il pourrait être perçu comme une tentative de cyberharcèlement.
    </p>
    <p style="margin: 4px 0;">
      Il vous reste <strong>${essais}</strong> tentative(s) avant le blocage.
    </p>
    <button id="popup-ok-btn" style="
      background-color: #0df024;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    ">
      Modifier le message
    </button>
  `;

  document.body.appendChild(popup);

  document.getElementById("popup-ok-btn").addEventListener("click", () => {
    allBloqued = false;
    popup.remove();

    if (lastEditableElement) {
      const text = lastEditableElement.isContentEditable
        ? lastEditableElement.innerText
        : lastEditableElement.value;

      simulateBackspaces(lastEditableElement, text.length);
      lastText = "";
    }
  });

  setTimeout(() => {
    if (document.querySelector("#cyber-popup")) {
      allBloqued = false;
      popup.remove();
    }
  }, 15000);
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

  // ✅ Doit être un let, défini une seule fois
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

setInterval(() => {
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
