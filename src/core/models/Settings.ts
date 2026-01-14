/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Theme, Gender } from './types'
import type { ReadingMode } from '../tts/readingModes'

/**
 * Paramètres globaux de l'application
 */
export interface Settings {
  /** Identifiant (toujours 'global') */
  id: string

  /** Thème de l'interface */
  theme: Theme

  /** Voix off activée (lecture des didascalies) */
  voiceOff: boolean

  /** Vitesse de lecture (0.5 - 2.0) */
  readingSpeed: number

  /** Vitesse de lecture utilisateur en italiennes (0.5 - 2.0) */
  userSpeed: number

  /** Cacher les répliques de l'utilisateur */
  hideUserLines: boolean

  /** Afficher les répliques avant lecture */
  showBefore: boolean

  /** Afficher les répliques après lecture */
  showAfter: boolean
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
}

/**
 * Paramètres spécifiques à une pièce
 */
export interface PlaySettings {
  /** ID de la pièce */
  playId: string

  /** Mode de lecture */
  readingMode: ReadingMode

  /** ID du personnage de l'utilisateur (pour italiennes) */
  userCharacterId?: string

  /** Cacher les répliques de l'utilisateur */
  hideUserLines: boolean

  /** Afficher les répliques avant lecture */
  showBefore: boolean

  /** Afficher les répliques après lecture */
  showAfter: boolean

  /** Vitesse de lecture utilisateur (italiennes) */
  userSpeed: number

  /** Voix off activée */
  voiceOffEnabled: boolean

  /** Vitesse de lecture par défaut */
  defaultSpeed: number

  /** Assignation des voix par personnage (characterId -> gender) */
  characterVoices: Record<string, Gender>

  /** Assignations de voix pour Piper (characterId -> voiceId) */
  characterVoicesPiper: Record<string, string>

  /** Thème (override du thème global si défini) */
  theme?: Theme
}

/**
 * Crée des paramètres par défaut pour une pièce
 */
export function createDefaultPlaySettings(playId: string): PlaySettings {
  return {
    playId,
    readingMode: 'silent',
    userCharacterId: undefined,
    hideUserLines: false,
    showBefore: false,
    showAfter: true,
    userSpeed: 1.0,
    voiceOffEnabled: true,
    defaultSpeed: 1.0,
    characterVoices: {},
    characterVoicesPiper: {},
    theme: undefined,
  }
}
