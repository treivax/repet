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
import type { TTSProviderType, VoiceGender } from '../core/tts/types'
import { ttsProviderManager } from '../core/tts/providers'

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

  /** Toggle voix off */
  toggleVoiceOff: (playId: string) => void

  /** Supprime les paramètres d'une pièce */
  deletePlaySettings: (playId: string) => void

  /** Réinitialise les paramètres d'une pièce */
  resetPlaySettings: (playId: string) => void

  /** Change le provider TTS pour une pièce */
  setTTSProvider: (playId: string, provider: TTSProviderType) => void

  /** Assigne une voix spécifique à un personnage pour un provider donné */
  setCharacterVoiceAssignment: (
    playId: string,
    provider: TTSProviderType,
    characterId: string,
    voiceId: string
  ) => void

  /** Réassigne toutes les voix pour un provider donné */
  reassignAllVoices: (playId: string, provider: TTSProviderType) => void
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
          return existing
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

      toggleVoiceOff: (playId: string) => {
        const settings = get().getPlaySettings(playId)
        get().updatePlaySettings(playId, { voiceOffEnabled: !settings.voiceOffEnabled })
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

      setTTSProvider: (playId: string, provider: TTSProviderType) => {
        get().updatePlaySettings(playId, { ttsProvider: provider })
      },

      setCharacterVoiceAssignment: (
        playId: string,
        provider: TTSProviderType,
        characterId: string,
        voiceId: string
      ) => {
        const settings = get().getPlaySettings(playId)

        // Choisir la bonne map selon le provider
        if (provider === 'piper-wasm') {
          const updatedAssignments = {
            ...settings.characterVoicesPiper,
            [characterId]: voiceId,
          }
          get().updatePlaySettings(playId, { characterVoicesPiper: updatedAssignments })
        } else {
          const updatedAssignments = {
            ...settings.characterVoicesGoogle,
            [characterId]: voiceId,
          }
          get().updatePlaySettings(playId, { characterVoicesGoogle: updatedAssignments })
        }
      },

      reassignAllVoices: (playId: string, provider: TTSProviderType) => {
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

        // Sauvegarder selon le provider
        if (provider === 'piper-wasm') {
          get().updatePlaySettings(playId, { characterVoicesPiper: newAssignments })
        } else {
          get().updatePlaySettings(playId, { characterVoicesGoogle: newAssignments })
        }
      },
    }),
    {
      name: 'repet-play-settings-storage',
    }
  )
)
