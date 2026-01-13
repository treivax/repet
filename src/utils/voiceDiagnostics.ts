/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Utilitaires de diagnostic pour le système TTS
 *
 * Ce module fournit des outils pour diagnostiquer les problèmes
 * liés aux voix TTS, aux modèles ONNX, et aux assignations de voix.
 */

import type { PlaySettings } from '../core/models/Settings'
import { isObsoleteVoice, getReplacementVoice } from './voiceMigration'

/**
 * Résultat d'un diagnostic de voix
 */
export interface VoiceDiagnosticResult {
  /** ID de la voix diagnostiquée */
  voiceId: string

  /** La voix est-elle obsolète/retirée ? */
  isObsolete: boolean

  /** Voix de remplacement suggérée (si obsolète) */
  replacement?: string

  /** Raison du problème (si obsolète) */
  reason?: string

  /** Nombre de personnages utilisant cette voix */
  usageCount: number

  /** IDs des personnages utilisant cette voix */
  characterIds: string[]
}

/**
 * Résultat d'un diagnostic complet des paramètres de pièce
 */
export interface PlaySettingsDiagnostic {
  /** ID de la pièce */
  playId: string

  /** Voix problématiques trouvées */
  problematicVoices: VoiceDiagnosticResult[]

  /** Nombre total de voix problématiques */
  problemCount: number

  /** La pièce nécessite-t-elle une migration ? */
  needsMigration: boolean
}

/**
 * Raisons connues pour lesquelles des voix sont obsolètes
 */
const OBSOLETE_VOICE_REASONS: Record<string, string> = {
  'fr_FR-gilles-low':
    'Erreurs ONNX Runtime (Gather node index out of bounds) - indices hors limites du modèle',
  'fr_FR-mls-medium': 'Audio distordu/inintelligible sur certaines lignes',
}

/**
 * Diagnostique une voix spécifique
 *
 * @param voiceId - ID de la voix à diagnostiquer
 * @param characterIds - IDs des personnages utilisant cette voix
 * @returns Résultat du diagnostic
 */
export function diagnoseVoice(voiceId: string, characterIds: string[]): VoiceDiagnosticResult {
  const isObsolete = isObsoleteVoice(voiceId)
  const replacement = isObsolete ? getReplacementVoice(voiceId) : undefined
  const reason = OBSOLETE_VOICE_REASONS[voiceId]

  return {
    voiceId,
    isObsolete,
    replacement,
    reason,
    usageCount: characterIds.length,
    characterIds,
  }
}

/**
 * Diagnostique toutes les assignations de voix pour une pièce
 *
 * @param playId - ID de la pièce
 * @param settings - Paramètres de la pièce
 * @returns Diagnostic complet
 */
export function diagnosePlaySettings(
  playId: string,
  settings: PlaySettings
): PlaySettingsDiagnostic {
  // Grouper les personnages par voix
  const voiceUsage: Record<string, string[]> = {}

  for (const [characterId, voiceId] of Object.entries(settings.characterVoicesPiper)) {
    if (!voiceUsage[voiceId]) {
      voiceUsage[voiceId] = []
    }
    voiceUsage[voiceId].push(characterId)
  }

  // Diagnostiquer chaque voix utilisée
  const problematicVoices: VoiceDiagnosticResult[] = []

  for (const [voiceId, characterIds] of Object.entries(voiceUsage)) {
    const diagnostic = diagnoseVoice(voiceId, characterIds)

    if (diagnostic.isObsolete) {
      problematicVoices.push(diagnostic)
    }
  }

  return {
    playId,
    problematicVoices,
    problemCount: problematicVoices.length,
    needsMigration: problematicVoices.length > 0,
  }
}

/**
 * Diagnostique tous les paramètres de pièces
 *
 * @param allPlaySettings - Record de tous les paramètres
 * @returns Tableau de diagnostics pour chaque pièce
 */
export function diagnoseAllPlaySettings(
  allPlaySettings: Record<string, PlaySettings>
): PlaySettingsDiagnostic[] {
  const diagnostics: PlaySettingsDiagnostic[] = []

  for (const [playId, settings] of Object.entries(allPlaySettings)) {
    const diagnostic = diagnosePlaySettings(playId, settings)
    diagnostics.push(diagnostic)
  }

  return diagnostics
}

/**
 * Génère un rapport de diagnostic formaté
 *
 * @param diagnostics - Résultats de diagnostic à formater
 * @returns Rapport formaté en texte
 */
export function formatDiagnosticReport(diagnostics: PlaySettingsDiagnostic[]): string {
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('    RAPPORT DE DIAGNOSTIC DES VOIX TTS')
  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('')

  const problematicPlays = diagnostics.filter((d) => d.needsMigration)

  if (problematicPlays.length === 0) {
    lines.push('✅ Aucun problème détecté.')
    lines.push(`   ${diagnostics.length} pièce(s) analysée(s), toutes utilisent des voix valides.`)
    lines.push('')
  } else {
    lines.push(
      `⚠️  ${problematicPlays.length} pièce(s) nécessite(nt) une migration de voix.`
    )
    lines.push('')

    for (const playDiag of problematicPlays) {
      lines.push(`📄 Pièce: ${playDiag.playId}`)
      lines.push(`   Problèmes: ${playDiag.problemCount}`)
      lines.push('')

      for (const voiceDiag of playDiag.problematicVoices) {
        lines.push(`   🔴 Voix obsolète: ${voiceDiag.voiceId}`)
        if (voiceDiag.reason) {
          lines.push(`      Raison: ${voiceDiag.reason}`)
        }
        if (voiceDiag.replacement) {
          lines.push(`      Remplacement: ${voiceDiag.replacement}`)
        }
        lines.push(`      Utilisée par ${voiceDiag.usageCount} personnage(s):`)
        for (const charId of voiceDiag.characterIds) {
          lines.push(`         - ${charId}`)
        }
        lines.push('')
      }
    }

    lines.push('───────────────────────────────────────────────────────────')
    lines.push('💡 Recommandation:')
    lines.push('   Les migrations seront appliquées automatiquement au')
    lines.push('   prochain chargement de chaque pièce affectée.')
    lines.push('')
  }

  lines.push('═══════════════════════════════════════════════════════════')

  return lines.join('\n')
}

/**
 * Affiche un rapport de diagnostic dans la console
 *
 * @param allPlaySettings - Record de tous les paramètres
 */
export function logDiagnosticReport(allPlaySettings: Record<string, PlaySettings>): void {
  const diagnostics = diagnoseAllPlaySettings(allPlaySettings)
  const report = formatDiagnosticReport(diagnostics)
  console.warn(report)
}

/**
 * Vérifie si un texte contient des caractères ou patterns problématiques
 * connus pour causer des erreurs avec certains modèles Piper
 *
 * @param text - Texte à analyser
 * @returns true si le texte contient des patterns problématiques
 */
export function hasProblematicPatterns(text: string): boolean {
  // Patterns connus pour causer des problèmes avec Gilles et MLS
  const problematicPatterns = [
    /\?\?\?+/, // Multiples points d'interrogation
    /!!!+/, // Multiples points d'exclamation
    /ahah+/i, // Onomatopées de rire
    /héhé+/i,
    /hihi+/i,
    /\[.*?\]/, // Didascalies entre crochets
    /\(.*?\)/, // Didascalies entre parenthèses
    /…{2,}/, // Points de suspension multiples
  ]

  return problematicPatterns.some((pattern) => pattern.test(text))
}

/**
 * Analyse un texte et retourne des avertissements si des patterns
 * problématiques sont détectés
 *
 * @param text - Texte à analyser
 * @returns Tableau d'avertissements (vide si pas de problème)
 */
export function analyzeTextForProblems(text: string): string[] {
  const warnings: string[] = []

  if (/\?\?\?+/.test(text)) {
    warnings.push('Points d\'interrogation multiples détectés (???)')
  }

  if (/!!!+/.test(text)) {
    warnings.push('Points d\'exclamation multiples détectés (!!!)')
  }

  if (/ahah+|héhé+|hihi+/i.test(text)) {
    warnings.push('Onomatopées de rire détectées (ahah, héhé, hihi)')
  }

  if (/\[.*?\]|\(.*?\)/.test(text)) {
    warnings.push('Didascalies détectées (entre crochets ou parenthèses)')
  }

  if (/…{2,}/.test(text)) {
    warnings.push('Points de suspension multiples détectés (……)')
  }

  return warnings
}
