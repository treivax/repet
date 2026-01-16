/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import Dexie, { Table } from 'dexie'
import { Play } from '../models/Play'
import { Settings, DEFAULT_SETTINGS } from '../models/Settings'

/**
 * Base de données IndexedDB pour Répét
 */
export class RepetDatabase extends Dexie {
  /** Table des pièces de théâtre */
  plays!: Table<Play, string>

  /** Table des paramètres */
  settings!: Table<Settings, string>

  constructor() {
    super('RepetDB')

    // Version 1 du schéma
    this.version(1).stores({
      plays: 'id, title, createdAt, updatedAt',
      settings: 'id',
    })

    // Version 2 : Ajout du support des annotations
    this.version(2)
      .stores({
        plays: 'id, title, createdAt, updatedAt',
        settings: 'id',
      })
      .upgrade((trans) => {
        // Migration : Initialiser le champ annotations pour les pièces existantes
        return trans
          .table('plays')
          .toCollection()
          .modify((play) => {
            if (!play.annotations) {
              play.annotations = []
            }
          })
      })
  }
}

/**
 * Instance singleton de la base de données
 */
export const db = new RepetDatabase()

/**
 * Initialise la base de données (paramètres par défaut)
 * À appeler au démarrage de l'application
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Vérifier si les paramètres existent
    const existingSettings = await db.settings.get('global')

    if (!existingSettings) {
      // Créer les paramètres par défaut
      await db.settings.add(DEFAULT_SETTINGS)
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error)
    throw new Error(
      `Impossible d'initialiser la base de données : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}
