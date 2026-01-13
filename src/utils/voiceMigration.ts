/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Utilitaire de migration pour les assignations de voix
 *
 * Ce module permet de migrer automatiquement les assignations de voix
 * lorsqu'une voix est retirée ou remplacée.
 */

import type { PlaySettings } from '../core/models/Settings'

/**
 * Mapping des voix obsolètes vers leurs remplacements
 */
const VOICE_MIGRATIONS: Record<string, string> = {
  // Gilles (fr_FR-gilles-low) → Tom (fr_FR-tom-medium)
  // Raison: Erreurs ONNX Runtime (Gather node index out of bounds)
  'fr_FR-gilles-low': 'fr_FR-tom-medium',

  // MLS (fr_FR-mls-medium) → Tom (fr_FR-tom-medium)
  // Raison: Audio distordu/inintelligible sur certaines lignes
  'fr_FR-mls-medium': 'fr_FR-tom-medium',
}

/**
 * Migre une assignation de voix Piper vers une voix de remplacement si nécessaire
 *
 * @param voiceId - ID de la voix à vérifier
 * @returns ID de la voix (original ou migrée)
 */
export function migrateVoiceId(voiceId: string): string {
  const replacement = VOICE_MIGRATIONS[voiceId]
  if (replacement) {
    console.warn(
      `[VoiceMigration] 🔄 Migration de voix: ${voiceId} → ${replacement}`
    )
    return replacement
  }
  return voiceId
}

/**
 * Migre toutes les assignations de voix Piper dans les paramètres d'une pièce
 *
 * @param settings - Paramètres de la pièce à migrer
 * @returns Paramètres mis à jour (nouvelle référence si changements, sinon original)
 */
export function migratePlaySettingsVoices(settings: PlaySettings): PlaySettings {
  let hasChanges = false
  const migratedPiperVoices: Record<string, string> = {}

  // Migrer les assignations Piper
  for (const [characterId, voiceId] of Object.entries(settings.characterVoicesPiper)) {
    const migratedVoiceId = migrateVoiceId(voiceId)
    migratedPiperVoices[characterId] = migratedVoiceId

    if (migratedVoiceId !== voiceId) {
      hasChanges = true
      console.warn(
        `[VoiceMigration] ⚙️  Personnage "${characterId}": ${voiceId} → ${migratedVoiceId}`
      )
    }
  }

  // Retourner les paramètres mis à jour seulement si changements
  if (hasChanges) {
    return {
      ...settings,
      characterVoicesPiper: migratedPiperVoices,
    }
  }

  return settings
}

/**
 * Migre toutes les assignations de voix pour tous les paramètres de pièces
 *
 * @param allPlaySettings - Record de tous les paramètres (playId → PlaySettings)
 * @returns Record mis à jour avec migrations appliquées
 */
export function migrateAllPlaySettings(
  allPlaySettings: Record<string, PlaySettings>
): Record<string, PlaySettings> {
  const migrated: Record<string, PlaySettings> = {}
  let totalMigrations = 0

  for (const [playId, settings] of Object.entries(allPlaySettings)) {
    const migratedSettings = migratePlaySettingsVoices(settings)
    migrated[playId] = migratedSettings

    if (migratedSettings !== settings) {
      totalMigrations++
    }
  }

  if (totalMigrations > 0) {
    console.warn(
      `[VoiceMigration] ✅ Migration terminée: ${totalMigrations} pièce(s) mise(s) à jour`
    )
  }

  return migrated
}

/**
 * Vérifie si une voix a été retirée/obsolète
 *
 * @param voiceId - ID de la voix à vérifier
 * @returns true si la voix est obsolète et doit être migrée
 */
export function isObsoleteVoice(voiceId: string): boolean {
  return voiceId in VOICE_MIGRATIONS
}

/**
 * Obtient la voix de remplacement pour une voix obsolète
 *
 * @param voiceId - ID de la voix obsolète
 * @returns ID de la voix de remplacement, ou undefined si pas obsolète
 */
export function getReplacementVoice(voiceId: string): string | undefined {
  return VOICE_MIGRATIONS[voiceId]
}
