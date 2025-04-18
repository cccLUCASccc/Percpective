<<<<<<< HEAD
# Percpective
=======

```
extension
├─ .hintrc
├─ background.js
├─ content.js
├─ icons
│  ├─ icon_128.png
│  ├─ icon_16.png
│  └─ icon_48.png
├─ manifest.json
├─ popup.html
└─ popup.js

```
>>>>>>> master

--------------
| CyberAgent |
--------------

Fonctionnel pour le moment avec :
- Messenger,

A) Que fait l'extension :

1) À chaque seconde, le texte dans les champs  éditables est scanné.

2) Si nouveau message détecté, analyse de la toxicité.

3) Si toxique :

- Popup d’alerte.
- Blocage temporaire de Enter.
- Tentatives restantes diminuées.
- Blocage définitif après 3 essais.

4) L’utilisateur être bloqué pendant 10 jours sur le domaine concerné.


B) La fenêtre de paramétrage :

- Donner son accord sur les conditions d'utilisation :
ce qui active l'extension
- Définir le seuil de toxicité : permet d'activer les alertes selon la gravité du texte

