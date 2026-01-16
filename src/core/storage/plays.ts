/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { db } from './database'
import { Play } from '../models/Play'

/**
 * Repository pour la gestion des pièces de théâtre
 */
export const playsRepository = {
  /**
   * Récupère toutes les pièces, triées par date de création décroissante
   *
   * @returns Liste des pièces
   */
  async getAll(): Promise<Play[]> {
    try {
      const plays = await db.plays.orderBy('createdAt').reverse().toArray()
      return plays
    } catch (error) {
      console.error('Erreur lors de la récupération des pièces:', error)
      throw new Error(
        `Impossible de récupérer les pièces : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Récupère une pièce par son ID
   *
   * @param id - Identifiant unique de la pièce
   * @returns La pièce ou undefined si non trouvée
   */
  async get(id: string): Promise<Play | undefined> {
    try {
      const play = await db.plays.get(id)
      return play
    } catch (error) {
      console.error(`Erreur lors de la récupération de la pièce ${id}:`, error)
      throw new Error(
        `Impossible de récupérer la pièce : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Ajoute une nouvelle pièce
   *
   * @param play - Pièce à ajouter
   * @returns ID de la pièce ajoutée
   */
  async add(play: Play): Promise<string> {
    try {
      const now = new Date()
      const playWithDates: Play = {
        ...play,
        createdAt: now,
        updatedAt: now,
      }

      await db.plays.add(playWithDates)
      return play.id
    } catch (error) {
      console.error("Erreur lors de l'ajout de la pièce:", error)
      throw new Error(
        `Impossible d'ajouter la pièce : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Met à jour une pièce existante
   *
   * @param id - ID de la pièce à mettre à jour
   * @param changes - Modifications à appliquer
   * @returns Nombre de lignes modifiées (1 si succès, 0 si non trouvée)
   */
  async update(id: string, changes: Partial<Play>): Promise<number> {
    try {
      const existing = await db.plays.get(id)

      if (!existing) {
        return 0
      }

      const updated: Play = {
        ...existing,
        ...changes,
        updatedAt: new Date(),
      }

      await db.plays.put(updated)
      return 1
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la pièce ${id}:`, error)
      throw new Error(
        `Impossible de mettre à jour la pièce : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Supprime une pièce
   *
   * @param id - ID de la pièce à supprimer
   */
  async delete(id: string): Promise<void> {
    try {
      await db.plays.delete(id)
    } catch (error) {
      console.error(`Erreur lors de la suppression de la pièce ${id}:`, error)
      throw new Error(
        `Impossible de supprimer la pièce : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Supprime toutes les pièces (utilisé pour les tests ou réinitialisation)
   */
  async deleteAll(): Promise<void> {
    try {
      await db.plays.clear()
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les pièces:', error)
      throw new Error(
        `Impossible de supprimer toutes les pièces : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Compte le nombre total de pièces
   *
   * @returns Nombre de pièces
   */
  async count(): Promise<number> {
    try {
      return await db.plays.count()
    } catch (error) {
      console.error('Erreur lors du comptage des pièces:', error)
      throw new Error(
        `Impossible de compter les pièces : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Ajoute une annotation à une pièce
   *
   * @param playId - ID de la pièce
   * @param annotation - Annotation à ajouter
   */
  async addAnnotation(
    playId: string,
    annotation: import('../models/Annotation').Annotation
  ): Promise<void> {
    try {
      const play = await db.plays.get(playId)

      if (!play) {
        throw new Error(`Pièce ${playId} non trouvée`)
      }

      const annotations = play.annotations ?? []
      annotations.push(annotation)

      await db.plays.update(playId, {
        annotations,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error(`Erreur lors de l'ajout de l'annotation:`, error)
      throw new Error(
        `Impossible d'ajouter l'annotation : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Met à jour une annotation
   *
   * @param playId - ID de la pièce
   * @param annotationId - ID de l'annotation à mettre à jour
   * @param updates - Modifications à appliquer
   */
  async updateAnnotation(
    playId: string,
    annotationId: string,
    updates: Partial<import('../models/Annotation').Annotation>
  ): Promise<void> {
    try {
      const play = await db.plays.get(playId)

      if (!play) {
        throw new Error(`Pièce ${playId} non trouvée`)
      }

      const annotations = play.annotations ?? []
      const index = annotations.findIndex((a) => a.id === annotationId)

      if (index === -1) {
        throw new Error(`Annotation ${annotationId} non trouvée`)
      }

      annotations[index] = {
        ...annotations[index],
        ...updates,
        updatedAt: new Date(),
      }

      await db.plays.update(playId, {
        annotations,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'annotation:`, error)
      throw new Error(
        `Impossible de mettre à jour l'annotation : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Supprime une annotation
   *
   * @param playId - ID de la pièce
   * @param annotationId - ID de l'annotation à supprimer
   */
  async deleteAnnotation(playId: string, annotationId: string): Promise<void> {
    try {
      const play = await db.plays.get(playId)

      if (!play) {
        throw new Error(`Pièce ${playId} non trouvée`)
      }

      const annotations = (play.annotations ?? []).filter((a) => a.id !== annotationId)

      await db.plays.update(playId, {
        annotations,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'annotation:`, error)
      throw new Error(
        `Impossible de supprimer l'annotation : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Remplace toutes les annotations d'une pièce
   * Utilisé pour le toggle global
   *
   * @param playId - ID de la pièce
   * @param annotations - Nouvelles annotations
   */
  async updateAllAnnotations(
    playId: string,
    annotations: import('../models/Annotation').Annotation[]
  ): Promise<void> {
    try {
      const play = await db.plays.get(playId)

      if (!play) {
        throw new Error(`Pièce ${playId} non trouvée`)
      }

      await db.plays.update(playId, {
        annotations,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des annotations:`, error)
      throw new Error(
        `Impossible de mettre à jour les annotations : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },
}
