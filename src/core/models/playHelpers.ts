/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { Play } from './Play'

/**
 * Helpers pour accéder aux propriétés de Play via l'AST
 * Permet la compatibilité avec le code existant
 */

export function getPlayTitle(play: Play): string {
  return play.ast.metadata.title
}

export function getPlayAuthor(play: Play): string | undefined {
  return play.ast.metadata.author
}

export function getPlayYear(play: Play): string | undefined {
  return play.ast.metadata.year
}

export function getPlayCategory(play: Play): string | undefined {
  return play.ast.metadata.category
}

export function getPlayCharacters(play: Play) {
  return play.ast.characters
}

export function getPlayLines(play: Play) {
  return play.ast.flatLines
}

export function getPlayActs(play: Play) {
  return play.ast.acts
}

export function getPlayMetadata(play: Play) {
  return play.ast.metadata
}

/**
 * Convertit un index de ligne global en position (acte, scène, ligne)
 * @param acts Les actes de la pièce
 * @param globalLineIndex L'index global de la ligne
 * @returns La position {actIndex, sceneIndex, lineIndex} ou null si non trouvé
 */
export function globalLineIndexToPosition(
  acts: Play['ast']['acts'],
  globalLineIndex: number
): { actIndex: number; sceneIndex: number; lineIndex: number } | null {
  let currentGlobalIndex = 0

  for (let actIndex = 0; actIndex < acts.length; actIndex++) {
    const act = acts[actIndex]
    for (let sceneIndex = 0; sceneIndex < act.scenes.length; sceneIndex++) {
      const scene = act.scenes[sceneIndex]
      for (let lineIndex = 0; lineIndex < scene.lines.length; lineIndex++) {
        if (currentGlobalIndex === globalLineIndex) {
          return { actIndex, sceneIndex, lineIndex }
        }
        currentGlobalIndex++
      }
    }
  }

  return null
}
