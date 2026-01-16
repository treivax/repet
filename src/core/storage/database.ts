/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import Dexie, { Table } from 'dexie'
import { Play } from '../models/Play'
import { Settings, DEFAULT_SETTINGS } from '../models/Settings'
import { buildPlaybackSequence } from '../../utils/playbackSequence'
import type { LinePlaybackItem } from '../models/types'

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

    // Version 3 : Migration des annotations de lineId vers playbackItemIndex
    this.version(3)
      .stores({
        plays: 'id, title, createdAt, updatedAt',
        settings: 'id',
      })
      .upgrade((trans) => {
        // Migration : Convertir lineId en playbackItemIndex pour chaque annotation
        return trans
          .table('plays')
          .toCollection()
          .modify((play) => {
            if (!play.annotations || play.annotations.length === 0) {
              return
            }

            try {
              // Construire la séquence de playback pour cette pièce
              const playbackSequence = buildPlaybackSequence(play.ast, {
                includeStageDirections: true,
                includeStructure: true,
                includePresentation: true,
              })

              // Créer un map de lineId vers playbackItemIndex
              const lineIdToIndex = new Map<string, number>()

              playbackSequence.forEach((item) => {
                if (item.type === 'line') {
                  const lineItem = item as LinePlaybackItem
                  const line = play.ast.lines?.[lineItem.lineIndex]
                  if (line) {
                    lineIdToIndex.set(line.id, item.index)
                  }
                }
              })

              // Migrer chaque annotation
              play.annotations = play.annotations
                .map((annotation: Record<string, unknown>) => {
                  // Si l'annotation a déjà un playbackItemIndex, la garder telle quelle
                  if (annotation.playbackItemIndex !== undefined) {
                    return annotation
                  }

                  // Sinon, convertir lineId en playbackItemIndex
                  if (annotation.lineId) {
                    const playbackItemIndex = lineIdToIndex.get(annotation.lineId as string)
                    if (playbackItemIndex !== undefined) {
                      // Créer nouvelle annotation avec playbackItemIndex
                      const { lineId: _lineId, ...rest } = annotation
                      return {
                        ...rest,
                        playbackItemIndex,
                      }
                    } else {
                      // Si on ne trouve pas le lineId, supprimer l'annotation
                      console.warn(`Annotation orpheline détectée (lineId: ${annotation.lineId})`)
                      return null
                    }
                  }

                  // Annotation invalide
                  return null
                })
                .filter((a: Record<string, unknown> | null) => a !== null)
            } catch (error) {
              console.error('Erreur lors de la migration des annotations:', error)
              // En cas d'erreur, vider les annotations pour éviter les corruptions
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
