# 📊 Diagramme des Modèles de Données

Ce document présente visuellement tous les modèles TypeScript créés pour Répét.

---

## 🎭 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                            Play                              │
├─────────────────────────────────────────────────────────────┤
│ - id: string                                                 │
│ - fileName: string                                           │
│ - title: string                                              │
│ - author?: string                                            │
│ - year?: string                                              │
│ - category?: string                                          │
│ - characters: Character[]        ◄──────────┐                │
│ - content: ContentNode[]         ◄────┐     │                │
│ - createdAt: Date                     │     │                │
│ - updatedAt: Date                     │     │                │
└───────────────────────────────────────┼─────┼────────────────┘
                                        │     │
                    ┌───────────────────┘     │
                    │                         │
                    ▼                         │
        ┌───────────────────────┐             │
        │     Character         │             │
        ├───────────────────────┤             │
        │ - id: string          │             │
        │ - name: string        │             │
        │ - gender: Gender      │             │
        │ - voiceURI?: string   │             │
        │ - color: string       │             │
        └───────────────────────┘             │
                    │                         │
                    │ uses                    │
                    ▼                         │
        ┌───────────────────────┐             │
        │       Gender          │             │
        ├───────────────────────┤             │
        │ 'male'                │             │
        │ 'female'              │             │
        │ 'neutral'             │             │
        └───────────────────────┘             │
                                              │
                                              │
                    ┌─────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │    ContentNode        │◄──────────────┐
        │      (Union)          │               │
        ├───────────────────────┤               │
        │ ActNode               │               │
        │ SceneNode             │               │
        │ LineNode              │               │
        │ DidascalieNode        │               │
        └───────────────────────┘               │
                    │                           │
        ┌───────────┼───────────┬───────────┐   │
        ▼           ▼           ▼           ▼   │
    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────┐
    │ActNode │  │SceneNode│ │LineNode│  │Didascalie  │
    ├────────┤  ├────────┤  ├────────┤  │   Node     │
    │type    │  │type    │  │type    │  ├────────────┤
    │number? │  │number? │  │id      │  │type        │
    │title   │  │title   │  │charId  │  │content     │
    │children├─►│children├─►│segments│  └────────────┘
    └────────┘  └────────┘  └────┬───┘
                                 │
                                 │ contains
                                 ▼
                    ┌─────────────────────┐
                    │   TextSegment       │
                    ├─────────────────────┤
                    │ - type: Type        │
                    │ - content: string   │
                    └─────────────────────┘
                                 │
                                 │ uses
                                 ▼
                    ┌─────────────────────┐
                    │ TextSegmentType     │
                    ├─────────────────────┤
                    │ 'text'              │
                    │ 'didascalie'        │
                    └─────────────────────┘
```

---

## ⚙️ Paramètres Globaux

```
┌─────────────────────────────────────────────┐
│              Settings                        │
├─────────────────────────────────────────────┤
│ - id: string (always 'global')              │
│ - theme: Theme                              │
│ - voiceOff: boolean                         │
│ - readingSpeed: number (0.5 - 2.0)          │
│ - userSpeed: number (0.5 - 2.0)             │
│ - hideUserLines: boolean                    │
│ - showBefore: boolean                       │
│ - showAfter: boolean                        │
└─────────────────────────────────────────────┘
                    │
                    │ uses
                    ▼
        ┌───────────────────────┐
        │       Theme           │
        ├───────────────────────┤
        │ 'light'               │
        │ 'dark'                │
        └───────────────────────┘
```

---

## 📝 Types de Base

### Gender
```typescript
type Gender = 'male' | 'female' | 'neutral'
```
**Utilisation** : Sélection de voix pour les personnages

### ContentNodeType
```typescript
type ContentNodeType = 'act' | 'scene' | 'line' | 'didascalie'
```
**Utilisation** : Discrimination de types dans l'AST

### TextSegmentType
```typescript
type TextSegmentType = 'text' | 'didascalie'
```
**Utilisation** : Segments de texte dans les répliques

### ReadingMode
```typescript
type ReadingMode = 'silent' | 'audio' | 'italian'
```
**Utilisation** : Mode de lecture de la pièce
- `silent` : Lecture silencieuse
- `audio` : Lecture audio complète
- `italian` : Mode répétition (italiennes)

### Theme
```typescript
type Theme = 'light' | 'dark'
```
**Utilisation** : Thème de l'interface utilisateur

---

## 🌳 Hiérarchie de l'AST

```
Play
└── ContentNode[]
    ├── ActNode
    │   └── children: ContentNode[]
    │       ├── SceneNode
    │       │   └── children: ContentNode[]
    │       │       ├── LineNode
    │       │       │   └── segments: TextSegment[]
    │       │       │       ├── { type: 'text', content: '...' }
    │       │       │       └── { type: 'didascalie', content: '...' }
    │       │       └── DidascalieNode
    │       │           └── content: string
    │       └── LineNode (peut être directement dans l'acte)
    └── SceneNode (peut être à la racine si pas d'acte)
```

---

## 🔧 Fonctions Utilitaires

### Création

```typescript
createCharacter(name: string): Character
```
**Description** : Crée un personnage avec valeurs par défaut
- Génère un ID unique
- Gender: 'neutral'
- Color: '#666666'

### Type Guards

```typescript
isActNode(node: ContentNode): node is ActNode
isSceneNode(node: ContentNode): node is SceneNode
isLineNode(node: ContentNode): node is LineNode
isDidascalieNode(node: ContentNode): node is DidascalieNode
```
**Description** : Permettent la discrimination de types dans l'AST

---

## 📦 Constantes

### DEFAULT_SETTINGS

```typescript
const DEFAULT_SETTINGS: Settings = {
  id: 'global',
  theme: 'light',
  voiceOff: true,
  readingSpeed: 1.0,
  userSpeed: 1.0,
  hideUserLines: false,
  showBefore: false,
  showAfter: true,
}
```

---

## 🔄 Flux de Données

### Import d'une pièce

```
Fichier .txt
    │
    ▼
[Parser]  ──►  Play object
    │              │
    │              ├── Metadata (title, author, year, category)
    │              ├── Characters[] (détectés automatiquement)
    │              └── ContentNode[] (AST)
    │
    ▼
[Storage] ──►  IndexedDB
    │
    ▼
[State]   ──►  Zustand Store
    │
    ▼
[UI]      ──►  React Components
```

### Lecture d'une pièce

```
Play (from State)
    │
    ▼
ContentNode[] traversal
    │
    ├── ActNode ──► Display act title
    │
    ├── SceneNode ──► Display scene title
    │
    ├── LineNode ──► TTS.speak(text, character.voice)
    │       │
    │       └── TextSegment[] ──► Handle text and didascalies
    │
    └── DidascalieNode ──► TTS.speak(content, voiceOff)
```

---

## 💾 Sérialisation pour IndexedDB

### Dates
Les `Date` objects sont automatiquement convertis en ISO strings par IndexedDB :
```typescript
createdAt: Date  →  "2025-01-15T10:30:00.000Z"
```

### Characters
Stockés comme tableau JSON :
```json
[
  {
    "id": "char_123...",
    "name": "HAMLET",
    "gender": "male",
    "voiceURI": "Microsoft David - English (United States)",
    "color": "#3B82F6"
  }
]
```

### Content (AST)
Stocké comme structure JSON récursive :
```json
[
  {
    "type": "act",
    "number": 1,
    "title": "Acte I",
    "children": [
      {
        "type": "scene",
        "number": 1,
        "title": "Scène 1",
        "children": [
          {
            "type": "line",
            "id": "line_001",
            "characterId": "char_123...",
            "segments": [
              { "type": "text", "content": "Être ou ne pas être..." }
            ]
          }
        ]
      }
    ]
  }
]
```

---

## 🎯 Cas d'Usage

### 1. Créer une nouvelle pièce

```typescript
import { Play, createCharacter } from '@/core/models';

const hamlet = createCharacter('HAMLET');
const play: Play = {
  id: crypto.randomUUID(),
  fileName: 'hamlet.txt',
  title: 'Hamlet',
  author: 'Shakespeare',
  characters: [hamlet],
  content: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### 2. Parcourir l'AST

```typescript
import { isLineNode, isActNode } from '@/core/models';

function traverse(node: ContentNode) {
  if (isActNode(node)) {
    console.log('Acte:', node.title);
    node.children.forEach(traverse);
  } else if (isLineNode(node)) {
    console.log('Réplique:', node.segments);
  }
}
```

### 3. Trouver un personnage

```typescript
const character = play.characters.find(c => c.name === 'HAMLET');
```

### 4. Modifier les paramètres

```typescript
import { DEFAULT_SETTINGS } from '@/core/models';

const settings = { 
  ...DEFAULT_SETTINGS, 
  theme: 'dark',
  readingSpeed: 0.8 
};
```

---

## 📚 Références

- **Fichiers sources** : `src/core/models/`
- **Exemples** : `examples/models-usage.ts`
- **Documentation** : `docs/PROMPT_02_COMPLETED.md`
- **Standards** : `.github/prompts/common.md`

---

**Version** : Prompt 02  
**Date** : 2025-01-XX  
**Status** : ✅ Complété