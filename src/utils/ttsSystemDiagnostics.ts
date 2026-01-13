/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Script de diagnostic automatique du système TTS
 *
 * Ce module fournit des outils pour diagnostiquer et vérifier
 * l'état complet du système TTS, incluant les voix, profils,
 * cache, et migrations.
 */

import type { PlaySettings } from '../core/models/Settings'
import { ttsProviderManager } from '../core/tts/providers'
import { audioCacheService } from '../core/tts/services/AudioCacheService'
import { ALL_VOICE_PROFILES, getVoiceProfile } from '../core/tts/voiceProfiles'
import { diagnoseAllPlaySettings } from './voiceDiagnostics'
import { isObsoleteVoice } from './voiceMigration'

/**
 * Résultat du diagnostic système complet
 */
export interface SystemDiagnosticResult {
  /** Date et heure du diagnostic */
  timestamp: string

  /** Statut global du système (ok, warning, error) */
  status: 'ok' | 'warning' | 'error'

  /** Résumé des problèmes */
  summary: {
    totalIssues: number
    criticalIssues: number
    warnings: number
  }

  /** Diagnostic du provider TTS */
  provider: {
    name: string
    isActive: boolean
    isAvailable: boolean
    totalVoices: number
    baseVoices: number
    profileVoices: number
    obsoleteVoices: string[]
  }

  /** Diagnostic du cache audio */
  cache: {
    totalEntries: number
    totalSizeMB: number
    voiceCount: number
    largestVoiceId: string | null
    largestVoiceSizeMB: number
  }

  /** Diagnostic des profils vocaux */
  profiles: {
    totalProfiles: number
    profilesByGender: {
      male: number
      female: number
    }
    profilesByBaseVoice: Record<string, number>
    invalidProfiles: string[]
  }

  /** Diagnostic des paramètres de pièces */
  playSettings: {
    totalPlays: number
    playsNeedingMigration: number
    obsoleteVoiceUsage: Record<string, number>
  }

  /** Détails des problèmes détectés */
  issues: Array<{
    severity: 'critical' | 'warning' | 'info'
    category: 'provider' | 'cache' | 'profiles' | 'settings'
    message: string
    details?: string
  }>
}

/**
 * Exécute un diagnostic complet du système TTS
 */
export async function runSystemDiagnostics(
  allPlaySettings?: Record<string, PlaySettings>
): Promise<SystemDiagnosticResult> {
  const issues: SystemDiagnosticResult['issues'] = []

  // 1. Diagnostic du provider
  const provider = ttsProviderManager.getActiveProvider()

  if (!provider) {
    issues.push({
      severity: 'critical',
      category: 'provider',
      message: 'Aucun provider TTS actif',
      details: 'Le système TTS ne peut pas fonctionner sans provider actif.',
    })
  }

  const availability = await provider?.checkAvailability()
  if (availability && !availability.available) {
    issues.push({
      severity: 'critical',
      category: 'provider',
      message: 'Provider TTS non disponible',
      details: availability.reason || 'Raison inconnue',
    })
  }

  const voices = provider?.getVoices() || []
  const baseVoices = voices.filter((v) => !v.id.includes('-custom-'))
  const profileVoices = voices.filter((v) => v.id.includes('-custom-') || getVoiceProfile(v.id))

  // Détecter les voix obsolètes dans la liste
  const obsoleteVoices = voices.filter((v) => isObsoleteVoice(v.id)).map((v) => v.id)

  if (obsoleteVoices.length > 0) {
    issues.push({
      severity: 'critical',
      category: 'provider',
      message: `${obsoleteVoices.length} voix obsolète(s) détectée(s) dans la liste des voix`,
      details: `Voix: ${obsoleteVoices.join(', ')}`,
    })
  }

  // 2. Diagnostic du cache
  const cacheStats = await audioCacheService.getCacheStats()
  const cacheSizeMB = cacheStats.totalSize / 1024 / 1024

  if (cacheSizeMB > 100) {
    issues.push({
      severity: 'warning',
      category: 'cache',
      message: 'Cache audio volumineux',
      details: `Taille actuelle: ${cacheSizeMB.toFixed(2)} MB. Considérer un nettoyage.`,
    })
  }

  let largestVoiceId: string | null = null
  let largestVoiceSizeMB = 0

  Object.entries(cacheStats.byVoice).forEach(([voiceId, stats]) => {
    const sizeMB = stats.totalSize / 1024 / 1024
    if (sizeMB > largestVoiceSizeMB) {
      largestVoiceId = voiceId
      largestVoiceSizeMB = sizeMB
    }

    // Vérifier si le cache contient des voix obsolètes
    if (isObsoleteVoice(voiceId)) {
      issues.push({
        severity: 'warning',
        category: 'cache',
        message: `Cache contient des entrées pour une voix obsolète: ${voiceId}`,
        details: `${stats.count} entrée(s), ${sizeMB.toFixed(2)} MB. Devrait être nettoyé.`,
      })
    }
  })

  // 3. Diagnostic des profils vocaux
  const profilesByGender = {
    male: ALL_VOICE_PROFILES.filter((p) => p.perceivedGender === 'male').length,
    female: ALL_VOICE_PROFILES.filter((p) => p.perceivedGender === 'female').length,
  }

  const profilesByBaseVoice: Record<string, number> = {}
  ALL_VOICE_PROFILES.forEach((profile) => {
    profilesByBaseVoice[profile.baseVoiceId] = (profilesByBaseVoice[profile.baseVoiceId] || 0) + 1
  })

  const invalidProfiles: string[] = []
  ALL_VOICE_PROFILES.forEach((profile) => {
    // Vérifier que la voix de base existe
    const baseVoiceExists = baseVoices.some((v) => v.id === profile.baseVoiceId)
    if (!baseVoiceExists) {
      invalidProfiles.push(profile.id)
      issues.push({
        severity: 'warning',
        category: 'profiles',
        message: `Profil ${profile.id} référence une voix de base inexistante: ${profile.baseVoiceId}`,
      })
    }

    // Vérifier que les modificateurs sont valides
    if (profile.modifiers.playbackRate < 0.5 || profile.modifiers.playbackRate > 2.0) {
      invalidProfiles.push(profile.id)
      issues.push({
        severity: 'warning',
        category: 'profiles',
        message: `Profil ${profile.id} a un playbackRate invalide: ${profile.modifiers.playbackRate}`,
      })
    }
  })

  // 4. Diagnostic des paramètres de pièces
  let totalPlays = 0
  let playsNeedingMigration = 0
  const obsoleteVoiceUsage: Record<string, number> = {}

  if (allPlaySettings) {
    totalPlays = Object.keys(allPlaySettings).length
    const diagnostics = diagnoseAllPlaySettings(allPlaySettings)

    diagnostics.forEach((diag) => {
      if (diag.needsMigration) {
        playsNeedingMigration++

        diag.problematicVoices.forEach((voiceDiag) => {
          obsoleteVoiceUsage[voiceDiag.voiceId] =
            (obsoleteVoiceUsage[voiceDiag.voiceId] || 0) + voiceDiag.usageCount
        })
      }
    })

    if (playsNeedingMigration > 0) {
      issues.push({
        severity: 'warning',
        category: 'settings',
        message: `${playsNeedingMigration} pièce(s) nécessite(nt) une migration de voix`,
        details: `Voix obsolètes utilisées: ${Object.keys(obsoleteVoiceUsage).join(', ')}`,
      })
    }
  }

  // 5. Calculer le statut global
  const criticalIssues = issues.filter((i) => i.severity === 'critical').length
  const warnings = issues.filter((i) => i.severity === 'warning').length
  const totalIssues = issues.length

  let status: 'ok' | 'warning' | 'error' = 'ok'
  if (criticalIssues > 0) {
    status = 'error'
  } else if (warnings > 0) {
    status = 'warning'
  }

  return {
    timestamp: new Date().toISOString(),
    status,
    summary: {
      totalIssues,
      criticalIssues,
      warnings,
    },
    provider: {
      name: provider?.name || 'N/A',
      isActive: !!provider,
      isAvailable: availability?.available || false,
      totalVoices: voices.length,
      baseVoices: baseVoices.length,
      profileVoices: profileVoices.length,
      obsoleteVoices,
    },
    cache: {
      totalEntries: cacheStats.totalEntries,
      totalSizeMB: cacheSizeMB,
      voiceCount: Object.keys(cacheStats.byVoice).length,
      largestVoiceId,
      largestVoiceSizeMB,
    },
    profiles: {
      totalProfiles: ALL_VOICE_PROFILES.length,
      profilesByGender,
      profilesByBaseVoice,
      invalidProfiles,
    },
    playSettings: {
      totalPlays,
      playsNeedingMigration,
      obsoleteVoiceUsage,
    },
    issues,
  }
}

/**
 * Formatte un rapport de diagnostic en texte lisible
 */
export function formatSystemDiagnosticReport(result: SystemDiagnosticResult): string {
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('    DIAGNOSTIC COMPLET DU SYSTÈME TTS')
  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('')
  lines.push(`Date: ${new Date(result.timestamp).toLocaleString('fr-FR')}`)
  lines.push('')

  // Statut global
  const statusIcon = {
    ok: '✅',
    warning: '⚠️',
    error: '🔴',
  }[result.status]

  lines.push(`${statusIcon} Statut global: ${result.status.toUpperCase()}`)
  lines.push('')

  if (result.summary.totalIssues > 0) {
    lines.push(`📊 Résumé des problèmes:`)
    lines.push(`   - Total: ${result.summary.totalIssues}`)
    lines.push(`   - Critiques: ${result.summary.criticalIssues}`)
    lines.push(`   - Avertissements: ${result.summary.warnings}`)
    lines.push('')
  }

  // Provider
  lines.push('───────────────────────────────────────────────────────────')
  lines.push('🎤 Provider TTS')
  lines.push('───────────────────────────────────────────────────────────')
  lines.push(`   Nom: ${result.provider.name}`)
  lines.push(`   Actif: ${result.provider.isActive ? '✅' : '❌'}`)
  lines.push(`   Disponible: ${result.provider.isAvailable ? '✅' : '❌'}`)
  lines.push(`   Voix totales: ${result.provider.totalVoices}`)
  lines.push(`   - Voix de base: ${result.provider.baseVoices}`)
  lines.push(`   - Profils: ${result.provider.profileVoices}`)
  if (result.provider.obsoleteVoices.length > 0) {
    lines.push(`   ⚠️  Voix obsolètes: ${result.provider.obsoleteVoices.join(', ')}`)
  }
  lines.push('')

  // Cache
  lines.push('───────────────────────────────────────────────────────────')
  lines.push('💾 Cache Audio')
  lines.push('───────────────────────────────────────────────────────────')
  lines.push(`   Entrées: ${result.cache.totalEntries}`)
  lines.push(`   Taille: ${result.cache.totalSizeMB.toFixed(2)} MB`)
  lines.push(`   Voix en cache: ${result.cache.voiceCount}`)
  if (result.cache.largestVoiceId) {
    lines.push(
      `   Plus grande voix: ${result.cache.largestVoiceId} (${result.cache.largestVoiceSizeMB.toFixed(2)} MB)`
    )
  }
  lines.push('')

  // Profils
  lines.push('───────────────────────────────────────────────────────────')
  lines.push('🎭 Profils Vocaux')
  lines.push('───────────────────────────────────────────────────────────')
  lines.push(`   Total: ${result.profiles.totalProfiles}`)
  lines.push(`   - Masculins: ${result.profiles.profilesByGender.male}`)
  lines.push(`   - Féminins: ${result.profiles.profilesByGender.female}`)
  lines.push(`   Par voix de base:`)
  Object.entries(result.profiles.profilesByBaseVoice).forEach(([voiceId, count]) => {
    lines.push(`      - ${voiceId}: ${count} profil(s)`)
  })
  if (result.profiles.invalidProfiles.length > 0) {
    lines.push(`   ⚠️  Profils invalides: ${result.profiles.invalidProfiles.join(', ')}`)
  }
  lines.push('')

  // Paramètres de pièces
  if (result.playSettings.totalPlays > 0) {
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('📄 Paramètres de Pièces')
    lines.push('───────────────────────────────────────────────────────────')
    lines.push(`   Total de pièces: ${result.playSettings.totalPlays}`)
    lines.push(`   Pièces nécessitant migration: ${result.playSettings.playsNeedingMigration}`)
    if (Object.keys(result.playSettings.obsoleteVoiceUsage).length > 0) {
      lines.push(`   Utilisation de voix obsolètes:`)
      Object.entries(result.playSettings.obsoleteVoiceUsage).forEach(([voiceId, count]) => {
        lines.push(`      - ${voiceId}: ${count} personnage(s)`)
      })
    }
    lines.push('')
  }

  // Problèmes détectés
  if (result.issues.length > 0) {
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('⚠️  Problèmes Détectés')
    lines.push('───────────────────────────────────────────────────────────')

    const criticalIssues = result.issues.filter((i) => i.severity === 'critical')
    const warningIssues = result.issues.filter((i) => i.severity === 'warning')
    const infoIssues = result.issues.filter((i) => i.severity === 'info')

    if (criticalIssues.length > 0) {
      lines.push('')
      lines.push('🔴 CRITIQUES:')
      criticalIssues.forEach((issue, index) => {
        lines.push(`   ${index + 1}. [${issue.category.toUpperCase()}] ${issue.message}`)
        if (issue.details) {
          lines.push(`      ${issue.details}`)
        }
      })
    }

    if (warningIssues.length > 0) {
      lines.push('')
      lines.push('⚠️  AVERTISSEMENTS:')
      warningIssues.forEach((issue, index) => {
        lines.push(`   ${index + 1}. [${issue.category.toUpperCase()}] ${issue.message}`)
        if (issue.details) {
          lines.push(`      ${issue.details}`)
        }
      })
    }

    if (infoIssues.length > 0) {
      lines.push('')
      lines.push('ℹ️  INFORMATIONS:')
      infoIssues.forEach((issue, index) => {
        lines.push(`   ${index + 1}. [${issue.category.toUpperCase()}] ${issue.message}`)
        if (issue.details) {
          lines.push(`      ${issue.details}`)
        }
      })
    }

    lines.push('')
  } else {
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('✅ Aucun problème détecté')
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('')
  }

  // Recommandations
  if (result.status !== 'ok') {
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('💡 Recommandations')
    lines.push('───────────────────────────────────────────────────────────')

    if (result.provider.obsoleteVoices.length > 0) {
      lines.push('   • Retirer les voix obsolètes de la liste des voix')
    }

    if (result.playSettings.playsNeedingMigration > 0) {
      lines.push('   • Appliquer les migrations automatiques (se fait au chargement)')
    }

    if (result.cache.totalSizeMB > 100) {
      lines.push('   • Nettoyer le cache audio (audioCacheService.clearCache())')
    }

    if (result.profiles.invalidProfiles.length > 0) {
      lines.push('   • Corriger ou supprimer les profils invalides')
    }

    lines.push('')
  }

  lines.push('═══════════════════════════════════════════════════════════')

  return lines.join('\n')
}

/**
 * Exécute un diagnostic complet et affiche le rapport dans la console
 */
export async function logSystemDiagnostics(
  allPlaySettings?: Record<string, PlaySettings>
): Promise<void> {
  const result = await runSystemDiagnostics(allPlaySettings)
  const report = formatSystemDiagnosticReport(result)
  console.warn(report)
}

/**
 * Exécute un diagnostic rapide et retourne uniquement le statut
 */
export async function quickHealthCheck(): Promise<{
  healthy: boolean
  status: 'ok' | 'warning' | 'error'
  criticalIssues: number
}> {
  const result = await runSystemDiagnostics()

  return {
    healthy: result.status === 'ok',
    status: result.status,
    criticalIssues: result.summary.criticalIssues,
  }
}

/**
 * Actions de réparation automatiques
 */
export async function autoRepair(): Promise<{
  success: boolean
  actionsPerformed: string[]
  errors: string[]
}> {
  const actionsPerformed: string[] = []
  const errors: string[] = []

  try {
    // 1. Nettoyer le cache des voix obsolètes
    const cacheStats = await audioCacheService.getCacheStats()
    for (const voiceId of Object.keys(cacheStats.byVoice)) {
      if (isObsoleteVoice(voiceId)) {
        try {
          const deleted = await audioCacheService.deleteByVoiceId(voiceId)
          actionsPerformed.push(`Cache nettoyé pour ${voiceId} (${deleted} entrées)`)
        } catch (err) {
          errors.push(`Erreur lors du nettoyage du cache pour ${voiceId}: ${err}`)
        }
      }
    }

    // 2. Vérifier et réinitialiser le provider si nécessaire
    const provider = ttsProviderManager.getActiveProvider()
    if (!provider) {
      errors.push('Aucun provider TTS actif - nécessite une intervention manuelle')
    } else {
      const availability = await provider.checkAvailability()
      if (!availability.available) {
        try {
          await provider.initialize()
          actionsPerformed.push('Provider TTS réinitialisé')
        } catch (err) {
          errors.push(`Erreur lors de la réinitialisation du provider: ${err}`)
        }
      }
    }

    return {
      success: errors.length === 0,
      actionsPerformed,
      errors,
    }
  } catch (err) {
    return {
      success: false,
      actionsPerformed,
      errors: [`Erreur globale lors de la réparation: ${err}`],
    }
  }
}
