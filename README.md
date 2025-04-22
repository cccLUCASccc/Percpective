# CyberProtect – Extension Chrome

**CyberProtect** est une extension Chrome qui détecte et modère les comportements toxiques sur les réseaux sociaux. 
Elle utilise l'API CommentAnalyzer pour analyser les messages saisis avant qu'ils ne soient envoyés.

---

## 📁 Contenu de l’extension

- `manifest.json` — Déclaration de l’extension
- `background.js` — Script de fond principal (inactivité, notifications)
- `content.js` — Script injecté dans les pages (écoute clavier, traitement)
- `interface.html` — Interface d'affichage si nécessaire
- `interface.js` — Script de gestion de l'interface
- `icons/` — Dossier contenant les icônes :
  - `icon_16.png`, `icon_48.png`, `icon_128.png`
- `README.md` — Ce fichier

---

## 🚀 Installation en mode développeur

1. Télécharge et **décompresse** ce dossier.
2. Ouvre **Google Chrome** et accède à `chrome://extensions/`
3. Active le **mode développeur** (en haut à droite).
4. Clique sur **"Charger l’extension non empaquetée"**
5. Sélectionne le **dossier extrait**.

> L’extension devrait maintenant apparaître dans ta barre d’outils !

---

## 🔍 Fonctionnalités principales

- Analyse des messages saisis sur les réseaux sociaux
- Délai de réflexion avant envoi si contenu jugé toxique
- Notification de déconnexion après inactivité
- Interface de contrôle intégrée à l’extension

---

## 🧪 Testé sur

- Google Chrome 123+
- Windows 10 / 11

---

## 📬 Contact développeurs

**Emmanuel Cuiret**
**Lucas Cloes**

---

## 📝 Licence

Ce projet est destiné à un usage personnel ou éducatif.  
Toute reproduction ou diffusion nécessite l’accord explicite des auteurs.
