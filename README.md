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

## 🛠️ Installation

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

## 📖 Documentation

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