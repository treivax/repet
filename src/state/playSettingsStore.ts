/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlaySettings } from '../core/models/Settings'
import { createDefaultPlaySettings } from '../core/models/Settings'
import type { ReadingMode } from '../core/tts/readingModes'
import type { Gender } from '../core/models/types'
import type { VoiceGender } from '../core/tts/types'
import { ttsProviderManager } from '../core/tts/providers'
import { migrateAllPlaySettings, migratePlaySettingsVoices } from '../utils/voiceMigration'

/**
 * État du PlaySettings Store
 */
interface PlaySettingsState {
  /** Paramètres par pièce (playId -> PlaySettings) */
  playSettings: Record<string, PlaySettings>

  // Actions
  /** Récupère les paramètres d'une pièce (ou crée les paramètres par défaut) */
  getPlaySettings: (playId: string) => PlaySettings

  /** Met à jour les paramètres d'une pièce */
  updatePlaySettings: (playId: string, updates: Partial<PlaySettings>) => void

  /** Change le mode de lecture d'une pièce */
  setReadingMode: (playId: string, mode: ReadingMode) => void

  /** Définit le personnage de l'utilisateur */
  setUserCharacter: (playId: string, characterId: string | undefined) => void

  /** Change le sexe assigné à un personnage */
  setCharacterGender: (playId: string, characterId: string, gender: Gender) => void

  /** Toggle cacher répliques utilisateur */
  toggleHideUserLines: (playId: string) => void

  /** Toggle afficher avant */
  toggleShowBefore: (playId: string) => void

  /** Toggle afficher après */
  toggleShowAfter: (playId: string) => void

  /** Change la vitesse utilisateur */
  setUserSpeed: (playId: string, speed: number) => void

  /** Change la vitesse par défaut */
  setDefaultSpeed: (playId: string, speed: number) => void

  /** Toggle lire les didascalies */
  toggleReadStageDirections: (playId: string) => void

  /** Toggle lire la structure (titres, actes, scènes) */
  toggleReadStructure: (playId: string) => void

  /** Toggle lire la section de présentation (Cast) */
  toggleReadPresentation: (playId: string) => void

  /** Supprime les paramètres d'une pièce */
  deletePlaySettings: (playId: string) => void

  /** Réinitialise les paramètres d'une pièce */
  resetPlaySettings: (playId: string) => void

  /** Assigne une voix spécifique à un personnage */
  setCharacterVoiceAssignment: (playId: string, characterId: string, voiceId: string) => void

  /** Réassigne toutes les voix */
  reassignAllVoices: (playId: string) => void
}

/**
 * Store Zustand pour les paramètres spécifiques aux pièces
 */
export const usePlaySettingsStore = create<PlaySettingsState>()(
  persist(
    (set, get) => ({
      // État initial
      playSettings: {},

      // Actions
      getPlaySettings: (playId: string) => {
        const existing = get().playSettings[playId]
        if (existing) {
          // Appliquer les migrations de voix si nécessaire
          let migrated = migratePlaySettingsVoices(existing)

          // Migration 1: voiceOffEnabled (boolean) → voiceOffMode (intermediate)
          let migratedAny = migrated as unknown as Record<string, unknown>
          if (migratedAny.voiceOffEnabled !== undefined && !migratedAny.voiceOffMode) {
            const enabled = migratedAny.voiceOffEnabled as boolean
            migratedAny.voiceOffMode = enabled ? 'stage-directions' : 'nothing'
            delete migratedAny.voiceOffEnabled
            migrated = migratedAny as unknown as PlaySettings
            console.warn(
              `[PlaySettings] 🔄 Migration voiceOffEnabled → voiceOffMode pour ${playId}: ${enabled} → ${migratedAny.voiceOffMode}`
            )
          }

          // Migration 2: voiceOffMode (VoiceOffMode) → trois booléens distincts
          migratedAny = migrated as unknown as Record<string, unknown>
          if (
            migratedAny.voiceOffMode !== undefined &&
            migrated.readStageDirections === undefined
          ) {
            const mode = migratedAny.voiceOffMode as string
            migrated = {
              ...migrated,
              readStageDirections: mode === 'stage-directions' || mode === 'everything',
              readStructure: mode === 'everything',
              readPresentation: mode === 'everything',
            }
            delete (migrated as unknown as Record<string, unknown>).voiceOffMode
            console.warn(
              `[PlaySettings] 🔄 Migration voiceOffMode → trois booléens pour ${playId}: ${mode} → {stage:${migrated.readStageDirections}, struct:${migrated.readStructure}, pres:${migrated.readPresentation}}`
            )
          }

          // Si des migrations ont eu lieu, sauvegarder les changements
          if (migrated !== existing) {
            set((state) => ({
              playSettings: {
                ...state.playSettings,
                [playId]: migrated,
              },
            }))
          }

          return migrated
        }

        // Créer paramètres par défaut
        const defaultSettings = createDefaultPlaySettings(playId)
        set((state) => ({
          playSettings: {
            ...state.playSettings,
            [playId]: defaultSettings,
          },
        }))

        return defaultSettings
      },

      updatePlaySettings: (playId: string, updates: Partial<PlaySettings>) => {
        set((state) => {
          const current = state.playSettings[playId] || createDefaultPlaySettings(playId)

          return {
            playSettings: {
              ...state.playSettings,
              [playId]: {
                ...current,
                ...updates,
              },
            },
          }
        })
      },

      setReadingMode: (playId: string, mode: ReadingMode) => {
        get().updatePlaySettings(playId, { readingMode: mode })
      },

      setUserCharacter: (playId: string, characterId: string | undefined) => {
        get().updatePlaySettings(playId, { userCharacterId: characterId })
      },

      setCharacterGender: (playId: string, characterId: string, gender: Gender) => {
        const settings = get().getPlaySettings(playId)
        const updatedVoices = {
          ...settings.characterVoices,
          [characterId]: gender,
        }
        get().updatePlaySettings(playId, { characterVoices: updatedVoices })
      },

      toggleHideUserLines: (playId: string) => {
        const settings = get().getPlaySettings(playId)
        get().updatePlaySettings(playId, { hideUserLines: !settings.hideUserLines })
      },

      toggleShowBefore: (playId: string) => {
        const settings = get().getPlaySettings(playId)
        get().updatePlaySettings(playId, { showBefore: !settings.showBefore })
      },

      toggleShowAfter: (playId: string) => {
        const settings = get().getPlaySettings(playId)
        get().updatePlaySettings(playId, { showAfter: !settings.showAfter })
      },

      setUserSpeed: (playId: string, speed: number) => {
        const clamped = Math.max(0.5, Math.min(2.0, speed))
        get().updatePlaySettings(playId, { userSpeed: clamped })
      },

      setDefaultSpeed: (playId: string, speed: number) => {
        const clamped = Math.max(0.5, Math.min(2.0, speed))
        get().updatePlaySettings(playId, { defaultSpeed: clamped })
      },

      toggleReadStageDirections: (playId: string) => {
        const settings = get().getPlaySettings(playId)
        get().updatePlaySettings(playId, { readStageDirections: !settings.readStageDirections })
      },

      toggleReadStructure: (playId: string) => {
        const settings = get().getPlaySettings(playId)
        get().updatePlaySettings(playId, { readStructure: !settings.readStructure })
      },

      toggleReadPresentation: (playId: string) => {
        const settings = get().getPlaySettings(playId)
        get().updatePlaySettings(playId, { readPresentation: !settings.readPresentation })
      },

      deletePlaySettings: (playId: string) => {
        set((state) => {
          const { [playId]: _, ...remainingSettings } = state.playSettings
          return { playSettings: remainingSettings }
        })
      },

      resetPlaySettings: (playId: string) => {
        const defaultSettings = createDefaultPlaySettings(playId)
        set((state) => ({
          playSettings: {
            ...state.playSettings,
            [playId]: defaultSettings,
          },
        }))
      },

      setCharacterVoiceAssignment: (playId: string, characterId: string, voiceId: string) => {
        const settings = get().getPlaySettings(playId)

        // Récupérer l'ancienne voix assignée pour la supprimer du cache
        const oldVoiceId = settings.characterVoicesPiper[characterId]

        // Vider le cache de l'ancienne voix si elle existe et est différente
        if (oldVoiceId && oldVoiceId !== voiceId) {
          // Import dynamique pour éviter les dépendances circulaires
          import('../core/tts/providers/PiperWASMProvider')
            .then(({ piperWASMProvider }) => {
              piperWASMProvider.clearCacheForVoice(oldVoiceId).then((deletedCount) => {
                if (deletedCount > 0) {
                  console.warn(
                    `[PlaySettings] 🗑️ Cache vidé pour l'ancienne voix ${oldVoiceId} (${deletedCount} entrées)`
                  )
                }
              })
            })
            .catch((err) => {
              console.error('[PlaySettings] Erreur lors du vidage du cache:', err)
            })
        }

        // Mettre à jour les assignations
        const updatedAssignments = {
          ...settings.characterVoicesPiper,
          [characterId]: voiceId,
        }
        get().updatePlaySettings(playId, { characterVoicesPiper: updatedAssignments })
      },

      reassignAllVoices: (playId: string) => {
        const settings = get().getPlaySettings(playId)

        // Récupérer les personnages avec leurs genres
        const characters: Array<{ id: string; gender: VoiceGender }> = Object.entries(
          settings.characterVoices
        ).map(([id, gender]) => ({
          id,
          gender: gender as VoiceGender,
        }))

        // Générer nouvelles assignations via le provider
        const providerInstance = ttsProviderManager.getActiveProvider()
        if (!providerInstance) {
          console.warn('[PlaySettingsStore] Aucun provider actif pour réassigner les voix')
          return
        }

        const newAssignments = providerInstance.generateVoiceAssignments(characters, {})

        // Sauvegarder les assignations
        get().updatePlaySettings(playId, { characterVoicesPiper: newAssignments })
      },
    }),
    {
      name: 'repet-play-settings-storage',
      // Middleware pour migrer automatiquement les voix lors de l'hydratation
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[PlaySettingsStore] Erreur lors de la réhydratation:', error)
            return
          }

          if (state) {
            // Migrer toutes les assignations de voix obsolètes
            const migratedSettings = migrateAllPlaySettings(state.playSettings)

            // Mettre à jour l'état si des migrations ont eu lieu
            if (migratedSettings !== state.playSettings) {
              state.playSettings = migratedSettings
              console.warn('[PlaySettingsStore] ✅ Migrations de voix appliquées au chargement')
            }
          }
        }
      },
    }
  )
)
