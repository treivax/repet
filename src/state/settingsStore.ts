/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReadingMode } from '../core/models/types'
import { DEFAULT_SPEED, DEFAULT_VOLUME } from '../utils/constants'

/**
 * État du Settings Store
 */
interface SettingsState {
  /** Mode de lecture (silent, audio, italian) */
  readingMode: ReadingMode
  /** Vitesse de lecture globale */
  globalSpeed: number
  /** Volume global */
  globalVolume: number
  /** Vitesse actuelle (alias pour globalSpeed) */
  speed: number
  /** Volume actuel (alias pour globalVolume) */
  volume: number
  /** Voix sélectionnée actuellement */
  selectedVoice: string | null
  /** Lecture automatique ligne suivante */
  autoPlay: boolean
  /** Surligner les lignes de l'utilisateur */
  highlightUserLines: boolean
  /** Voix masculine sélectionnée */
  maleVoiceName: string | null
  /** Voix féminine sélectionnée */
  femaleVoiceName: string | null
  /** Voix neutre sélectionnée */
  neutralVoiceName: string | null
  /** Voix pour didascalies */
  stageDirectionVoiceName: string | null
  /** Volume spécifique didascalies */
  stageDirectionVolume: number
  /** Vitesse spécifique didascalies */
  stageDirectionSpeed: number
  /** Masquer les répliques utilisateur en mode italien */
  hideUserLinesInItalian: boolean

  // Actions
  /** Change le mode de lecture */
  setReadingMode: (mode: ReadingMode) => void
  /** Change la vitesse globale */
  setGlobalSpeed: (speed: number) => void
  /** Change le volume global */
  setGlobalVolume: (volume: number) => void
  /** Change la vitesse actuelle */
  setSpeed: (speed: number) => void
  /** Change le volume actuel */
  setVolume: (volume: number) => void
  /** Change la voix sélectionnée */
  setSelectedVoice: (voiceName: string | null) => void
  /** Toggle autoPlay */
  setAutoPlay: (enabled: boolean) => void
  /** Toggle highlight user lines */
  setHighlightUserLines: (enabled: boolean) => void
  /** Change la voix masculine */
  setMaleVoice: (voiceName: string | null) => void
  /** Change la voix féminine */
  setFemaleVoice: (voiceName: string | null) => void
  /** Change la voix neutre */
  setNeutralVoice: (voiceName: string | null) => void
  /** Change la voix didascalies */
  setStageDirectionVoice: (voiceName: string | null) => void
  /** Change le volume didascalies */
  setStageDirectionVolume: (volume: number) => void
  /** Change la vitesse didascalies */
  setStageDirectionSpeed: (speed: number) => void
  /** Toggle masquage répliques utilisateur */
  toggleHideUserLines: () => void
  /** Réinitialise tous les paramètres */
  resetSettings: () => void
}

/**
 * Store Zustand pour les paramètres TTS
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // État initial
      readingMode: 'silent',
      globalSpeed: DEFAULT_SPEED,
      globalVolume: DEFAULT_VOLUME,
      speed: DEFAULT_SPEED,
      volume: DEFAULT_VOLUME,
      selectedVoice: null,
      autoPlay: false,
      highlightUserLines: true,
      maleVoiceName: null,
      femaleVoiceName: null,
      neutralVoiceName: null,
      stageDirectionVoiceName: null,
      stageDirectionVolume: 0.8,
      stageDirectionSpeed: 1.0,
      hideUserLinesInItalian: true,

      // Actions
      setReadingMode: (mode: ReadingMode) => {
        set({ readingMode: mode })
      },

      setGlobalSpeed: (speed: number) => {
        const clamped = Math.max(0.5, Math.min(2.0, speed))
        set({ globalSpeed: clamped, speed: clamped })
      },

      setGlobalVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1.0, volume))
        set({ globalVolume: clamped, volume: clamped })
      },

      setSpeed: (speed: number) => {
        const clamped = Math.max(0.5, Math.min(2.0, speed))
        set({ speed: clamped, globalSpeed: clamped })
      },

      setVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1.0, volume))
        set({ volume: clamped, globalVolume: clamped })
      },

      setSelectedVoice: (voiceName: string | null) => {
        set({ selectedVoice: voiceName })
      },

      setAutoPlay: (enabled: boolean) => {
        set({ autoPlay: enabled })
      },

      setHighlightUserLines: (enabled: boolean) => {
        set({ highlightUserLines: enabled })
      },

      setMaleVoice: (voiceName: string | null) => {
        set({ maleVoiceName: voiceName })
      },

      setFemaleVoice: (voiceName: string | null) => {
        set({ femaleVoiceName: voiceName })
      },

      setNeutralVoice: (voiceName: string | null) => {
        set({ neutralVoiceName: voiceName })
      },

      setStageDirectionVoice: (voiceName: string | null) => {
        set({ stageDirectionVoiceName: voiceName })
      },

      setStageDirectionVolume: (volume: number) => {
        set({ stageDirectionVolume: Math.max(0, Math.min(1.0, volume)) })
      },

      setStageDirectionSpeed: (speed: number) => {
        set({ stageDirectionSpeed: Math.max(0.5, Math.min(2.0, speed)) })
      },

      toggleHideUserLines: () => {
        set((state) => ({ hideUserLinesInItalian: !state.hideUserLinesInItalian }))
      },

      resetSettings: () => {
        set({
          readingMode: 'silent',
          globalSpeed: DEFAULT_SPEED,
          globalVolume: DEFAULT_VOLUME,
          speed: DEFAULT_SPEED,
          volume: DEFAULT_VOLUME,
          selectedVoice: null,
          autoPlay: false,
          highlightUserLines: true,
          maleVoiceName: null,
          femaleVoiceName: null,
          neutralVoiceName: null,
          stageDirectionVoiceName: null,
          stageDirectionVolume: 0.8,
          stageDirectionSpeed: 1.0,
          hideUserLinesInItalian: true,
        })
      },
    }),
    {
      name: 'repet-settings-storage',
    }
  )
)
