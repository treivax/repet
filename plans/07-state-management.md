# 🚀 Prompt 07 : State Management (Zustand)

**Durée estimée** : ~1h30 | **Dépend de** : Prompts 01-06

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer le **système de gestion d'état** de l'application avec **Zustand**.

Zustand gère :
- **Play Store** : Pièce active, personnage utilisateur, navigation acte/scène/ligne
- **Settings Store** : Configuration TTS (voix, vitesse, volume, mode lecture)
- **UI Store** : État UI (modales, loading, erreurs)

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés à respecter

- ✅ Code simple et lisible (pas de sur-ingénierie)
- ✅ TypeScript strict (pas de `any`, typage complet)
- ✅ Stores découplés et responsabilités claires
- ✅ Documentation inline (JSDoc pour fonctions publiques)
- ✅ Actions synchrones (async géré en dehors des stores)
- ❌ PAS de logique métier dans les stores (uniquement état)
- ❌ PAS de dépendances circulaires entre stores

---

## 🎯 Objectifs

1. Créer le **Play Store** (pièce active, personnage, navigation)
2. Créer le **Settings Store** (configuration TTS et mode lecture)
3. Créer le **UI Store** (état interface, modales, erreurs)
4. Créer les **selectors** et **hooks** réutilisables
5. Assurer la persistance locale (localStorage)

---

## 📦 Tâches

### 1. Play Store (État de la pièce active)

#### Fichier : `src/state/playStore.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Play } from '../core/models/Play';
import type { Character } from '../core/models/Character';
import type { Line } from '../core/models/Line';

/**
 * État du Play Store
 */
interface PlayState {
  /** Pièce actuellement chargée */
  currentPlay: Play | null;
  /** Personnage de l'utilisateur */
  userCharacter: Character | null;
  /** Index de ligne actuelle */
  currentLineIndex: number;
  /** Index d'acte actuel */
  currentActIndex: number;
  /** Index de scène actuelle */
  currentSceneIndex: number;

  // Actions
  /** Charge une pièce */
  loadPlay: (play: Play) => void;
  /** Sélectionne le personnage de l'utilisateur */
  setUserCharacter: (character: Character | null) => void;
  /** Navigue vers une ligne spécifique */
  goToLine: (lineIndex: number) => void;
  /** Navigue vers la ligne suivante */
  nextLine: () => void;
  /** Navigue vers la ligne précédente */
  previousLine: () => void;
  /** Navigue vers un acte/scène */
  goToScene: (actIndex: number, sceneIndex: number) => void;
  /** Réinitialise la lecture */
  resetReading: () => void;
  /** Ferme la pièce */
  closePlay: () => void;
}

/**
 * Store Zustand pour la gestion de la pièce active
 */
export const usePlayStore = create<PlayState>()(
  persist(
    (set, get) => ({
      // État initial
      currentPlay: null,
      userCharacter: null,
      currentLineIndex: 0,
      currentActIndex: 0,
      currentSceneIndex: 0,

      // Actions
      loadPlay: (play: Play) => {
        set({
          currentPlay: play,
          currentLineIndex: 0,
          currentActIndex: 0,
          currentSceneIndex: 0,
          userCharacter: null,
        });
      },

      setUserCharacter: (character: Character | null) => {
        set({ userCharacter: character });
      },

      goToLine: (lineIndex: number) => {
        const { currentPlay } = get();
        if (!currentPlay) return;

        // Valider l'index
        const maxIndex = currentPlay.lines.length - 1;
        const validIndex = Math.max(0, Math.min(lineIndex, maxIndex));

        // Trouver l'acte/scène correspondant
        const line = currentPlay.lines[validIndex];
        if (!line) return;

        set({
          currentLineIndex: validIndex,
          currentActIndex: line.actIndex,
          currentSceneIndex: line.sceneIndex,
        });
      },

      nextLine: () => {
        const { currentPlay, currentLineIndex } = get();
        if (!currentPlay) return;

        const nextIndex = currentLineIndex + 1;
        if (nextIndex < currentPlay.lines.length) {
          get().goToLine(nextIndex);
        }
      },

      previousLine: () => {
        const { currentLineIndex } = get();
        if (currentLineIndex > 0) {
          get().goToLine(currentLineIndex - 1);
        }
      },

      goToScene: (actIndex: number, sceneIndex: number) => {
        const { currentPlay } = get();
        if (!currentPlay) return;

        // Trouver la première ligne de cette scène
        const firstLineIndex = currentPlay.lines.findIndex(
          (line) => line.actIndex === actIndex && line.sceneIndex === sceneIndex
        );

        if (firstLineIndex !== -1) {
          set({
            currentLineIndex: firstLineIndex,
            currentActIndex: actIndex,
            currentSceneIndex: sceneIndex,
          });
        }
      },

      resetReading: () => {
        set({
          currentLineIndex: 0,
          currentActIndex: 0,
          currentSceneIndex: 0,
        });
      },

      closePlay: () => {
        set({
          currentPlay: null,
          userCharacter: null,
          currentLineIndex: 0,
          currentActIndex: 0,
          currentSceneIndex: 0,
        });
      },
    }),
    {
      name: 'repet-play-storage',
      partialize: (state) => ({
        // Persister uniquement l'ID de la pièce (pas toute la pièce)
        currentPlayId: state.currentPlay?.id,
        userCharacterId: state.userCharacter?.id,
        currentLineIndex: state.currentLineIndex,
        currentActIndex: state.currentActIndex,
        currentSceneIndex: state.currentSceneIndex,
      }),
    }
  )
);
```

---

### 2. Settings Store (Configuration TTS)

#### Fichier : `src/state/settingsStore.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReadingMode } from '../core/models/Settings';
import { DEFAULT_SPEED, DEFAULT_VOLUME } from '../utils/constants';

/**
 * État du Settings Store
 */
interface SettingsState {
  /** Mode de lecture (silent, audio, italian) */
  readingMode: ReadingMode;
  /** Vitesse de lecture globale */
  globalSpeed: number;
  /** Volume global */
  globalVolume: number;
  /** Voix masculine sélectionnée */
  maleVoiceName: string | null;
  /** Voix féminine sélectionnée */
  femaleVoiceName: string | null;
  /** Voix neutre sélectionnée */
  neutralVoiceName: string | null;
  /** Voix pour didascalies */
  stageDirectionVoiceName: string | null;
  /** Volume spécifique didascalies */
  stageDirectionVolume: number;
  /** Vitesse spécifique didascalies */
  stageDirectionSpeed: number;
  /** Masquer les répliques utilisateur en mode italien */
  hideUserLinesInItalian: boolean;

  // Actions
  /** Change le mode de lecture */
  setReadingMode: (mode: ReadingMode) => void;
  /** Change la vitesse globale */
  setGlobalSpeed: (speed: number) => void;
  /** Change le volume global */
  setGlobalVolume: (volume: number) => void;
  /** Change la voix masculine */
  setMaleVoice: (voiceName: string | null) => void;
  /** Change la voix féminine */
  setFemaleVoice: (voiceName: string | null) => void;
  /** Change la voix neutre */
  setNeutralVoice: (voiceName: string | null) => void;
  /** Change la voix didascalies */
  setStageDirectionVoice: (voiceName: string | null) => void;
  /** Change le volume didascalies */
  setStageDirectionVolume: (volume: number) => void;
  /** Change la vitesse didascalies */
  setStageDirectionSpeed: (speed: number) => void;
  /** Toggle masquage répliques utilisateur */
  toggleHideUserLines: () => void;
  /** Réinitialise tous les paramètres */
  resetSettings: () => void;
}

/**
 * Store Zustand pour les paramètres TTS
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // État initial
      readingMode: 'silent',
      globalSpeed: DEFAULT_SPEED,
      globalVolume: DEFAULT_VOLUME,
      maleVoiceName: null,
      femaleVoiceName: null,
      neutralVoiceName: null,
      stageDirectionVoiceName: null,
      stageDirectionVolume: 0.8,
      stageDirectionSpeed: 1.0,
      hideUserLinesInItalian: true,

      // Actions
      setReadingMode: (mode: ReadingMode) => {
        set({ readingMode: mode });
      },

      setGlobalSpeed: (speed: number) => {
        set({ globalSpeed: Math.max(0.5, Math.min(2.0, speed)) });
      },

      setGlobalVolume: (volume: number) => {
        set({ globalVolume: Math.max(0, Math.min(1.0, volume)) });
      },

      setMaleVoice: (voiceName: string | null) => {
        set({ maleVoiceName: voiceName });
      },

      setFemaleVoice: (voiceName: string | null) => {
        set({ femaleVoiceName: voiceName });
      },

      setNeutralVoice: (voiceName: string | null) => {
        set({ neutralVoiceName: voiceName });
      },

      setStageDirectionVoice: (voiceName: string | null) => {
        set({ stageDirectionVoiceName: voiceName });
      },

      setStageDirectionVolume: (volume: number) => {
        set({ stageDirectionVolume: Math.max(0, Math.min(1.0, volume)) });
      },

      setStageDirectionSpeed: (speed: number) => {
        set({ stageDirectionSpeed: Math.max(0.5, Math.min(2.0, speed)) });
      },

      toggleHideUserLines: () => {
        set((state) => ({ hideUserLinesInItalian: !state.hideUserLinesInItalian }));
      },

      resetSettings: () => {
        set({
          readingMode: 'silent',
          globalSpeed: DEFAULT_SPEED,
          globalVolume: DEFAULT_VOLUME,
          maleVoiceName: null,
          femaleVoiceName: null,
          neutralVoiceName: null,
          stageDirectionVoiceName: null,
          stageDirectionVolume: 0.8,
          stageDirectionSpeed: 1.0,
          hideUserLinesInItalian: true,
        });
      },
    }),
    {
      name: 'repet-settings-storage',
    }
  )
);
```

---

### 3. UI Store (État interface)

#### Fichier : `src/state/uiStore.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { create } from 'zustand';

/**
 * Type d'erreur
 */
export type ErrorType = 'error' | 'warning' | 'info';

/**
 * Message d'erreur
 */
export interface ErrorMessage {
  /** ID unique */
  id: string;
  /** Type d'erreur */
  type: ErrorType;
  /** Message */
  message: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * État du UI Store
 */
interface UIState {
  /** Chargement global en cours */
  isLoading: boolean;
  /** Messages d'erreur */
  errors: ErrorMessage[];
  /** Modale paramètres ouverte */
  isSettingsOpen: boolean;
  /** Modale import ouverte */
  isImportOpen: boolean;
  /** Sidebar navigation ouverte */
  isSidebarOpen: boolean;

  // Actions
  /** Démarre le chargement */
  startLoading: () => void;
  /** Arrête le chargement */
  stopLoading: () => void;
  /** Ajoute une erreur */
  addError: (message: string, type?: ErrorType) => void;
  /** Supprime une erreur */
  removeError: (id: string) => void;
  /** Nettoie toutes les erreurs */
  clearErrors: () => void;
  /** Toggle modale paramètres */
  toggleSettings: () => void;
  /** Toggle modale import */
  toggleImport: () => void;
  /** Toggle sidebar */
  toggleSidebar: () => void;
  /** Ferme toutes les modales */
  closeAllModals: () => void;
}

/**
 * Store Zustand pour l'état de l'interface
 */
export const useUIStore = create<UIState>((set) => ({
  // État initial
  isLoading: false,
  errors: [],
  isSettingsOpen: false,
  isImportOpen: false,
  isSidebarOpen: false,

  // Actions
  startLoading: () => {
    set({ isLoading: true });
  },

  stopLoading: () => {
    set({ isLoading: false });
  },

  addError: (message: string, type: ErrorType = 'error') => {
    const error: ErrorMessage = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: Date.now(),
    };

    set((state) => ({
      errors: [...state.errors, error],
    }));

    // Auto-supprimer après 5 secondes
    setTimeout(() => {
      set((state) => ({
        errors: state.errors.filter((e) => e.id !== error.id),
      }));
    }, 5000);
  },

  removeError: (id: string) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    }));
  },

  clearErrors: () => {
    set({ errors: [] });
  },

  toggleSettings: () => {
    set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
  },

  toggleImport: () => {
    set((state) => ({ isImportOpen: !state.isImportOpen }));
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  closeAllModals: () => {
    set({
      isSettingsOpen: false,
      isImportOpen: false,
      isSidebarOpen: false,
    });
  },
}));
```

---

### 4. Selectors et Hooks

#### Fichier : `src/state/selectors.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { usePlayStore } from './playStore';
import { useSettingsStore } from './settingsStore';
import type { Line } from '../core/models/Line';

/**
 * Sélectionne la ligne actuelle
 * 
 * @returns Ligne actuelle ou null
 */
export function useCurrentLine(): Line | null {
  const currentPlay = usePlayStore((state) => state.currentPlay);
  const currentLineIndex = usePlayStore((state) => state.currentLineIndex);

  if (!currentPlay || currentLineIndex < 0 || currentLineIndex >= currentPlay.lines.length) {
    return null;
  }

  return currentPlay.lines[currentLineIndex];
}

/**
 * Vérifie si on peut naviguer vers la ligne suivante
 * 
 * @returns true si possible
 */
export function useCanGoNext(): boolean {
  const currentPlay = usePlayStore((state) => state.currentPlay);
  const currentLineIndex = usePlayStore((state) => state.currentLineIndex);

  return Boolean(currentPlay && currentLineIndex < currentPlay.lines.length - 1);
}

/**
 * Vérifie si on peut naviguer vers la ligne précédente
 * 
 * @returns true si possible
 */
export function useCanGoPrevious(): boolean {
  const currentLineIndex = usePlayStore((state) => state.currentLineIndex);
  return currentLineIndex > 0;
}

/**
 * Récupère les lignes de la scène actuelle
 * 
 * @returns Lignes de la scène
 */
export function useCurrentSceneLines(): Line[] {
  const currentPlay = usePlayStore((state) => state.currentPlay);
  const currentActIndex = usePlayStore((state) => state.currentActIndex);
  const currentSceneIndex = usePlayStore((state) => state.currentSceneIndex);

  if (!currentPlay) return [];

  return currentPlay.lines.filter(
    (line) => line.actIndex === currentActIndex && line.sceneIndex === currentSceneIndex
  );
}

/**
 * Vérifie si le mode audio est activé
 * 
 * @returns true si mode audio ou italien
 */
export function useIsAudioEnabled(): boolean {
  const readingMode = useSettingsStore((state) => state.readingMode);
  return readingMode === 'audio' || readingMode === 'italian';
}

/**
 * Vérifie si une ligne est celle de l'utilisateur
 * 
 * @param line - Ligne à vérifier
 * @returns true si c'est la ligne de l'utilisateur
 */
export function useIsUserLine(line: Line | null): boolean {
  const userCharacter = usePlayStore((state) => state.userCharacter);
  if (!line || !userCharacter) return false;
  return line.characterId === userCharacter.id;
}
```

---

### 5. Index des Stores

#### Fichier : `src/state/index.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

export * from './playStore';
export * from './settingsStore';
export * from './uiStore';
export * from './selectors';
```

---

## ✅ Critères de Validation

**Avant de passer au prompt suivant, valider :**

```bash
npm run type-check  # DOIT retourner 0 erreur
npm run dev         # DOIT démarrer sans erreur
```

### Tests manuels dans la console navigateur

Ouvrir la console (F12) et tester :

```javascript
import { usePlayStore, useSettingsStore, useUIStore } from './state';

// Test 1 : Play Store
const playStore = usePlayStore.getState();
console.log('Play Store initial:', playStore.currentPlay); // null

// Simuler une pièce
const mockPlay = {
  id: 'test-1',
  title: 'Test',
  author: 'Auteur',
  lines: [
    { id: 'line-1', actIndex: 0, sceneIndex: 0, characterId: 'char-1', text: 'Réplique 1' },
    { id: 'line-2', actIndex: 0, sceneIndex: 0, characterId: 'char-2', text: 'Réplique 2' },
  ],
  characters: [],
  acts: [],
  importedAt: Date.now(),
};

playStore.loadPlay(mockPlay);
console.log('Pièce chargée:', usePlayStore.getState().currentPlay.title); // "Test"

playStore.nextLine();
console.log('Index après next:', usePlayStore.getState().currentLineIndex); // 1

playStore.previousLine();
console.log('Index après previous:', usePlayStore.getState().currentLineIndex); // 0

// Test 2 : Settings Store
const settingsStore = useSettingsStore.getState();
console.log('Mode lecture initial:', settingsStore.readingMode); // "silent"

settingsStore.setReadingMode('audio');
console.log('Mode après changement:', useSettingsStore.getState().readingMode); // "audio"

settingsStore.setGlobalSpeed(1.5);
console.log('Vitesse:', useSettingsStore.getState().globalSpeed); // 1.5

settingsStore.setGlobalSpeed(5.0); // hors limites
console.log('Vitesse (clamped):', useSettingsStore.getState().globalSpeed); // 2.0 (max)

// Test 3 : UI Store
const uiStore = useUIStore.getState();
console.log('Erreurs initiales:', uiStore.errors.length); // 0

uiStore.addError('Test erreur', 'error');
console.log('Erreurs après ajout:', useUIStore.getState().errors.length); // 1
console.log('Message erreur:', useUIStore.getState().errors[0].message); // "Test erreur"

uiStore.startLoading();
console.log('Loading:', useUIStore.getState().isLoading); // true

uiStore.stopLoading();
console.log('Loading après stop:', useUIStore.getState().isLoading); // false

// Test 4 : Persistance localStorage
console.log('LocalStorage keys:', Object.keys(localStorage).filter(k => k.includes('repet')));
// Devrait voir "repet-play-storage" et "repet-settings-storage"
```

### Checklist de validation

- [ ] Fichiers créés sans erreurs TypeScript
- [ ] Aucun type `any` utilisé
- [ ] JSDoc présent sur toutes les interfaces/fonctions publiques
- [ ] Imports/exports fonctionnent correctement
- [ ] Play Store : navigation lignes fonctionne
- [ ] Play Store : goToScene fonctionne
- [ ] Settings Store : validation vitesse/volume (clamping)
- [ ] Settings Store : toggle hideUserLines fonctionne
- [ ] UI Store : gestion erreurs avec auto-suppression (5s)
- [ ] UI Store : toggle modales fonctionne
- [ ] Selectors : hooks personnalisés fonctionnent
- [ ] Persistance localStorage active (vérifier dans DevTools > Application > Local Storage)
- [ ] Pas d'erreur dans la console navigateur
- [ ] Pas de dépendances circulaires

---

## 📝 Livrables

- [ ] `src/state/playStore.ts`
- [ ] `src/state/settingsStore.ts`
- [ ] `src/state/uiStore.ts`
- [ ] `src/state/selectors.ts`
- [ ] `src/state/index.ts`
- [ ] Tests manuels passés
- [ ] Commit avec message : "feat: add state management with Zustand (Prompt 07)"

---

## 🔗 Liens utiles

- Standards : `.github/prompts/common.md`
- Architecture : `plans/PROJECT_STRUCTURE.md`
- Zustand Doc : https://docs.pmnd.rs/zustand/getting-started/introduction

---

## 📌 Notes importantes

- **Stores découplés** : Chaque store a une responsabilité unique
- **Actions synchrones** : Les stores ne doivent PAS contenir de logique async (à gérer dans les composants/hooks)
- **Persistance partielle** : Play Store ne persiste que les IDs (pas les objets complets)
- **Validation** : Clamping automatique pour speed/volume (pas d'erreur, juste correction silencieuse)
- **Auto-cleanup** : Erreurs UI supprimées automatiquement après 5s
- **Selectors** : Utiliser les selectors pour éviter re-renders inutiles
- **TypeScript strict** : Toujours typer les paramètres et retours

---

## ➡️ Prompt suivant

Après validation complète : **Prompt 08 - Composants Communs (UI Primitives)**