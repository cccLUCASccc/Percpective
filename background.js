chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startTimer") {
    setTimeout(() => {
      (async () => {
        // Nettoyage des données d'auth
        await chrome.storage.sync.remove("isAuthenticated");
        await chrome.storage.sync.remove("openParameters");

        // Notification de déconnexion
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

  if (message.action === "updateBlockingRules") {
    updateBlockingRules();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  updateBlockingRules();
});

function updateBlockingRules() {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingRuleIds = existingRules.map(rule => rule.id);

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,  // 🔥 Supprimer tout
      addRules: [], // Vide d'abord

    }, () => {
      // Après nettoyage, on recharge les nouvelles règles
      chrome.storage.sync.get(['blockedSites'], (result) => {
        const blockedSitesObj = result.blockedSites || {};

        const manualSites = Object.keys(blockedSitesObj).filter(site => {
          return blockedSitesObj[site].manual === true;
        });

        const rules = manualSites.map((site, index) => ({
          id: index + 1,  // ⚠️ ID simple
          priority: 1,
          action: {
            type: "redirect",
            redirect: { extensionPath: "/blocked.html" } // vers une page HTML de ton extension
          },
          condition: {
            urlFilter: site,
            resourceTypes: ["main_frame"]
          }
        }));

        chrome.declarativeNetRequest.updateDynamicRules({
          addRules: rules
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Erreur mise à jour des règles :', chrome.runtime.lastError?.message);
          } else {
            console.log("✅ Règles de blocage mises à jour !");
          }
        });
      });
    });
  });
}