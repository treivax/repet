# 📁 Structure Finale du Projet Répét

Ce fichier décrit la structure complète du projet après exécution des 12 prompts.

---

## 🌳 Arborescence Complète

```
repet/
├── .github/
│   └── prompts/
│       └── common.md                 # Standards du projet
│
├── docs/
│   ├── ARCHITECTURE.md               # Architecture détaillée
│   ├── USER_GUIDE.md                 # Guide utilisateur
│   ├── FILE_FORMAT.md                # Format des fichiers .txt
│   └── DEPLOYMENT.md                 # Guide de déploiement
│
├── plans/
│   ├── README.md                     # Vue d'ensemble du plan
│   ├── PROMPTS_SUMMARY.md            # Résumé détaillé des prompts
│   ├── GETTING_STARTED.md            # Guide de démarrage
│   ├── PROJECT_STRUCTURE.md          # Ce fichier
│   ├── 01-setup-initial.md           # Prompt 01
│   ├── 02-models-types.md            # Prompt 02
│   └── 03-12-*.md                    # Prompts 03 à 12
│
├── public/
│   ├── icons/
│   │   ├── icon-192.png              # Icône PWA 192x192
│   │   └── icon-512.png              # Icône PWA 512x512
│   ├── examples/
│   │   └── exemple-piece.txt         # Exemple de pièce
│   └── manifest.json                 # Manifest PWA (auto-généré)
│
├── src/
│   ├── core/                         # 🧠 LOGIQUE MÉTIER
│   │   ├── models/                   # Modèles de données
│   │   │   ├── types.ts              # Types de base
│   │   │   ├── Character.ts          # Modèle personnage
│   │   │   ├── ContentNode.ts        # AST (actes, scènes, répliques)
│   │   │   ├── Play.ts               # Modèle pièce
│   │   │   ├── Settings.ts           # Modèle paramètres
│   │   │   └── index.ts              # Exports
│   │   │
│   │   ├── parser/                   # Parser de textes
│   │   │   ├── types.ts              # Types internes
│   │   │   ├── tokenizer.ts          # Découpage en tokens
│   │   │   ├── parser.ts             # Construction AST
│   │   │   └── index.ts              # API publique
│   │   │
│   │   ├── storage/                  # IndexedDB
│   │   │   ├── database.ts           # Configuration Dexie
│   │   │   ├── plays.ts              # Repository pièces
│   │   │   ├── settings.ts           # Repository paramètres
│   │   │   └── index.ts              # API publique
│   │   │
│   │   └── tts/                      # Text-to-Speech
│   │       ├── types.ts              # Types TTS
│   │       ├── engine.ts             # Wrapper Web Speech API
│   │       ├── queue.ts              # File d'attente répliques
│   │       ├── voice-manager.ts      # Sélection voix
│   │       └── index.ts              # API publique
│   │
│   ├── state/                        # 🗂️ STATE MANAGEMENT (Zustand)
│   │   ├── usePlayStore.ts           # Store des pièces
│   │   ├── useSettingsStore.ts       # Store des paramètres
│   │   ├── usePlayerStore.ts         # Store du lecteur audio
│   │   └── useUIStore.ts             # Store UI (thème, navigation)
│   │
│   ├── screens/                      # 📱 ÉCRANS
│   │   ├── HomeScreen.tsx            # Liste des pièces
│   │   ├── PlayDetailScreen.tsx      # Détails + config
│   │   ├── SilentReadScreen.tsx      # Lecture silencieuse
│   │   ├── AudioReadScreen.tsx       # Lecture audio
│   │   ├── ItalianScreen.tsx         # Mode italiennes
│   │   └── NotFoundScreen.tsx        # Page 404
│   │
│   ├── components/                   # 🧩 COMPOSANTS REACT
│   │   ├── common/                   # Composants génériques
│   │   │   ├── Button.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Header.tsx
│   │   │
│   │   ├── play/                     # Composants pièces
│   │   │   ├── PlayList.tsx          # Liste des pièces
│   │   │   ├── PlayCard.tsx          # Carte d'une pièce
│   │   │   ├── ActHeader.tsx         # En-tête d'acte
│   │   │   ├── SceneHeader.tsx       # En-tête de scène
│   │   │   ├── Line.tsx              # Une réplique
│   │   │   ├── Didascalie.tsx        # Didascalie
│   │   │   ├── TableOfContents.tsx   # Sommaire
│   │   │   └── CharacterBadge.tsx    # Badge personnage
│   │   │
│   │   ├── settings/                 # Composants configuration
│   │   │   ├── VoiceSettings.tsx     # Config voix
│   │   │   ├── ReadingSettings.tsx   # Config lecture
│   │   │   └── ThemeToggle.tsx       # Switch thème
│   │   │
│   │   └── reader/                   # Composants lecteur
│   │       ├── NavigationControls.tsx # Navigation scènes
│   │       ├── ProgressIndicator.tsx  # Animation progression
│   │       └── CharacterSelector.tsx  # Sélecteur personnage
│   │
│   ├── hooks/                        # 🎣 CUSTOM HOOKS
│   │   ├── useFileImport.ts          # Import fichier .txt
│   │   ├── useTTS.ts                 # Hook TTS simplifié
│   │   ├── useTheme.ts               # Gestion thème
│   │   ├── useNavigation.ts          # Navigation scènes
│   │   └── useSceneNavigation.ts     # Navigation scènes avancée
│   │
│   ├── utils/                        # 🔧 UTILITAIRES
│   │   ├── colors.ts                 # Génération couleurs
│   │   ├── validation.ts             # Validation fichiers
│   │   ├── formatting.ts             # Formatage texte
│   │   ├── uuid.ts                   # Génération UUID
│   │   └── constants.ts              # Constantes globales
│   │
│   ├── styles/                       # 🎨 STYLES
│   │   └── globals.css               # Styles globaux + Tailwind
│   │
│   ├── main.tsx                      # Point d'entrée
│   └── App.tsx                       # Composant racine + Router
│
├── .gitignore                        # Git ignore
├── index.html                        # HTML racine
├── LICENSE                           # Licence MIT
├── package.json                      # Dépendances npm
├── postcss.config.js                 # Config PostCSS
├── README.md                         # README principal
├── tailwind.config.js                # Config Tailwind
├── tsconfig.json                     # Config TypeScript
├── tsconfig.node.json                # Config TS pour Node
└── vite.config.ts                    # Config Vite + PWA
```

---

## 📊 Statistiques du Projet

### Fichiers
- **~60 fichiers TypeScript/TSX**
- **~15 fichiers de configuration**
- **~10 fichiers de documentation**

### Lignes de Code (estimation)
- Models : ~500 lignes
- Parser : ~800 lignes
- Storage : ~300 lignes
- TTS : ~600 lignes
- State : ~400 lignes
- Components : ~2000 lignes
- Screens : ~1500 lignes
- Hooks : ~400 lignes
- Utils : ~300 lignes
- **Total : ~6800 lignes de code**

### Dépendances NPM
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7",
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

---

## 🎯 Modules Principaux

### Core Modules (Logique Métier)

| Module | Responsabilité | Dépendances |
|--------|----------------|-------------|
| **models** | Types et modèles de données | Aucune |
| **parser** | Parse fichiers .txt → AST | models |
| **storage** | Stockage IndexedDB | models, dexie |
| **tts** | Text-to-Speech | models, Web Speech API |

### State Modules (Zustand)

| Store | Responsabilité | Persistence |
|-------|----------------|-------------|
| **usePlayStore** | Gestion des pièces | IndexedDB |
| **useSettingsStore** | Paramètres | localStorage |
| **usePlayerStore** | État lecteur audio | Mémoire |
| **useUIStore** | État UI (thème, etc.) | localStorage |

### UI Modules (React)

| Module | Composants | Complexité |
|--------|-----------|------------|
| **common** | 6 composants génériques | Simple |
| **play** | 8 composants pièces | Moyenne |
| **settings** | 3 composants config | Simple |
| **reader** | 3 composants lecteur | Moyenne |

### Screens (Pages)

| Écran | Route | Fonctionnalité |
|-------|-------|----------------|
| **Home** | `/` | Liste + import |
| **PlayDetail** | `/play/:id` | Config pièce |
| **SilentRead** | `/play/:id/read` | Lecture silencieuse |
| **AudioRead** | `/play/:id/audio` | Lecture audio |
| **Italian** | `/play/:id/italian` | Mode italiennes |
| **NotFound** | `*` | 404 |

---

## 🔧 Outils de Développement

### Scripts NPM
```bash
npm run dev          # Serveur dev (port 5173)
npm run build        # Build production
npm run preview      # Preview du build
npm run type-check   # Vérif TypeScript
npm run lint         # Linting
npm run format       # Formatage Prettier
```

### Configuration
- **TypeScript** : Strict mode activé
- **ESLint** : Règles React + TypeScript
- **Prettier** : Formatage auto
- **Tailwind** : Utility-first CSS
- **Vite** : Build rapide avec HMR

---

## 📱 Caractéristiques PWA

### Manifest
- Nom : "Répét - Répétition Théâtre"
- Icônes : 192x192, 512x512
- Display : standalone
- Orientation : any

### Service Worker
- Cache-first pour assets statiques
- Offline-capable
- Auto-update

### Capacités
- Installable (Android/iOS)
- Fonctionne hors ligne
- Accès File API
- Web Speech API
- IndexedDB

---

## 🎨 Design System

### Thèmes
- **Light** : Blanc, noir, gris, bleu
- **Dark** : Gris foncé, blanc, bleu clair

### Typographie
- Police : Inter, system-ui
- Tailles : text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

### Couleurs
- Primary : Bleu (#2563eb)
- Personnages : Générées automatiquement (HSL)
- Didascalies : Gris (#666666)

### Spacing
- Tailwind standard (0.25rem increments)
- Padding général : p-4, p-6
- Margins : m-2, m-4, m-8

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `README.md` | Vue d'ensemble, installation, usage |
| `docs/ARCHITECTURE.md` | Architecture détaillée |
| `docs/USER_GUIDE.md` | Guide utilisateur complet |
| `docs/FILE_FORMAT.md` | Spécification format .txt |
| `docs/DEPLOYMENT.md` | Guide déploiement (Netlify, Vercel, etc.) |
| `CHANGELOG.md` | Historique des versions |

---

## ✅ Checklist Finale

Après les 12 prompts, vérifier :

- [ ] L'app démarre sans erreur
- [ ] Import fichier .txt fonctionne
- [ ] 3 modes de lecture fonctionnels
- [ ] Stockage persistant (refresh conserve data)
- [ ] Synthèse vocale opérationnelle
- [ ] Navigation scènes fluide
- [ ] Sommaire interactif
- [ ] Thème clair/sombre bascule
- [ ] Responsive (mobile/tablet/desktop)
- [ ] PWA installable
- [ ] Mode hors ligne
- [ ] 0 erreur TypeScript
- [ ] 0 warning ESLint
- [ ] 0 erreur console navigateur
- [ ] Documentation complète

---

**Structure créée par les prompts 01-12**
**Date : 2025-01-10**
