# Changelog

All notable changes to Répét will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-XX

### 🚀 Major Update - Conformité avec la spécification

Cette version majeure réécrit les composants clés pour respecter strictement la spécification `spec/appli.txt`.

### ✨ Features

#### Parser Conforme à la Spec

- **Nouveau parser textParser.ts** - Réécriture complète du parser
  - Détection correcte du titre (premier bloc isolé)
  - Extraction `Auteur:` et `Annee:` juste après le titre
  - Détection des actes : `ACTE N` ou `ACTE N - Titre`
  - Détection des scènes : `Scene N` ou `Scène N - Titre`
  - Reconnaissance répliques : `PERSONNAGE:` en MAJUSCULES sur ligne séparée
  - Support répliques multi-lignes avec lignes vides
  - Détection didascalies : blocs hors répliques + segments `(texte)` inline
  - Génération AST hiérarchique : metadata → acts → scenes → lines
  - Tableau `flatLines` pour navigation rapide
  - Validation avec `examples/ALEGRIA.txt`

#### Nouvelle Structure de Données

- **PlayAST** - Structure AST complète
  - `PlayMetadata` : title, author, year, category
  - `Act[]` : actNumber, title, scenes
  - `Scene[]` : sceneNumber, title, lines
  - `Line[]` : type, actIndex, sceneIndex, characterId, text, isStageDirection
  - `flatLines` : tableau aplati avec métadonnées complètes
- **Play** - Modèle de stockage
  - `id`, `fileName`, `ast`, `createdAt`, `updatedAt`
  - Stockage de l'AST complet dans IndexedDB

#### Moteur TTS Conforme

- **readingModes.ts** - Logique de lecture par mode
  - `SilentMode` : pas de lecture
  - `AudioMode` : lecture avec voix off optionnelle
  - `ItalianMode` : volume 0 pour utilisateur, masquage configurable
  - Règle : **nom du personnage jamais lu**
  - Didascalies lues par voix off si activée, sinon ignorées
  - Support vitesse utilisateur distincte (italiennes)

#### Paramètres par Pièce

- **PlaySettings** - Configuration spécifique à chaque pièce
  - `readingMode` : 'silent' | 'audio' | 'italian'
  - `userCharacterId` : personnage de l'utilisateur (italiennes)
  - `hideUserLines`, `showBefore`, `showAfter` : options masquage
  - `userSpeed` : vitesse utilisateur (italiennes)
  - `defaultSpeed` : vitesse par défaut (audio)
  - `voiceOffEnabled` : lecture didascalies
  - `characterVoices` : assignation sexe par personnage (male/female/neutral)
  - Persistance dans `playSettingsStore`

#### Assignation Voix Simplifiée

- **Mapping sexe → voix système**
  - Utilisateur choisit le sexe du personnage (homme/femme/neutre)
  - `voiceManager.selectVoiceForGender()` choisit automatiquement la voix
  - Heuristiques basées sur les noms de voix système
  - Fallback automatique si pas de voix du sexe demandé

### 🔧 Technical Changes

#### Helpers de Compatibilité

- **playHelpers.ts** - Fonctions d'accès aux propriétés Play
  - `getPlayTitle(play)` : accède à `play.ast.metadata.title`
  - `getPlayAuthor(play)` : accède à `play.ast.metadata.author`
  - `getPlayYear(play)` : accède à `play.ast.metadata.year`
  - `getPlayCategory(play)` : accède à `play.ast.metadata.category`
  - `getPlayCharacters(play)` : accède à `play.ast.characters`
  - `getPlayLines(play)` : accède à `play.ast.flatLines`
  - `getPlayActs(play)` : accède à `play.ast.acts`
  - Migration progressive du code existant

#### Refactoring Store

- **playSettingsStore** - Nouveau store pour paramètres pièces
  - Stockage par `playId` dans localStorage
  - Actions : `setReadingMode`, `setUserCharacter`, `setCharacterGender`
  - Toggles : `toggleHideUserLines`, `toggleShowBefore`, `toggleShowAfter`
  - Vitesses : `setUserSpeed`, `setDefaultSpeed`
  - Gestion complète du cycle de vie (create, update, delete, reset)

#### Migration Code Base

- Migration automatique via script sed
  - Remplacement `play.title` → `getPlayTitle(play)`
  - Remplacement `play.lines` → `getPlayLines(play)`
  - Remplacement `play.characters` → `getPlayCharacters(play)`
  - Ajout imports `playHelpers` dans tous les fichiers concernés
  - Fichiers migrés : PlayCard, SceneNavigator, PlayScreen, ReaderScreen, playStore, selectors

#### Tests Unitaires

- **parser.test.ts** - 24 tests pour le parser
  - Extraction titre, auteur, année
  - Détection actes et scènes
  - Reconnaissance répliques (simples, multi-lignes, avec lignes vides)
  - Noms avec espaces et tirets
  - Didascalies (blocs et inline)
  - Construction flatLines
  - Parsing échantillon ALEGRIA
  - Infrastructure Vitest configurée

### 🐛 Bug Fixes

- Correction de l'import parser dans `HomeScreen.tsx` (utilise `textParser`)
- Conversion AST → Play lors de l'import de fichier
  - Génération UUID, dates createdAt/updatedAt
  - Stockage correct dans IndexedDB
- Fix types TypeScript dans parser legacy (assertions de type)
- Fix conflits exports `Line` (suppression duplicate dans Play.ts)
- Fix warnings TypeScript (paramètres inutilisés avec underscore)

### 📚 Documentation

- **plans/plan-mise-en-conformite-spec.md** - Plan détaillé en 8 phases
  - Phase 1 : Parser (✅ TERMINÉE)
  - Phase 2 : Storage (✅ TERMINÉE)
  - Phase 3 : TTS (✅ TERMINÉE)
  - Phase 4 : Réglages (✅ TERMINÉE)
  - Phase 5-8 : UI (en attente)
- Critères de succès et validation pour chaque phase
- Checklist tests manuels et automatiques

### ⚠️ Breaking Changes

- **Structure Play modifiée** : `Play` contient maintenant `ast: PlayAST`
  - Code legacy doit utiliser les helpers `getPlay*()` pour compatibilité
  - Migration automatique effectuée pour la base de code existante
- **Parser API changée** : `parsePlayText()` retourne `PlayAST` (pas `Play`)
  - Conversion manuelle en `Play` nécessaire avec dates et UUID
- **Settings globaux vs Play-specific** : Settings sont maintenant par pièce
  - `playSettingsStore` pour paramètres spécifiques
  - `settingsStore` reste pour paramètres globaux (thème, etc.)

### ✨ Features (Suite)

#### Interface de Configuration (Phase 5 - ✅ TERMINÉE)

- **PlayConfigScreen** - Écran de configuration par pièce
  - Route `/play/:playId/config` ajoutée au router
  - Section informations pièce (titre, auteur, année, stats)
  - Sélection méthode de lecture (3 modes)
  - Assignation voix par personnage (sexe)
  - Réglages audio (voix off, vitesses)
  - Réglages italiennes (masquage, affichage)
  - Zone de danger (suppression pièce)
  - Bouton "Commencer la lecture" sticky

- **Composants de Configuration**
  - `ReadingModeSelector` - 3 boutons (Silencieux, Audio, Italiennes)
    - Cartes cliquables avec descriptions
    - Indicateur visuel de sélection
    - Support thème clair/sombre
  - `VoiceAssignment` - Assignation sexe aux personnages
    - Liste personnages avec sélecteurs ♂/♀/◯
    - Boutons toggle avec highlight sélection
    - Message si aucun personnage
  - `AudioSettings` - Réglages audio
    - Toggle voix off (switch animé)
    - Slider vitesse de lecture (0.5x - 2.0x)
    - Slider vitesse utilisateur (mode italiennes)
    - Affichage conditionnel selon mode
  - `ItalianSettings` - Configuration mode italiennes
    - Dropdown sélection personnage utilisateur
    - Toggle masquage répliques
    - Options affichage avant/après lecture
    - Message info si pas de personnage

- **Intégration PlayCard**
  - Bouton configuration (icône engrenage)
  - Navigation vers `/play/:playId/config`
  - Event propagation correcte
  - Support thème clair/sombre

#### Composants de Lecture (Phase 6 - ✅ TERMINÉE)

- **SceneSummary** - Sommaire actes/scènes navigable
  - Panel latéral avec overlay
  - Liste hiérarchique actes → scènes
  - Highlight acte/scène actuelle
  - Navigation par clic
  - Compteur de lignes par scène
  - Fermeture automatique après sélection

- **LineRenderer** - Rendu ligne selon mode
  - Support `dialogue` et `stage-direction`
  - Récupération nom personnage via charactersMap
  - Masquage répliques utilisateur (italiennes)
  - Coloration selon contexte (playing, révélée, utilisateur)
  - Indicateur visuel ligne en cours
  - Message "[Réplique masquée]" si hideUserLines
  - Badge "✓ Révélée" si showAfter

- **SceneNavigation** - Navigation entre scènes
  - Boutons Précédent/Suivant avec icônes
  - Indicateur position (Acte X/Y, Scène A/B)
  - Désactivation si limites atteintes
  - Responsive (texte masqué sur mobile)
  - Support thème clair/sombre

- **PlaybackControls** - Contrôles TTS
  - Boutons Play/Pause/Stop
  - Boutons Précédent/Suivant
  - Mode silencieux simplifié (navigation uniquement)
  - Icônes SVG pour tous les contrôles
  - États disabled gérés
  - Bouton Play principal mis en évidence

- **TextDisplay** - Affichage texte scène
  - Scroll automatique vers ligne courante
  - Opacité différenciée (courante/lue/non-lue)
  - Ref management pour auto-scroll
  - Container scrollable avec max-width
  - Intégration LineRenderer pour chaque ligne
  - Passage charactersMap aux enfants

### ✅ Phase 6 Complétée - Refonte ReaderScreen

- **ReaderScreen refactorisé** - Utilisation des nouveaux composants
  - Intégration `TextDisplay` pour affichage scène
  - Intégration `SceneNavigation` pour navigation actes/scènes
  - Intégration `PlaybackControls` pour contrôles TTS
  - Intégration `SceneSummary` en modal overlay
  - Utilisation `playSettingsStore` pour settings par pièce
  - Navigation par scène (fini ligne par ligne)
  - Support complet mode italiennes avec masquage
  - Assignation voix par sexe via `voiceManager`
  - Sélection personnage depuis settings
  - Gestion état lecture (playing, readLinesSet)

### ✅ Phase 8 Complétée - Documentation

- **Documentation technique complète** (~1600+ lignes)
  - `docs/PARSER.md` (397 lignes) - Format fichier théâtral détaillé avec exemples
  - `docs/ARCHITECTURE.md` (780 lignes) - AST, flux, stores, composants
  - `docs/USER_GUIDE.md` - Guide utilisateur avec mode italiennes détaillé (existant)
  - `README.md` - Mise à jour liens documentation

### 🔜 Phase 7 - Tests et Validation

Phase restante à compléter :

- **Tests automatisés**
  - Optimiser configuration Vitest (résoudre timeout)
  - Ajouter tests composants settings/reader
  - Tests E2E workflow complet

- **Tests manuels**
  - Import ALEGRIA.txt → vérifier AST
  - Tester 3 modes lecture (silent/audio/italian)
  - Configuration par pièce (persistance)
  - Navigation scènes
  - Cross-browser (Chrome, Firefox, Safari, Edge)
  - Mobile (iOS Safari, Android Chrome)

### 🏗️ Architecture Updates

```
src/core/
├── models/
│   ├── Play.ts (nouvelles interfaces PlayAST, Act, Scene)
│   ├── playHelpers.ts (helpers d'accès)
│   └── Settings.ts (+ PlaySettings)
├── parser/
│   ├── textParser.ts (NOUVEAU - conforme spec)
│   └── parser.ts (legacy - @deprecated)
└── tts/
    └── readingModes.ts (NOUVEAU - logique modes)
src/state/
└── playSettingsStore.ts (NOUVEAU - settings par pièce)
src/screens/
└── PlayConfigScreen.tsx (NOUVEAU - configuration pièce)
src/components/
├── settings/
│   ├── ReadingModeSelector.tsx (NOUVEAU)
│   ├── VoiceAssignment.tsx (NOUVEAU)
│   ├── AudioSettings.tsx (NOUVEAU)
│   └── ItalianSettings.tsx (NOUVEAU)
└── reader/
    ├── SceneSummary.tsx (NOUVEAU)
    ├── LineRenderer.tsx (NOUVEAU)
    ├── SceneNavigation.tsx (NOUVEAU)
    ├── PlaybackControls.tsx (NOUVEAU)
    ├── TextDisplay.tsx (NOUVEAU)
    └── index.ts (mis à jour)
```

### 📊 Statistics

- **Fichiers modifiés** : 25+
- **Fichiers créés** : 14 nouveaux fichiers
  - Phase 1-4 : 5 fichiers (parser, stores, helpers)
  - Phase 5 : 5 fichiers (PlayConfigScreen + 4 composants settings)
  - Phase 6 : 5 fichiers (composants reader)
- **Lignes de code** : +3500
  - Parser, models, stores : ~2000 lignes
  - UI Configuration : ~700 lignes
  - UI Reader : ~800 lignes
- **Tests** : 24 tests unitaires ajoutés
- **Erreurs TypeScript corrigées** : 46 → 0
- **Build** : ✅ Succès (tsc + vite)

### 🎯 Validation

- ✅ Type-check : 0 erreur
- ✅ Build production : réussi
- ✅ Taille bundle : ~383KB (gzipped: ~120KB)
- ✅ PWA : fonctionnel (manifest + SW)
- ✅ Compatibilité helpers : code legacy fonctionne
- ✅ Composants UI : compilent sans erreur
- ✅ Router : route `/play/:playId/config` ajoutée
- ✅ Thème clair/sombre : tous les nouveaux composants

---

## [0.1.0] - 2025-01-XX

### 🎉 Initial Release

First functional version of Répét - Theatre Rehearsal PWA application.

### ✨ Features

#### Core Functionality

- **Play Parser** - Parse theatre plays from plain text files
  - Support for French theatre format (Actes, Scènes, Personnages)
  - Metadata extraction (title, author, genre, year)
  - Character detection and role assignment
  - Stage direction recognition
  - Hierarchical AST generation
  - Flattened line sequence for navigation

- **Text-to-Speech (TTS)** - Natural voice synthesis
  - Web Speech API integration
  - Multi-voice support (system voices)
  - Configurable speed (0.5x - 2.0x)
  - Configurable volume (0% - 100%)
  - Voice queue management
  - Character-specific voice assignment (planned)
  - Stage direction voice (distinct from character voices)

- **Italian Mode (Répétition à l'italienne)** - Memory practice
  - Hide user's own lines for memorization
  - Visual masking with blur effect
  - Reveal button for checking lines
  - Purple highlight for masked lines
  - Mode indicator in header
  - Toggle setting to enable/disable line hiding

- **Storage** - Local data persistence
  - IndexedDB integration via Dexie.js
  - Play library management (CRUD operations)
  - Settings persistence
  - Reading progress tracking
  - Offline-first architecture

#### User Interface

- **Home Screen** - Import and quick access
  - Drag & drop file upload
  - File validation
  - Recent plays display
  - Quick import workflow

- **Library Screen** - Play management
  - Grid view with metadata cards
  - Real-time search/filter
  - Sort by date/title/author
  - Delete with confirmation modal
  - Empty state handling

- **Play Screen** - Main reading interface
  - Character selection modal
  - Scene navigation dropdown
  - Current line highlight
  - Context display (previous/next lines)
  - Play/Stop TTS controls
  - Progress indicator
  - Navigation controls (Previous/Next)
  - Italian mode support with line masking
  - Reveal button for masked lines

- **Reader Screen** - Focused rehearsal mode
  - Filter by character
  - Show/hide all lines toggle
  - User line highlighting
  - Scene-based line list
  - Quick line navigation
  - TTS per line
  - Italian mode support with line masking
  - Reveal button for masked lines

- **Settings Screen** - Configuration
  - Voice selection (from system)
  - Speed slider
  - Volume slider
  - Auto-play toggle
  - Highlight user lines toggle
  - Reading mode selection (Silent / Audio / Italian)
  - Italian mode line hiding toggle
  - Reset to defaults

#### Components

**Common Components**
- `Button` - Multiple variants (primary, secondary, danger, ghost)
- `Input` - Text input with icons and validation
- `Modal` - Accessible modal with focus trap
- `Spinner` - Loading indicator (sm, md, lg)
- `Toast` - Auto-dismissing notifications
- `Layout` - Page wrapper with header/footer

**Play Components**
- `PlayCard` - Play metadata display card
- `CharacterBadge` - Character tag with color
- `CharacterSelector` - Character selection UI

**Reader Components**
- `LineCue` - Line display with character info
- `NavigationControls` - Play/Pause/Next/Previous
- `SceneNavigator` - Act/Scene dropdown

#### State Management

- **Play Store** (Zustand)
  - Current play state
  - User character selection
  - Line navigation (index-based)
  - Scene navigation
  - Reading progress persistence

- **Settings Store** (Zustand)
  - TTS configuration
  - Voice preferences
  - Reading mode
  - UI preferences
  - Persistence to localStorage

- **UI Store** (Zustand)
  - Loading states
  - Error messages with auto-dismiss
  - Modal states
  - Toast notifications

#### Utilities

- **Colors** - Character color generation (deterministic hashing)
- **Validation** - File, text, and parameter validation
- **Formatting** - Date, duration, text formatting
- **Constants** - App-wide constants and defaults

#### PWA Features

- **Offline Support** - Service Worker with Workbox
- **Installable** - Add to home screen (iOS/Android/Desktop)
- **App Manifest** - Name, icons, theme color
- **Caching Strategy** - Precache app shell, runtime cache for assets
- **Responsive** - Mobile-first design (320px - 1920px+)

#### Developer Experience

- **TypeScript** - Strict mode, full type coverage
- **ESLint** - Code quality enforcement
- **Prettier** - Code formatting
- **Vite** - Fast build tool with HMR
- **React Router** - Client-side navigation
- **Tailwind CSS** - Utility-first styling

### 🏗️ Architecture

- **Parser Layer** - AST generation from plain text
- **Storage Layer** - IndexedDB abstraction (Dexie)
- **TTS Layer** - Web Speech API wrapper
- **State Layer** - Zustand stores with persistence
- **UI Layer** - React components with TypeScript
- **Routing Layer** - React Router v6

### 📁 Project Structure

```
repet/
├── public/
│   ├── icons/              # PWA icons
│   └── test-play.txt       # Sample file
├── src/
│   ├── core/
│   │   ├── models/         # TypeScript interfaces
│   │   ├── parser/         # Play text parser
│   │   ├── storage/        # IndexedDB layer
│   │   └── tts/            # Text-to-Speech
│   ├── state/              # Zustand stores
│   ├── screens/            # Page components
│   ├── components/         # Reusable components
│   ├── utils/              # Helper functions
│   └── router.tsx          # Route configuration
├── docs/                   # Documentation
│   ├── TESTING.md         # Manual testing guide
│   └── DEPLOYMENT.md      # Deployment guide
└── plans/                  # Development plans
```

### 🎯 Routes

- `/` - Home (import)
- `/library` - Play library
- `/settings` - Settings
- `/play/:playId` - Play reading screen
- `/reader/:playId` - Focused reader mode

### 🧪 Testing

- Manual testing checklist (444 test items)
- Type checking with TypeScript
- Linting with ESLint
- Browser compatibility testing

### 📦 Dependencies

**Production**
- `react` ^18.3.1
- `react-dom` ^18.3.1
- `react-router-dom` ^7.1.3
- `zustand` ^5.0.2
- `dexie` ^4.0.10

**Development**
- `typescript` ^5.6.2
- `vite` ^6.4.1
- `@vitejs/plugin-react` ^4.3.4
- `vite-plugin-pwa` ^0.21.2
- `tailwindcss` ^4.0.0
- `eslint` ^9.18.0
- `prettier` ^3.4.2

### 🌐 Browser Support

- Chrome 90+ (Desktop/Android)
- Safari 15+ (Desktop/iOS)
- Firefox 88+ (Desktop)
- Edge 90+ (Desktop)

### 📝 Known Limitations

- TTS voices depend on system availability
- iOS requires user interaction before first TTS playback
- Large files (>5MB) may impact performance
- No cloud sync (local-only storage)
- No collaborative features

### 🔜 Planned Features

See `plans/` directory for detailed roadmaps:
- Voice-to-character association
- Italian mode (hide user lines)
- Keyboard shortcuts
- Export annotations
- Statistics and analytics
- Multi-user rehearsal mode

### 📄 License

MIT License - See LICENSE file for details

### 👥 Contributors

- Initial implementation by Répét Contributors

---

**Full Changelog**: Initial release v0.1.0