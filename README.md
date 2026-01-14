# Répét

Application PWA de répétition de théâtre en italiennes.

## 🎭 À propos

**Répét** est une application web progressive (PWA) open-source conçue pour faciliter la répétition de pièces de théâtre en mode "italiennes". Elle permet aux comédiens de :

- Importer des textes de pièces au format `.txt`
- Lire silencieusement ou avec synthèse vocale (TTS)
- **Pratiquer en mode "italiennes"** avec masquage de leurs propres répliques pour les réciter de mémoire
- Révéler temporairement une réplique en cas de trou de mémoire
- Gérer plusieurs pièces et personnages
- Travailler hors-ligne grâce au stockage local

## 🚀 Stack Technique

- **React 18** + **TypeScript** - Interface utilisateur moderne et type-safe
- **Vite** - Build tool rapide avec HMR
- **Tailwind CSS** - Styling utilitaire avec support du mode sombre
- **React Router** - Navigation côté client
- **Zustand** - Gestion d'état légère et performante avec persistance
- **Dexie.js** - Abstraction IndexedDB pour stockage local
- **Web Speech API** - Synthèse vocale native du navigateur
- **PWA** - Application installable, fonctionnelle hors-ligne
- **Mode Italiennes** - Masquage intelligent des répliques pour répétition

## 📋 Prérequis

- **Node.js** 18+ 
- **npm** 7+

## 🚀 Installation et Développement

```bash
# Cloner le repository
git clone https://github.com/OWNER/repet.git
cd repet

# Installer les dépendances
npm install

# Télécharger les modèles vocaux (~268 MB)
npm run download-models

# Développement version offline (default)
npm run dev:offline

# Développement version online (iOS)
npm run dev:online
```

## 📦 Déploiement

Répét utilise une architecture dual-build pour optimiser l'expérience utilisateur selon la plateforme :

### Architecture de déploiement

- **Build OFFLINE** (~675 MB) : Version complète avec toutes les voix embarquées
  - URL : `https://app.repet.ecanasso.org`
  - Cible : Desktop (Chrome, Firefox, Edge, Safari) et Android
  
- **Build ONLINE** (~10 MB) : Version légère qui télécharge les voix à la demande
  - URL : `https://ios.repet.ecanasso.org`
  - Cible : iOS/Safari/macOS (compatible avec les limites de stockage iOS)

### Déploiement automatique

Le déploiement se fait automatiquement via GitHub Actions à chaque push sur `main` :

```bash
# Build les deux versions
npm run build

# Le workflow GitHub Actions déploie automatiquement :
# - dist-offline/ vers app.repet.ecanasso.org
# - dist-online/ vers ios.repet.ecanasso.org
```

### Configuration requise

Pour configurer le déploiement automatique sur O2switch :

1. Suivre le guide complet : [`deployment/O2SWITCH_DEPLOYMENT.md`](deployment/O2SWITCH_DEPLOYMENT.md)
2. Utiliser la checklist : [`deployment/SETUP_CHECKLIST.md`](deployment/SETUP_CHECKLIST.md)

**Secrets GitHub requis :**
- `O2SWITCH_HOST` : Hôte SSH
- `O2SWITCH_PORT` : Port SSH (généralement 2222)
- `O2SWITCH_USERNAME` : Nom d'utilisateur cPanel
- `O2SWITCH_SSH_KEY` : Clé privée SSH pour le déploiement
- `O2SWITCH_PATH_OFFLINE` : Chemin vers le dossier offline
- `O2SWITCH_PATH_ONLINE` : Chemin vers le dossier online

Voir [`deployment/O2SWITCH_DEPLOYMENT.md`](deployment/O2SWITCH_DEPLOYMENT.md) pour les instructions détaillées.

### Déploiement manuel

Si nécessaire, vous pouvez déployer manuellement via rsync :

```bash
# Build local
npm run build

# Déployer la version offline
rsync -avz --delete \
  -e "ssh -i ~/.ssh/o2switch_deploy_repet -p 2222" \
  dist-offline/ \
  user@ecanasso.org:/home/user/public_html/app.repet.ecanasso.org/

# Déployer la version online
rsync -avz --delete \
  -e "ssh -i ~/.ssh/o2switch_deploy_repet -p 2222" \
  dist-online/ \
  user@ecanasso.org:/home/user/public_html/ios.repet.ecanasso.org/
```

## 🏗️ Build de Production

### Build des deux versions

```bash
# Build complet (offline + online)
npm run build

# Build offline uniquement
npm run build:offline

# Build online uniquement
npm run build:online
```

### Structure des builds

```
repet/
├── dist-offline/     # Version offline (~675 MB)
│   └── voices/       # Voix embarquées
└── dist-online/      # Version online (~5-10 MB)
    └── (pas de dossier voices/)
```

### Preview

```bash
# Preview version offline
npm run preview:offline

# Preview version online
npm run preview:online
```

## 📦 Déploiement

### Version Offline → app.repet.com

```bash
npm run build:offline
# Déployer dist-offline/
```

### Version Online → ios.repet.com

```bash
npm run build:online
# Déployer dist-online/
# + Héberger les voix sur CDN (voir docs/CDN_SETUP.md)
```

📚 **Guide de déploiement** : Voir [docs/TWO_BUILDS_ARCHITECTURE.md](docs/TWO_BUILDS_ARCHITECTURE.md) et [docs/CDN_SETUP.md](docs/CDN_SETUP.md)

## 📱 Deux Versions Disponibles

Répét est disponible en **deux versions** pour s'adapter aux contraintes des différentes plateformes :

### 🖥️ Version Offline - Desktop/Android

**URL** : https://app.repet.com

- ✅ **100% hors ligne** après le premier chargement
- ✅ **Toutes les voix embarquées** (~675 MB)
- ✅ Compatible **Desktop** (Chrome, Firefox, Edge, Safari) et **Android**
- ✅ Expérience optimale pour répétitions sans connexion

### 📱 Version Online - iOS/Safari/macOS

**URL** : https://ios.repet.com

- ✅ **Léger** : ~5-10 MB seulement
- ✅ **Compatible iOS/Safari** : respecte les limites de stockage strictes
- ✅ Les voix sont **téléchargées à la demande** depuis le CDN
- ✅ **Cache intelligent** avec stratégie LRU
- ⚠️ **Nécessite Internet** pour le téléchargement initial des voix

### 🎯 Quelle Version Choisir ?

| Plateforme | Version Recommandée |
|------------|---------------------|
| Desktop (Chrome, Firefox, Edge) | **Offline** |
| Android moderne | **Offline** |
| iOS / iPhone / iPad | **Online** |
| macOS Safari | **Online** |

📚 **Documentation complète** : Voir [docs/TWO_BUILDS_ARCHITECTURE.md](docs/TWO_BUILDS_ARCHITECTURE.md)

### Documentation Complète

- **[OFFLINE_QUICKSTART.md](OFFLINE_QUICKSTART.md)** - Guide de démarrage rapide
- **[docs/OFFLINE_MODE.md](docs/OFFLINE_MODE.md)** - Documentation technique complète
- **[OFFLINE_MODE_READY.md](OFFLINE_MODE_READY.md)** - Instructions de test

### Commandes

```bash
# Télécharger/re-télécharger les modèles
npm run download-models

# Vérifier les fichiers
ls public/voices/  # 4 dossiers de modèles
ls public/wasm/    # Fichiers WASM Piper + ONNX

# Build avec tous les assets
npm run build      # dist/ contient tout (~390 MB)
```

---

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/repet.git
cd repet

# Installer les dépendances
npm install
```

## 💻 Développement

```bash
# Lancer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:5173
```

### Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement avec HMR |
| `npm run build` | Compile l'application pour la production |
| `npm run preview` | Prévisualise le build de production |
| `npm run type-check` | Vérifie les types TypeScript sans compiler |
| `npm run lint` | Analyse le code avec ESLint |
| `npm run format` | Formate le code avec Prettier |

### 📱 Tester l'installation PWA

L'icône d'installation PWA n'apparaît **pas en mode dev** (`npm run dev`). Pour tester l'installation :

```bash
# Option 1 : Script automatique
./test-pwa.sh

# Option 2 : Manuellement
npm run build
npm run preview
# Puis ouvrez http://localhost:4173 dans Chrome
```

**Dans Chrome** :
1. Attendez quelques secondes après le chargement
2. Cherchez l'icône ⊕ dans la barre d'adresse (à droite de l'URL)
3. Ou Menu (⋮) → "Installer Répét..."
4. Cliquez pour installer l'application

**Vérification** :
- Ouvrez DevTools (F12) → Onglet **Application**
- Section **Manifest** : doit afficher le manifest de Répét
- Section **Service Workers** : doit montrer un service worker actif

**Alternative pour tester en dev** :
Décommentez `devOptions.enabled: true` dans `vite.config.ts` (⚠️ peut causer des problèmes de cache)

## 📦 Build Production

```bash
# Compiler l'application
npm run build

# Prévisualiser le build
npm run preview
```

Le build sera généré dans le dossier `dist/`.

## 🌐 Déploiement en production

### Déploiement rapide (5 minutes)

Voir **[DEPLOY_QUICKSTART.md](DEPLOY_QUICKSTART.md)** pour un guide express.

### Options de déploiement

| Plateforme | Difficulté | HTTPS | Déploiement auto | Gratuit |
|------------|------------|-------|------------------|---------|
| **Netlify** | ⭐ Facile | ✅ | ✅ | ✅ |
| **Vercel** | ⭐ Facile | ✅ | ✅ | ✅ |
| **GitHub Pages** | ⭐⭐ Moyen | ✅ | ✅ | ✅ |
| **Serveur personnel** | ⭐⭐⭐ Avancé | ⚙️ | ❌ | Dépend |

### Netlify (Recommandé)

```bash
# 1. Connectez votre repo sur netlify.com
# 2. Configuration :
#    Build command: npm run build
#    Publish directory: dist
# 3. Deploy !
```

Configuration incluse dans `netlify.toml` ✅

### Vercel

```bash
# Via CLI
npm install -g vercel
vercel login
vercel --prod

# Ou via l'interface web vercel.com
```

### GitHub Pages

```bash
# Le workflow GitHub Actions est déjà configuré
# Il suffit d'activer Pages dans Settings → Pages
# Source: GitHub Actions
```

**Documentation complète** : [DEPLOYMENT.md](DEPLOYMENT.md)

**Vérification après déploiement** :
- ✅ Site accessible en HTTPS
- ✅ PWA installable (icône ⊕ dans Chrome)
- ✅ Service Worker actif (DevTools → Application)
- ✅ Fonctionne hors ligne

## 📁 Structure du Projet

```
repet/
├── public/                    # Fichiers statiques
│   └── icons/                # Icônes PWA
├── src/
│   ├── core/                 # Logique métier
│   │   ├── parser/          # Parser de textes de pièces
│   │   ├── storage/         # Gestion IndexedDB
│   │   ├── tts/             # Text-to-Speech
│   │   └── models/          # Types et interfaces TypeScript
│   ├── state/               # State management (Zustand)
│   ├── screens/             # Pages de l'application
│   ├── components/          # Composants React réutilisables
│   │   ├── common/         # Composants génériques
│   │   ├── play/           # Composants liés aux pièces
│   │   ├── settings/       # Composants de configuration
│   │   └── reader/         # Composants de lecture
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Fonctions utilitaires
│   ├── styles/             # Styles globaux
│   ├── App.tsx             # Composant racine
│   └── main.tsx            # Point d'entrée
├── docs/                    # Documentation
└── plans/                   # Plans de développement
```

## 🧪 Tests

Les tests manuels sont effectués pour chaque fonctionnalité :

```bash
# Vérifier les types
npm run type-check

# Lancer l'application
npm run dev

# Vérifier :
# - Aucune erreur console
# - Fonctionnalités nominales
# - Responsive (mobile/desktop)
# - Thème clair et sombre
```

## 🌐 Compatibilité Navigateurs

- **Desktop** : Chrome, Firefox, Safari, Edge (dernières versions)
- **iOS** : Safari 15+ (support PWA)
- **Android** : Chrome 90+ (support PWA)

## 📚 Documentation

### Guides Utilisateur

- [README.md](README.md) - Ce fichier
- [OFFLINE_QUICKSTART.md](OFFLINE_QUICKSTART.md) - Mode déconnecté : guide rapide

### Documentation Technique

- [Guide utilisateur](docs/USER_GUIDE.md) - Instructions complètes d'utilisation et mode italiennes
- [Architecture](docs/ARCHITECTURE.md) - Documentation technique complète (AST, flux, stores)
- [Parser](docs/PARSER.md) - Format de fichier théâtral et utilisation du parser
- [Statut du projet](PROJECT_STATUS.md) - État d'avancement et roadmap
- [Changelog](CHANGELOG.md) - Historique des versions

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez les [plans de développement](plans/) pour voir les fonctionnalités en cours.

### Processus de contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'feat: add amazing feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code

- TypeScript strict (pas de `any`)
- Pas de hardcoding (utiliser des constantes)
- Tests manuels systématiques
- Documentation JSDoc pour les fonctions complexes
- Respecter les conventions du projet (voir `.github/prompts/common.md`)

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Vite](https://vitejs.dev/) - Build tool ultra-rapide
- [React](https://react.dev/) - Bibliothèque UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitaire
- [Dexie.js](https://dexie.org/) - Wrapper IndexedDB élégant
- [Zustand](https://github.com/pmndrs/zustand) - State management simple

---

**Répét** - Parce que la répétition est la clé de la performance 🎭