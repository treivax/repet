/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useCallback, useRef } from 'react'
import { voicePreloadService } from '../core/tts/services/VoicePreloadService'
import { audioPrefetchService } from '../core/tts/services/AudioPrefetchService'
import { ttsMetricsService } from '../core/tts/services/TTSMetricsService'
import { ttsProviderManager } from '../core/tts/providers'
import type { Line } from '../core/models/Line'

export interface AudioOptimizationConfig {
  /** Activer le préchargement des voix */
  enableVoicePreload?: boolean
  /** Activer le prefetch des répliques */
  enablePrefetch?: boolean
  /** Nombre de répliques à préfetch */
  prefetchLookahead?: number
  /** Afficher les rapports de métriques */
  enableMetricsReports?: boolean
  /** Intervalle des rapports de métriques (ms) */
  metricsReportInterval?: number
}

export interface VoiceUsageMap {
  [voiceId: string]: number
}

/**
 * Hook pour optimiser la génération audio via preload et prefetch
 *
 * Phase 1 Optimizations:
 * - Preload: Précharge les sessions des voix utilisées dans la scène
 * - Prefetch: Génère en arrière-plan les 2-3 prochaines répliques
 * - Metrics: Track des performances (sessionLoadTime, inferenceTime, cacheHitRate)
 */
export function useAudioOptimization(config: AudioOptimizationConfig = {}) {
  const {
    enableVoicePreload = true,
    enablePrefetch = true,
    prefetchLookahead = 3,
    enableMetricsReports = false,
    metricsReportInterval = 30000, // 30s
  } = config

  const metricsIntervalRef = useRef<number | null>(null)
  const isInitializedRef = useRef(false)

  // Supprimer variable non utilisée maxConcurrent

  /**
   * Initialise les services
   */
  useEffect(() => {
    if (isInitializedRef.current) return

    const provider = ttsProviderManager.getActiveProvider()
    if (!provider) {
      console.warn('[AudioOptimization] ⚠️ Aucun provider TTS actif')
      return
    }

    // Configurer les services
    voicePreloadService.setProvider(provider)
    audioPrefetchService.setProvider(provider)
    audioPrefetchService.setLookahead(prefetchLookahead)

    isInitializedRef.current = true

    console.warn('[AudioOptimization] ✅ Services initialisés')
    console.warn(`  - Voice Preload: ${enableVoicePreload ? 'activé' : 'désactivé'}`)
    console.warn(
      `  - Audio Prefetch: ${enablePrefetch ? 'activé' : 'désactivé'} (lookahead: ${prefetchLookahead})`
    )
    console.warn(`  - Metrics Reports: ${enableMetricsReports ? 'activé' : 'désactivé'}`)

    // Configurer les rapports de métriques périodiques
    if (enableMetricsReports) {
      metricsIntervalRef.current = window.setInterval(() => {
        ttsMetricsService.printReport()
      }, metricsReportInterval)
    }

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
        metricsIntervalRef.current = null
      }
    }
  }, [
    enableVoicePreload,
    enablePrefetch,
    prefetchLookahead,
    enableMetricsReports,
    metricsReportInterval,
  ])

  /**
   * Analyse les voix utilisées dans une scène
   */
  const analyzeSceneVoices = useCallback(
    (lines: Line[], voiceAssignments: Record<string, string>): VoiceUsageMap => {
      const voiceUsage: VoiceUsageMap = {}

      for (const line of lines) {
        if (line.type === 'dialogue' && line.characterId) {
          const voiceId = voiceAssignments[line.characterId]
          if (voiceId) {
            voiceUsage[voiceId] = (voiceUsage[voiceId] || 0) + 1
          }
        }
      }

      return voiceUsage
    },
    []
  )

  /**
   * Précharge les voix d'une scène
   */
  const preloadSceneVoices = useCallback(
    async (voiceUsage: VoiceUsageMap, maxVoices = 5) => {
      if (!enableVoicePreload) {
        console.warn('[AudioOptimization] Preload désactivé')
        return
      }

      const usageMap = new Map(Object.entries(voiceUsage))

      console.warn('[AudioOptimization] 📥 Début du préchargement des voix...')
      const result = await voicePreloadService.preloadSceneVoices(usageMap, maxVoices)

      console.warn('[AudioOptimization] ✅ Préchargement terminé:', {
        loaded: result.loaded.length,
        cached: result.cached.length,
        failed: result.failed.length,
        totalTime: result.totalTime,
      })

      return result
    },
    [enableVoicePreload]
  )

  /**
   * Préfetch les N prochaines répliques
   *
   * Note: Cette fonction doit être adaptée selon la structure de données de votre app.
   * Utilisez directement audioPrefetchService.prefetchNext() avec vos données.
   */
  const prefetchNextLines = useCallback(
    (
      items: Array<{ id: string; text: string; voiceId: string }>,
      options?: {
        rate?: number
        pitch?: number
        volume?: number
      }
    ) => {
      if (!enablePrefetch) {
        return
      }

      const itemsToPrefetch = items.map((item) => ({
        ...item,
        options,
      }))

      if (itemsToPrefetch.length > 0) {
        console.warn(`[AudioOptimization] ⚡ Ajout de ${itemsToPrefetch.length} items au prefetch`)
        audioPrefetchService.prefetchNext(itemsToPrefetch)
      }
    },
    [enablePrefetch]
  )

  /**
   * Annule tous les prefetch en cours
   */
  const cancelAllPrefetch = useCallback(() => {
    audioPrefetchService.cancelAll()
  }, [])

  /**
   * Annule le préchargement des voix
   */
  const cancelVoicePreload = useCallback(() => {
    voicePreloadService.cancelPreload()
  }, [])

  /**
   * Récupère les statistiques de performance
   */
  const getMetricsStats = useCallback(() => {
    return ttsMetricsService.getStats()
  }, [])

  /**
   * Affiche un rapport de performance
   */
  const printMetricsReport = useCallback(() => {
    ttsMetricsService.printReport()
  }, [])

  /**
   * Réinitialise les métriques
   */
  const resetMetrics = useCallback(() => {
    ttsMetricsService.reset()
  }, [])

  return {
    // Analyse
    analyzeSceneVoices,

    // Preload
    preloadSceneVoices,
    cancelVoicePreload,

    // Prefetch
    prefetchNextLines,
    cancelAllPrefetch,

    // Métriques
    getMetricsStats,
    printMetricsReport,
    resetMetrics,
  }
}
