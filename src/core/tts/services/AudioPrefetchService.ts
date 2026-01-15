/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { TTSProvider, SynthesisOptions } from '../types'
import { ttsMetricsService } from './TTSMetricsService'

/**
 * Item à préfetch
 */
export interface PrefetchItem {
  /** Identifiant unique de l'item */
  id: string
  /** Texte à synthétiser */
  text: string
  /** ID de la voix */
  voiceId: string
  /** Options de synthèse */
  options?: Partial<SynthesisOptions>
  /** Priorité (0 = haute, plus élevé = plus basse) */
  priority?: number
}

/**
 * Résultat du prefetch
 */
export interface PrefetchResult {
  /** ID de l'item */
  id: string
  /** Succès ou échec */
  success: boolean
  /** Temps de génération (ms) */
  generationTime?: number
  /** Erreur si échec */
  error?: string
}

/**
 * Service de prefetch audio
 *
 * Génère en arrière-plan les prochaines répliques pour réduire
 * le temps d'attente lors de la lecture.
 *
 * Stratégie :
 * - Génère les 2-3 prochaines répliques après chaque lecture
 * - Stocke dans le cache audio (AudioCacheService)
 * - Génération silencieuse (pas de lecture)
 * - Annulation automatique si l'utilisateur saute des répliques
 * - Priorité aux répliques proches de la position actuelle
 */
export class AudioPrefetchService {
  private provider: TTSProvider | null = null
  private prefetchQueue: PrefetchItem[] = []
  private prefetchingInProgress = false
  private abortController: AbortController | null = null
  // private maxConcurrent = 1 // Nombre de prefetch simultanés (Phase 2 - non implémenté)
  private defaultLookahead = 3 // Nombre de répliques à préfetch par défaut

  /**
   * Initialise le service avec un provider TTS
   */
  setProvider(provider: TTSProvider): void {
    this.provider = provider
  }

  /**
   * Configure le nombre de répliques à préfetch
   */
  setLookahead(count: number): void {
    this.defaultLookahead = Math.max(1, Math.min(10, count))
    console.warn(`[AudioPrefetch] 🔧 Lookahead configuré: ${this.defaultLookahead} répliques`)
  }

  /**
   * Ajoute des items à la queue de prefetch
   */
  addToPrefetchQueue(items: PrefetchItem[]): void {
    if (!this.provider) {
      console.warn('[AudioPrefetch] ⚠️ Provider TTS non configuré, prefetch ignoré')
      return
    }

    // Filtrer les doublons
    const newItems = items.filter(
      (item) => !this.prefetchQueue.some((existing) => existing.id === item.id)
    )

    if (newItems.length === 0) {
      return
    }

    // Trier par priorité (0 = haute priorité)
    newItems.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))

    this.prefetchQueue.push(...newItems)

    console.warn(
      `[AudioPrefetch] 📥 Ajout de ${newItems.length} items à la queue (total: ${this.prefetchQueue.length})`
    )

    // Démarrer le prefetch si pas déjà en cours
    if (!this.prefetchingInProgress) {
      this.processPrefetchQueue()
    }
  }

  /**
   * Préfetch les N prochaines répliques
   */
  prefetchNext(
    items: Array<{
      id: string
      text: string
      voiceId: string
      options?: Partial<SynthesisOptions>
    }>,
    count?: number
  ): void {
    const lookahead = count ?? this.defaultLookahead
    const itemsToPrefetch = items.slice(0, lookahead).map((item, index) => ({
      ...item,
      priority: index, // Priorité basée sur la position (0 = prochain)
    }))

    this.addToPrefetchQueue(itemsToPrefetch)
  }

  /**
   * Traite la queue de prefetch
   */
  private async processPrefetchQueue(): Promise<void> {
    if (!this.provider || this.prefetchingInProgress || this.prefetchQueue.length === 0) {
      return
    }

    this.prefetchingInProgress = true
    this.abortController = new AbortController()

    console.warn(`[AudioPrefetch] 🔄 Début du traitement (${this.prefetchQueue.length} items)`)

    while (this.prefetchQueue.length > 0) {
      // Vérifier si annulé
      if (this.abortController.signal.aborted) {
        console.warn('[AudioPrefetch] 🛑 Prefetch annulé')
        break
      }

      // Prendre le premier item de la queue
      const item = this.prefetchQueue.shift()
      if (!item) break

      try {
        const startTime = Date.now()

        console.warn(
          `[AudioPrefetch] ⚡ Génération silencieuse - id: ${item.id}, voiceId: ${item.voiceId}, text: "${item.text.substring(0, 30)}..."`
        )

        // Synthétiser sans jouer (génération silencieuse)
        await this.provider.synthesize(item.text, {
          voiceId: item.voiceId,
          rate: item.options?.rate ?? 1.0,
          pitch: item.options?.pitch ?? 1.0,
          volume: item.options?.volume ?? 1.0,
          isPrefetch: true, // IMPORTANT: Ne pas arrêter l'audio en cours
          // Pas de callbacks audio car on ne joue pas
          onStart: undefined,
          onEnd: undefined,
          onError: undefined,
        })

        const generationTime = Date.now() - startTime

        ttsMetricsService.recordPrefetchSuccess(item.voiceId, item.text.length)

        console.warn(
          `[AudioPrefetch] ✅ Prefetch réussi - id: ${item.id} (${generationTime}ms, ${item.text.length} chars)`
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        ttsMetricsService.recordPrefetchFailure(item.voiceId, errorMessage)
        console.error(`[AudioPrefetch] ❌ Échec prefetch - id: ${item.id}:`, errorMessage)
      }

      // Petite pause entre chaque prefetch pour ne pas bloquer
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    this.prefetchingInProgress = false
    this.abortController = null

    console.warn('[AudioPrefetch] ✅ Traitement de la queue terminé')
  }

  /**
   * Annule tous les prefetch en cours et vide la queue
   */
  cancelAll(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.prefetchQueue = []
    this.prefetchingInProgress = false
    console.warn('[AudioPrefetch] 🛑 Tous les prefetch annulés et queue vidée')
  }

  /**
   * Annule les prefetch pour des IDs spécifiques
   */
  cancelById(ids: string[]): void {
    const initialLength = this.prefetchQueue.length
    this.prefetchQueue = this.prefetchQueue.filter((item) => !ids.includes(item.id))
    const removed = initialLength - this.prefetchQueue.length

    if (removed > 0) {
      console.warn(`[AudioPrefetch] 🗑️ ${removed} items retirés de la queue`)
    }
  }

  /**
   * Vérifie si un prefetch est en cours
   */
  isPrefetching(): boolean {
    return this.prefetchingInProgress
  }

  /**
   * Récupère la taille de la queue
   */
  getQueueSize(): number {
    return this.prefetchQueue.length
  }

  /**
   * Récupère les IDs dans la queue
   */
  getQueueIds(): string[] {
    return this.prefetchQueue.map((item) => item.id)
  }

  /**
   * Vide la queue sans annuler le prefetch en cours
   */
  clearQueue(): void {
    this.prefetchQueue = []
    console.warn('[AudioPrefetch] 🗑️ Queue vidée')
  }
}

/**
 * Instance singleton du service de prefetch
 */
export const audioPrefetchService = new AudioPrefetchService()
