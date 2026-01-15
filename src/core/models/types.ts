/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { CastSection } from './Play'

/** Sexe d'un personnage */
export type Gender = 'male' | 'female' | 'neutral'

/** Type de nœud de contenu dans l'AST */
export type ContentNodeType = 'act' | 'scene' | 'line' | 'didascalie'

/** Type de segment de texte */
export type TextSegmentType = 'text' | 'didascalie'

/** Mode de lecture */
export type ReadingMode = 'silent' | 'audio' | 'italian'

/** Thème de l'application */
export type Theme = 'light' | 'dark'

/** Type d'élément de lecture (playback item) */
export type PlaybackItemType = 'line' | 'stage-direction' | 'structure' | 'presentation'

/**
 * Élément de lecture (peut être une réplique, didascalie, structure ou présentation)
 * Ces éléments forment la séquence de lecture et sont présentés comme des cartes
 */
export interface PlaybackItem {
  /** Type d'élément */
  type: PlaybackItemType

  /** Index dans la séquence de lecture */
  index: number
}

/**
 * Réplique normale
 */
export interface LinePlaybackItem extends PlaybackItem {
  type: 'line'

  /** Index de la réplique dans l'AST */
  lineIndex: number

  /** Index de l'acte */
  actIndex: number

  /** Index de la scène */
  sceneIndex: number
}

/**
 * Didascalie hors réplique (carte cliquable)
 */
export interface StageDirectionPlaybackItem extends PlaybackItem {
  type: 'stage-direction'

  /** Texte de la didascalie */
  text: string

  /** Index de l'acte */
  actIndex: number

  /** Index de la scène */
  sceneIndex: number

  /** Indique si cet élément doit être lu (dépend du toggle readStageDirections) */
  shouldRead?: boolean
}

/**
 * Élément de structure (titre, acte, scène) (carte cliquable)
 */
export interface StructurePlaybackItem extends PlaybackItem {
  type: 'structure'

  /** Sous-type de structure */
  structureType: 'title' | 'act' | 'scene'

  /** Texte à lire */
  text: string

  /** Titre si présent */
  title?: string

  /** Index de l'acte (si applicable) */
  actIndex?: number

  /** Index de la scène (si applicable) */
  sceneIndex?: number

  /** Indique si cet élément doit être lu (dépend du toggle readStructure) */
  shouldRead?: boolean
}

/**
 * Section de présentation (Cast) (carte cliquable unique)
 */
export interface PresentationPlaybackItem extends PlaybackItem {
  type: 'presentation'

  /** Texte complet à lire (inclut noms + descriptions) */
  text: string

  /** Structure complète de la section Cast pour l'affichage */
  castSection: CastSection

  /** Indique si cet élément doit être lu (dépend du toggle readPresentation) */
  shouldRead?: boolean
}
