# Documentation Répét

Cette documentation contient les informations essentielles pour comprendre, utiliser et maintenir l'application Répét.

## 📚 Index de la Documentation

### 🏗️ Architecture et Conception

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture technique complète de l'application
  - Structure du projet
  - Flux de données (Zustand stores)
  - Composants React
  - Système de parsing et AST

- **[TWO_BUILDS_ARCHITECTURE.md](TWO_BUILDS_ARCHITECTURE.md)** - Architecture dual-build
  - Build Offline (~248 MB) : Desktop/Android avec voix embarquées
  - Build Online (~54 MB) : iOS/Safari avec voix à la demande
  - Stratégies de cache et OPFS
  - Comparaison et recommandations

### 🚀 Déploiement et Build

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guide de déploiement complet
  - Netlify, Vercel, GitHub Pages
  - Configuration serveur
  - Vérifications post-déploiement

- **[BUILD_OPTIMIZATION_SUMMARY.md](BUILD_OPTIMIZATION_SUMMARY.md)** - Optimisations des builds
  - Réduction de la taille (929 MB → 248 MB offline, 130 MB → 54 MB online)
  - Élimination des duplications
  - Configuration Vite et Workbox

### 📖 Guides Utilisateur

- **[USER_GUIDE.md](USER_GUIDE.md)** - Guide complet d'utilisation
  - Modes de lecture (Silencieux, Audio, Italien)
  - Installation PWA (Desktop, Android, iOS)
  - Configuration des voix
  - Paramètres et astuces

### 🎭 Format des Fichiers Texte

- **[PARSER.md](PARSER.md)** - Documentation du parser de pièces
  - Format des fichiers `.txt` acceptés
  - Syntaxe des répliques (avec/sans deux-points)
  - Structure (titre, auteur, actes, scènes)
  - Section Personnages
  - Didascalies
  - AST généré

### 📤 Export et Partage

- **[PDF_EXPORT.md](PDF_EXPORT.md)** - Export PDF des pièces
  - Génération de PDF A4 pour impression
  - Mise en page professionnelle
  - Options d'export

- **[TEXT_EXPORT.md](TEXT_EXPORT.md)** - Export texte des pièces
  - Sauvegarde au format `.txt`
  - Préservation de la structure

### 📱 Mode Hors Ligne (PWA)

- **[OFFLINE_MODE.md](OFFLINE_MODE.md)** - Fonctionnement du mode offline
  - Service Workers
  - Stratégies de cache
  - Synthèse vocale offline (Piper TTS)
  - ONNX Runtime Web
  - OPFS pour stockage persistant

- **[VOICE_LOADING.md](VOICE_LOADING.md)** - Chargement des voix TTS
  - Préchargement et optimisations
  - Gestion du cache
  - Stratégies de chargement

- **[WORKFLOW_TROUBLESHOOTING.md](WORKFLOW_TROUBLESHOOTING.md)** - Dépannage
  - Problèmes courants et solutions
  - Diagnostic des erreurs

## 🎯 Parcours Recommandés

### Pour les Utilisateurs

1. **[USER_GUIDE.md](USER_GUIDE.md)** - Commencez ici pour apprendre à utiliser l'application
2. **[PARSER.md](PARSER.md)** - Pour comprendre le format des fichiers texte

### Pour les Développeurs

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Vue d'ensemble de l'architecture
2. **[TWO_BUILDS_ARCHITECTURE.md](TWO_BUILDS_ARCHITECTURE.md)** - Comprendre les deux builds
3. **[BUILD_OPTIMIZATION_SUMMARY.md](BUILD_OPTIMIZATION_SUMMARY.md)** - Optimisations appliquées
4. **[PARSER.md](PARSER.md)** - Détails techniques du parsing
5. **[OFFLINE_MODE.md](OFFLINE_MODE.md)** - Fonctionnement PWA et TTS offline

### Pour le Déploiement

1. **[TWO_BUILDS_ARCHITECTURE.md](TWO_BUILDS_ARCHITECTURE.md)** - Choisir le bon build
2. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Suivre les instructions de déploiement

## 🔑 Concepts Clés

### Modes de Lecture

- **Silencieux** : Lecture classique du texte
- **Audio** : Synthèse vocale pour toutes les répliques
- **Italien** : Vos répliques masquées pour tester votre mémoire

### Synthèse Vocale Offline

Répét utilise **Piper TTS** avec **ONNX Runtime** pour une synthèse vocale de qualité fonctionnant 100% hors ligne :

- 3 voix françaises embarquées (Siwis, Tom, UPMC)
- Aucune connexion requise après installation
- Assignation de voix par personnage
- Voix narrateur pour didascalies et structure

### Stockage Local

- **IndexedDB** (via Dexie.js) : Pièces et paramètres
- **OPFS** : Modèles vocaux téléchargés (build online)
- **Service Worker Cache** : Assets statiques

## 📝 Historique des Versions

Voir [CHANGELOG.md](../CHANGELOG.md) à la racine du projet pour l'historique complet des versions et modifications.

## 🤝 Contribution

Répét est un projet open-source. Les contributions sont bienvenues !

Consultez les [standards de développement](../.github/prompts/common.md) pour les conventions de code.

### Auteur

**Xavier Talon**

### Association

Ce logiciel est fourni gracieusement par l'association **"En Compagnie des Alliés Nés"**.

### Licence

**MIT License** - Voir [LICENSE](../LICENSE) pour le texte complet.

---

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.