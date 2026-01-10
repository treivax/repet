# 📋 Standards Communs - Projet Répet

## 🎯 Contexte du Projet

**Répét** : Application web PWA open-source de répétition de théâtre en italiennes, permettant la lecture silencieuse, audio et le mode répétition avec masquage des répliques de l'utilisateur.

---

## 🎯 PRINCIPES DE DÉVELOPPEMENT

### Règle Fondamentale : Simplicité et Maintenabilité

**TOUJOURS privilégier la solution la plus simple et maintenable.**

#### Principes

- ✅ **Code simple et lisible** avant optimisation prématurée
- ✅ **Composants réutilisables** et découplés
- ✅ **Separation of Concerns** - chaque module a une responsabilité claire
- ✅ **Progressive Enhancement** - fonctionnalités de base d'abord
- ❌ **PAS de sur-ingénierie** - YAGNI (You Aren't Gonna Need It)
- ❌ **PAS de dépendances inutiles** - privilégier les APIs natives
- ❌ **PAS de solutions temporaires** qui créent de la dette technique

#### Application

**Cas de refactoring complexe** :
1. **Produire un plan d'exécution détaillé**
2. **Décomposer en étapes atomiques validables**
3. **Soumettre le plan pour validation**
4. **Exécuter étape par étape**
5. **Tester manuellement après chaque étape**

**Exemple : Refactoring d'un composant**

```
❌ MAUVAIS (approche fragmentée) :
1. Créer nouveau composant
2. Garder ancien composant pour compatibilité
3. Ajouter props pour basculer entre les deux
4. Migration progressive
5. Nettoyage ultérieur

✅ BON (solution directe) :
1. Créer nouveau composant
2. Identifier TOUS les usages de l'ancien
3. Remplacer TOUS les usages en une fois
4. Supprimer l'ancien composant
5. Tester toutes les pages affectées
```

#### Plan d'Exécution Type

Pour un refactoring complexe :

```markdown
## Plan d'Exécution : [Nom du Refactoring]

### Objectif
[Description de l'état final souhaité]

### Portée
- X composants à créer
- Y composants à modifier
- Z composants à supprimer

### Étapes

#### Phase 1 : Préparation
1. Créer la nouvelle structure
2. Implémenter les nouveaux composants
3. Valider isolément

#### Phase 2 : Migration
1. Pages/composants batch 1 : [liste]
   - Remplacer imports
   - Adapter les props
2. Pages/composants batch 2 : [liste]
   - Remplacer imports
   - Adapter les props

#### Phase 3 : Nettoyage
1. Supprimer anciens composants
2. Tester manuellement tous les écrans
3. Vérifier la console (pas d'erreurs)

### Validation
- [ ] Toutes les pages fonctionnent
- [ ] Pas d'erreurs console
- [ ] Anciens fichiers supprimés
- [ ] Tests manuels OK
```

---

## 🏗️ ARCHITECTURE ET ORGANISATION

### Structure des Dossiers

```
repet/
├── public/                    # Fichiers statiques
│   ├── manifest.json
│   ├── icons/
│   └── sw.js
├── src/
│   ├── main.tsx              # Point d'entrée
│   ├── App.tsx               # Composant racine
│   ├── core/                 # Logique métier
│   │   ├── parser/          # Parser de textes
│   │   ├── storage/         # IndexedDB
│   │   ├── tts/             # Text-to-Speech
│   │   └── models/          # Types TypeScript
│   ├── state/               # State management (Zustand)
│   ├── screens/             # Pages/écrans
│   ├── components/          # Composants React
│   │   ├── common/         # Composants génériques
│   │   ├── play/           # Composants spécifiques pièces
│   │   ├── settings/       # Composants de configuration
│   │   └── reader/         # Composants de lecture
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilitaires
│   └── styles/             # Styles globaux
├── tests/                   # Tests (si nécessaire)
├── docs/                    # Documentation
└── README.md
```

### Principes d'Organisation

- **Colocation** : Garder ensemble ce qui change ensemble
- **Modules autonomes** : Chaque module core/ doit être indépendant
- **Composants réutilisables** : Dans `components/common/`
- **Composants spécifiques** : Dans sous-dossiers thématiques
- **Un fichier = Une responsabilité**

---

## 🔒 LICENCE ET COPYRIGHT

### En-tête de Copyright OBLIGATOIRE

**Tous les nouveaux fichiers `.ts`, `.tsx` doivent commencer par** :

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */
```

### Vérification de Compatibilité

**AVANT toute utilisation de code externe, bibliothèque ou algorithme** :

| Statut | Licences | Action |
|--------|----------|--------|
| ✅ **Acceptées** | MIT, BSD, Apache-2.0, ISC | Utilisation autorisée |
| ⚠️ **À éviter** | GPL, AGPL, LGPL (copyleft) | Incompatible avec MIT |
| ❌ **Interdites** | Code sans licence, propriétaire | NE PAS UTILISER |

**Documentation obligatoire** :
- Code inspiré/adapté → Commentaire avec source
- Bibliothèque tierce → Mise à jour `package.json` + documentation
- Algorithme connu → Citation académique

```typescript
/**
 * Color generation algorithm based on:
 * https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
 * Implementation adapted for TypeScript
 */
```

---

## ⚠️ RÈGLES STRICTES - CODE TYPESCRIPT

### 🚫 Interdictions Absolues

#### 1. AUCUN HARDCODING

❌ **Interdit** :
- Valeurs en dur dans le code
- "Magic numbers" ou "magic strings"
- Chemins hardcodés
- Configurations hardcodées
- Code spécifique à un seul cas

✅ **Obligatoire** :
- Constantes nommées et exportées
- Variables de configuration
- Paramètres de fonction/props
- Interfaces pour abstraction
- Code générique et réutilisable

**Exemple** :

```typescript
// ❌ MAUVAIS - Hardcodé
function PlayCard({ play }: Props) {
  if (play.id === "123") { // Hardcodé !
    return <SpecialCard />;
  }
  const maxLength = 50; // Magic number !
}

// ✅ BON - Générique
const MAX_TITLE_LENGTH = 50;

interface CardRenderer {
  shouldRenderSpecial(play: Play): boolean;
  render(play: Play): ReactNode;
}

function PlayCard({ play, renderer }: Props) {
  if (renderer.shouldRenderSpecial(play)) {
    return renderer.render(play);
  }
  // ... code générique
}
```

#### 2. PAS de `any`

❌ **Interdit** :
- Type `any` (sauf cas extrêmes justifiés)
- `@ts-ignore` sans commentaire explicatif
- Casts non sécurisés

✅ **Obligatoire** :
- Types explicites et précis
- Interfaces bien définies
- Type guards quand nécessaire
- Génériques pour réutilisabilité
- `unknown` plutôt que `any` si vraiment nécessaire

**Exemple** :

```typescript
// ❌ MAUVAIS
function parseData(data: any): any {
  return data.value;
}

// ✅ BON
interface ParsedData {
  value: string;
  metadata?: Record<string, unknown>;
}

function parseData(data: unknown): ParsedData {
  if (!isValidData(data)) {
    throw new Error('Invalid data format');
  }
  return data;
}

function isValidData(data: unknown): data is ParsedData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof data.value === 'string'
  );
}
```

#### 3. TESTS Manuels SYSTÉMATIQUES

Pas de tests automatisés obligatoires (sauf si demandé), mais :

✅ **Obligatoire** :
- Tester manuellement chaque fonctionnalité ajoutée/modifiée
- Vérifier tous les écrans affectés
- Tester sur navigateur desktop
- Vérifier la console (0 erreur, 0 warning)
- Tester les cas limites
- Vérifier la réactivité mobile

**Checklist de test manuel** :
- [ ] Fonctionnalité nominale OK
- [ ] Cas limites testés (texte vide, très long, caractères spéciaux)
- [ ] Pas d'erreurs console
- [ ] Pas de warnings console
- [ ] Responsive (mobile/tablet/desktop)
- [ ] Thème clair ET sombre
- [ ] Navigation fonctionnelle

### ✅ Standards de Code TypeScript/React

#### Conventions TypeScript

| Aspect | Règle |
|--------|-------|
| **Style** | Prettier + ESLint recommandé |
| **Nommage** | PascalCase composants, camelCase fonctions/variables |
| **Types** | Explicites, pas d'inférence ambiguë |
| **Exports** | Named exports (pas de default) |
| **Imports** | Organisés : React → librairies → local |
| **Interfaces** | Préfixe `I` évité, noms descriptifs |

#### Conventions React

| Aspect | Règle |
|--------|-------|
| **Composants** | Fonctions (pas de classes) |
| **Hooks** | Règles des hooks respectées |
| **Props** | Interface `Props` dans chaque composant |
| **State** | Zustand pour global, useState pour local |
| **Effects** | useEffect minimal, cleanup systématique |
| **Mémo** | React.memo si nécessaire (pas systématique) |

#### Principes Architecturaux

- **Single Responsibility** - Un composant, une responsabilité
- **Composition over Inheritance** - Composer les composants
- **Props Drilling évité** - Utiliser le state management
- **Couplage faible** - Composants indépendants
- **Testabilité** - Code facilement testable manuellement
- **Accessibilité** - Sémantique HTML, ARIA si nécessaire

#### Qualité

- Code auto-documenté (noms explicites)
- JSDoc pour fonctions complexes
- Pas de code mort
- Validation de props si nécessaire
- Gestion des cas null/undefined
- Pas de fuites mémoire (cleanup des effects)
- Performance acceptable (pas d'optimisation prématurée)

---

## 🎨 STANDARDS UI/UX

### Design Épuré et Minimal

#### Principes

- **Moins c'est plus** - Interface minimale
- **Hiérarchie visuelle claire** - Importance évidente
- **Espaces blancs généreux** - Respiration
- **Typographie soignée** - Lisibilité avant tout
- **Couleurs intentionnelles** - Signification claire
- **Animations subtiles** - Feedback discret

#### Composants

- **Réutilisation** - DRY pour l'UI aussi
- **Cohérence** - Même style partout
- **Accessibilité** - Contraste, taille, sémantique
- **Responsive** - Mobile-first si possible
- **États clairs** - Hover, active, disabled, loading

#### Thème Clair/Sombre

```typescript
// Configuration dans Tailwind ou CSS variables
const theme = {
  light: {
    background: '#ffffff',
    text: '#000000',
    textMuted: '#666666',
    primary: '#2563eb',
    // ...
  },
  dark: {
    background: '#1a1a1a',
    text: '#ffffff',
    textMuted: '#999999',
    primary: '#3b82f6',
    // ...
  }
};
```

### Accessibilité

- **Sémantique HTML** - `<button>` pour boutons, etc.
- **ARIA labels** - Quand nécessaire
- **Contraste suffisant** - WCAG AA minimum
- **Navigation clavier** - Tab, Enter, Escape
- **Focus visible** - Outline clair
- **Textes alternatifs** - Images, icônes

---

## 📱 STANDARDS PWA

### Configuration PWA

#### Manifest.json

```json
{
  "name": "Répét - Répétition Théâtre",
  "short_name": "Répét",
  "description": "Application de répétition de théâtre en italiennes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### Service Worker

- **Cache-first** pour assets statiques
- **Network-first** pour données (pas applicable ici, tout local)
- **Offline-ready** - Application fonctionnelle hors ligne
- **Update notification** - Informer l'utilisateur des mises à jour

### Compatibilité

- **Desktop** : Chrome, Firefox, Safari, Edge (dernières versions)
- **iOS** : Safari 15+ (PWA support)
- **Android** : Chrome 90+ (PWA support)
- **APIs natives** : Web Speech API, IndexedDB, File API

---

## 🗄️ GESTION DES DONNÉES

### IndexedDB avec Dexie

#### Principes

- **Schema versioning** - Migrations propres
- **Indexation** - Index sur champs recherchés
- **Transactions** - Atomicité des opérations
- **Async/Await** - Pas de callbacks
- **Error handling** - Gestion erreurs explicite

#### Structure de Données

```typescript
// Schéma de base
interface Play {
  id: string;              // UUID
  fileName: string;
  title: string;
  author?: string;
  year?: string;
  category?: string;
  characters: Character[];
  content: ContentNode[];
  createdAt: Date;
  updatedAt: Date;
}

// Dans Dexie
class RepetDatabase extends Dexie {
  plays!: Dexie.Table<Play, string>;
  settings!: Dexie.Table<Settings, string>;

  constructor() {
    super('RepetDB');
    this.version(1).stores({
      plays: 'id, title, createdAt',
      settings: 'id'
    });
  }
}
```

### Web Speech API

#### Principes

- **Voix système** - Utiliser les voix disponibles
- **Fallback** - Gérer l'absence de voix
- **Contrôle** - Play, pause, stop, vitesse
- **Events** - onstart, onend, onerror, onboundary
- **Queue management** - File d'attente pour répliques

```typescript
// Exemple d'utilisation
const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance(text);
utterance.rate = 1.0;
utterance.volume = 1.0;
utterance.voice = selectedVoice;

utterance.onend = () => {
  // Passer à la réplique suivante
};

synth.speak(utterance);
```

---

## 📚 DOCUMENTATION

### Organisation

```
repet/
├── README.md                  # Vue d'ensemble du projet
├── docs/
│   ├── ARCHITECTURE.md       # Architecture détaillée
│   ├── PARSER.md             # Format et parsing
│   ├── USER_GUIDE.md         # Guide utilisateur
│   └── DEVELOPMENT.md        # Guide développeur
└── src/
    └── [module]/
        └── README.md         # Documentation du module
```

### Standards

| Type | Langue | Format | Emplacement |
|------|--------|--------|-------------|
| **JSDoc** | Anglais | Commentaires TS | Dans le code |
| **Commentaires internes** | Français | Inline | Dans le code |
| **Documentation technique** | Français | Markdown | `docs/` |
| **README** | Français | Markdown | Racine/modules |
| **Commentaires UI** | Français | Dans le code | Composants |

### Checklist Documentation

- [ ] JSDoc pour fonctions complexes exportées
- [ ] Commentaires inline pour logique non-évidente
- [ ] README.md à jour
- [ ] CHANGELOG.md si applicable
- [ ] TODO/FIXME documentés si nécessaire
- [ ] Pas de commentaires obsolètes
- [ ] Documentation des formats de données

---

## 🔧 OUTILS ET COMMANDES

### Développement

```bash
# Installation
npm install

# Développement (avec HMR)
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Configuration Recommandée

#### package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\""
  }
}
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./