# 📦 Prompt 02 : Modèles de Données & Types

**Durée** : ~1h | **Dépend de** : Prompt 01

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu crées les modèles TypeScript qui représentent les données de l'application Répét.

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

## 🎯 Tâches

### 1. Types de Base (src/core/models/types.ts)

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

/** Sexe d'un personnage */
export type Gender = 'male' | 'female' | 'neutral';

/** Type de nœud de contenu dans l'AST */
export type ContentNodeType = 'act' | 'scene' | 'line' | 'didascalie';

/** Type de segment de texte */
export type TextSegmentType = 'text' | 'didascalie';

/** Mode de lecture */
export type ReadingMode = 'silent' | 'audio' | 'italian';

/** Thème de l'application */
export type Theme = 'light' | 'dark';
```

### 2. Modèle Character (src/core/models/Character.ts)

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { Gender } from './types';

/**
 * Représente un personnage de la pièce
 */
export interface Character {
  /** Identifiant unique du personnage */
  id: string;
  
  /** Nom du personnage (en majuscules dans le texte) */
  name: string;
  
  /** Sexe du personnage (pour sélection de voix) */
  gender: Gender;
  
  /** URI de la voix système sélectionnée (optionnel) */
  voiceURI?: string;
  
  /** Couleur associée au personnage (hex) */
  color: string;
}

/**
 * Crée un nouveau personnage avec valeurs par défaut
 */
export function createCharacter(name: string): Character {
  return {
    id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    gender: 'neutral',
    color: '#666666', // Sera généré automatiquement
  };
}
```

### 3. Modèle ContentNode (src/core/models/ContentNode.ts)

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { ContentNodeType, TextSegmentType } from './types';

/** Segment de texte (texte normal ou didascalie inline) */
export interface TextSegment {
  type: TextSegmentType;
  content: string;
}

/** Nœud de base pour l'AST */
export interface BaseContentNode {
  type: ContentNodeType;
}

/** Nœud Acte */
export interface ActNode extends BaseContentNode {
  type: 'act';
  number?: number;
  title: string;
  children: ContentNode[];
}

/** Nœud Scène */
export interface SceneNode extends BaseContentNode {
  type: 'scene';
  number?: number;
  title: string;
  children: ContentNode[];
}

/** Nœud Réplique */
export interface LineNode extends BaseContentNode {
  type: 'line';
  id: string;
  characterId: string;
  segments: TextSegment[];
}

/** Nœud Didascalie (standalone) */
export interface DidascalieNode extends BaseContentNode {
  type: 'didascalie';
  content: string;
}

/** Union de tous les types de nœuds */
export type ContentNode = ActNode | SceneNode | LineNode | DidascalieNode;

/** Type guard pour ActNode */
export function isActNode(node: ContentNode): node is ActNode {
  return node.type === 'act';
}

/** Type guard pour SceneNode */
export function isSceneNode(node: ContentNode): node is SceneNode {
  return node.type === 'scene';
}

/** Type guard pour LineNode */
export function isLineNode(node: ContentNode): node is LineNode {
  return node.type === 'line';
}

/** Type guard pour DidascalieNode */
export function isDidascalieNode(node: ContentNode): node is DidascalieNode {
  return node.type === 'didascalie';
}
```

### 4. Modèle Play (src/core/models/Play.ts)

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { Character } from './Character';
import { ContentNode } from './ContentNode';

/**
 * Représente une pièce de théâtre complète
 */
export interface Play {
  /** Identifiant unique (UUID) */
  id: string;
  
  /** Nom du fichier importé */
  fileName: string;
  
  /** Titre de la pièce */
  title: string;
  
  /** Auteur (optionnel) */
  author?: string;
  
  /** Année (optionnel) */
  year?: string;
  
  /** Catégorie (comédie, drame, etc.) */
  category?: string;
  
  /** Liste des personnages */
  characters: Character[];
  
  /** Contenu de la pièce (AST) */
  content: ContentNode[];
  
  /** Date de création */
  createdAt: Date;
  
  /** Date de dernière modification */
  updatedAt: Date;
}
```

### 5. Modèle Settings (src/core/models/Settings.ts)

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { Theme } from './types';

/**
 * Paramètres globaux de l'application
 */
export interface Settings {
  /** Identifiant (toujours 'global') */
  id: string;
  
  /** Thème de l'interface */
  theme: Theme;
  
  /** Voix off activée (lecture des didascalies) */
  voiceOff: boolean;
  
  /** Vitesse de lecture (0.5 - 2.0) */
  readingSpeed: number;
  
  /** Vitesse de lecture utilisateur en italiennes (0.5 - 2.0) */
  userSpeed: number;
  
  /** Cacher les répliques de l'utilisateur */
  hideUserLines: boolean;
  
  /** Afficher les répliques avant lecture */
  showBefore: boolean;
  
  /** Afficher les répliques après lecture */
  showAfter: boolean;
}

/**
 * Paramètres par défaut
 */
export const DEFAULT_SETTINGS: Settings = {
  id: 'global',
  theme: 'light',
  voiceOff: true,
  readingSpeed: 1.0,
  userSpeed: 1.0,
  hideUserLines: false,
  showBefore: false,
  showAfter: true,
};
```

### 6. Index (src/core/models/index.ts)

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

export * from './types';
export * from './Character';
export * from './ContentNode';
export * from './Play';
export * from './Settings';
```

## ✅ Validation

```bash
npm run type-check  # 0 erreur
```

Vérifier :
- [ ] Tous les types compilent
- [ ] Imports/exports fonctionnent
- [ ] Type guards fonctionnent
- [ ] Pas de `any`

## 📝 Livrables

- [x] types.ts
- [x] Character.ts
- [x] ContentNode.ts
- [x] Play.ts
- [x] Settings.ts
- [x] index.ts
