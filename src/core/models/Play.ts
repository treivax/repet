/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Character } from './Character'
import { Line } from './Line'
import { Annotation } from './Annotation'

/**
 * Présentation d'un personnage dans la section Cast
 */
export interface CastPresentation {
  /** Nom du personnage (en MAJUSCULES) */
  characterName: string

  /** Description du personnage */
  description: string
}

/**
 * Section Cast (Personnages/Comédiens/Rôles/Présentation)
 * Cette section n'est pas lue en mode audio/italienne
 */
export interface CastSection {
  /** Blocs de texte libre (didascalies) */
  textBlocks: string[]

  /** Présentations de personnages (format réplique mais non-jouable) */
  presentations: CastPresentation[]
}

/**
 * Métadonnées d'une pièce de théâtre
 */
export interface PlayMetadata {
  /** Titre de la pièce */
  title: string

  /** Auteur (optionnel) */
  author?: string

  /** Année (optionnel) */
  year?: string

  /** Catégorie (comédie, drame, etc.) */
  category?: string

  /** Section Cast (personnages/rôles) - optionnelle */
  castSection?: CastSection
}

/**
 * Représente une scène
 */
export interface Scene {
  /** Numéro de la scène */
  sceneNumber: number

  /** Titre de la scène (optionnel) */
  title?: string

  /** Lignes de la scène */
  lines: Line[]
}

/**
 * Représente un acte
 */
export interface Act {
  /** Numéro de l'acte */
  actNumber: number

  /** Titre de l'acte (optionnel) */
  title?: string

  /** Scènes de l'acte */
  scenes: Scene[]
}

/**
 * AST complet d'une pièce de théâtre
 */
export interface PlayAST {
  /** Métadonnées de la pièce */
  metadata: PlayMetadata

  /** Liste des personnages */
  characters: Character[]

  /** Structure hiérarchique (actes/scènes) */
  acts: Act[]

  /** Tableau aplati de toutes les lignes pour navigation rapide */
  flatLines: Line[]
}

/**
 * Représente une pièce de théâtre complète (stockage)
 */
export interface Play {
  /** Identifiant unique (UUID) */
  id: string

  /** Nom du fichier importé */
  fileName: string

  /** AST de la pièce */
  ast: PlayAST

  /** Liste des annotations utilisateur sur les répliques */
  annotations?: Annotation[]

  /** Date de création */
  createdAt: Date

  /** Date de dernière modification */
  updatedAt: Date
}
