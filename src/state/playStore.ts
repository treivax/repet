/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Play } from '../core/models/Play'
import type { Character } from '../core/models/Character'
import type { Line } from '../core/models/Line'
import { getPlayLines } from '../core/models/playHelpers'

/**
 * État du Play Store
 */
interface PlayState {
  /** Pièce actuellement chargée */
  currentPlay: Play | null
  /** Personnage de l'utilisateur */
  userCharacter: Character | null
  /** Index de ligne actuelle */
  currentLineIndex: number
  /** Index d'acte actuel */
  currentActIndex: number
  /** Index de scène actuelle */
  currentSceneIndex: number

  // Actions
  /** Charge une pièce */
  loadPlay: (play: Play) => void
  /** Sélectionne le personnage de l'utilisateur */
  setUserCharacter: (character: Character | null) => void
  /** Navigue vers une ligne spécifique */
  goToLine: (lineIndex: number) => void
  /** Navigue vers la ligne suivante */
  nextLine: () => void
  /** Navigue vers la ligne précédente */
  previousLine: () => void
  /** Navigue vers un acte/scène */
  goToScene: (actIndex: number, sceneIndex: number) => void
  /** Réinitialise la lecture */
  resetReading: () => void
  /** Ferme la pièce */
  closePlay: () => void
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
        })
      },

      setUserCharacter: (character: Character | null) => {
        set({ userCharacter: character })
      },

      goToLine: (lineIndex: number) => {
        const { currentPlay } = get()
        if (!currentPlay) return

        // Valider l'index
        const lines = getPlayLines(currentPlay)
        const maxIndex = lines.length - 1
        const validIndex = Math.max(0, Math.min(lineIndex, maxIndex))

        // Trouver l'acte/scène correspondant
        const line = lines[validIndex]
        if (!line) return

        set({
          currentLineIndex: validIndex,
          currentActIndex: line.actIndex,
          currentSceneIndex: line.sceneIndex,
        })
      },

      nextLine: () => {
        const { currentPlay, currentLineIndex } = get()
        if (!currentPlay) return

        const nextIndex = currentLineIndex + 1
        const lines = getPlayLines(currentPlay)
        if (nextIndex < lines.length) {
          get().goToLine(nextIndex)
        }
      },

      previousLine: () => {
        const { currentLineIndex } = get()
        if (currentLineIndex > 0) {
          get().goToLine(currentLineIndex - 1)
        }
      },

      goToScene: (actIndex: number, sceneIndex: number) => {
        const { currentPlay } = get()
        if (!currentPlay) return

        // Trouver la première ligne de cette scène
        const lines = getPlayLines(currentPlay)
        const firstLineIndex = lines.findIndex(
          (line: Line) => line.actIndex === actIndex && line.sceneIndex === sceneIndex
        )

        if (firstLineIndex !== -1) {
          set({
            currentLineIndex: firstLineIndex,
            currentActIndex: actIndex,
            currentSceneIndex: sceneIndex,
          })
        }
      },

      resetReading: () => {
        set({
          currentLineIndex: 0,
          currentActIndex: 0,
          currentSceneIndex: 0,
        })
      },

      closePlay: () => {
        set({
          currentPlay: null,
          userCharacter: null,
          currentLineIndex: 0,
          currentActIndex: 0,
          currentSceneIndex: 0,
        })
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
)
