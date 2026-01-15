/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { TTSProvider, SynthesisOptions } from '../types'

/**
 * Segment de texte pour le streaming
 */
export interface TextSegment {
  /** Index du segment */
  index: number
  /** Texte du segment */
  text: string
  /** Position de début dans le texte original */
  startOffset: number
  /** Position de fin dans le texte original */
  endOffset: number
}

/**
 * Segment audio généré
 */
export interface AudioSegment {
  /** Index du segment */
  index: number
  /** Élément audio */
  audio: HTMLAudioElement
  /** Durée (ms) */
  duration: number
  /** Blob audio */
  blob: Blob
}

/**
 * Options de streaming
 */
export interface StreamingOptions {
  /** Options de synthèse */
  synthesisOptions: SynthesisOptions
  /** Taille minimale de segment (caractères) */
  minSegmentSize?: number
  /** Taille maximale de segment (caractères) */
  maxSegmentSize?: number
  /** Callback de progression */
  onSegmentReady?: (segment: AudioSegment) => void
  /** Callback de fin */
  onComplete?: () => void
  /** Callback d'erreur */
  onError?: (error: Error) => void
}

/**
 * Service de streaming audio progressif
 *
 * Phase 2 Optimization: Segmente les longues répliques et génère l'audio
 * segment par segment, permettant de commencer la lecture du premier segment
 * pendant que les suivants sont encore en cours de génération.
 *
 * Stratégie:
 * - Segmente le texte aux limites de phrases (., !, ?, ;)
 * - Génère les segments en parallèle (2-3 à la fois)
 * - Retourne le premier segment dès qu'il est prêt
 * - Continue la génération en arrière-plan
 * - Gère la mise en cache de chaque segment
 */
export class AudioStreamingService {
  private provider: TTSProvider | null = null
  private minSegmentSize = 50 // Caractères minimum par segment
  private maxSegmentSize = 200 // Caractères maximum par segment
  private maxConcurrentGeneration = 2 // Nombre de segments à générer en parallèle

  /**
   * Initialise le service avec un provider TTS
   */
  setProvider(provider: TTSProvider): void {
    this.provider = provider
  }

  /**
   * Configure la taille des segments
   */
  setSegmentSize(min: number, max: number): void {
    this.minSegmentSize = Math.max(20, min)
    this.maxSegmentSize = Math.max(this.minSegmentSize, max)
    console.warn(
      `[AudioStreaming] 🔧 Segment size configuré: ${this.minSegmentSize}-${this.maxSegmentSize} chars`
    )
  }

  /**
   * Configure le nombre de générations parallèles
   */
  setMaxConcurrent(count: number): void {
    this.maxConcurrentGeneration = Math.max(1, Math.min(5, count))
    console.warn(`[AudioStreaming] 🔧 Concurrent generation: ${this.maxConcurrentGeneration}`)
  }

  /**
   * Segmente un texte en morceaux adaptés au streaming
   */
  segmentText(text: string): TextSegment[] {
    const segments: TextSegment[] = []

    // Nettoyer le texte
    const cleanText = text.trim()
    if (cleanText.length === 0) {
      return segments
    }

    // Si le texte est court, pas besoin de segmenter
    if (cleanText.length <= this.maxSegmentSize) {
      return [
        {
          index: 0,
          text: cleanText,
          startOffset: 0,
          endOffset: cleanText.length,
        },
      ]
    }

    // Délimiteurs de phrases par ordre de priorité
    const sentenceDelimiters = ['. ', '! ', '? ', '; ', ', ', ' ']

    let currentOffset = 0
    let segmentIndex = 0

    while (currentOffset < cleanText.length) {
      const segmentEnd = currentOffset + this.maxSegmentSize

      // Si on arrive à la fin du texte
      if (segmentEnd >= cleanText.length) {
        const remainingText = cleanText.substring(currentOffset).trim()
        if (remainingText.length > 0) {
          segments.push({
            index: segmentIndex++,
            text: remainingText,
            startOffset: currentOffset,
            endOffset: cleanText.length,
          })
        }
        break
      }

      // Chercher un délimiteur approprié
      let bestSplitPoint = -1
      for (const delimiter of sentenceDelimiters) {
        const searchEnd = Math.min(segmentEnd, cleanText.length)
        const searchStart = Math.max(currentOffset + this.minSegmentSize, currentOffset)
        const substring = cleanText.substring(searchStart, searchEnd)
        const lastIndex = substring.lastIndexOf(delimiter)

        if (lastIndex !== -1) {
          bestSplitPoint = searchStart + lastIndex + delimiter.length
          break
        }
      }

      // Si aucun délimiteur trouvé, couper au maximum
      if (bestSplitPoint === -1) {
        bestSplitPoint = segmentEnd
      }

      // Créer le segment
      const segmentText = cleanText.substring(currentOffset, bestSplitPoint).trim()
      if (segmentText.length > 0) {
        segments.push({
          index: segmentIndex++,
          text: segmentText,
          startOffset: currentOffset,
          endOffset: bestSplitPoint,
        })
      }

      currentOffset = bestSplitPoint
    }

    console.warn(
      `[AudioStreaming] 📄 Texte segmenté: ${segments.length} segments (${cleanText.length} chars)`
    )

    return segments
  }

  /**
   * Génère l'audio pour un segment
   */
  private async generateSegment(
    segment: TextSegment,
    options: SynthesisOptions
  ): Promise<AudioSegment> {
    if (!this.provider) {
      throw new Error('Provider TTS non configuré')
    }

    const startTime = Date.now()

    console.warn(
      `[AudioStreaming] 🎤 Génération segment ${segment.index}: "${segment.text.substring(0, 30)}..." (${segment.text.length} chars)`
    )

    const result = await this.provider.synthesize(segment.text, options)
    const duration = Date.now() - startTime

    console.warn(
      `[AudioStreaming] ✅ Segment ${segment.index} généré (${duration}ms, fromCache: ${result.fromCache})`
    )

    // Créer le blob depuis l'audio
    const audioSrc = result.audio.src
    const response = await fetch(audioSrc)
    const blob = await response.blob()

    return {
      index: segment.index,
      audio: result.audio,
      duration,
      blob,
    }
  }

  /**
   * Génère l'audio en mode streaming
   *
   * Retourne le premier segment dès qu'il est prêt,
   * continue la génération des autres en arrière-plan
   */
  async streamAudio(text: string, options: StreamingOptions): Promise<AudioSegment[]> {
    if (!this.provider) {
      throw new Error('Provider TTS non configuré')
    }

    // console.group('[AudioStreaming] 🚀 Début du streaming audio')
    console.warn(`Texte: "${text.substring(0, 50)}..." (${text.length} chars)`)

    const segments = this.segmentText(text)
    const audioSegments: AudioSegment[] = []

    if (segments.length === 0) {
      console.warn('[AudioStreaming] ⚠️ Aucun segment à générer')
      // console.groupEnd()
      return audioSegments
    }

    try {
      // Générer les segments avec un pool de concurrence
      const promises: Promise<void>[] = []
      let activeGenerations = 0
      let completedCount = 0

      for (let i = 0; i < segments.length; i++) {
        // Attendre qu'un slot se libère si on a atteint le max
        while (activeGenerations >= this.maxConcurrentGeneration) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        activeGenerations++

        const segment = segments[i]
        const promise = this.generateSegment(segment, options.synthesisOptions)
          .then((audioSegment) => {
            audioSegments[segment.index] = audioSegment
            completedCount++
            activeGenerations--

            // Notifier que le segment est prêt
            options.onSegmentReady?.(audioSegment)

            console.warn(
              `[AudioStreaming] 📊 Progression: ${completedCount}/${segments.length} segments`
            )
          })
          .catch((error) => {
            activeGenerations--
            const err = error instanceof Error ? error : new Error(String(error))
            console.error(`[AudioStreaming] ❌ Erreur segment ${segment.index}:`, err.message)
            options.onError?.(err)
            throw err
          })

        promises.push(promise)
      }

      // Attendre que tous les segments soient générés
      await Promise.all(promises)

      console.warn(`[AudioStreaming] ✅ Tous les segments générés (${audioSegments.length})`)
      // console.groupEnd()

      options.onComplete?.()

      return audioSegments
    } catch (error) {
      console.error('[AudioStreaming] ❌ Erreur lors du streaming:', error)
      // console.groupEnd()
      throw error
    }
  }

  /**
   * Vérifie si un texte devrait être streamé
   * (basé sur la longueur)
   */
  shouldStream(text: string): boolean {
    return text.length > this.maxSegmentSize * 1.5
  }

  /**
   * Estime le nombre de segments pour un texte
   */
  estimateSegmentCount(text: string): number {
    if (text.length <= this.maxSegmentSize) {
      return 1
    }
    return Math.ceil(text.length / this.maxSegmentSize)
  }
}

/**
 * Instance singleton du service de streaming
 */
export const audioStreamingService = new AudioStreamingService()
