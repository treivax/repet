/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { usePlayStore } from './playStore'
import type { Line } from '../core/models/Line'
import { getPlayLines } from '../core/models/playHelpers'

/**
 * Sélectionne la ligne actuelle
 *
 * @returns Ligne actuelle ou null
 */
export function useCurrentLine(): Line | null {
  const currentPlay = usePlayStore((state) => state.currentPlay)
  const currentLineIndex = usePlayStore((state) => state.currentLineIndex)

  if (!currentPlay) return null

  const lines = getPlayLines(currentPlay)
  if (currentLineIndex < 0 || currentLineIndex >= lines.length) {
    return null
  }

  return lines[currentLineIndex]
}

/**
 * Vérifie si on peut naviguer vers la ligne suivante
 *
 * @returns true si possible
 */
export function useCanGoNext(): boolean {
  const currentPlay = usePlayStore((state) => state.currentPlay)
  const currentLineIndex = usePlayStore((state) => state.currentLineIndex)

  if (!currentPlay) return false

  const lines = getPlayLines(currentPlay)
  return currentLineIndex < lines.length - 1
}

/**
 * Vérifie si on peut naviguer vers la ligne précédente
 *
 * @returns true si possible
 */
export function useCanGoPrevious(): boolean {
  const currentLineIndex = usePlayStore((state) => state.currentLineIndex)
  return currentLineIndex > 0
}

/**
 * Récupère la scène actuelle
 *
 * @returns Scène actuelle ou null
 */
export function useCurrentScene() {
  const currentPlay = usePlayStore((state) => state.currentPlay)
  const currentActIndex = usePlayStore((state) => state.currentActIndex)
  const currentSceneIndex = usePlayStore((state) => state.currentSceneIndex)

  if (!currentPlay || !currentPlay.ast?.acts) return null

  const currentAct = currentPlay.ast.acts[currentActIndex]
  if (!currentAct || !currentAct.scenes) return null

  return currentAct.scenes[currentSceneIndex] || null
}

/**
 * Récupère les lignes de la scène actuelle
 *
 * @returns Lignes de la scène
 */
export function useCurrentSceneLines(): Line[] {
  const currentPlay = usePlayStore((state) => state.currentPlay)
  const currentActIndex = usePlayStore((state) => state.currentActIndex)
  const currentSceneIndex = usePlayStore((state) => state.currentSceneIndex)

  if (!currentPlay) return []

  const lines = getPlayLines(currentPlay)
  return lines.filter(
    (line: Line) => line.actIndex === currentActIndex && line.sceneIndex === currentSceneIndex
  )
}

/**
 * Vérifie si une ligne est celle de l'utilisateur
 *
 * @param line - Ligne à vérifier
 * @returns true si c'est la ligne de l'utilisateur
 */
export function useIsUserLine(line: Line | null): boolean {
  const userCharacter = usePlayStore((state) => state.userCharacter)
  if (!line || !userCharacter) return false
  return line.characterId === userCharacter.id
}
