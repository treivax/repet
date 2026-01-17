# 📋 Plan d'Implémentation Stricte et Complète - Fonctionnalité Notes

**Version**: 1.0  
**Date**: 2025-01-XX  
**Branche**: `new_annotations`  
**Basé sur**: `spec_notes.md` + `.github/prompts/common.md`

---

## 🎯 Objectif

Implémenter la fonctionnalité Notes de manière **complète, propre et maintenable** en respectant strictement les principes du projet Répét :
- ✅ Code simple et lisible avant optimisation prématurée
- ✅ Composants réutilisables et découplés
- ✅ Separation of Concerns
- ✅ Progressive Enhancement
- ❌ PAS de sur-ingénierie
- ❌ PAS de hardcoding
- ❌ PAS de solutions temporaires

---

## 📑 Table des Matières

1. [Principes Directeurs](#principes-directeurs)
2. [Phase 1 : Fondations](#phase-1--fondations-priorité-1)
3. [Phase 2 : Composants UI](#phase-2--composants-ui-priorité-1)
4. [Phase 3 : Intégration Écrans](#phase-3--intégration-écrans-de-lecture-priorité-1)
5. [Phase 4 : Interactions Avancées](#phase-4--interactions-avancées-priorité-2)
6. [Phase 5 : Export PDF](#phase-5--export-pdf-priorité-1)
7. [Phase 6 : Tests et Validation](#phase-6--tests-et-validation-priorité-1)
8. [Phase 7 : Documentation](#phase-7--documentation-et-polish-priorité-2)
9. [Checklist Finale](#checklist-finale)

---

## 🎯 Principes Directeurs

### Règles Strictes à Respecter

#### 1. Copyright Obligatoire
**TOUS** les nouveaux fichiers `.ts` et `.tsx` doivent commencer par :
```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */
```

#### 2. AUCUN Hardcoding
- ❌ Pas de valeurs en dur dans le code
- ❌ Pas de "magic numbers" ou "magic strings"
- ✅ Constantes nommées et exportées
- ✅ Configuration centralisée

**Exemple** :
```typescript
// ❌ MAUVAIS
const delay = 500; // Magic number !
if (type === "line") { // Hardcodé !

// ✅ BON
export const LONG_PRESS_DELAY_MS = 500;
export const LONG_PRESS_MOVE_THRESHOLD_PX = 10;
export const NOTE_AUTOSAVE_DEBOUNCE_MS = 500;

export enum AttachableType {
  STRUCTURE = 'structure',
  ANNOTATION = 'annotation',
  LINE = 'line'
}
```

#### 3. Types TypeScript Stricts
- ❌ Pas de `any` (sauf cas extrême justifié avec commentaire)
- ❌ Pas de `@ts-ignore` sans explication
- ✅ Interfaces explicites
- ✅ Type guards quand nécessaire
- ✅ Génériques pour réutilisabilité

#### 4. Tests Manuels Systématiques
Après **chaque étape** :
- [ ] Tester manuellement la fonctionnalité ajoutée/modifiée
- [ ] Vérifier tous les écrans affectés
- [ ] Vérifier la console (0 erreur, 0 warning)
- [ ] Tester les cas limites
- [ ] Tester responsive (mobile/tablet/desktop)
- [ ] Tester thème clair ET sombre

#### 5. Approche Directe (Pas de Solutions Temporaires)
```
✅ BON (solution directe) :
1. Créer nouveau composant
2. Identifier TOUS les usages
3. Remplacer TOUS les usages en une fois
4. Supprimer l'ancien
5. Tester toutes les pages affectées

❌ MAUVAIS (approche fragmentée) :
1. Créer nouveau composant
2. Garder ancien pour compatibilité
3. Migration progressive
4. Nettoyage ultérieur
```

---

## 🏗️ PHASE 1 : Fondations (Priorité 1)

### Objectif
Créer les types, constantes, et la couche de stockage IndexedDB pour les notes.

### Étape 1.1 : Types et Constantes

**Fichier** : `src/core/models/note.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Type d'élément sur lequel une note peut être attachée
 */
export enum AttachableType {
  STRUCTURE = 'structure',  // Titre, acte, scène
  ANNOTATION = 'annotation', // Didascalie, présentation
  LINE = 'line'             // Réplique
}

/**
 * État d'affichage d'une note
 */
export enum NoteDisplayState {
  MAXIMIZED = 'maximized',
  MINIMIZED = 'minimized'
}

/**
 * Note attachée à un élément de la pièce
 */
export interface Note {
  /** Identifiant unique de la note (UUID v4) */
  id: string;
  
  /** ID de la pièce */
  playId: string;
  
  /** Type d'élément attaché */
  attachedToType: AttachableType;
  
  /** Index de l'élément dans son tableau */
  attachedToIndex: number;
  
  /** Contenu texte de la note */
  content: string;
  
  /** État d'affichage actuel */
  displayState: NoteDisplayState;
  
  /** Date de création */
  createdAt: Date;
  
  /** Date de dernière modification */
  updatedAt: Date;
}

/**
 * Préférences globales pour l'affichage des notes
 */
export interface NotesPreferences {
  /** ID unique (toujours 'global') */
  id: 'global';
  
  /** État par défaut pour nouvelles notes */
  defaultDisplayState: NoteDisplayState;
  
  /** Dernière mise à jour */
  updatedAt: Date;
}
```

**Fichier** : `src/core/models/noteConstants.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Constantes pour la gestion des notes
 */

/** Durée minimale du long-press en millisecondes */
export const LONG_PRESS_DELAY_MS = 500;

/** Seuil de mouvement pour annuler un long-press (en pixels) */
export const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

/** Délai de debounce pour la sauvegarde automatique (en millisecondes) */
export const NOTE_AUTOSAVE_DEBOUNCE_MS = 500;

/** Largeur minimale d'une note en pixels */
export const NOTE_MIN_WIDTH_PX = 200;

/** Hauteur minimale d'une note en pixels */
export const NOTE_MIN_HEIGHT_PX = 100;

/** Nombre maximum de caractères dans une note */
export const NOTE_MAX_LENGTH = 5000;

/** Classes Tailwind pour le style de note (fond jaune pastel) */
export const NOTE_BG_COLOR = 'bg-yellow-50';
export const NOTE_BG_COLOR_DARK = 'dark:bg-yellow-900/20';
export const NOTE_BORDER_COLOR = 'border-yellow-200';
export const NOTE_BORDER_COLOR_DARK = 'dark:border-yellow-700';
export const NOTE_TEXT_COLOR = 'text-gray-600';
export const NOTE_TEXT_COLOR_DARK = 'dark:text-gray-400';

/** Taille de l'icône minimisée */
export const NOTE_ICON_SIZE_PX = 24;
```

**Validation Étape 1.1** :
- [ ] Fichiers créés avec copyright
- [ ] Aucun hardcoding (toutes valeurs en constantes)
- [ ] Types stricts (pas de `any`)
- [ ] Exports nommés (pas de default)
- [ ] Compilation TypeScript OK (`npm run type-check`)

---

### Étape 1.2 : Stockage IndexedDB

**Fichier** : `src/core/storage/notesStorage.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Note, NotesPreferences, NoteDisplayState } from '../models/note';

/**
 * Base de données IndexedDB pour les notes
 * Utilise Dexie pour simplifier les opérations
 */
class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  preferences!: Table<NotesPreferences, string>;

  constructor() {
    super('RepetNotesDB');
    
    // Version 1 du schéma
    this.version(1).stores({
      notes: 'id, playId, [playId+attachedToType+attachedToIndex]',
      preferences: 'id'
    });
  }
}

const db = new NotesDatabase();

/**
 * Service de gestion du stockage des notes
 */
export class NotesStorage {
  /**
   * Génère un nouvel ID unique pour une note
   */
  private static generateId(): string {
    return uuidv4();
  }

  /**
   * Crée une nouvelle note
   */
  static async createNote(
    playId: string,
    attachedToType: Note['attachedToType'],
    attachedToIndex: number,
    content: string = ''
  ): Promise<Note> {
    const now = new Date();
    const note: Note = {
      id: this.generateId(),
      playId,
      attachedToType,
      attachedToIndex,
      content,
      displayState: NoteDisplayState.MAXIMIZED,
      createdAt: now,
      updatedAt: now
    };

    await db.notes.add(note);
    return note;
  }

  /**
   * Récupère une note par son ID
   */
  static async getNote(id: string): Promise<Note | undefined> {
    return await db.notes.get(id);
  }

  /**
   * Récupère toutes les notes d'une pièce
   */
  static async getNotesByPlayId(playId: string): Promise<Note[]> {
    return await db.notes.where('playId').equals(playId).toArray();
  }

  /**
   * Récupère la note attachée à un élément spécifique
   */
  static async getNoteByAttachment(
    playId: string,
    attachedToType: Note['attachedToType'],
    attachedToIndex: number
  ): Promise<Note | undefined> {
    return await db.notes
      .where('[playId+attachedToType+attachedToIndex]')
      .equals([playId, attachedToType, attachedToIndex])
      .first();
  }

  /**
   * Met à jour le contenu d'une note
   */
  static async updateNoteContent(id: string, content: string): Promise<void> {
    await db.notes.update(id, {
      content,
      updatedAt: new Date()
    });
  }

  /**
   * Met à jour l'état d'affichage d'une note
   */
  static async updateNoteDisplayState(
    id: string,
    displayState: NoteDisplayState
  ): Promise<void> {
    await db.notes.update(id, {
      displayState,
      updatedAt: new Date()
    });
  }

  /**
   * Supprime une note
   */
  static async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  }

  /**
   * Supprime toutes les notes d'une pièce
   */
  static async deleteNotesByPlayId(playId: string): Promise<void> {
    await db.notes.where('playId').equals(playId).delete();
  }

  /**
   * Minimise ou maximise toutes les notes d'une pièce
   */
  static async setAllNotesDisplayState(
    playId: string,
    displayState: NoteDisplayState
  ): Promise<void> {
    const notes = await this.getNotesByPlayId(playId);
    const now = new Date();
    
    await db.transaction('rw', db.notes, async () => {
      for (const note of notes) {
        await db.notes.update(note.id, {
          displayState,
          updatedAt: now
        });
      }
    });
  }

  /**
   * Récupère les préférences globales
   */
  static async getPreferences(): Promise<NotesPreferences> {
    const prefs = await db.preferences.get('global');
    
    if (!prefs) {
      // Créer préférences par défaut
      const defaultPrefs: NotesPreferences = {
        id: 'global',
        defaultDisplayState: NoteDisplayState.MAXIMIZED,
        updatedAt: new Date()
      };
      await db.preferences.add(defaultPrefs);
      return defaultPrefs;
    }
    
    return prefs;
  }

  /**
   * Met à jour les préférences globales
   */
  static async updatePreferences(
    updates: Partial<Omit<NotesPreferences, 'id'>>
  ): Promise<void> {
    await db.preferences.update('global', {
      ...updates,
      updatedAt: new Date()
    });
  }

  /**
   * Nettoie toutes les données (pour tests/debug)
   */
  static async clearAll(): Promise<void> {
    await db.notes.clear();
    await db.preferences.clear();
  }
}
```

**Validation Étape 1.2** :
- [ ] Copyright présent
- [ ] Pas de hardcoding (utilise constantes)
- [ ] Types stricts
- [ ] Gestion erreurs explicite
- [ ] Indexation optimale (index composite)
- [ ] Compilation OK
- [ ] Test manuel : ouvrir DevTools → Application → IndexedDB
  - [ ] Créer une note : `await NotesStorage.createNote('test', 'line', 0, 'test')`
  - [ ] Vérifier présence dans IndexedDB
  - [ ] Récupérer : `await NotesStorage.getNotesByPlayId('test')`
  - [ ] Supprimer : `await NotesStorage.deleteNote(id)`

---

### Étape 1.3 : Context et Hook

**Fichier** : `src/hooks/useNotes.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { createContext, useContext } from 'react';
import { Note, NoteDisplayState } from '../core/models/note';

/**
 * Contexte pour la gestion des notes
 */
export interface NotesContextValue {
  /** Toutes les notes de la pièce actuelle */
  notes: Note[];
  
  /** Map pour lookup rapide : "type:index" → Note */
  notesMap: Map<string, Note>;
  
  /** Crée une nouvelle note */
  createNote: (
    attachedToType: Note['attachedToType'],
    attachedToIndex: number
  ) => Promise<Note>;
  
  /** Met à jour le contenu d'une note */
  updateNoteContent: (id: string, content: string) => Promise<void>;
  
  /** Bascule l'état d'affichage d'une note */
  toggleNoteDisplayState: (id: string) => Promise<void>;
  
  /** Supprime une note */
  deleteNote: (id: string) => Promise<void>;
  
  /** Minimise ou maximise toutes les notes */
  setAllNotesDisplayState: (state: NoteDisplayState) => Promise<void>;
  
  /** Recharge les notes depuis le storage */
  reloadNotes: () => Promise<void>;
}

export const NotesContext = createContext<NotesContextValue | null>(null);

/**
 * Hook pour accéder au contexte des notes
 * @throws Error si utilisé hors d'un NotesProvider
 */
export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext);
  
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  
  return context;
}

/**
 * Génère une clé pour la map de notes
 */
export function getNoteMapKey(
  type: Note['attachedToType'],
  index: number
): string {
  return `${type}:${index}`;
}
```

**Fichier** : `src/components/notes/NotesProvider.tsx`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Note, NoteDisplayState } from '../../core/models/note';
import { NotesStorage } from '../../core/storage/notesStorage';
import { NotesContext, getNoteMapKey } from '../../hooks/useNotes';

interface NotesProviderProps {
  playId: string;
  children: React.ReactNode;
}

/**
 * Provider pour la gestion des notes d'une pièce
 */
export function NotesProvider({ playId, children }: NotesProviderProps) {
  const [notes, setNotes] = useState<Note[]>([]);

  // Map pour lookup O(1)
  const notesMap = useMemo(() => {
    const map = new Map<string, Note>();
    for (const note of notes) {
      const key = getNoteMapKey(note.attachedToType, note.attachedToIndex);
      map.set(key, note);
    }
    return map;
  }, [notes]);

  // Charge les notes au montage et quand playId change
  const reloadNotes = useCallback(async () => {
    try {
      const loadedNotes = await NotesStorage.getNotesByPlayId(playId);
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      setNotes([]);
    }
  }, [playId]);

  useEffect(() => {
    reloadNotes();
  }, [reloadNotes]);

  // Crée une nouvelle note
  const createNote = useCallback(
    async (
      attachedToType: Note['attachedToType'],
      attachedToIndex: number
    ): Promise<Note> => {
      const note = await NotesStorage.createNote(
        playId,
        attachedToType,
        attachedToIndex,
        ''
      );
      setNotes(prev => [...prev, note]);
      return note;
    },
    [playId]
  );

  // Met à jour le contenu
  const updateNoteContent = useCallback(
    async (id: string, content: string) => {
      await NotesStorage.updateNoteContent(id, content);
      setNotes(prev =>
        prev.map(note =>
          note.id === id
            ? { ...note, content, updatedAt: new Date() }
            : note
        )
      );
    },
    []
  );

  // Bascule l'état d'affichage
  const toggleNoteDisplayState = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const newState =
      note.displayState === NoteDisplayState.MAXIMIZED
        ? NoteDisplayState.MINIMIZED
        : NoteDisplayState.MAXIMIZED;

    await NotesStorage.updateNoteDisplayState(id, newState);
    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, displayState: newState, updatedAt: new Date() }
          : n
      )
    );
  }, [notes]);

  // Supprime une note
  const deleteNote = useCallback(async (id: string) => {
    await NotesStorage.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // Change l'état de toutes les notes
  const setAllNotesDisplayState = useCallback(
    async (state: NoteDisplayState) => {
      await NotesStorage.setAllNotesDisplayState(playId, state);
      await reloadNotes();
    },
    [playId, reloadNotes]
  );

  const value = {
    notes,
    notesMap,
    createNote,
    updateNoteContent,
    toggleNoteDisplayState,
    deleteNote,
    setAllNotesDisplayState,
    reloadNotes
  };

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
```

**Validation Étape 1.3** :
- [ ] Copyright présent
- [ ] Types stricts
- [ ] Gestion erreurs
- [ ] Map pour lookup O(1)
- [ ] useCallback pour éviter re-renders
- [ ] Compilation OK
- [ ] Console : 0 erreur, 0 warning

---

## 🎨 PHASE 2 : Composants UI (Priorité 1)

### Objectif
Créer les composants visuels pour afficher et interagir avec les notes.

### Étape 2.1 : Hook useLongPress

**Fichier** : `src/hooks/useLongPress.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useRef, useCallback } from 'react';
import {
  LONG_PRESS_DELAY_MS,
  LONG_PRESS_MOVE_THRESHOLD_PX
} from '../core/models/noteConstants';

interface Position {
  x: number;
  y: number;
}

interface UseLongPressOptions {
  /** Callback appelé lors d'un long-press réussi */
  onLongPress: () => void;
  
  /** Durée minimale en ms (défaut: LONG_PRESS_DELAY_MS) */
  delay?: number;
  
  /** Seuil de mouvement en px (défaut: LONG_PRESS_MOVE_THRESHOLD_PX) */
  moveThreshold?: number;
}

/**
 * Hook pour détecter un long-press avec annulation sur mouvement
 * Compatible touch et mouse events
 */
export function useLongPress({
  onLongPress,
  delay = LONG_PRESS_DELAY_MS,
  moveThreshold = LONG_PRESS_MOVE_THRESHOLD_PX
}: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const startPosRef = useRef<Position | null>(null);
  const isLongPressRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
    isLongPressRef.current = false;
  }, []);

  const start = useCallback(
    (x: number, y: number) => {
      cancel();
      startPosRef.current = { x, y };
      isLongPressRef.current = false;

      timerRef.current = window.setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, delay);
    },
    [cancel, onLongPress, delay]
  );

  const move = useCallback(
    (x: number, y: number) => {
      if (!startPosRef.current) return;

      const dx = Math.abs(x - startPosRef.current.x);
      const dy = Math.abs(y - startPosRef.current.y);

      // Si mouvement > threshold, annuler le long-press
      if (dx > moveThreshold || dy > moveThreshold) {
        cancel();
      }
    },
    [cancel, moveThreshold]
  );

  const end = useCallback(() => {
    cancel();
  }, [cancel]);

  // Handlers touch
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        start(touch.clientX, touch.clientY);
      }
    },
    [start]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        move(touch.clientX, touch.clientY);
      }
    },
    [move]
  );

  const onTouchEnd = useCallback(() => {
    end();
  }, [end]);

  // Handlers mouse (fallback desktop)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      start(e.clientX, e.clientY);
    },
    [start]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      move(e.clientX, e.clientY);
    },
    [move]
  );

  const onMouseUp = useCallback(() => {
    end();
  }, [end]);

  const onMouseLeave = useCallback(() => {
    end();
  }, [end]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: end,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave
  };
}
```

**Validation Étape 2.1** :
- [ ] Copyright présent
- [ ] Utilise constantes (pas de hardcoding)
- [ ] Types stricts
- [ ] Annulation sur mouvement
- [ ] Compatible touch + mouse
- [ ] Cleanup des timers
- [ ] Compilation OK

---

### Étape 2.2 : Composant NoteIcon

**Fichier** : `src/components/notes/NoteIcon.tsx`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React from 'react';
import { NOTE_ICON_SIZE_PX } from '../../core/models/noteConstants';

interface NoteIconProps {
  /** Callback au clic */
  onClick: () => void;
  
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Icône de note minimisée (sticky note)
 */
export function NoteIcon({ onClick, className = '' }: NoteIconProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        rounded
        bg-yellow-200 dark:bg-yellow-600
        hover:bg-yellow-300 dark:hover:bg-yellow-500
        transition-colors
        cursor-pointer
        ${className}
      `}
      style={{
        width: NOTE_ICON_SIZE_PX,
        height: NOTE_ICON_SIZE_PX
      }}
      aria-label="Ouvrir la note"
      title="Cliquez pour ouvrir la note"
    >
      {/* SVG sticky note icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-yellow-700 dark:text-yellow-900"
      >
        <path
          d="M3 3h18v12l-6 6H3V3z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 15v6l6-6h-6z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
```

**Validation Étape 2.2** :
- [ ] Copyright présent
- [ ] Utilise constante NOTE_ICON_SIZE_PX
- [ ] Accessibilité (aria-label, title)
- [ ] Hover states
- [ ] Thème clair + sombre
- [ ] Compilation OK
- [ ] Test manuel : afficher dans une page test
  - [ ] Clic déclenche onClick
  - [ ] Hover fonctionne
  - [ ] Thème sombre OK

---

### Étape 2.3 : Composant Note

**Fichier** : `src/components/notes/Note.tsx`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React, { useState, useRef, useEffect } from 'react';
import { Note as NoteType, NoteDisplayState } from '../../core/models/note';
import {
  NOTE_BG_COLOR,
  NOTE_BG_COLOR_DARK,
  NOTE_BORDER_COLOR,
  NOTE_BORDER_COLOR_DARK,
  NOTE_TEXT_COLOR,
  NOTE_TEXT_COLOR_DARK,
  NOTE_MIN_WIDTH_PX,
  NOTE_MIN_HEIGHT_PX,
  NOTE_MAX_LENGTH,
  NOTE_AUTOSAVE_DEBOUNCE_MS
} from '../../core/models/noteConstants';
import { useLongPress } from '../../hooks/useLongPress';
import { NoteIcon } from './NoteIcon';

interface NoteProps {
  /** Données de la note */
  note: NoteType;
  
  /** Callback pour mise à jour du contenu */
  onContentChange: (content: string) => void;
  
  /** Callback pour minimiser/maximiser */
  onToggleState: () => void;
  
  /** Callback pour supprimer */
  onDelete: () => void;
  
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Note - affichage maximisé ou minimisé
 */
export function Note({
  note,
  onContentChange,
  onToggleState,
  onDelete,
  className = ''
}: NoteProps) {
  const [localContent, setLocalContent] = useState(note.content);
  const saveTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local content avec props
  useEffect(() => {
    setLocalContent(note.content);
  }, [note.content]);

  // Auto-save avec debounce
  const scheduleSave = (content: string) => {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      onContentChange(content);
    }, NOTE_AUTOSAVE_DEBOUNCE_MS);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    scheduleSave(newContent);
  };

  const handleBlur = () => {
    // Save immédiatement au blur
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    onContentChange(localContent);
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Long-press pour minimiser (sauf sur textarea et bouton delete)
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (note.displayState === NoteDisplayState.MAXIMIZED) {
        onToggleState();
      }
    }
  });

  const handleWrapperInteraction = (e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Ne pas déclencher long-press sur textarea ou bouton
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.closest('button')
    ) {
      return;
    }

    // Appliquer les handlers de long-press
    const handlers = longPressHandlers as any;
    if ('touches' in e && handlers.onTouchStart) {
      handlers.onTouchStart(e);
    } else if ('clientX' in e && handlers.onMouseDown) {
      handlers.onMouseDown(e);
    }
  };

  // Note minimisée
  if (note.displayState === NoteDisplayState.MINIMIZED) {
    return (
      <div className={`inline-block ml-2 ${className}`}>
        <NoteIcon onClick={onToggleState} />
      </div>
    );
  }

  // Note maximisée
  return (
    <div
      className={`
        relative
        ${NOTE_BG_COLOR} ${NOTE_BG_COLOR_DARK}
        border ${NOTE_BORDER_COLOR} ${NOTE_BORDER_COLOR_DARK}
        rounded-lg shadow-md
        p-4 mb-4
        ${className}
      `}
      style={{
        minWidth: NOTE_MIN_WIDTH_PX,
        minHeight: NOTE_MIN_HEIGHT_PX
      }}
      onTouchStart={handleWrapperInteraction}
      onMouseDown={handleWrapperInteraction}
      {...longPressHandlers}
      // Exclure du IntersectionObserver
      data-note-element="true"
    >
      {/* Bouton de suppression */}
      <button
        onClick={onDelete}
        className="
          absolute top-2 right-2
          w-6 h-6
          flex items-center justify-center
          text-gray-400 hover:text-gray-600
          dark:text-gray-500 dark:hover:text-gray-300
          transition-colors
        "
        aria-label="Supprimer la note"
        title="Supprimer la note"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Textarea pour le contenu */}
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={handleContentChange}
        onBlur={handleBlur}
        maxLength={NOTE_MAX_LENGTH}
        placeholder="Écrivez votre note ici..."
        className={`
          w-full
          resize-none
          bg-transparent
          border-none
          outline-none
          ${NOTE_TEXT_COLOR} ${NOTE_TEXT_COLOR_DARK}
          italic
          placeholder-gray-400 dark:placeholder-gray-600
        `}
        style={{
          minHeight: NOTE_MIN_HEIGHT_PX - 32 // padding
        }}
        aria-label="Contenu de la note"
      />

      {/* Indicateur de caractères */}
      <div
        className="
          text-xs text-gray-400 dark:text-gray-600
          text-right mt-1
        "
      >
        {localContent.length} / {NOTE_MAX_LENGTH}
      </div>
    </div>
  );
}
```

**Validation Étape 2.3** :
- [ ] Copyright présent
- [ ] Utilise TOUTES les constantes (pas de hardcoding)
- [ ] Types stricts
- [ ] Auto-save avec debounce
- [ ] Save on blur
- [ ] Long-press pour minimiser
- [ ] Exclusion des handlers sur textarea/button
- [ ] data-note-element pour exclure de l'Observer
- [ ] Accessibilité (aria-labels, placeholder)
- [ ] Thème clair + sombre
- [ ] Compilation OK
- [ ] Test manuel :
  - [ ] Créer une note
  - [ ] Taper du texte → debounce fonctionne
  - [ ] Blur → save immédiat
  - [ ] Long-press → minimise
  - [ ] Clic sur icône → maximise
  - [ ] Clic sur X → demande suppression
  - [ ] Thème sombre OK

---

## 🔌 PHASE 3 : Intégration Écrans de Lecture (Priorité 1)

### Objectif
Intégrer les notes dans PlayScreen et ReaderScreen avec support de tous les types d'éléments.

### Étape 3.1 : Wrapper PlayScreen avec NotesProvider

**Fichier** : `src/screens/PlayScreen.tsx` (modification)

```typescript
// Ajouter import
import { NotesProvider } from '../components/notes/NotesProvider';

// Dans le JSX, wrapper le contenu existant :
return (
  <NotesProvider playId={play.id}>
    {/* Contenu existant de PlayScreen */}
  </NotesProvider>
);
```

**Validation Étape 3.1** :
- [ ] NotesProvider enveloppe le contenu
- [ ] playId passé correctement
- [ ] Compilation OK
- [ ] Console : 0 erreur
- [ ] Test manuel : ouvrir PlayScreen → pas d'erreur

---

### Étape 3.2 : Ajouter Long-Press sur Éléments Attachables

**Fichier** : `src/components/reader/PlaybackDisplay.tsx` (modifications)

Stratégie :
1. Ajouter `useNotes()` pour accéder au contexte
2. Ajouter `useLongPress` sur chaque élément attachable
3. Vérifier si une note existe déjà avant de créer
4. Rendre la note après l'élément si elle existe

**Exemple pour une réplique** :

```typescript
import { useNotes, getNoteMapKey } from '../../hooks/useNotes';
import { useLongPress } from '../../hooks/useLongPress';
import { AttachableType } from '../../core/models/note';
import { Note } from '../notes/Note';

function LineComponent({ line, index }: Props) {
  const { notesMap, createNote, updateNoteContent, toggleNoteDisplayState, deleteNote } = useNotes();
  
  const noteKey = getNoteMapKey(AttachableType.LINE, index);
  const existingNote = notesMap.get(noteKey);

  const handleLongPress = async () => {
    if (!existingNote) {
      await createNote(AttachableType.LINE, index);
    }
  };

  const longPressHandlers = useLongPress({ onLongPress: handleLongPress });

  return (
    <div>
      <div
        data-playback-index={index}
        {...longPressHandlers}
      >
        {/* Contenu de la réplique */}
      </div>
      
      {existingNote && (
        <Note
          note={existingNote}
          onContentChange={(content) => updateNoteContent(existingNote.id, content)}
          onToggleState={() => toggleNoteDisplayState(existingNote.id)}
          onDelete={() => {
            if (confirm('Supprimer cette note ?')) {
              deleteNote(existingNote.id);
            }
          }}
        />
      )}
    </div>
  );
}
```

**IMPORTANT** : Appliquer cette logique à **TOUS** les éléments attachables :
- Éléments de structure (titre, acte, scène)
- Annotations hors réplique (didascalies, présentation)
- Répliques

**Validation Étape 3.2** :
- [ ] Long-press fonctionne sur structure
- [ ] Long-press fonctionne sur didascalies
- [ ] Long-press fonctionne sur répliques
- [ ] Confirmation de suppression
- [ ] Notes visibles après éléments
- [ ] Pas d'interference avec IntersectionObserver
- [ ] Compilation OK
- [ ] Test manuel :
  - [ ] Long-press sur titre → note créée
  - [ ] Long-press sur acte → note créée
  - [ ] Long-press sur scène → note créée
  - [ ] Long-press sur didascalie → note créée
  - [ ] Long-press sur réplique → note créée
  - [ ] Scroll manuel fonctionne (pas d'annulation intempestive)
  - [ ] TTS continue de fonctionner
  - [ ] Console : 0 erreur

---

### Étape 3.3 : Menu Global Minimiser/Maximiser

**Fichier** : Menu de PlayScreen (composant existant de menu)

Ajouter un item de menu :

```typescript
import { useNotes } from '../../hooks/useNotes';
import { NoteDisplayState } from '../../core/models/note';

function Menu() {
  const { notes, setAllNotesDisplayState } = useNotes();
  
  const areAllMinimized = notes.every(
    n => n.displayState === NoteDisplayState.MINIMIZED
  );

  const handleToggleAll = async () => {
    const newState = areAllMinimized
      ? NoteDisplayState.MAXIMIZED
      : NoteDisplayState.MINIMIZED;
    await setAllNotesDisplayState(newState);
  };

  return (
    <button onClick={handleToggleAll}>
      {areAllMinimized ? 'Maximiser toutes les notes' : 'Minimiser toutes les notes'}
    </button>
  );
}
```

**Validation Étape 3.3** :
- [ ] Item de menu présent
- [ ] Texte change selon l'état
- [ ] Clic minimise toutes les notes
- [ ] Clic maximise toutes les notes
- [ ] Compilation OK
- [ ] Test manuel :
  - [ ] Créer 3+ notes
  - [ ] Clic menu → toutes minimisées
  - [ ] Clic menu → toutes maximisées

---

## ⚡ PHASE 4 : Interactions Avancées (Priorité 2)

### Objectif
Améliorer l'UX avec confirmations, optimisations, etc.

### Étape 4.1 : Modale de Confirmation de Suppression

**Fichier** : `src/components/common/ConfirmDialog.tsx`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Utiliser dans `Note.tsx` :

```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// Remplacer window.confirm par :
<ConfirmDialog
  isOpen={showDeleteConfirm}
  title="Supprimer la note"
  message="Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible."
  confirmLabel="Supprimer"
  cancelLabel="Annuler"
  onConfirm={() => {
    setShowDeleteConfirm(false);
    onDelete();
  }}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

**Validation Étape 4.1** :
- [ ] Copyright présent
- [ ] Pas de hardcoding (labels en props)
- [ ] Modale accessible (ESC pour fermer)
- [ ] Thème clair + sombre
- [ ] Test manuel :
  - [ ] Clic X sur note → modale s'ouvre
  - [ ] Annuler → modale se ferme
  - [ ] Confirmer → note supprimée

---

### Étape 4.2 : Optimisations Performance

**Fichier** : `src/components/notes/Note.tsx`

Ajouter `React.memo` :

```typescript
export const Note = React.memo(function Note({ ... }: NoteProps) {
  // ... composant
});
```

**Fichier** : `src/components/notes/NoteIcon.tsx`

```typescript
export const NoteIcon = React.memo(function NoteIcon({ ... }: NoteIconProps) {
  // ... composant
});
```

**Validation Étape 4.2** :
- [ ] React.memo appliqué
- [ ] Pas de re-renders inutiles
- [ ] Test manuel avec React DevTools Profiler :
  - [ ] Créer 20+ notes
  - [ ] Modifier une note
  - [ ] Vérifier que seule celle-ci re-render

---

## 📄 PHASE 5 : Export PDF (Priorité 1)

### Objectif
Inclure les notes dans l'export PDF.

### Étape 5.1 : Étendre pdfExportService

**Fichier** : `src/core/services/pdfExportService.ts` (modifications)

```typescript
import { NotesStorage } from '../storage/notesStorage';
import { Note, AttachableType } from '../models/note';
import { getNoteMapKey } from '../../hooks/useNotes';
import {
  NOTE_BG_COLOR,
  NOTE_BORDER_COLOR,
  NOTE_TEXT_COLOR
} from '../models/noteConstants';

// Ajouter paramètre includeNotes
interface ExportOptions {
  includeNotes?: boolean;
}

// Dans la fonction d'export :
async function exportToPDF(play: Play, options: ExportOptions = {}) {
  const { includeNotes = true } = options;
  
  let notes: Note[] = [];
  let notesMap = new Map<string, Note>();
  
  if (includeNotes) {
    notes = await NotesStorage.getNotesByPlayId(play.id);
    for (const note of notes) {
      const key = getNoteMapKey(note.attachedToType, note.attachedToIndex);
      notesMap.set(key, note);
    }
  }

  // Après chaque élément, vérifier s'il y a une note
  // Exemple pour une réplique à l'index i :
  function renderLineWithNote(line: Line, index: number, yPosition: number): number {
    // Rendre la ligne normalement
    let currentY = renderLine(line, yPosition);
    
    // Vérifier si une note existe
    const noteKey = getNoteMapKey(AttachableType.LINE, index);
    const note = notesMap.get(noteKey);
    
    if (note && note.content.trim()) {
      currentY = renderNoteInPDF(pdf, note, currentY, pageWidth);
    }
    
    return currentY;
  }
}

/**
 * Rendre une note dans le PDF
 */
function renderNoteInPDF(
  pdf: jsPDF,
  note: Note,
  yPosition: number,
  pageWidth: number
): number {
  const margin = 20;
  const noteWidth = pageWidth - margin * 2;
  const padding = 10;
  
  // Fond jaune pastel (approximation RGB)
  pdf.setFillColor(254, 252, 232); // #fefce8 approximation
  pdf.setDrawColor(254, 240, 138); // #fef08a approximation
  
  // Calculer hauteur nécessaire
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99); // gray-600
  
  const lines = pdf.splitTextToSize(note.content, noteWidth - padding * 2);
  const lineHeight = 5;
  const noteHeight = lines.length * lineHeight + padding * 2;
  
  // Vérifier si on a assez de place
  if (yPosition + noteHeight > pdf.internal.pageSize.height - margin) {
    pdf.addPage();
    yPosition = margin;
  }
  
  // Dessiner le rectangle
  pdf.rect(margin, yPosition, noteWidth, noteHeight, 'FD');
  
  // Écrire le texte
  pdf.text(lines, margin + padding, yPosition + padding + 5);
  
  return yPosition + noteHeight + 5; // 5px de marge après la note
}
```

**Validation Étape 5.1** :
- [ ] Notes chargées depuis storage
- [ ] Notes rendues après chaque élément
- [ ] Style fidèle (jaune, italique, gris)
- [ ] Gestion pagination (si note dépasse)
- [ ] Option includeNotes dans UI d'export
- [ ] Test manuel :
  - [ ] Créer pièce avec notes sur différents éléments
  - [ ] Exporter PDF avec notes
  - [ ] Vérifier présence des notes
  - [ ] Vérifier style (fond jaune, texte gris italique)
  - [ ] Exporter PDF sans notes
  - [ ] Vérifier absence des notes

---

## ✅ PHASE 6 : Tests et Validation (Priorité 1)

### Objectif
Valider l'implémentation complète par des tests manuels exhaustifs.

### Checklist de Tests Manuels

#### Création de Notes
- [ ] Long-press sur titre → note créée
- [ ] Long-press sur acte → note créée
- [ ] Long-press sur scène → note créée
- [ ] Long-press sur didascalie → note créée
- [ ] Long-press sur réplique → note créée
- [ ] Note apparaît maximisée
- [ ] Curseur dans textarea
- [ ] Pas de note dupliquée si long-press répété

#### Édition de Notes
- [ ] Taper du texte → debounce fonctionne (500ms)
- [ ] Blur textarea → save immédiat
- [ ] Contenu persisté après refresh page
- [ ] Limite de caractères respectée (5000)
- [ ] Compteur de caractères mis à jour

#### Minimisation/Maximisation
- [ ] Long-press sur note → minimise (sauf sur textarea/bouton)
- [ ] Clic sur icône → maximise
- [ ] État persisté après refresh
- [ ] Menu global minimise toutes les notes
- [ ] Menu global maximise toutes les notes

#### Suppression
- [ ] Clic sur X → modale de confirmation
- [ ] Annuler → note conservée
- [ ] Confirmer → note supprimée
- [ ] Suppression persistée après refresh

#### Interactions et Conflits
- [ ] Scroll manuel fonctionne (pas d'annulation par long-press)
- [ ] TTS fonctionne normalement
- [ ] IntersectionObserver fonctionne (highlight)
- [ ] Pas d'erreurs console
- [ ] Pas de warnings console

#### Export PDF
- [ ] Notes incluses par défaut
- [ ] Option "Inclure notes" dans UI
- [ ] Notes en forme maximisée dans PDF
- [ ] Style correct (jaune, italique, gris)
- [ ] Pagination correcte
- [ ] Export sans notes fonctionne

#### Performance
- [ ] 50+ notes → pas de lag
- [ ] Scroll fluide avec notes
- [ ] Pas de memory leaks (DevTools Performance)

#### Compatibilité
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari
- [ ] Mobile iOS Safari
- [ ] Mobile Android Chrome

#### Accessibilité
- [ ] Navigation clavier possible
- [ ] Aria labels présents
- [ ] Contraste suffisant
- [ ] Focus visible

#### Thèmes
- [ ] Thème clair OK
- [ ] Thème sombre OK
- [ ] Transition fluide

---

## 📚 PHASE 7 : Documentation et Polish (Priorité 2)

### Objectif
Documenter l'implémentation et finaliser.

### Étape 7.1 : Documentation

**Fichier** : `docs/NOTES_FEATURE.md`

```markdown
# Fonctionnalité Notes

## Vue d'ensemble

Les notes permettent d'ajouter des annotations personnelles sur n'importe quel élément d'une pièce.

## Utilisation

### Créer une note
Long-press sur un élément (titre, acte, scène, didascalie, ou réplique).

### Modifier une note
Cliquer dans le champ de texte et taper.

### Minimiser/Maximiser
- Long-press sur la note (hors textarea/bouton) → minimise
- Clic sur l'icône → maximise
- Menu → minimiser/maximiser toutes

### Supprimer une note
Clic sur le X → confirmation → suppression

## Architecture

### Stockage
IndexedDB via `NotesStorage` avec index composite.

### Contexte
`NotesProvider` + `useNotes()` hook.

### Composants
- `Note.tsx` : Affichage et édition
- `NoteIcon.tsx` : Icône minimisée
- `NotesProvider.tsx` : Context provider

### Hooks
- `useNotes()` : Accès au contexte
- `useLongPress()` : Détection long-press

## Export PDF
Notes incluses par défaut, option pour exclure.
```

**Validation Étape 7.1** :
- [ ] Documentation complète
- [ ] Guide utilisateur
- [ ] Guide développeur
- [ ] Architecture documentée

---

### Étape 7.2 : CHANGELOG

**Fichier** : `CHANGELOG.md`

```markdown
## [Unreleased]

### Added
- **Fonctionnalité Notes** : Ajout de notes personnelles sur tous les éléments
  - Création par long-press
  - Édition avec auto-save
  - Minimisation/Maximisation
  - Suppression avec confirmation
  - Persistance IndexedDB
  - Export PDF avec notes
  - Support tous types d'éléments (structure, didascalies, répliques)
```

---

### Étape 7.3 : Nettoyage Final

- [ ] Supprimer tous les `console.log` de debug
- [ ] Vérifier pas de code mort
- [ ] Vérifier pas de TODOs non résolus
- [ ] Formater le code : `npm run format`
- [ ] Linter : `npm run lint`
- [ ] Type-check : `npm run type-check`
- [ ] Build : `npm run build`

---

## 🎯 CHECKLIST FINALE

### Code Quality
- [ ] Copyright sur TOUS les nouveaux fichiers
- [ ] AUCUN hardcoding (toutes valeurs en constantes)
- [ ] Types stricts (pas de `any`)
- [ ] Gestion erreurs explicite
- [ ] Pas de code mort
- [ ] Pas de TODOs non résolus

### Tests Manuels
- [ ] Tous les cas d'usage testés
- [ ] Tous les navigateurs testés
- [ ] Performance validée (50+ notes)
- [ ] Accessibilité vérifiée
- [ ] Thèmes testés

### Documentation
- [ ] Code commenté (JSDoc sur fonctions complexes)
- [ ] README mis à jour
- [ ] CHANGELOG mis à jour
- [ ] Guide utilisateur créé

### Build & Deploy
- [ ] `npm run type-check` : 0 erreur
- [ ] `npm run lint` : 0 erreur
- [ ] `npm run build` : succès
- [ ] Console navigateur : 0 erreur, 0 warning
- [ ] Tests manuels post-build OK

### Git
- [ ] Commits atomiques et clairs
- [ ] Messages de commit descriptifs
- [ ] Branche `new_annotations` clean
- [ ] Prêt pour merge/PR

---

## 🚀 Procédure de Validation Finale

1. **Checkout branche**
   ```bash
   git checkout new_annotations
   ```

2. **Install & Build**
   ```bash
   npm install
   npm run type-check
   npm run lint
   npm run build
   ```

3. **Tests Manuels Complets**
   - Suivre checklist Phase 6 intégralement
   - Noter tout problème

4. **Corrections si Nécessaire**
   - Fixer les problèmes identifiés
   - Re-tester

5. **Documentation Finale**
   - CHANGELOG.md
   - README.md
   - docs/NOTES_FEATURE.md

6. **Commit Final**
   ```bash
   git add .
   git commit -m "feat: Implémentation complète de la fonctionnalité Notes

   - Support tous types d'éléments (structure, didascalies, répliques)
   - Création par long-press
   - Édition avec auto-save et debounce
   - Minimisation/Maximisation (individuelle et globale)
   - Suppression avec confirmation
   - Persistance IndexedDB
   - Export PDF avec notes
   - Tests manuels complets validés
   - Documentation complète"
   ```

7. **Push & PR**
   ```bash
   git push origin new_annotations
   ```
   Ouvrir PR avec description détaillée

---

## 📊 Métriques de Succès

- ✅ 0 erreur TypeScript
- ✅ 0 warning lint
- ✅ 0 erreur console runtime
- ✅ 0 warning console runtime
- ✅ 100% checklist tests manuels
- ✅ Documentation complète
- ✅ Performance acceptable (50+ notes)
- ✅ Compatible tous navigateurs cibles

---

**Fin du Plan d'Implémentation**