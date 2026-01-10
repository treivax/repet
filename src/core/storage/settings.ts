/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { db } from './database'
import { Settings, DEFAULT_SETTINGS } from '../models/Settings'

/**
 * Repository pour la gestion des paramètres de l'application
 */
export const settingsRepository = {
  /**
   * Récupère les paramètres de l'application
   * Crée les paramètres par défaut s'ils n'existent pas
   *
   * @returns Paramètres de l'application
   */
  async get(): Promise<Settings> {
    try {
      let settings = await db.settings.get('global')

      if (!settings) {
        // Créer les paramètres par défaut
        await db.settings.add(DEFAULT_SETTINGS)
        settings = DEFAULT_SETTINGS
      }

      return settings
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error)
      throw new Error(
        `Impossible de récupérer les paramètres : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Met à jour les paramètres de l'application
   *
   * @param changes - Modifications à appliquer
   * @returns Paramètres mis à jour
   */
  async update(changes: Partial<Settings>): Promise<Settings> {
    try {
      await db.settings.update('global', changes)
      const updated = await db.settings.get('global')

      if (!updated) {
        throw new Error('Paramètres introuvables après mise à jour')
      }

      return updated
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error)
      throw new Error(
        `Impossible de mettre à jour les paramètres : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },

  /**
   * Réinitialise les paramètres aux valeurs par défaut
   *
   * @returns Paramètres réinitialisés
   */
  async reset(): Promise<Settings> {
    try {
      await db.settings.put(DEFAULT_SETTINGS)
      return DEFAULT_SETTINGS
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des paramètres:', error)
      throw new Error(
        `Impossible de réinitialiser les paramètres : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    }
  },
}
