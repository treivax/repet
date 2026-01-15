/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Métriques de performance TTS pour une opération de synthèse
 */
export interface TTSMetrics {
  /** Temps de chargement de la session ONNX (ms) */
  sessionLoadTime?: number
  /** Temps d'inférence/synthèse (ms) */
  inferenceTime: number
  /** Temps total de l'opération (ms) */
  totalTime: number
  /** Si l'audio provenait du cache */
  fromCache: boolean
  /** ID de la voix utilisée */
  voiceId: string
  /** Longueur du texte (caractères) */
  textLength: number
  /** Taille de l'audio généré (bytes) */
  audioSize?: number
  /** Timestamp de l'opération */
  timestamp: number
}

/**
 * Statistiques agrégées des métriques TTS
 */
export interface TTSMetricsStats {
  /** Nombre total d'opérations */
  totalOperations: number
  /** Nombre d'opérations depuis le cache */
  cacheHits: number
  /** Nombre d'opérations avec synthèse */
  cacheMisses: number
  /** Taux de cache (0-1) */
  cacheHitRate: number
  /** Temps moyen de chargement de session (ms) */
  avgSessionLoadTime: number
  /** Temps moyen d'inférence (ms) */
  avgInferenceTime: number
  /** Temps total moyen (ms) */
  avgTotalTime: number
  /** Temps total moyen pour cache hits (ms) */
  avgCacheHitTime: number
  /** Temps total moyen pour cache misses (ms) */
  avgCacheMissTime: number
  /** Nombre de sessions préchargées */
  preloadedSessions: number
  /** Nombre de préfetch réussis */
  prefetchSuccesses: number
  /** Nombre de préfetch échoués */
  prefetchFailures: number
}

/**
 * Service de métriques de performance TTS
 *
 * Permet de suivre les performances de génération audio :
 * - Temps de chargement des sessions ONNX
 * - Temps d'inférence
 * - Taux de cache
 * - Efficacité du preload/prefetch
 */
export class TTSMetricsService {
  private metrics: TTSMetrics[] = []
  private maxMetrics = 1000 // Garder les 1000 dernières métriques
  private preloadedSessionsCount = 0
  private prefetchSuccessCount = 0
  private prefetchFailureCount = 0

  /**
   * Enregistre une métrique de synthèse
   */
  recordSynthesis(metrics: Omit<TTSMetrics, 'timestamp'>): void {
    const record: TTSMetrics = {
      ...metrics,
      timestamp: Date.now(),
    }

    this.metrics.push(record)

    // Limiter la taille du tableau
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log pour debug
    if (metrics.fromCache) {
      console.warn(
        `[TTSMetrics] ✅ Cache hit - voiceId: ${metrics.voiceId}, totalTime: ${metrics.totalTime}ms`
      )
    } else {
      console.warn(
        `[TTSMetrics] 🔄 Cache miss - voiceId: ${metrics.voiceId}, sessionLoad: ${metrics.sessionLoadTime}ms, inference: ${metrics.inferenceTime}ms, total: ${metrics.totalTime}ms`
      )
    }
  }

  /**
   * Enregistre un préchargement de session
   */
  recordPreload(voiceId: string, loadTime: number): void {
    this.preloadedSessionsCount++
    console.warn(
      `[TTSMetrics] 📥 Session préchargée - voiceId: ${voiceId}, loadTime: ${loadTime}ms (total: ${this.preloadedSessionsCount})`
    )
  }

  /**
   * Enregistre un succès de prefetch
   */
  recordPrefetchSuccess(voiceId: string, textLength: number): void {
    this.prefetchSuccessCount++
    console.warn(
      `[TTSMetrics] ⚡ Prefetch réussi - voiceId: ${voiceId}, textLength: ${textLength} chars (total: ${this.prefetchSuccessCount})`
    )
  }

  /**
   * Enregistre un échec de prefetch
   */
  recordPrefetchFailure(voiceId: string, error: string): void {
    this.prefetchFailureCount++
    console.warn(
      `[TTSMetrics] ❌ Prefetch échoué - voiceId: ${voiceId}, error: ${error} (total: ${this.prefetchFailureCount})`
    )
  }

  /**
   * Calcule les statistiques agrégées
   */
  getStats(timeWindowMs?: number): TTSMetricsStats {
    let metricsToAnalyze = this.metrics

    // Filtrer par fenêtre temporelle si spécifiée
    if (timeWindowMs !== undefined) {
      const cutoffTime = Date.now() - timeWindowMs
      metricsToAnalyze = this.metrics.filter((m) => m.timestamp >= cutoffTime)
    }

    const totalOperations = metricsToAnalyze.length
    const cacheHits = metricsToAnalyze.filter((m) => m.fromCache).length
    const cacheMisses = totalOperations - cacheHits

    const cacheHitMetrics = metricsToAnalyze.filter((m) => m.fromCache)
    const cacheMissMetrics = metricsToAnalyze.filter((m) => !m.fromCache)

    // Calculer les moyennes
    const avgSessionLoadTime =
      cacheMissMetrics.length > 0
        ? cacheMissMetrics.reduce((sum, m) => sum + (m.sessionLoadTime || 0), 0) /
          cacheMissMetrics.length
        : 0

    const avgInferenceTime =
      cacheMissMetrics.length > 0
        ? cacheMissMetrics.reduce((sum, m) => sum + m.inferenceTime, 0) / cacheMissMetrics.length
        : 0

    const avgTotalTime =
      totalOperations > 0
        ? metricsToAnalyze.reduce((sum, m) => sum + m.totalTime, 0) / totalOperations
        : 0

    const avgCacheHitTime =
      cacheHitMetrics.length > 0
        ? cacheHitMetrics.reduce((sum, m) => sum + m.totalTime, 0) / cacheHitMetrics.length
        : 0

    const avgCacheMissTime =
      cacheMissMetrics.length > 0
        ? cacheMissMetrics.reduce((sum, m) => sum + m.totalTime, 0) / cacheMissMetrics.length
        : 0

    return {
      totalOperations,
      cacheHits,
      cacheMisses,
      cacheHitRate: totalOperations > 0 ? cacheHits / totalOperations : 0,
      avgSessionLoadTime: Math.round(avgSessionLoadTime),
      avgInferenceTime: Math.round(avgInferenceTime),
      avgTotalTime: Math.round(avgTotalTime),
      avgCacheHitTime: Math.round(avgCacheHitTime),
      avgCacheMissTime: Math.round(avgCacheMissTime),
      preloadedSessions: this.preloadedSessionsCount,
      prefetchSuccesses: this.prefetchSuccessCount,
      prefetchFailures: this.prefetchFailureCount,
    }
  }

  /**
   * Affiche un rapport des métriques
   */
  printReport(timeWindowMs?: number): void {
    const stats = this.getStats(timeWindowMs)

    // console.group('[TTSMetrics] 📊 Rapport de performance')
    console.warn(`📈 Opérations totales: ${stats.totalOperations}`)
    console.warn(
      `✅ Cache hits: ${stats.cacheHits} (${(stats.cacheHitRate * 100).toFixed(1)}%)`
    )
    console.warn(`🔄 Cache misses: ${stats.cacheMisses}`)
    console.warn(`⏱️  Temps moyen total: ${stats.avgTotalTime}ms`)
    console.warn(`⚡ Temps moyen (cache hit): ${stats.avgCacheHitTime}ms`)
    console.warn(`🐢 Temps moyen (cache miss): ${stats.avgCacheMissTime}ms`)
    console.warn(`🔧 Temps moyen chargement session: ${stats.avgSessionLoadTime}ms`)
    console.warn(`🎤 Temps moyen inférence: ${stats.avgInferenceTime}ms`)
    console.warn(`📥 Sessions préchargées: ${stats.preloadedSessions}`)
    console.warn(`⚡ Prefetch réussis: ${stats.prefetchSuccesses}`)
    console.warn(`❌ Prefetch échoués: ${stats.prefetchFailures}`)
    // console.groupEnd()
  }

  /**
   * Réinitialise les métriques
   */
  reset(): void {
    this.metrics = []
    this.preloadedSessionsCount = 0
    this.prefetchSuccessCount = 0
    this.prefetchFailureCount = 0
    console.warn('[TTSMetrics] 🔄 Métriques réinitialisées')
  }

  /**
   * Exporte les métriques brutes
   */
  exportRawMetrics(): TTSMetrics[] {
    return [...this.metrics]
  }
}

/**
 * Instance singleton du service de métriques
 */
export const ttsMetricsService = new TTSMetricsService()
