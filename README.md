# Répét 🎭

Application PWA de répétition de théâtre en italiennes avec synthèse vocale offline.

## 🎯 À propos

**Répét** est une Progressive Web App (PWA) open-source conçue pour aider les comédiens à mémoriser leurs textes et répéter leurs scènes. Elle propose :

- 📖 **Lecture silencieuse** - Lecture classique à votre rythme
- 🔊 **Mode Audio** - Synthèse vocale pour toutes les répliques
- 🎭 **Mode Italienne** - Vos répliques sont masquées pour tester votre mémoire
- 🎤 **Voix offline** - 4 voix françaises de haute qualité embarquées (Piper TTS)
- 📄 **Export PDF** - Exportez vos pièces au format A4 pour l'impression
- 💾 **100% hors ligne** - Fonctionne sans connexion après installation
- 📱 **Multi-plateforme** - Desktop, Android, iOS

## 🚀 Stack Technique

- **React 18** + **TypeScript** - Interface moderne et type-safe
- **Vite** - Build ultra-rapide avec HMR
- **Tailwind CSS** - Styling avec support mode sombre
- **Zustand** - State management avec persistance
- **Dexie.js** - Stockage local IndexedDB
- **Piper TTS** - Synthèse vocale offline de qualité (ONNX)
- **PWA** - Application installable fonctionnant hors ligne

## 📋 Prérequis

- **Node.js** 18+
- **npm** 9+

## 🛠️ Installation

```bash
# Cloner le projet
git clone https://github.com/ecanasso/repet.git
cd repet

# Installer les dépendances
npm install

# Télécharger les voix (~268 MB)
npm run download-models
```

## 💻 Développement

```bash
# Mode développement (version offline par défaut)
npm run dev

# Version online (iOS/léger)
npm run dev:online

# L'app sera sur http://localhost:5173
```

### Commandes disponibles

```bash
npm run dev              # Dev offline (défaut)
npm run dev:online       # Dev online (iOS)
npm run build            # Build offline + online
npm run build:offline    # Build offline uniquement (~248 MB)
npm run build:online     # Build online uniquement (~54 MB)
npm run preview:offline  # Preview build offline
npm run preview:online   # Preview build online
npm run type-check       # Vérification TypeScript
npm run lint             # Analyse ESLint
npm run format           # Format Prettier
```

## 📦 Architecture Dual-Build

Répét utilise deux builds optimisés pour différentes plateformes :

### 🖥️ Build Offline (~248 MB)

**Cible** : Desktop (Chrome, Firefox, Edge, Safari) et Android

- ✅ 4 voix françaises embarquées (Siwis, Tom, Jessica, Pierre)
- ✅ 100% fonctionnel hors ligne
- ✅ Précache ~1.35 MB (assets légers)
- ✅ Voix stockées hors précache (compatibilité iOS)

**Déployer** : `dist-offline/` → https://app.repet.com

### 📱 Build Online (~54 MB)

**Cible** : iOS/Safari (limites strictes de stockage PWA)

- ✅ Aucune voix embarquée
- ✅ Téléchargement à la demande depuis CDN
- ✅ Précache ~1.2 MB seulement
- ✅ Cache OPFS persistant

**Déployer** : `dist-online/` → https://ios.repet.com (+ CDN pour voix)

📚 **Documentation complète** : [docs/TWO_BUILDS_ARCHITECTURE.md](docs/TWO_BUILDS_ARCHITECTURE.md)

## 🌐 Déploiement

### Build de production

```bash
# Build des deux versions
npm run build

# Résultat :
# - dist-offline/  (~248 MB)
# - dist-online/   (~54 MB)
```

### Déploiement recommandé

**Netlify / Vercel** (le plus simple)

1. Connectez votre repo
2. Configuration :
   - Build command: `npm run build:offline` (ou `:online`)
   - Publish directory: `dist-offline` (ou `dist-online`)
3. Deploy !

**GitHub Pages**

Le workflow `.github/workflows/deploy.yml` est déjà configuré.
Activez Pages dans Settings → Pages → Source: GitHub Actions

**Serveur personnel**

```bash
# Via rsync/FTP : uploadez dist-offline/ ou dist-online/
# Servir avec nginx/apache en mode SPA (fallback index.html)
```

📚 **Guide détaillé** : [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 📱 Tester l'Installation PWA

⚠️ L'icône d'installation n'apparaît **pas en dev** (`npm run dev`).

### Pour tester l'installation :

```bash
npm run build:offline
npm run preview:offline
# Ouvrez http://localhost:4173 dans Chrome
```

**Dans Chrome** :
- Attendez quelques secondes
- Icône ⊕ dans la barre d'adresse
- Ou Menu (⋮) → "Installer Répét"

**Vérification DevTools (F12)** :
- Onglet **Application** → **Manifest** (doit s'afficher)
- **Service Workers** (doit être actif)

## 📁 Structure du Projet

```
repet/
├── public/
│   ├── icons/              # Icônes PWA
│   ├── voices/             # Modèles Piper (3 voix FR)
│   ├── wasm/               # ONNX Runtime + Piper phonemizer
│   └── manifest.json
├── src/
│   ├── core/
│   │   ├── parser/        # Parser textes théâtre
│   │   ├── storage/       # IndexedDB (Dexie)
│   │   ├── tts/           # TTS offline (Piper)
│   │   └── models/        # Types TypeScript
│   ├── state/             # Zustand stores
│   ├── screens/           # Pages React
│   ├── components/        # Composants réutilisables
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilitaires
├── docs/                  # Documentation technique
├── examples/              # Exemples de pièces
├── scripts/               # Scripts d'optimisation
├── vite.config.offline.ts # Config build offline
├── vite.config.online.ts  # Config build online
└── README.md
```

## 📚 Documentation

### Pour Utilisateurs

- **Aide intégrée** : Bouton "?" dans l'application
- [USER_GUIDE.md](docs/USER_GUIDE.md) - Guide complet

### Pour Développeurs

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture technique
- [PARSER.md](docs/PARSER.md) - Format de fichiers texte
- [TWO_BUILDS_ARCHITECTURE.md](docs/TWO_BUILDS_ARCHITECTURE.md) - Builds offline/online
- [OFFLINE_MODE.md](docs/OFFLINE_MODE.md) - Mode hors ligne
- [BUILD_OPTIMIZATION_SUMMARY.md](docs/BUILD_OPTIMIZATION_SUMMARY.md) - Optimisations
- [CHANGELOG.md](CHANGELOG.md) - Historique versions

### Exemples

Le dossier `examples/` contient des pièces d'exemple au format supporté :

- `ALEGRIA.txt` - Exemple complet
- `format-mixte.txt` - Plusieurs formats combinés
- `format-sans-deux-points.txt` - Format alternatif
- `section-cast-complete.txt` - Avec section Personnages
- `uniquement-scenes.txt` - Sans actes
- `sans-structure.txt` - Minimal

## 🎨 Format des Fichiers Texte

Répét accepte les fichiers `.txt` avec une structure flexible :

```
Titre de la Pièce

Auteur: Nom de l'auteur
Annee: 2024

PERSONNAGES:
HAMLET - Prince de Danemark
OPHÉLIE - Fille de Polonius

ACTE I

Scène 1

HAMLET:
Être ou ne pas être, telle est la question.

OPHÉLIE
Monseigneur, j'ai des souvenirs de vous.
(Elle lui tend des lettres)
```

**Formats supportés** :
- Répliques avec deux-points : `HAMLET:`
- Répliques sans deux-points : ligne vide + `HAMLET`
- Didascalies : `(texte entre parenthèses)`
- Section Personnages optionnelle
- Structure flexible (actes/scènes optionnels)

📚 **Documentation complète** : [docs/PARSER.md](docs/PARSER.md)

## 🌐 Compatibilité

| Plateforme | Navigateur | PWA Installable | Voix Offline |
|------------|-----------|----------------|--------------|
| **Desktop** | Chrome 90+ | ✅ | ✅ |
| **Desktop** | Firefox 88+ | ✅ | ✅ |
| **Desktop** | Edge 90+ | ✅ | ✅ |
| **Desktop** | Safari 15+ | ✅ | ✅ |
| **Android** | Chrome 90+ | ✅ | ✅ |
| **iOS** | Safari 15+ | ✅ | ✅ (via CDN) |

## 🤝 Contribution

Les contributions sont bienvenues !

### Processus

1. Fork le projet
2. Créer une branche : `git checkout -b feature/ma-feature`
3. Commit : `git commit -m 'feat: ajout de ma feature'`
4. Push : `git push origin feature/ma-feature`
5. Ouvrir une Pull Request

### Standards

- ✅ TypeScript strict (pas de `any`)
- ✅ Pas de hardcoding (constantes nommées)
- ✅ Tests manuels systématiques
- ✅ JSDoc pour fonctions complexes
- ✅ Copyright header MIT sur nouveaux fichiers

📚 **Standards complets** : [.github/prompts/common.md](.github/prompts/common.md)

## 🐛 Signaler un Bug

Ouvrez une issue sur GitHub avec :

- Description du problème
- Étapes de reproduction
- Navigateur et version
- Captures d'écran si applicable

## 📄 Licence

Ce projet est sous licence **MIT**.

Copyright (c) 2025 Répét Contributors

Voir [LICENSE](LICENSE) pour le texte complet.

## 👤 Auteur

**Xavier Talon**

Ce logiciel open-source est fourni gracieusement par l'association **"En Compagnie des Alliés Nés"**.

## 🙏 Remerciements

- [Piper TTS](https://github.com/rhasspy/piper) - Synthèse vocale offline de qualité
- [ONNX Runtime](https://onnxruntime.ai/) - Inférence ML performante
- [Vite](https://vitejs.dev/) - Build tool ultra-rapide
- [React](https://react.dev/) - Framework UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Dexie.js](https://dexie.org/) - Wrapper IndexedDB
- [Zustand](https://github.com/pmndrs/zustand) - State management

---

**Répét** - Répétez, mémorisez, performez 🎭✨