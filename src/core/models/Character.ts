/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Gender } from './types'

/**
 * Représente un personnage de la pièce
 */
export interface Character {
  /** Identifiant unique du personnage */
  id: string

  /** Nom du personnage (en majuscules dans le texte) */
  name: string

  /** Sexe du personnage (pour sélection de voix) */
  gender: Gender

  /** URI de la voix système sélectionnée (optionnel) */
  voiceURI?: string

  /** Couleur associée au personnage (hex) */
  color: string
}

/**
 * Crée un nouveau personnage avec valeurs par défaut
 *
 * @param name - Nom du personnage
 * @param id - Identifiant unique (optionnel, généré automatiquement si non fourni)
 * @returns Character object
 */
export function createCharacter(name: string, id?: string): Character {
  return {
    id: id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    gender: 'neutral',
    color: '#666666', // Sera généré automatiquement
  }
}
