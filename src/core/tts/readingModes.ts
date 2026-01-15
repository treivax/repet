/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { Line } from '../models/Line'

/**
 * Mode de lecture
 */
export type ReadingMode = 'silent' | 'audio' | 'italian'

/**
 * Configuration de lecture par mode
 */
export interface ReadingModeConfig {
  /** Indique si une ligne doit être lue */
  shouldRead(line: Line, userCharacterId?: string): boolean

  /** Détermine le volume de lecture (0.0 - 1.0) */
  getVolume(line: Line, userCharacterId?: string): number

  /** Indique si la ligne doit être mise en surbrillance */
  shouldHighlight(line: Line, userCharacterId?: string): boolean

  /** Indique si la ligne doit être masquée */
  shouldHide(line: Line, userCharacterId?: string, hideUserLines?: boolean): boolean
}

/**
 * Configuration pour le mode silencieux
 */
export class SilentMode implements ReadingModeConfig {
  shouldRead(): boolean {
    return false
  }

  getVolume(): number {
    return 0
  }

  shouldHighlight(): boolean {
    return false
  }

  shouldHide(): boolean {
    return false
  }
}

/**
 * Configuration pour le mode audio
 */
export class AudioMode implements ReadingModeConfig {
  constructor(private readStageDirections: boolean = true) {}

  shouldRead(line: Line): boolean {
    // Lire les dialogues toujours
    if (line.type === 'dialogue') {
      return true
    }

    // Lire les didascalies selon le réglage
    if (line.type === 'stage-direction') {
      return this.readStageDirections
    }

    return false
  }

  getVolume(): number {
    return 1.0
  }

  shouldHighlight(line: Line): boolean {
    // Mettre en surbrillance la ligne en cours de lecture
    return line.type === 'dialogue'
  }

  shouldHide(): boolean {
    return false
  }
}

/**
 * Configuration pour le mode italiennes
 */
export class ItalianMode implements ReadingModeConfig {
  constructor(
    private readStageDirections: boolean = true,
    private hideUserLinesOption: boolean = false,
    private showBefore: boolean = false,
    private showAfter: boolean = true
  ) {}

  shouldRead(line: Line, _userCharacterId?: string): boolean {
    // Les répliques utilisateur sont toujours "lues" mais à volume 0
    if (line.type === 'dialogue') {
      return true
    }

    // Lire les didascalies selon le réglage
    if (line.type === 'stage-direction') {
      return this.readStageDirections
    }

    return false
  }

  getVolume(line: Line, userCharacterId?: string): number {
    // Les répliques de l'utilisateur sont lues à volume 0
    if (line.type === 'dialogue' && userCharacterId) {
      // Cas TOUS en mode italienne
      if (line.isAllCharacters) {
        return 0
      }

      // Cas multi-personnages : vérifier si l'utilisateur est dans la liste
      if (line.characterIds && line.characterIds.length > 0) {
        if (line.characterIds.includes(userCharacterId)) {
          return 0
        }
      } else if (line.characterId === userCharacterId) {
        // Cas simple (compatibilité)
        return 0
      }
    }

    return 1.0
  }

  shouldHighlight(line: Line): boolean {
    // Mettre en surbrillance la ligne en cours de lecture
    return line.type === 'dialogue'
  }

  shouldHide(line: Line, userCharacterId?: string, hideUserLines?: boolean): boolean {
    // Ne cacher que si l'option est activée
    if (!hideUserLines && !this.hideUserLinesOption) {
      return false
    }

    // Ne cacher que les répliques de l'utilisateur
    if (line.type !== 'dialogue' || !userCharacterId) {
      return false
    }

    // Vérifier si c'est une réplique utilisateur (avec support multi-personnages)
    const isUserLineEffective = isUserLine(line, userCharacterId)
    if (!isUserLineEffective) {
      return false
    }

    // La ligne est une réplique utilisateur et l'option est activée
    // Ne pas cacher si "afficher avant" ou "afficher après" selon le contexte
    // Note: la logique exacte de before/after sera gérée par le composant UI
    // qui connaît l'état de lecture (avant, pendant, après)
    return true
  }

  /**
   * Détermine si une réplique utilisateur doit être visible selon l'état de lecture
   */
  shouldShowUserLine(readingState: 'before' | 'during' | 'after'): boolean {
    if (readingState === 'before') {
      return this.showBefore
    }
    if (readingState === 'after') {
      return this.showAfter
    }
    // Pendant la lecture, toujours visible temporairement
    return true
  }
}

/**
 * Factory pour créer la configuration de mode appropriée
 */
export function createReadingModeConfig(
  mode: ReadingMode,
  options?: {
    readStageDirections?: boolean
    readStructure?: boolean
    readPresentation?: boolean
    hideUserLines?: boolean
    showBefore?: boolean
    showAfter?: boolean
  }
): ReadingModeConfig {
  const {
    readStageDirections = true,
    readStructure: _readStructure = false,
    readPresentation: _readPresentation = false,
    hideUserLines = false,
    showBefore = false,
    showAfter = true,
  } = options || {}

  switch (mode) {
    case 'silent':
      return new SilentMode()
    case 'audio':
      return new AudioMode(readStageDirections)
    case 'italian':
      return new ItalianMode(readStageDirections, hideUserLines, showBefore, showAfter)
    default:
      return new SilentMode()
  }
}

/**
 * Détermine si une ligne doit être lue selon le mode et les options
 */
export function shouldReadLine(
  line: Line,
  mode: ReadingMode,
  userCharacterId?: string,
  readStageDirections: boolean = true
): boolean {
  const config = createReadingModeConfig(mode, { readStageDirections })
  return config.shouldRead(line, userCharacterId)
}

/**
 * Détermine le volume de lecture d'une ligne
 */
export function getLineVolume(line: Line, mode: ReadingMode, userCharacterId?: string): number {
  const config = createReadingModeConfig(mode)
  return config.getVolume(line, userCharacterId)
}

/**
 * Vérifie si une ligne est celle de l'utilisateur
 * Supporte les répliques multi-personnages et le mot-clé TOUS
 */
export function isUserLine(line: Line, userCharacterId?: string): boolean {
  if (line.type !== 'dialogue' || !userCharacterId) {
    return false
  }

  // Cas TOUS : toujours considéré comme réplique utilisateur en mode italienne
  if (line.isAllCharacters) {
    return true
  }

  // Cas multi-personnages : vérifier si l'utilisateur est dans la liste
  if (line.characterIds && line.characterIds.length > 0) {
    return line.characterIds.includes(userCharacterId)
  }

  // Cas simple (compatibilité)
  return line.characterId === userCharacterId
}
