/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Options de compression audio
 */
export interface CompressionOptions {
  /** Format de sortie (défaut: 'webm') */
  format?: 'webm' | 'ogg'
  /** Codec audio (défaut: 'opus') */
  codec?: 'opus' | 'vorbis'
  /** Bitrate en kbps (défaut: 32) */
  bitrate?: number
  /** Sample rate en Hz (défaut: 24000) */
  sampleRate?: number
}

/**
 * Résultat de compression
 */
export interface CompressionResult {
  /** Blob compressé */
  blob: Blob
  /** Taille originale (bytes) */
  originalSize: number
  /** Taille compressée (bytes) */
  compressedSize: number
  /** Ratio de compression (0-1) */
  compressionRatio: number
  /** Temps de compression (ms) */
  compressionTime: number
}

/**
 * Service de compression audio
 *
 * Phase 2 Optimization: Compresse l'audio généré en format Opus
 * pour réduire l'espace utilisé dans IndexedDB.
 *
 * Avantages:
 * - Réduction de ~70-80% de la taille (WAV -> Opus 32kbps)
 * - Meilleure gestion du cache (plus d'audios stockables)
 * - Transferts plus rapides depuis IndexedDB
 *
 * Trade-offs:
 * - Temps de compression additionnel (~50-200ms par audio)
 * - Légère perte de qualité (acceptable pour voix synthétiques)
 * - Nécessite support navigateur pour MediaRecorder + Opus
 */
export class AudioCompressionService {
  private isSupported = false
  private supportedFormats: string[] = []

  /**
   * Initialise le service et détecte le support
   */
  async initialize(): Promise<void> {
    // Vérifier le support de MediaRecorder
    if (typeof MediaRecorder === 'undefined') {
      console.warn('[AudioCompression] ⚠️ MediaRecorder non disponible')
      this.isSupported = false
      return
    }

    // Détecter les formats supportés
    const formatsToTest = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ]

    for (const format of formatsToTest) {
      if (MediaRecorder.isTypeSupported(format)) {
        this.supportedFormats.push(format)
        console.warn(`[AudioCompression] ✅ Format supporté: ${format}`)
      }
    }

    this.isSupported = this.supportedFormats.length > 0

    if (this.isSupported) {
      console.warn(
        `[AudioCompression] ✅ Compression disponible (${this.supportedFormats.length} formats)`
      )
    } else {
      console.warn('[AudioCompression] ⚠️ Aucun format de compression supporté')
    }
  }

  /**
   * Vérifie si la compression est disponible
   */
  isAvailable(): boolean {
    return this.isSupported
  }

  /**
   * Récupère les formats supportés
   */
  getSupportedFormats(): string[] {
    return [...this.supportedFormats]
  }

  /**
   * Compresse un blob audio
   */
  async compress(
    audioBlob: Blob,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    if (!this.isSupported) {
      throw new Error('Compression audio non supportée par ce navigateur')
    }

    const startTime = Date.now()
    const originalSize = audioBlob.size

    const {
      format = 'webm',
      codec = 'opus',
      bitrate = 32, // 32 kbps = bon compromis qualité/taille pour voix
      sampleRate = 24000, // 24kHz = suffisant pour voix
    } = options

    console.warn('[AudioCompression] 🗜️ Début de la compression...')
    console.warn(`  Format: ${format}, Codec: ${codec}, Bitrate: ${bitrate}kbps`)
    console.warn(`  Taille originale: ${(originalSize / 1024).toFixed(2)} KB`)

    try {
      // Créer un contexte audio pour décoder le blob
      const audioContext = new AudioContext({ sampleRate })
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Créer une MediaStreamSource depuis le buffer
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer

      // Créer un MediaStreamDestination pour capturer l'audio
      const destination = audioContext.createMediaStreamDestination()
      source.connect(destination)

      // Déterminer le MIME type
      const mimeType = `audio/${format};codecs=${codec}`
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback au premier format supporté
        const fallbackType = this.supportedFormats[0]
        console.warn(
          `[AudioCompression] ⚠️ ${mimeType} non supporté, utilisation de ${fallbackType}`
        )
      }

      // Créer le MediaRecorder avec compression
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: this.supportedFormats.includes(mimeType)
          ? mimeType
          : this.supportedFormats[0],
        audioBitsPerSecond: bitrate * 1000,
      })

      // Collecter les chunks
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      // Promise qui se résout quand l'enregistrement est terminé
      const recordingComplete = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: mediaRecorder.mimeType })
          resolve(compressedBlob)
        }

        mediaRecorder.onerror = (event) => {
          reject(new Error(`MediaRecorder error: ${event}`))
        }

        // Timeout de sécurité (max 30s)
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop()
            reject(new Error('Compression timeout'))
          }
        }, 30000)
      })

      // Démarrer l'enregistrement
      mediaRecorder.start()

      // Jouer l'audio source (nécessaire pour que MediaRecorder capture)
      source.start(0)

      // Arrêter l'enregistrement après la durée de l'audio
      const duration = audioBuffer.duration * 1000
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
        source.stop()
        audioContext.close()
      }, duration + 100)

      // Attendre la fin de la compression
      const compressedBlob = await recordingComplete
      const compressedSize = compressedBlob.size
      const compressionRatio = compressedSize / originalSize
      const compressionTime = Date.now() - startTime

      console.warn('[AudioCompression] ✅ Compression terminée')
      console.warn(`  Taille compressée: ${(compressedSize / 1024).toFixed(2)} KB`)
      console.warn(
        `  Ratio: ${(compressionRatio * 100).toFixed(1)}% (économie: ${((1 - compressionRatio) * 100).toFixed(1)}%)`
      )
      console.warn(`  Temps: ${compressionTime}ms`)

      return {
        blob: compressedBlob,
        originalSize,
        compressedSize,
        compressionRatio,
        compressionTime,
      }
    } catch (error) {
      const compressionTime = Date.now() - startTime
      console.error('[AudioCompression] ❌ Erreur de compression:', error)

      // En cas d'erreur, retourner le blob original
      return {
        blob: audioBlob,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1.0,
        compressionTime,
      }
    }
  }

  /**
   * Compresse si bénéfique (seulement si gain > 20%)
   */
  async compressIfWorthwhile(
    audioBlob: Blob,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    if (!this.isSupported) {
      // Retourner le blob original sans compression
      return {
        blob: audioBlob,
        originalSize: audioBlob.size,
        compressedSize: audioBlob.size,
        compressionRatio: 1.0,
        compressionTime: 0,
      }
    }

    // Ne compresser que si le fichier est assez gros (> 50 KB)
    if (audioBlob.size < 50000) {
      console.warn(
        '[AudioCompression] ⏭️ Fichier trop petit pour compression (<50KB), ignoré'
      )
      return {
        blob: audioBlob,
        originalSize: audioBlob.size,
        compressedSize: audioBlob.size,
        compressionRatio: 1.0,
        compressionTime: 0,
      }
    }

    const result = await this.compress(audioBlob, options)

    // Si le gain est faible (< 20%), retourner l'original
    if (result.compressionRatio > 0.8) {
      console.warn(
        '[AudioCompression] ⏭️ Gain de compression insuffisant (<20%), original conservé'
      )
      return {
        blob: audioBlob,
        originalSize: audioBlob.size,
        compressedSize: audioBlob.size,
        compressionRatio: 1.0,
        compressionTime: result.compressionTime,
      }
    }

    return result
  }

  /**
   * Estime la taille après compression (basé sur le bitrate)
   */
  estimateCompressedSize(
    audioDurationMs: number,
    bitrate = 32 // kbps
  ): number {
    // Formule: (bitrate * duration) / 8
    // bitrate en kbps, duration en ms
    return Math.ceil((bitrate * audioDurationMs) / 8000)
  }

  /**
   * Calcule l'économie d'espace estimée
   */
  estimateSavings(
    originalSize: number,
    audioDurationMs: number,
    bitrate = 32
  ): { compressedSize: number; savings: number; savingsPercent: number } {
    const compressedSize = this.estimateCompressedSize(audioDurationMs, bitrate)
    const savings = Math.max(0, originalSize - compressedSize)
    const savingsPercent = (savings / originalSize) * 100

    return {
      compressedSize,
      savings,
      savingsPercent,
    }
  }
}

/**
 * Instance singleton du service de compression
 */
export const audioCompressionService = new AudioCompressionService()
