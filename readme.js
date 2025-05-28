// Ouvre les règles de confidentialité en html
document.getElementById('open-privacyRules').addEventListener('click', () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('/private/privacyRules.html')
  });
});

//Permet de charger le fichier readme.md et de le convertir en html
fetch(chrome.runtime.getURL('readme.md'))
  .then(response => response.text())
  .then(text => {
    document.getElementById('content').innerHTML = marked.parse(text);
  })
  .catch(error => {
    document.getElementById('content').textContent = 'Erreur de chargement du readme.';
    console.error('Erreur lors du chargement du readme:', error);
  });
