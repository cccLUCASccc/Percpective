chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startTimer") {
    setTimeout(() => {
      (async () => {
        // Nettoyage des données d'auth
        await chrome.storage.local.remove("isAuthenticated");
        await chrome.storage.local.remove("openParameters");

        // Notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon_48.png",
          title: "Notification CyberProtect",
          message: "Vous avez été déconnecté(e) après 2 minutes d'inactivité."
        });

        // Tentative de fermeture de la popup (si elle est ouverte)
        chrome.runtime.sendMessage({ action: "closePopup" }, (response) => {
          if (chrome.runtime.lastError) {
            // La popup peut ne pas être ouverte : on ignore l'erreur.
            console.warn("Popup non ouverte :", chrome.runtime.lastError.message);
          }
        });
      })();
    }, 120000); // 2 minutes
  }
});
