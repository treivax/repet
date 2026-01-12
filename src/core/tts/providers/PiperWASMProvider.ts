/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type {
  TTSProvider,
  TTSProviderAvailability,
  VoiceDescriptor,
  VoiceGender,
  SynthesisOptions,
  SynthesisResult,
} from '../types'
import { TtsSession, type VoiceId } from '@mintplex-labs/piper-tts-web'
import { audioCacheService } from '../services/AudioCacheService'
import * as ort from 'onnxruntime-web'

/**
 * Configuration d'un modèle Piper
 */
interface PiperModelConfig extends VoiceDescriptor {
  /** ID du modèle pour piper-tts-web */
  piperVoiceId: VoiceId

  /** Taille estimée du téléchargement en octets */
  downloadSize: number
}

/**
 * Configuration des modèles Piper disponibles
 */
const PIPER_MODELS: PiperModelConfig[] = [
  {
    id: 'fr_FR-siwis-medium',
    name: 'fr_FR-siwis-medium',
    displayName: 'Siwis (Femme, France)',
    language: 'fr-FR',
    gender: 'female',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: true,
    piperVoiceId: 'fr_FR-siwis-medium',
    downloadSize: 15_000_000, // ~15MB
  },
  {
    id: 'fr_FR-tom-medium',
    name: 'fr_FR-tom-medium',
    displayName: 'Tom (Homme, France)',
    language: 'fr-FR',
    gender: 'male',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: true,
    piperVoiceId: 'fr_FR-tom-medium',
    downloadSize: 15_000_000, // ~15MB
  },
  {
    id: 'fr_FR-upmc-medium',
    name: 'fr_FR-upmc-medium',
    displayName: 'UPMC Jessica (Femme, France)',
    language: 'fr-FR',
    gender: 'female',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: true,
    piperVoiceId: 'fr_FR-upmc-medium',
    downloadSize: 16_000_000, // ~16MB
  },
  {
    id: 'fr_FR-mls-medium',
    name: 'fr_FR-mls-medium',
    displayName: 'MLS Pierre (Homme, France)',
    language: 'fr-FR',
    gender: 'male',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: true,
    piperVoiceId: 'fr_FR-mls-medium',
    downloadSize: 14_000_000, // ~14MB
  },
]

/**
 * Provider TTS utilisant Piper-WASM via @mintplex-labs/piper-tts-web
 */
export class PiperWASMProvider implements TTSProvider {
  readonly type = 'piper-wasm' as const
  readonly name = 'Piper (Voix naturelles)'

  private currentSession: TtsSession | null = null
  private currentVoiceId: string | null = null
  private currentAudio: HTMLAudioElement | null = null
  private initialized = false
  private downloadProgress: Map<string, number> = new Map()
  private isPaused = false

  /**
   * Initialise le provider et le service de cache
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // Configurer ONNX Runtime pour utiliser les fichiers WASM locaux
    // Désactiver le multi-threading pour éviter les problèmes CORS
    ort.env.wasm.numThreads = 1
    ort.env.wasm.simd = true

    // Utiliser le backend WASM simple au lieu du threaded
    ort.env.wasm.wasmPaths = '/wasm/'

    // Initialiser le service de cache audio
    await audioCacheService.initialize()

    this.initialized = true
  }

  /**
   * Vérifie la disponibilité du provider
   */
  async checkAvailability(): Promise<TTSProviderAvailability> {
    // Vérifier support WebAssembly
    if (typeof WebAssembly === 'undefined') {
      return {
        available: false,
        reason: 'WebAssembly non supporté par ce navigateur',
      }
    }

    // TODO: Vérifier que le module Piper-WASM peut être chargé
    return { available: true }
  }

  /**
   * Récupère la liste des voix disponibles
   */
  getVoices(): VoiceDescriptor[] {
    return PIPER_MODELS.map((model) => ({
      id: model.id,
      name: model.name,
      displayName: model.displayName,
      language: model.language,
      gender: model.gender,
      provider: model.provider,
      quality: model.quality,
      isLocal: model.isLocal,
      requiresDownload: model.requiresDownload,
      downloadSize: model.downloadSize,
    }))
  }

  /**
   * Génère une assignation de voix pour des personnages
   * Algorithme : round-robin pour maximiser la diversité
   */
  generateVoiceAssignments(
    characters: Array<{ id: string; gender: VoiceGender }>,
    existingAssignments: Record<string, string> = {}
  ): Record<string, string> {
    const assignments: Record<string, string> = { ...existingAssignments }
    const voices = this.getVoices()
    const usageCount: Record<string, number> = {}

    console.warn('[PiperWASM] generateVoiceAssignments called with:', {
      charactersCount: characters.length,
      characters: characters,
      voicesCount: voices.length,
      voices: voices.map((v) => ({ id: v.id, name: v.displayName, gender: v.gender })),
    })

    // Compter l'utilisation actuelle
    Object.values(assignments).forEach((voiceId) => {
      usageCount[voiceId] = (usageCount[voiceId] || 0) + 1
    })

    // Pour chaque personnage sans assignation
    characters.forEach((char) => {
      if (assignments[char.id]) {
        console.warn(`[PiperWASM] ${char.id} déjà assigné: ${assignments[char.id]}`)
        return // Déjà assigné
      }

      // Filtrer voix du bon genre
      let candidateVoices = voices.filter((v) => v.gender === char.gender)
      console.warn(
        `[PiperWASM] Pour ${char.id} (${char.gender}): ${candidateVoices.length} voix candidates`,
        candidateVoices.map((v) => v.displayName)
      )

      // Fallback : toutes les voix si aucune du bon genre
      if (candidateVoices.length === 0) {
        console.warn(`[PiperWASM] Aucune voix ${char.gender}, fallback vers toutes les voix`)
        candidateVoices = voices
      }

      // Fallback ultime : si aucune voix disponible
      if (candidateVoices.length === 0) {
        console.warn(`Aucune voix Piper disponible pour le personnage ${char.id}`)
        return
      }

      // Sélectionner la voix la moins utilisée (round-robin)
      let selectedVoice = candidateVoices[0]
      let minUsage = Infinity

      candidateVoices.forEach((voice) => {
        const usage = usageCount[voice.id] || 0
        if (usage < minUsage) {
          minUsage = usage
          selectedVoice = voice
        }
      })

      // Assigner
      assignments[char.id] = selectedVoice.id
      usageCount[selectedVoice.id] = minUsage + 1
      console.warn(
        `[PiperWASM] ${char.id} assigné à ${selectedVoice.displayName} (usage: ${minUsage})`
      )
    })

    console.warn('[PiperWASM] Assignations finales:', assignments)
    return assignments
  }

  /**
   * Synthétise du texte en audio avec Piper-WASM
   */
  async synthesize(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
    const startTime = Date.now()

    console.warn(`[PiperWASM] synthesize() appelé avec voiceId: ${options.voiceId}`)

    try {
      // Vérifier le cache d'abord
      const cachedBlob = await audioCacheService.getAudio(text, options.voiceId, {
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume,
      })

      if (cachedBlob) {
        // Utiliser l'audio en cache
        const audio = new Audio(URL.createObjectURL(cachedBlob))
        audio.playbackRate = options.rate || 1
        audio.volume = options.volume || 1

        // Connecter les événements
        audio.addEventListener('play', () => options.onStart?.())
        audio.addEventListener('ended', () => options.onEnd?.())
        audio.addEventListener('error', (e) =>
          options.onError?.(new Error(`Audio error: ${e.message}`))
        )

        this.currentAudio = audio

        return {
          audio,
          duration: Date.now() - startTime,
          fromCache: true,
        }
      }

      // Pas en cache, synthétiser avec Piper
      const modelConfig = PIPER_MODELS.find((m) => m.id === options.voiceId)
      if (!modelConfig) {
        throw new Error(`Modèle Piper ${options.voiceId} non trouvé`)
      }

      // Créer une nouvelle session si la voix a changé
      let session: TtsSession
      if (this.currentVoiceId === options.voiceId && this.currentSession) {
        console.warn(`[PiperWASM] 🔄 Réutilisation de la session pour ${options.voiceId}`)
        session = this.currentSession
      } else {
        console.warn(
          `[PiperWASM] 🆕 Création d'une NOUVELLE session pour ${options.voiceId} (ancienne voix: ${this.currentVoiceId})`
        )
        session = await TtsSession.create({
          voiceId: modelConfig.piperVoiceId,
          progress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100)
            console.warn(
              `[PiperWASM] Téléchargement ${modelConfig.piperVoiceId}: ${percent}% (${progress.loaded}/${progress.total} bytes)`
            )
            this.downloadProgress.set(options.voiceId, percent)
            options.onProgress?.(percent)
          },
          logger: (msg) => console.warn(`[Piper TTS] ${msg}`),
          wasmPaths: {
            onnxWasm: '/wasm/',
            piperData:
              'https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.0/build/piper_phonemize.data',
            piperWasm:
              'https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.0/build/piper_phonemize.wasm',
          },
        })
        console.warn(`[PiperWASM] ✅ Session créée pour ${modelConfig.piperVoiceId}`)
        console.warn(
          `[PiperWASM] Session object:`,
          session,
          `voiceId interne:`,
          (session as any).voiceId
        )
        this.currentSession = session
        this.currentVoiceId = options.voiceId
      }

      // Synthétiser le texte
      console.warn(
        `[PiperWASM] 🎤 Appel de session.predict() avec la session pour ${options.voiceId} (piperVoiceId: ${modelConfig.piperVoiceId})`
      )
      console.warn(`[PiperWASM] Texte à synthétiser: "${text.substring(0, 50)}..."`)
      const audioBlob = await session.predict(text)
      console.warn(`[PiperWASM] ✅ Audio généré: ${audioBlob.size} bytes pour ${options.voiceId}`)

      // Mettre en cache
      await audioCacheService.cacheAudio(text, options.voiceId, audioBlob, {
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume,
      })

      // Créer l'élément audio
      const audio = new Audio(URL.createObjectURL(audioBlob))
      audio.playbackRate = options.rate || 1
      audio.volume = options.volume || 1

      // Connecter les événements
      audio.addEventListener('play', () => options.onStart?.())
      audio.addEventListener('ended', () => options.onEnd?.())
      audio.addEventListener('error', (e) =>
        options.onError?.(new Error(`Audio error: ${e.message}`))
      )

      this.currentAudio = audio

      return {
        audio,
        duration: Date.now() - startTime,
        fromCache: false,
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de synthèse Piper')
      options.onError?.(err)
      throw err
    }
  }

  /**
   * Obtenir la progression du téléchargement pour une voix
   */
  getDownloadProgress(voiceId: string): number {
    return this.downloadProgress.get(voiceId) || 0
  }

  /**
   * Pré-télécharger un modèle pour l'utiliser hors ligne
   */
  async preloadModel(voiceId: string, onProgress?: (percent: number) => void): Promise<void> {
    const modelConfig = PIPER_MODELS.find((m) => m.id === voiceId)
    if (!modelConfig) {
      throw new Error(`Modèle Piper ${voiceId} non trouvé`)
    }

    // Créer une session pour pré-télécharger le modèle
    await TtsSession.create({
      voiceId: modelConfig.piperVoiceId,
      progress: (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100)
        this.downloadProgress.set(voiceId, percent)
        onProgress?.(percent)
      },
    })
  }

  /**
   * Arrête la lecture en cours
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.isPaused = false
  }

  /**
   * Met en pause la lecture en cours
   */
  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause()
      this.isPaused = true
    }
  }

  /**
   * Reprend la lecture en pause
   */
  resume(): void {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play().catch((error) => {
        console.error('Erreur lors de la reprise de la lecture:', error)
      })
      this.isPaused = false
    }
  }

  /**
   * Libère les ressources
   */
  async dispose(): Promise<void> {
    this.stop()
    this.ttsSessions.clear()
    this.downloadProgress.clear()
    this.initialized = false
  }

  /**
   * Obtenir les statistiques du cache audio
   */
  async getCacheStats(): Promise<{ count: number; size: number; sizeFormatted: string }> {
    return audioCacheService.getStats()
  }

  /**
   * Vider le cache audio
   */
  async clearCache(): Promise<void> {
    await audioCacheService.clearCache()
  }
}
