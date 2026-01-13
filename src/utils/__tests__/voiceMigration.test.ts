/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { describe, it, expect } from 'vitest'
import {
  migrateVoiceId,
  migratePlaySettingsVoices,
  migrateAllPlaySettings,
  isObsoleteVoice,
  getReplacementVoice,
} from '../voiceMigration'
import type { PlaySettings } from '../../core/models/Settings'

describe('voiceMigration', () => {
  describe('migrateVoiceId', () => {
    it('should migrate Gilles to Tom', () => {
      expect(migrateVoiceId('fr_FR-gilles-low')).toBe('fr_FR-tom-medium')
    })

    it('should migrate MLS to Tom', () => {
      expect(migrateVoiceId('fr_FR-mls-medium')).toBe('fr_FR-tom-medium')
    })

    it('should not migrate valid voices', () => {
      expect(migrateVoiceId('fr_FR-tom-medium')).toBe('fr_FR-tom-medium')
      expect(migrateVoiceId('fr_FR-siwis-medium')).toBe('fr_FR-siwis-medium')
      expect(migrateVoiceId('fr_FR-upmc-medium')).toBe('fr_FR-upmc-medium')
    })

    it('should return original ID for unknown voices', () => {
      expect(migrateVoiceId('unknown-voice')).toBe('unknown-voice')
    })
  })

  describe('isObsoleteVoice', () => {
    it('should return true for Gilles', () => {
      expect(isObsoleteVoice('fr_FR-gilles-low')).toBe(true)
    })

    it('should return true for MLS', () => {
      expect(isObsoleteVoice('fr_FR-mls-medium')).toBe(true)
    })

    it('should return false for valid voices', () => {
      expect(isObsoleteVoice('fr_FR-tom-medium')).toBe(false)
      expect(isObsoleteVoice('fr_FR-siwis-medium')).toBe(false)
      expect(isObsoleteVoice('fr_FR-upmc-medium')).toBe(false)
    })
  })

  describe('getReplacementVoice', () => {
    it('should return Tom for Gilles', () => {
      expect(getReplacementVoice('fr_FR-gilles-low')).toBe('fr_FR-tom-medium')
    })

    it('should return Tom for MLS', () => {
      expect(getReplacementVoice('fr_FR-mls-medium')).toBe('fr_FR-tom-medium')
    })

    it('should return undefined for valid voices', () => {
      expect(getReplacementVoice('fr_FR-tom-medium')).toBeUndefined()
      expect(getReplacementVoice('fr_FR-siwis-medium')).toBeUndefined()
    })
  })

  describe('migratePlaySettingsVoices', () => {
    it('should migrate Gilles assignments to Tom', () => {
      const settings: PlaySettings = {
        playId: 'test-play',
        readingMode: 'silent',
        userCharacterId: undefined,
        hideUserLines: false,
        showBefore: false,
        showAfter: true,
        userSpeed: 1.0,
        voiceOffEnabled: false,
        defaultSpeed: 1.0,
        characterVoices: {
          char1: 'male',
          char2: 'female',
        },
        ttsProvider: 'piper-wasm',
        characterVoicesPiper: {
          char1: 'fr_FR-gilles-low',
          char2: 'fr_FR-siwis-medium',
        },
        characterVoicesGoogle: {},
        theme: undefined,
      }

      const migrated = migratePlaySettingsVoices(settings)

      expect(migrated.characterVoicesPiper).toEqual({
        char1: 'fr_FR-tom-medium',
        char2: 'fr_FR-siwis-medium',
      })
    })

    it('should migrate MLS assignments to Tom', () => {
      const settings: PlaySettings = {
        playId: 'test-play',
        readingMode: 'silent',
        userCharacterId: undefined,
        hideUserLines: false,
        showBefore: false,
        showAfter: true,
        userSpeed: 1.0,
        voiceOffEnabled: false,
        defaultSpeed: 1.0,
        characterVoices: {
          char1: 'male',
        },
        ttsProvider: 'piper-wasm',
        characterVoicesPiper: {
          char1: 'fr_FR-mls-medium',
        },
        characterVoicesGoogle: {},
        theme: undefined,
      }

      const migrated = migratePlaySettingsVoices(settings)

      expect(migrated.characterVoicesPiper.char1).toBe('fr_FR-tom-medium')
    })

    it('should return same reference if no changes needed', () => {
      const settings: PlaySettings = {
        playId: 'test-play',
        readingMode: 'silent',
        userCharacterId: undefined,
        hideUserLines: false,
        showBefore: false,
        showAfter: true,
        userSpeed: 1.0,
        voiceOffEnabled: false,
        defaultSpeed: 1.0,
        characterVoices: {
          char1: 'male',
          char2: 'female',
        },
        ttsProvider: 'piper-wasm',
        characterVoicesPiper: {
          char1: 'fr_FR-tom-medium',
          char2: 'fr_FR-siwis-medium',
        },
        characterVoicesGoogle: {},
        theme: undefined,
      }

      const migrated = migratePlaySettingsVoices(settings)

      // Should return exact same reference
      expect(migrated).toBe(settings)
    })

    it('should handle multiple obsolete voices', () => {
      const settings: PlaySettings = {
        playId: 'test-play',
        readingMode: 'silent',
        userCharacterId: undefined,
        hideUserLines: false,
        showBefore: false,
        showAfter: true,
        userSpeed: 1.0,
        voiceOffEnabled: false,
        defaultSpeed: 1.0,
        characterVoices: {
          char1: 'male',
          char2: 'male',
          char3: 'female',
        },
        ttsProvider: 'piper-wasm',
        characterVoicesPiper: {
          char1: 'fr_FR-gilles-low',
          char2: 'fr_FR-mls-medium',
          char3: 'fr_FR-siwis-medium',
        },
        characterVoicesGoogle: {},
        theme: undefined,
      }

      const migrated = migratePlaySettingsVoices(settings)

      expect(migrated.characterVoicesPiper).toEqual({
        char1: 'fr_FR-tom-medium',
        char2: 'fr_FR-tom-medium',
        char3: 'fr_FR-siwis-medium',
      })
    })

    it('should handle empty voice assignments', () => {
      const settings: PlaySettings = {
        playId: 'test-play',
        readingMode: 'silent',
        userCharacterId: undefined,
        hideUserLines: false,
        showBefore: false,
        showAfter: true,
        userSpeed: 1.0,
        voiceOffEnabled: false,
        defaultSpeed: 1.0,
        characterVoices: {},
        ttsProvider: 'piper-wasm',
        characterVoicesPiper: {},
        characterVoicesGoogle: {},
        theme: undefined,
      }

      const migrated = migratePlaySettingsVoices(settings)

      expect(migrated).toBe(settings)
      expect(migrated.characterVoicesPiper).toEqual({})
    })
  })

  describe('migrateAllPlaySettings', () => {
    it('should migrate all plays with obsolete voices', () => {
      const allSettings: Record<string, PlaySettings> = {
        play1: {
          playId: 'play1',
          readingMode: 'silent',
          userCharacterId: undefined,
          hideUserLines: false,
          showBefore: false,
          showAfter: true,
          userSpeed: 1.0,
          voiceOffEnabled: false,
          defaultSpeed: 1.0,
          characterVoices: { char1: 'male' },
          ttsProvider: 'piper-wasm',
          characterVoicesPiper: {
            char1: 'fr_FR-gilles-low',
          },
          characterVoicesGoogle: {},
          theme: undefined,
        },
        play2: {
          playId: 'play2',
          readingMode: 'silent',
          userCharacterId: undefined,
          hideUserLines: false,
          showBefore: false,
          showAfter: true,
          userSpeed: 1.0,
          voiceOffEnabled: false,
          defaultSpeed: 1.0,
          characterVoices: { char2: 'male' },
          ttsProvider: 'piper-wasm',
          characterVoicesPiper: {
            char2: 'fr_FR-mls-medium',
          },
          characterVoicesGoogle: {},
          theme: undefined,
        },
        play3: {
          playId: 'play3',
          readingMode: 'silent',
          userCharacterId: undefined,
          hideUserLines: false,
          showBefore: false,
          showAfter: true,
          userSpeed: 1.0,
          voiceOffEnabled: false,
          defaultSpeed: 1.0,
          characterVoices: { char3: 'female' },
          ttsProvider: 'piper-wasm',
          characterVoicesPiper: {
            char3: 'fr_FR-siwis-medium',
          },
          characterVoicesGoogle: {},
          theme: undefined,
        },
      }

      const migrated = migrateAllPlaySettings(allSettings)

      expect(migrated.play1.characterVoicesPiper.char1).toBe('fr_FR-tom-medium')
      expect(migrated.play2.characterVoicesPiper.char2).toBe('fr_FR-tom-medium')
      expect(migrated.play3.characterVoicesPiper.char3).toBe('fr_FR-siwis-medium')
    })

    it('should preserve plays with no obsolete voices', () => {
      const allSettings: Record<string, PlaySettings> = {
        play1: {
          playId: 'play1',
          readingMode: 'silent',
          userCharacterId: undefined,
          hideUserLines: false,
          showBefore: false,
          showAfter: true,
          userSpeed: 1.0,
          voiceOffEnabled: false,
          defaultSpeed: 1.0,
          characterVoices: { char1: 'male' },
          ttsProvider: 'piper-wasm',
          characterVoicesPiper: {
            char1: 'fr_FR-tom-medium',
          },
          characterVoicesGoogle: {},
          theme: undefined,
        },
      }

      const migrated = migrateAllPlaySettings(allSettings)

      // Should preserve the original settings reference for unchanged plays
      expect(migrated.play1).toBe(allSettings.play1)
    })

    it('should handle empty settings object', () => {
      const migrated = migrateAllPlaySettings({})
      expect(migrated).toEqual({})
    })
  })
})
