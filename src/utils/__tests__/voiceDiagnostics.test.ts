/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { describe, it, expect } from 'vitest'
import {
  diagnoseVoice,
  diagnosePlaySettings,
  diagnoseAllPlaySettings,
  formatDiagnosticReport,
  hasProblematicPatterns,
  analyzeTextForProblems,
} from '../voiceDiagnostics'
import type { PlaySettings } from '../../core/models/Settings'

describe('voiceDiagnostics', () => {
  describe('diagnoseVoice', () => {
    it('should detect Gilles as obsolete', () => {
      const result = diagnoseVoice('fr_FR-gilles-low', ['char1', 'char2'])

      expect(result.voiceId).toBe('fr_FR-gilles-low')
      expect(result.isObsolete).toBe(true)
      expect(result.replacement).toBe('fr_FR-tom-medium')
      expect(result.usageCount).toBe(2)
      expect(result.characterIds).toEqual(['char1', 'char2'])
      expect(result.reason).toContain('ONNX Runtime')
    })

    it('should detect MLS as obsolete', () => {
      const result = diagnoseVoice('fr_FR-mls-medium', ['char1'])

      expect(result.voiceId).toBe('fr_FR-mls-medium')
      expect(result.isObsolete).toBe(true)
      expect(result.replacement).toBe('fr_FR-tom-medium')
      expect(result.usageCount).toBe(1)
      expect(result.reason).toContain('distordu')
    })

    it('should detect Tom as valid', () => {
      const result = diagnoseVoice('fr_FR-tom-medium', ['char1'])

      expect(result.voiceId).toBe('fr_FR-tom-medium')
      expect(result.isObsolete).toBe(false)
      expect(result.replacement).toBeUndefined()
      expect(result.reason).toBeUndefined()
      expect(result.usageCount).toBe(1)
    })

    it('should handle empty character list', () => {
      const result = diagnoseVoice('fr_FR-gilles-low', [])

      expect(result.usageCount).toBe(0)
      expect(result.characterIds).toEqual([])
    })
  })

  describe('diagnosePlaySettings', () => {
    it('should detect problematic voices in play settings', () => {
      const settings: PlaySettings = {
        playId: 'test-play',
        readingMode: 'silent',
        userCharacterId: undefined,
        hideUserLines: false,
        showBefore: false,
        showAfter: true,
        userSpeed: 1.0,
        readStageDirections: true,
        readStructure: false,
        readPresentation: false,
        defaultSpeed: 1.0,
        characterVoices: {
          char1: 'male',
          char2: 'male',
          char3: 'female',
        },
        characterVoicesPiper: {
          char1: 'fr_FR-gilles-low',
          char2: 'fr_FR-mls-medium',
          char3: 'fr_FR-siwis-medium',
        },
        theme: undefined,
      }

      const diagnostic = diagnosePlaySettings('test-play', settings)

      expect(diagnostic.playId).toBe('test-play')
      expect(diagnostic.problemCount).toBe(2)
      expect(diagnostic.needsMigration).toBe(true)
      expect(diagnostic.problematicVoices).toHaveLength(2)

      const gillesVoice = diagnostic.problematicVoices.find((v) => v.voiceId === 'fr_FR-gilles-low')
      expect(gillesVoice).toBeDefined()
      expect(gillesVoice?.characterIds).toContain('char1')

      const mlsVoice = diagnostic.problematicVoices.find((v) => v.voiceId === 'fr_FR-mls-medium')
      expect(mlsVoice).toBeDefined()
      expect(mlsVoice?.characterIds).toContain('char2')
    })

    it('should report no problems for valid voices', () => {
      const settings: PlaySettings = {
        playId: 'test-play',
        readingMode: 'silent',
        userCharacterId: undefined,
        hideUserLines: false,
        showBefore: false,
        showAfter: true,
        userSpeed: 1.0,
        readStageDirections: true,
        readStructure: false,
        readPresentation: false,
        defaultSpeed: 1.0,
        characterVoices: {
          char1: 'male',
          char2: 'female',
        },
        characterVoicesPiper: {
          char1: 'fr_FR-tom-medium',
          char2: 'fr_FR-siwis-medium',
        },
        theme: undefined,
      }

      const diagnostic = diagnosePlaySettings('test-play', settings)

      expect(diagnostic.problemCount).toBe(0)
      expect(diagnostic.needsMigration).toBe(false)
      expect(diagnostic.problematicVoices).toEqual([])
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
        readStageDirections: true,
        readStructure: false,
        readPresentation: false,
        defaultSpeed: 1.0,
        characterVoices: {},
        characterVoicesPiper: {},
        theme: undefined,
      }

      const diagnostic = diagnosePlaySettings('test-play', settings)

      expect(diagnostic.problemCount).toBe(0)
      expect(diagnostic.needsMigration).toBe(false)
    })
  })

  describe('diagnoseAllPlaySettings', () => {
    it('should diagnose multiple plays', () => {
      const allSettings: Record<string, PlaySettings> = {
        play1: {
          playId: 'play1',
          readingMode: 'silent',
          userCharacterId: undefined,
          hideUserLines: false,
          showBefore: false,
          showAfter: true,
          userSpeed: 1.0,
          readStageDirections: true,
          readStructure: false,
          readPresentation: false,
          defaultSpeed: 1.0,
          characterVoices: { char1: 'male' },
          characterVoicesPiper: { char1: 'fr_FR-gilles-low' },
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
          readStageDirections: true,
          readStructure: false,
          readPresentation: false,
          defaultSpeed: 1.0,
          characterVoices: { char2: 'male' },
          characterVoicesPiper: { char2: 'fr_FR-tom-medium' },
          theme: undefined,
        },
      }

      const diagnostics = diagnoseAllPlaySettings(allSettings)

      expect(diagnostics).toHaveLength(2)
      expect(diagnostics[0].needsMigration).toBe(true)
      expect(diagnostics[1].needsMigration).toBe(false)
    })
  })

  describe('formatDiagnosticReport', () => {
    it('should format report for problematic plays', () => {
      const diagnostics = [
        {
          playId: 'test-play',
          problematicVoices: [
            {
              voiceId: 'fr_FR-gilles-low',
              isObsolete: true,
              replacement: 'fr_FR-tom-medium',
              reason: 'Erreurs ONNX Runtime',
              usageCount: 2,
              characterIds: ['char1', 'char2'],
            },
          ],
          problemCount: 1,
          needsMigration: true,
        },
      ]

      const report = formatDiagnosticReport(diagnostics)

      expect(report).toContain('RAPPORT DE DIAGNOSTIC')
      expect(report).toContain('test-play')
      expect(report).toContain('fr_FR-gilles-low')
      expect(report).toContain('fr_FR-tom-medium')
      expect(report).toContain('Erreurs ONNX Runtime')
      expect(report).toContain('char1')
      expect(report).toContain('char2')
    })

    it('should format report for clean plays', () => {
      const diagnostics = [
        {
          playId: 'test-play',
          problematicVoices: [],
          problemCount: 0,
          needsMigration: false,
        },
      ]

      const report = formatDiagnosticReport(diagnostics)

      expect(report).toContain('Aucun problème détecté')
      expect(report).toContain('1 pièce(s) analysée(s)')
    })
  })

  describe('hasProblematicPatterns', () => {
    it('should detect multiple question marks', () => {
      expect(hasProblematicPatterns('Quoi ???')).toBe(true)
      expect(hasProblematicPatterns('Vraiment ????')).toBe(true)
    })

    it('should detect multiple exclamation marks', () => {
      expect(hasProblematicPatterns('Non !!!')).toBe(true)
      expect(hasProblematicPatterns('Incroyable !!!!')).toBe(true)
    })

    it('should detect onomatopoeia', () => {
      expect(hasProblematicPatterns('ahah')).toBe(true)
      expect(hasProblematicPatterns('Ahahahah !')).toBe(true)
      expect(hasProblematicPatterns("Héhé, c'est drôle")).toBe(true)
      expect(hasProblematicPatterns('hihi')).toBe(true)
    })

    it('should detect didascalies in brackets', () => {
      expect(hasProblematicPatterns('[rire]')).toBe(true)
      expect(hasProblematicPatterns('[à voix basse]')).toBe(true)
    })

    it('should detect didascalies in parentheses', () => {
      expect(hasProblematicPatterns('(sourire)')).toBe(true)
      expect(hasProblematicPatterns('(chuchoté)')).toBe(true)
    })

    it('should detect multiple ellipsis', () => {
      expect(hasProblematicPatterns('Je me demandais……')).toBe(true)
      expect(hasProblematicPatterns('Oui………')).toBe(true)
    })

    it('should return false for clean text', () => {
      expect(hasProblematicPatterns('Bonjour, comment allez-vous ?')).toBe(false)
      expect(hasProblematicPatterns('Très bien, merci !')).toBe(false)
      expect(hasProblematicPatterns('Je pense que oui.')).toBe(false)
    })
  })

  describe('analyzeTextForProblems', () => {
    it('should return warnings for multiple question marks', () => {
      const warnings = analyzeTextForProblems('Tu es sérieux ???')
      expect(warnings).toContain("Points d'interrogation multiples détectés (???)")
    })

    it('should return warnings for multiple exclamation marks', () => {
      const warnings = analyzeTextForProblems("C'est incroyable !!!")
      expect(warnings).toContain("Points d'exclamation multiples détectés (!!!)")
    })

    it('should return warnings for onomatopoeia', () => {
      const warnings = analyzeTextForProblems("Ahah, c'est drôle !")
      expect(warnings).toContain('Onomatopées de rire détectées (ahah, héhé, hihi)')
    })

    it('should return warnings for didascalies', () => {
      const warnings = analyzeTextForProblems("[rire] Oui, c'est vrai (sourire)")
      expect(warnings).toContain('Didascalies détectées (entre crochets ou parenthèses)')
    })

    it('should return warnings for multiple ellipsis', () => {
      const warnings = analyzeTextForProblems('Je pense que……')
      expect(warnings).toContain('Points de suspension multiples détectés (……)')
    })

    it('should return multiple warnings for complex text', () => {
      const warnings = analyzeTextForProblems('MARC : [rire] Ahah !!! Tu crois vraiment ???')

      expect(warnings.length).toBeGreaterThan(1)
      expect(warnings).toContain("Points d'interrogation multiples détectés (???)")
      expect(warnings).toContain("Points d'exclamation multiples détectés (!!!)")
      expect(warnings).toContain('Onomatopées de rire détectées (ahah, héhé, hihi)')
      expect(warnings).toContain('Didascalies détectées (entre crochets ou parenthèses)')
    })

    it('should return empty array for clean text', () => {
      const warnings = analyzeTextForProblems('Bonjour, comment allez-vous ?')
      expect(warnings).toEqual([])
    })

    it('should handle empty text', () => {
      const warnings = analyzeTextForProblems('')
      expect(warnings).toEqual([])
    })

    it('should be case insensitive for onomatopoeia', () => {
      const warnings1 = analyzeTextForProblems('AHAH')
      expect(warnings1.some((w) => w.includes('Onomatopées de rire'))).toBe(true)

      const warnings2 = analyzeTextForProblems('Héhé')
      expect(warnings2.some((w) => w.includes('Onomatopées de rire'))).toBe(true)

      const warnings3 = analyzeTextForProblems('HiHi')
      expect(warnings3.some((w) => w.includes('Onomatopées de rire'))).toBe(true)
    })
  })
})
