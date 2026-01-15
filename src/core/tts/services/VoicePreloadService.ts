/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { TTSProvider } from '../types'
import { ttsMetricsService } from './TTSMetricsService'

/**
 * Configuration de préchargement pour une scène
 */
export interface PreloadConfig {
  /** IDs des voix à précharger */
  voiceIds: string[]
  /** Priorité (0 = haute, plus élevé = plus basse) */
  priority?: number
  /** Callback de progression */
  onProgress?: (voiceId: string, percent: number) => void
  /** Callback de fin */
  onComplete?: (voiceId: string) => void
  /** Callback d'erreur */
  onError?: (voiceId: string, error: Error) => void
}

/**
 * Résultat du préchargement
 */
export interface PreloadResult {
  /** Voix préchargées avec succès */
  loaded: string[]
  /** Voix déjà en cache */
  cached: string[]
  /** Voix échouées */
  failed: Array<{ voiceId: string; error: string }>
  /** Temps total (ms) */
  totalTime: number
}

/**
 * Service de préchargement des voix
 *
 * Précharge les sessions TTS pour les voix utilisées dans une scène,
 * réduisant ainsi le temps de première lecture.
 *
 * Stratégie :
 * - Au chargement d'une scène, détecte toutes les voix utilisées
 * - Précharge les 2-3 voix les plus fréquentes en priorité
 * - Précharge les autres voix en arrière-plan
 * - Évite de précharger si déjà en cache
 */
export class VoicePreloadService {
  private provider: TTSProvider | null = null
  private preloadingInProgress = false
  private preloadQueue: string[] = []
  private abortController: AbortController | null = null

  /**
   * Initialise le service avec un provider TTS
   */
  setProvider(provider: TTSProvider): void {
    this.provider = provider
  }

  /**
   * Précharge les voix spécifiées
   */
  async preloadVoices(config: PreloadConfig): Promise<PreloadResult> {
    if (!this.provider) {
      throw new Error('Provider TTS non configuré')
    }

    // Vérifier que le provider supporte le préchargement
    if (!this.provider.preloadModel) {
      console.warn('[VoicePreload] ⚠️ Provider ne supporte pas le préchargement')
      return {
        loaded: [],
        cached: [],
        failed: [],
        totalTime: 0,
      }
    }

    const startTime = Date.now()
    const result: PreloadResult = {
      loaded: [],
      cached: [],
      failed: [],
      totalTime: 0,
    }

    // Annuler tout préchargement en cours
    if (this.preloadingInProgress) {
      console.warn('[VoicePreload] ⚠️ Préchargement déjà en cours, annulation...')
      this.cancelPreload()
    }

    this.preloadingInProgress = true
    this.abortController = new AbortController()
    this.preloadQueue = [...config.voiceIds]

    // console.group('[VoicePreload] 📥 Début du préchargement')
    console.warn(`Voix à précharger: ${config.voiceIds.length}`, config.voiceIds)

    // Précharger chaque voix séquentiellement
    for (const voiceId of config.voiceIds) {
      // Vérifier si annulé
      if (this.abortController.signal.aborted) {
        console.warn('[VoicePreload] 🛑 Préchargement annulé')
        break
      }

      try {
        const voiceStartTime = Date.now()

        // Précharger le modèle
        await this.provider.preloadModel(voiceId, (percent) => {
          config.onProgress?.(voiceId, percent)
        })

        const voiceLoadTime = Date.now() - voiceStartTime

        // Vérifier si c'était déjà en cache (temps très court < 50ms)
        if (voiceLoadTime < 50) {
          result.cached.push(voiceId)
          console.warn(`[VoicePreload] ✅ ${voiceId} déjà en cache (${voiceLoadTime}ms)`)
        } else {
          result.loaded.push(voiceId)
          ttsMetricsService.recordPreload(voiceId, voiceLoadTime)
          console.warn(`[VoicePreload] ✅ ${voiceId} préchargé (${voiceLoadTime}ms)`)
        }

        config.onComplete?.(voiceId)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        result.failed.push({ voiceId, error: errorMessage })
        config.onError?.(voiceId, error instanceof Error ? error : new Error(errorMessage))
        console.error(`[VoicePreload] ❌ Échec pour ${voiceId}:`, errorMessage)
      }

      // Retirer de la queue
      this.preloadQueue = this.preloadQueue.filter((id) => id !== voiceId)
    }

    this.preloadingInProgress = false
    this.abortController = null
    result.totalTime = Date.now() - startTime

    console.warn(
      `[VoicePreload] ✅ Préchargement terminé: ${result.loaded.length} chargées, ${result.cached.length} en cache, ${result.failed.length} échecs (${result.totalTime}ms)`
    )
    // console.groupEnd()

    return result
  }

  /**
   * Précharge les voix d'une scène en fonction de leur fréquence
   *
   * @param voiceUsage Map de voiceId -> nombre d'occurrences
   * @param maxVoices Nombre maximum de voix à précharger (défaut: 5)
   */
  async preloadSceneVoices(
    voiceUsage: Map<string, number>,
    maxVoices = 5,
    onProgress?: (voiceId: string, percent: number) => void
  ): Promise<PreloadResult> {
    // Trier les voix par fréquence d'utilisation (décroissant)
    const sortedVoices = Array.from(voiceUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])
      .slice(0, maxVoices)

    console.warn(
      '[VoicePreload] 🎯 Préchargement des voix prioritaires:',
      sortedVoices.map((id) => `${id} (${voiceUsage.get(id)} occurrences)`)
    )

    return this.preloadVoices({
      voiceIds: sortedVoices,
      onProgress,
    })
  }

  /**
   * Annule le préchargement en cours
   */
  cancelPreload(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.preloadingInProgress = false
    this.preloadQueue = []
    console.warn('[VoicePreload] 🛑 Préchargement annulé')
  }

  /**
   * Vérifie si un préchargement est en cours
   */
  isPreloading(): boolean {
    return this.preloadingInProgress
  }

  /**
   * Récupère la queue de préchargement actuelle
   */
  getPreloadQueue(): string[] {
    return [...this.preloadQueue]
  }
}

/**
 * Instance singleton du service de préchargement
 */
export const voicePreloadService = new VoicePreloadService()
