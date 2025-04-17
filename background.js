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
        console.log('Nouveau seuil :', newThreshold);
        chrome.storage.local.set({ threshold: newThreshold });
    }
});
