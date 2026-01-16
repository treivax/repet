/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Représente une annotation utilisateur sur n'importe quel élément de lecture
 * (réplique, didascalie, structure, présentation)
 */
export interface Annotation {
  /** Identifiant unique de l'annotation (UUID) */
  id: string

  /** Référence vers l'index du PlaybackItem annoté dans la séquence de lecture */
  playbackItemIndex: number

  /** Contenu textuel de l'annotation */
  content: string

  /** État d'affichage (étendu/minimisé) */
  isExpanded: boolean

  /** Date de création de l'annotation */
  createdAt: Date

  /** Date de dernière modification */
  updatedAt: Date
}
