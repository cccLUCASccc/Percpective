chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "notify") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Alerte Cyberharcèlement",
      message: message.message,
      priority: 1
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateThreshold') {
        const newThreshold = request.value;
        // Traitez la nouvelle valeur du seuil ici
        console.log('Nouveau seuil :', newThreshold);
        // Vous pouvez également stocker cette valeur dans le stockage local si nécessaire
        chrome.storage.local.set({ threshold: newThreshold });
    }
});
