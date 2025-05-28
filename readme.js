// Permet de charger le fichier readme.md et de le convertir en html
fetch(chrome.runtime.getURL('readme.md'))
  .then(response => response.text())
  .then(text => {
    document.getElementById('content').innerHTML = marked.parse(text);

    // 🔄 Maintenant que le contenu est injecté, on peut ajouter le listener
    const privacyLink = document.getElementById('open-privacyRules');
    if (privacyLink) {
      privacyLink.addEventListener('click', (event) => {
        event.preventDefault(); // Empêche le comportement par défaut du lien
        chrome.tabs.create({
          url: chrome.runtime.getURL('/private/privacyRules.html')
        });
      });
    }
  })
  .catch(error => {
    document.getElementById('content').textContent = 'Erreur de chargement du readme.';
    console.error('Erreur lors du chargement du readme:', error);
  });
