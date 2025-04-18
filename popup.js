// Au chargement de la popup
document.addEventListener("DOMContentLoaded", () => {
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
});

document.getElementById("toxicityThreshold").addEventListener("input", (event) => {
  const thresholdValue = document.getElementById("threshold-value");
  thresholdValue.textContent = `${event.target.value}%`;
});

document.getElementById("config-form").addEventListener("submit", (event) => {
  event.preventDefault();

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

document.getElementById("open-options").addEventListener("click", (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});

document.getElementById("block-extension").addEventListener("click", (event) => {
  event.preventDefault();
  const input = prompt("Mot de passe admin requis pour bloquer l'extension :");
  verifyPassword(input, (isValid) => {
    if (isValid) {
      alert("Extension bloquée.");
    } else {
      alert("Mot de passe incorrect.");
    }
  });
});

document.getElementById("uninstall-extension").addEventListener("click", (event) => {
  event.preventDefault();
  const input = prompt("Mot de passe admin requis pour désinstaller l'extension :");
  verifyPassword(input, (isValid) => {
    if (isValid) {
      alert("Extension désinstallée.");
    } else {
      alert("Mot de passe incorrect.");
    }
  });
});

function verifyPassword(inputPassword, callback) {
  const encoder = new TextEncoder();
  crypto.subtle.digest("SHA-256", encoder.encode(inputPassword)).then((buffer) => {
    const hash = Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    chrome.storage.local.get("adminPasswordHash", (result) => {
      if (result.adminPasswordHash === hash) {
        callback(true);
      } else {
        callback(false);
      }
    });
  });
}
