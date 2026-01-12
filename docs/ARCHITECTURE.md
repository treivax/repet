# Architecture Répét - Documentation Technique

## Vue d'ensemble

Répét est une Progressive Web App (PWA) construite avec React 18, TypeScript, et une architecture state-centric basée sur Zustand. L'application transforme des textes théâtraux en expériences de répétition interactives avec support TTS (Text-to-Speech) et modes de lecture avancés.

## Stack Technique

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.7** - Type safety (mode strict)
- **Vite 6** - Build tool & dev server
- **React Router 6.28** - Navigation
- **Tailwind CSS 3.4** - Styling

### State Management
- **Zustand 5.0** - Global state stores
- **Persist middleware** - LocalStorage persistence

### Storage
- **Dexie 4.0** - IndexedDB wrapper
- **dexie-react-hooks** - React integration

### TTS
- **Web Speech API** - Native browser TTS
- **Custom queue system** - Utterance management

### PWA
- **vite-plugin-pwa** - Service worker generation
- **Workbox** - Offline caching strategies

---

## Architecture Générale

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer (React)                    │
│  Screens → Components → Hooks                            │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              State Layer (Zustand Stores)                │
│  playStore | settingsStore | playSettingsStore | uiStore│
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                  Core Layer                              │
│  Parser → Models → Storage → TTS Engine                 │
└─────────────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Persistence Layer                           │
│  IndexedDB (Dexie) | LocalStorage (Zustand persist)     │
└─────────────────────────────────────────────────────────┘
```

---

## Flux de Données Principal

### 1. Import d'une Pièce

```
[Fichier .txt]
    ↓
[HomeScreen] → Lecture fichier
    ↓
[textParser.ts] → Parsing
    ↓
[PlayAST] → AST généré
    ↓
[playsRepository.save()] → Sauvegarde IndexedDB
    ↓
[playStore.loadPlay()] → Chargement dans state
    ↓
[Redirection /play/:id]
```

### 2. Lecture d'une Pièce

```
[PlayScreen/ReaderScreen]
    ↓
[playStore] ← currentPlay, currentLineIndex
    ↓
[Selectors] → useCurrentLine(), useCurrentScene()
    ↓
[LineRenderer] → Affichage adaptatif
    ↓
[TTS Engine] → Lecture audio (si mode audio/italien)
```

### 3. Configuration par Pièce

```
[PlayConfigScreen]
    ↓
[playSettingsStore] → Chargement settings pour playId
    ↓
[Composants Settings] → Modification UI
    ↓
[playSettingsStore.updateSettings()] → Mise à jour
    ↓
[LocalStorage] → Persist automatique
```

---

## Modèle de Données (AST)

### Structure PlayAST

```typescript
interface PlayAST {
  metadata: PlayMetadata
  characters: Character[]
  acts: Act[]
  scenes: Scene[]      // Liste plate (toutes scènes)
  flatLines: Line[]    // Liste plate (toutes lignes)
}
```

#### PlayMetadata

```typescript
interface PlayMetadata {
  title: string          // Titre de la pièce
  author?: string        // Auteur (optionnel)
  year?: string          // Année (optionnel)
  category?: string      // Catégorie/Genre
}
```

#### Character

```typescript
interface Character {
  id: string                           // UUID
  name: string                         // Nom (MAJUSCULES d'origine)
  gender?: 'male' | 'female' | 'neutral'  // Détecté ou assigné
}
```

#### Act & Scene

```typescript
interface Act {
  number: number         // Numéro d'acte (1, 2, 3...)
  title: string          // "ACTE I", "ACTE II"...
  scenes: Scene[]        // Scènes de cet acte
}

interface Scene {
  actNumber: number      // Référence à l'acte parent
  number: number         // Numéro de scène dans l'acte
  title: string          // "SCÈNE 1", "SCÈNE 2"...
  lines: Line[]          // Lignes de cette scène
}
```

#### Line

```typescript
interface Line {
  id: string                          // UUID unique
  type: 'dialogue' | 'stage-direction'  // Type de ligne
  actIndex: number                     // Index acte (0-based)
  sceneIndex: number                   // Index scène (0-based)
  lineIndex: number                    // Index ligne dans scène
  characterId?: string                 // ID personnage (si dialogue)
  character?: string                   // Nom personnage (dénormalisé)
  text: string                         // Texte de la ligne
}
```

### Navigation dans l'AST

```typescript
// Accès direct
const title = play.ast.metadata.title
const allCharacters = play.ast.characters
const firstAct = play.ast.acts[0]
const firstScene = play.ast.scenes[0]
const allLines = play.ast.flatLines

// Via helpers
import { getPlayTitle, getPlayCharacters, getPlayLines } from '@/core/models/playHelpers'

const title = getPlayTitle(play)
const characters = getPlayCharacters(play)
const lines = getPlayLines(play)
```

---

## Stores Zustand

### 1. playStore

**Responsabilité** : Gestion de la pièce courante et navigation

```typescript
interface PlayState {
  currentPlay: Play | null
  userCharacter: Character | null
  currentLineIndex: number
  currentActIndex: number
  currentSceneIndex: number
  
  // Actions
  loadPlay: (play: Play) => void
  setUserCharacter: (character: Character | null) => void
  nextLine: () => void
  previousLine: () => void
  goToLine: (index: number) => void
  goToScene: (actIndex: number, sceneIndex: number) => void
  closePlay: () => void
}
```

**Utilisation** :
```typescript
const { currentPlay, userCharacter, currentLineIndex, nextLine } = usePlayStore()
```

### 2. settingsStore

**Responsabilité** : Paramètres globaux de l'application

```typescript
interface SettingsState {
  // Audio global
  speed: number              // 0.5 - 2.0
  volume: number             // 0.0 - 1.0
  selectedVoice: string | null
  autoPlay: boolean
  
  // Modes
  readingMode: ReadingMode   // 'silent' | 'audio' | 'italian'
  
  // UI
  theme: Theme               // 'light' | 'dark'
  highlightUserLines: boolean
  hideUserLinesInItalian: boolean
  
  // Actions
  updateSettings: (partial: Partial<Settings>) => void
  resetSettings: () => void
}
```

### 3. playSettingsStore

**Responsabilité** : Paramètres spécifiques par pièce

```typescript
interface PlaySettingsState {
  settings: Record<string, PlaySettings>  // playId → PlaySettings
  
  // Actions
  getSettings: (playId: string) => PlaySettings
  updateSettings: (playId: string, partial: Partial<PlaySettings>) => void
  resetSettings: (playId: string) => void
  deleteSettings: (playId: string) => void
}

interface PlaySettings {
  readingMode: ReadingMode
  userCharacterId: string | null
  
  // Masquage italien
  hideUserLines: boolean
  showLinesBefore: number    // Nombre de lignes avant
  showLinesAfter: number     // Nombre de lignes après
  
  // Voix TTS
  userSpeed: number          // Vitesse utilisateur en italien
  defaultSpeed: number       // Vitesse autres personnages
  voiceOffEnabled: boolean   // Didascalies par voix off
  
  // Assignation voix par personnage
  characterVoices: Record<string, {
    voiceURI: string
    gender: Gender
  }>
}
```

**Persist** : Automatique via middleware Zustand (LocalStorage)

### 4. uiStore

**Responsabilité** : État UI éphémère

```typescript
interface UIState {
  isLoading: boolean
  errors: string[]
  notifications: Notification[]
  
  // Actions
  startLoading: () => void
  stopLoading: () => void
  addError: (message: string) => void
  clearErrors: () => void
  notify: (message: string, type: 'info' | 'success' | 'error') => void
}
```

---

## Selectors

Les selectors dérivent des états complexes pour éviter la duplication :

```typescript
// src/state/selectors.ts

export const useCurrentLine = (): Line | null => {
  const { currentPlay, currentLineIndex } = usePlayStore()
  if (!currentPlay) return null
  return getPlayLines(currentPlay)[currentLineIndex] || null
}

export const useCurrentScene = (): Scene | null => {
  const { currentPlay, currentSceneIndex } = usePlayStore()
  if (!currentPlay) return null
  return currentPlay.ast.scenes[currentSceneIndex] || null
}

export const useCurrentAct = (): Act | null => {
  const { currentPlay, currentActIndex } = usePlayStore()
  if (!currentPlay) return null
  return currentPlay.ast.acts[currentActIndex] || null
}

export const useCanGoNext = (): boolean => {
  const { currentPlay, currentLineIndex } = usePlayStore()
  if (!currentPlay) return false
  return currentLineIndex < getPlayLines(currentPlay).length - 1
}

export const useCanGoPrevious = (): boolean => {
  const { currentLineIndex } = usePlayStore()
  return currentLineIndex > 0
}
```

---

## Parser - textParser.ts

### Pipeline de Parsing

```
[Fichier .txt brut]
    ↓
[1. Normalisation] → Trim, lignes vides
    ↓
[2. Extraction Métadonnées] → Titre, Auteur, Année
    ↓
[3. Parsing Corps] → Actes, Scènes, Lignes
    ↓
[4. Détection Personnages] → Set de noms uniques
    ↓
[5. Génération AST] → PlayAST complet
```

### Algorithme

```typescript
function parsePlayText(text: string): PlayAST {
  const lines = text.split('\n').map(l => l.trim())
  
  // 1. Métadonnées (en-tête)
  const metadata = extractMetadata(lines)
  
  // 2. Corps (actes/scènes/lignes)
  const { acts, scenes, flatLines, characterNames } = parseBody(lines)
  
  // 3. Personnages
  const characters = createCharacters(characterNames)
  
  return { metadata, characters, acts, scenes, flatLines }
}
```

### Règles de Détection

**Acte** : Ligne contenant `/ACTE\s+[IVX0-9]+/i`  
**Scène** : Ligne contenant `/SC[EÈ]NE\s+[IVX0-9]+/i`  
**Personnage** : Deux formats acceptés :
  - Format avec deux-points : `^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s\-']+:\s*$`
  - Format sans deux-points : `^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s\-']+$` (doit être précédé d'une ligne vierge et sans indentation)
**Didascalie** : Ligne entre parenthèses `^(.*)`

---

## Storage - Dexie Repository

### Schéma IndexedDB

```typescript
// src/core/storage/database.ts
class RepetDatabase extends Dexie {
  plays!: Table<Play, string>
  
  constructor() {
    super('RepetDB')
    this.version(1).stores({
      plays: 'id, fileName, createdAt, updatedAt'
    })
  }
}
```

### Repository Pattern

```typescript
// src/core/storage/plays.ts
class PlaysRepository {
  async save(play: Play): Promise<void>
  async get(id: string): Promise<Play | undefined>
  async getAll(): Promise<Play[]>
  async delete(id: string): Promise<void>
  async update(id: string, updates: Partial<Play>): Promise<void>
}

export const playsRepository = new PlaysRepository()
```

**Avantages** :
- Abstraction de Dexie
- Testable (mockable)
- Type-safe
- Centralisation logique métier

---

## TTS Engine

### Architecture TTS

```
[Composant UI]
    ↓
[ttsEngine.speak()] 
    ↓
[TTSQueue] → Gestion file d'attente
    ↓
[Web Speech API] → SpeechSynthesisUtterance
    ↓
[Speaker système]
```

### Modes de Lecture

```typescript
// src/core/tts/readingModes.ts

interface ReadingMode {
  name: 'silent' | 'audio' | 'italian'
  shouldReadCharacterName: boolean
  shouldReadStageDirections: boolean
  shouldMaskUserLines: boolean
}

const MODES = {
  silent: {
    name: 'silent',
    shouldReadCharacterName: false,
    shouldReadStageDirections: false,
    shouldMaskUserLines: false,
  },
  audio: {
    name: 'audio',
    shouldReadCharacterName: false,  // Jamais lire le nom !
    shouldReadStageDirections: true,
    shouldMaskUserLines: false,
  },
  italian: {
    name: 'italian',
    shouldReadCharacterName: false,
    shouldReadStageDirections: true,  // Via voix off
    shouldMaskUserLines: true,
  },
}
```

### Voice Manager

```typescript
// src/core/tts/voice-manager.ts

class VoiceManager {
  getVoices(): SpeechSynthesisVoice[]
  
  selectVoiceForGender(
    gender: Gender,
    preferredVoiceURI?: string
  ): SpeechSynthesisVoice | null
  
  getDefaultVoice(): SpeechSynthesisVoice | null
}
```

**Assignation par sexe** :
- `male` → Voix masculines (Thomas, etc.)
- `female` → Voix féminines (Amélie, etc.)
- `neutral` → Voix par défaut

---

## Composants Architecture

### Structure Hiérarchique

```
src/components/
├── common/           # Composants réutilisables
│   ├── Button.tsx
│   ├── Spinner.tsx
│   ├── Modal.tsx
│   └── Card.tsx
├── play/             # Gestion pièces
│   ├── PlayCard.tsx
│   └── PlayList.tsx
├── reader/           # Composants lecture
│   ├── TextDisplay.tsx       # Affichage ligne courante
│   ├── LineRenderer.tsx      # Rendu adaptatif ligne
│   ├── SceneSummary.tsx      # Sommaire actes/scènes
│   ├── SceneNavigation.tsx   # Navigation scènes
│   └── PlaybackControls.tsx  # Contrôles TTS
└── settings/         # Configuration
    ├── ReadingModeSelector.tsx
    ├── VoiceAssignment.tsx
    ├── AudioSettings.tsx
    └── ItalianSettings.tsx
```

### Écrans Principaux

```
src/screens/
├── HomeScreen.tsx        # Import pièces
├── LibraryScreen.tsx     # Bibliothèque
├── PlayScreen.tsx        # Lecture principale
├── ReaderScreen.tsx      # Mode lecteur focalisé
├── PlayConfigScreen.tsx  # Configuration par pièce
└── SettingsScreen.tsx    # Paramètres globaux
```

### Routes

```typescript
// src/router.tsx
const routes = [
  { path: '/', element: <HomeScreen /> },
  { path: '/library', element: <LibraryScreen /> },
  { path: '/play/:playId', element: <PlayScreen /> },
  { path: '/play/:playId/config', element: <PlayConfigScreen /> },
  { path: '/reader/:playId', element: <ReaderScreen /> },
  { path: '/settings', element: <SettingsScreen /> },
]
```

---

## Mode Italiennes - Implémentation

### Logique de Masquage

```typescript
// Dans un composant de lecture
const { currentPlay, userCharacter } = usePlayStore()
const { readingMode, hideUserLinesInItalian } = useSettingsStore()

const isItalianMode = readingMode === 'italian'
const shouldHideLine = !!(
  isItalianMode &&
  hideUserLinesInItalian &&
  userCharacter &&
  line.characterId === userCharacter.id
)

// Rendu conditionnel
<div className={shouldHideLine ? 'blur-sm select-none' : ''}>
  {shouldHideLine ? '●●●●●●●●●●●●●●●' : line.text}
</div>
```

### TTS en Mode Italien

```typescript
// Répliques utilisateur : volume 0
if (line.characterId === userCharacter.id) {
  ttsEngine.speak({
    text: line.text,
    volume: 0,  // Muet
    rate: playSettings.userSpeed,
  })
} else {
  ttsEngine.speak({
    text: line.text,
    volume: volume,
    rate: playSettings.defaultSpeed,
  })
}

// Didascalies : voix off si activée
if (line.type === 'stage-direction' && playSettings.voiceOffEnabled) {
  const voiceOffVoice = voiceManager.selectVoiceForGender('neutral')
  ttsEngine.speak({
    text: line.text,
    voiceURI: voiceOffVoice?.voiceURI,
    rate: playSettings.defaultSpeed * 0.9,  // Légèrement plus lent
  })
}
```

---

## PWA Configuration

### Manifest (vite-plugin-pwa)

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Répét',
    short_name: 'Répét',
    description: 'Application de répétition théâtrale',
    theme_color: '#4F46E5',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
  },
})
```

### Offline Support

- **App shell** : Cached on first visit
- **Plays data** : IndexedDB (toujours disponible)
- **Settings** : LocalStorage (toujours disponible)
- **TTS** : Web Speech API (natif, pas de réseau requis)

---

## Performance

### Optimisations

1. **Parsing** : Synchrone, une seule passe, ~10-50ms pour pièces moyennes
2. **IndexedDB** : Async, non-bloquant, indexé par `id`
3. **Zustand** : Re-render minimal (selectors granulaires)
4. **React** : Mémoization via `useMemo`/`useCallback` sur composants lourds
5. **Tailwind** : PurgeCSS automatique → CSS minimal

### Limitations Connues

- **Grandes pièces** (>5000 lignes) : Parsing peut prendre >200ms
- **Initialisation TTS** : Premier appel peut être lent (cache voix OS)
- **iOS Safari** : TTS nécessite interaction utilisateur (limitation WebKit)

---

## Tests

### Structure

```
src/core/parser/__tests__/
└── parser.test.ts      # 24 tests unitaires
```

### Coverage Cible

- **Parser** : 90%+ (critique)
- **Stores** : 70%+ (logique métier)
- **Components** : 60%+ (UI logic)
- **Utils** : 80%+ (helpers)

### Exécution

```bash
npm run test              # Mode watch
npm run test:ui           # Interface Vitest
npm run type-check        # TypeScript strict
```

---

## Conventions de Code

### TypeScript

- **Strict mode** activé
- **No implicit any**
- **Explicit return types** sur fonctions publiques
- **Interfaces** pour shapes, **Types** pour unions

### React

- **Functional components** uniquement
- **Hooks** pour state/effects
- **Props destructuring**
- **Explicit typing** sur props

### Styling

- **Tailwind classes** uniquement (pas de CSS custom)
- **Responsive** : mobile-first
- **Dark mode** : Préparé (variable `theme`)

### Naming

- **Composants** : PascalCase (`PlayCard.tsx`)
- **Hooks** : camelCase avec `use` prefix (`useCurrentLine`)
- **Constantes** : UPPER_SNAKE_CASE (`DEFAULT_SPEED`)
- **Interfaces** : PascalCase sans `I` prefix (`Play`, pas `IPlay`)

---

## Migration Legacy → v0.2.0

### Changements Majeurs

| Ancien | Nouveau | Raison |
|--------|---------|--------|
| `parser.ts` | `textParser.ts` | Conformité spec stricte |
| `Play.lines: Line[]` | `Play.ast.flatLines` | AST structuré |
| Global settings | `playSettingsStore` | Settings par pièce |
| Ligne par ligne | Navigation scènes | UX théâtre |

### Compatibilité

- **Parser legacy** : Marqué `@deprecated`, conservé pour migration
- **Helpers** : `playHelpers.ts` pour compatibilité API
- **Storage** : Pas de migration auto (ré-import recommandé)

---

## Roadmap Technique

### Court Terme (v0.3.0)
- [ ] Tests E2E (Playwright)
- [ ] Optimisation grandes pièces (virtual scrolling)
- [ ] Export/Import backup

### Moyen Terme (v0.4.0)
- [ ] Sync cloud (optionnelle)
- [ ] Annotations inline
- [ ] Statistiques répétition

### Long Terme (v1.0.0)
- [ ] Multi-langue (i18n)
- [ ] Mode collaboratif (WebRTC)
- [ ] AI suggestions prononciation

---

## Licence

Copyright (c) 2025 Répét Contributors  
Licensed under the MIT License