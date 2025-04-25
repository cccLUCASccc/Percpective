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
