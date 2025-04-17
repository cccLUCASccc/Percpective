document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get(["consentGiven", "toxicityThreshold"], (result) => {
    const threshold = result.toxicityThreshold || 50;
    document.getElementById("consentGiven").checked = !!result.consentGiven;
    document.getElementById("toxicityThreshold").value = threshold;
    document.getElementById("threshold-value").innerText = `${threshold}%`;

    updateSliderBackground(threshold);
  });
  

  document.getElementById("toxicityThreshold").addEventListener("input", (event) => {
    const value = event.target.value;
    document.getElementById("threshold-value").innerText = `${value}%`;
    updateSliderBackground(value);
  });

  document.getElementById("config-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const consentGiven = document.getElementById("consentGiven").checked;
    const toxicityThreshold = parseInt(document.getElementById("toxicityThreshold").value, 10);

    chrome.storage.local.set({ consentGiven, toxicityThreshold }, () => {
      alert("Configuration sauvegardée !");
      window.close();
    });
  });

  function updateSliderBackground(value) {
    const color = `linear-gradient(to right, #FF0000, #00FF00 ${value}%, #333 ${value}%)`;

    const slider = document.getElementById("toxicityThreshold");
    slider.style.background = color;
  }
});
