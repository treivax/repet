/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Représente une ligne de dialogue ou didascalie dans une pièce
 * Version aplatie pour faciliter la navigation séquentielle
 */
export interface Line {
  /** Identifiant unique de la ligne */
  id: string

  /** Type de ligne */
  type: 'dialogue' | 'stage-direction'

  /** Index de l'acte (0-based) */
  actIndex: number

  /** Index de la scène dans l'acte (0-based) */
  sceneIndex: number

  /** ID du personnage (undefined pour didascalies) - conservé pour compatibilité */
  characterId?: string

  /** Liste des IDs de personnages pour répliques multi-personnages */
  characterIds?: string[]

  /** Indique si la réplique utilise le mot-clé TOUS (tous les personnages) */
  isAllCharacters?: boolean

  /** Texte de la ligne */
  text: string

  /** Est une didascalie */
  isStageDirection: boolean
}
