/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Character } from './Character'
import { Line } from './Line'

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

  /** Date de création */
  createdAt: Date

  /** Date de dernière modification */
  updatedAt: Date
}
