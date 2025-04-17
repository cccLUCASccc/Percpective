document.addEventListener('DOMContentLoaded', function () {
  // Charger les données depuis le stockage local
  chrome.storage.local.get(["consentGiven", "toxicityThreshold"], (result) => {
    document.getElementById("consentGiven").checked = !!result.consentGiven;
    const threshold = result.toxicityThreshold || 50;
    document.getElementById("toxicityThreshold").value = threshold;
    document.getElementById("threshold-value").innerText = `${threshold}%`;
  });

  // Mettre à jour l'affichage du seuil
  document.getElementById("toxicityThreshold").addEventListener("input", (event) => {
    document.getElementById("threshold-value").innerText = `${event.target.value}%`;
  });

  // Sauvegarder les choix de l'utilisateur
  document.getElementById("config-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const consentGiven = document.getElementById("consentGiven").checked;
    const toxicityThreshold = parseInt(document.getElementById("toxicityThreshold").value, 10);

    chrome.storage.local.set({ consentGiven, toxicityThreshold }, () => {
      alert("Configuration sauvegardée !");
      window.close();
    });
  });


});
