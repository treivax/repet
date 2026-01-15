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
import { TtsSession, type VoiceId } from '@/lib/piper-tts-web-patched'
import { audioCacheService } from '../services/AudioCacheService'
import { ttsMetricsService } from '../services/TTSMetricsService'
import * as ort from 'onnxruntime-web'
import { ALL_VOICE_PROFILES, getVoiceProfile, applyBasicModifiers } from '../voiceProfiles'

/**
 * Configuration d'un modèle Piper
 */
interface PiperModelConfig extends VoiceDescriptor {
  /** ID du modèle pour piper-tts-web */
  piperVoiceId: VoiceId

  /** Speaker ID pour les modèles multi-speaker (optionnel, défaut: 0) */
  speakerId?: number

  /** Taille estimée du téléchargement en octets */
  downloadSize: number
}

/**
 * Configuration des modèles Piper disponibles
 * Tous les modèles sont intégrés au build pour fonctionnement déconnecté
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
    requiresDownload: false, // Déjà dans le build
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
    requiresDownload: false, // Déjà dans le build
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
    requiresDownload: false, // Déjà dans le build
    piperVoiceId: 'fr_FR-upmc-medium',
    speakerId: 0, // Jessica (speaker #0)
    downloadSize: 16_000_000, // ~16MB
  },
  {
    id: 'fr_FR-upmc-pierre-medium',
    name: 'fr_FR-upmc-pierre-medium',
    displayName: 'UPMC Pierre (Homme, France)',
    language: 'fr-FR',
    gender: 'male',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: false, // Déjà dans le build (même modèle que UPMC, speaker #1)
    piperVoiceId: 'fr_FR-upmc-medium',
    speakerId: 1, // Pierre (speaker #1)
    downloadSize: 16_000_000, // ~16MB (partagé avec Jessica)
  },
  // DÉSACTIVÉ : Gilles (fr_FR-gilles-low) - Cause des erreurs ONNX Runtime
  // (Gather node index out of bounds - indices hors limites du modèle)
  // Les personnages utilisant Gilles doivent être réassignés à Tom
  // {
  //   id: 'fr_FR-gilles-low',
  //   name: 'fr_FR-gilles-low',
  //   displayName: 'Gilles (Homme, France)',
  //   language: 'fr-FR',
  //   gender: 'male',
  //   provider: 'piper-wasm',
  //   quality: 'low',
  //   isLocal: true,
  //   requiresDownload: false, // Déjà dans le build
  //   piperVoiceId: 'fr_FR-gilles-low',
  //   downloadSize: 14_000_000, // ~14MB
  // },
]

/**
 * Provider TTS utilisant une version forkée de @mintplex-labs/piper-tts-web
 * pour supporter la sélection du speakerId dans les modèles multi-speaker.
 *
 * Le fork expose le paramètre speakerId qui était hardcodé à 0 dans la version originale,
 * permettant l'utilisation du speaker #1 (Pierre) du modèle UPMC.
 *
 * Mode 100% déconnecté : tous les modèles sont intégrés au build.
 *
 * @see src/lib/piper-tts-web-patched/FORK_NOTES.md
 */
export class PiperWASMProvider implements TTSProvider {
  readonly type = 'piper-wasm' as const
  readonly name = 'Piper (Voix naturelles)'

  private currentAudio: HTMLAudioElement | null = null
  private initialized = false
  private downloadProgress: Map<string, number> = new Map()
  private isPaused = false
  private activeBlobUrls: Set<string> = new Set()

  /**
   * Cache de sessions TtsSession par voix pour éviter de recharger les modèles
   */
  private sessionCache: Map<string, TtsSession> = new Map()

  /**
   * Initialise le provider et le service de cache
   * Configure ONNX Runtime pour utiliser les fichiers WASM locaux
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    console.warn('[PiperWASM] 🔧 Initialisation du provider...')

    // Configurer ONNX Runtime pour utiliser les fichiers WASM locaux
    // Phase 1 Optimization: Tenter d'activer multi-threading si supporté
    // Détection du support SharedArrayBuffer pour le multi-threading
    const supportsThreads = typeof SharedArrayBuffer !== 'undefined'

    if (supportsThreads) {
      // Multi-threading activé (nécessite COOP/COEP headers)
      ort.env.wasm.numThreads = 4 // Utiliser 4 threads pour meilleure performance
      console.warn('[PiperWASM]    - Threads: 4 (multi-threaded) ✅')
    } else {
      // Fallback single-thread si SharedArrayBuffer non disponible
      ort.env.wasm.numThreads = 1
      console.warn(
        '[PiperWASM]    - Threads: 1 (single-threaded - SharedArrayBuffer non disponible)'
      )
    }

    ort.env.wasm.simd = true
    ort.env.wasm.wasmPaths = '/wasm/'

    console.warn('[PiperWASM] ✅ ONNX Runtime configuré')
    console.warn('[PiperWASM]    - WASM Path: /wasm/')
    console.warn('[PiperWASM]    - SIMD: enabled')

    // Configurer les chemins WASM pour TtsSession (utilisés par predict())
    TtsSession.WASM_LOCATIONS = {
      onnxWasm: '/wasm/',
      piperData: '/wasm/piper_phonemize.data',
      piperWasm: '/wasm/piper_phonemize.wasm',
    }
    console.warn('[PiperWASM] ✅ Chemins WASM configurés pour TtsSession')

    // Initialiser le service de cache audio
    console.warn('[PiperWASM] 🔄 Initialisation du cache audio...')
    await audioCacheService.initialize()

    // Afficher les statistiques du cache après initialisation
    const cacheStats = await audioCacheService.getStats()
    console.warn('[PiperWASM] ✅ Cache audio initialisé')
    console.warn(
      `[PiperWASM] 📊 Statistiques du cache: ${cacheStats.count} entrées, ${cacheStats.sizeFormatted}`
    )

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
   * Récupère uniquement les modèles de base Piper à précharger
   * (Ne retourne pas les profils vocaux qui sont des variantes)
   */
  getBaseModels(): VoiceDescriptor[] {
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
   * Récupère la liste des voix disponibles (modèles de base + profils vocaux)
   */
  getVoices(): VoiceDescriptor[] {
    // Voix de base depuis les modèles Piper
    const baseVoices = this.getBaseModels()

    // Profils vocaux (variantes des voix de base)
    const profileVoices = ALL_VOICE_PROFILES.map((profile) => ({
      id: profile.id,
      name: profile.id,
      displayName: profile.displayName,
      language: 'fr-FR',
      gender: (profile.perceivedGender || 'male') as VoiceGender,
      provider: 'piper-wasm' as const,
      quality: 'medium' as const,
      isLocal: true,
      requiresDownload: false,
    }))

    // Retourner les voix de base + les profils
    return [...baseVoices, ...profileVoices]
  }

  /**
   * Génère une assignation de voix pour des personnages
   * Algorithme : round-robin pour maximiser la diversité
   * Inclut automatiquement une voix pour le narrateur/voix off
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

    // 1. Assigner une voix au narrateur/voix off si non assignée
    if (!assignments['__narrator__']) {
      const neutralVoices = voices.filter((v) => v.gender === 'neutral')
      const narratorCandidates = neutralVoices.length > 0 ? neutralVoices : voices

      if (narratorCandidates.length > 0) {
        // Sélectionner la voix la moins utilisée
        let selectedVoice = narratorCandidates[0]
        let minUsage = Infinity

        narratorCandidates.forEach((voice) => {
          const usage = usageCount[voice.id] || 0
          if (usage < minUsage) {
            minUsage = usage
            selectedVoice = voice
          }
        })

        assignments['__narrator__'] = selectedVoice.id
        usageCount[selectedVoice.id] = minUsage + 1
        console.warn(
          `[PiperWASM] Narrateur assigné à ${selectedVoice.displayName} (usage: ${minUsage})`
        )
      }
    }

    // 2. Pour chaque personnage sans assignation
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
    let sessionLoadTime: number | undefined
    let inferenceTime = 0

    console.warn('[PiperWASM] synthesize() appelé avec voiceId:', options.voiceId)

    // Détecter si c'est un profil vocal
    const profile = getVoiceProfile(options.voiceId)
    let actualVoiceId = options.voiceId
    let voiceModifiers = null

    if (profile) {
      console.warn(
        `[PiperWASM] 🎭 Profil vocal détecté: "${profile.displayName}" (base: ${profile.baseVoiceId})`
      )
      actualVoiceId = profile.baseVoiceId
      voiceModifiers = profile.modifiers
    }

    try {
      // Vérifier le cache d'abord (avec le voiceId original pour les profils)
      console.warn(
        `[PiperWASM] 🔍 Vérification du cache pour voiceId="${options.voiceId}", texte="${text.substring(0, 30)}..."`
      )
      const cachedBlob = await audioCacheService.getAudio(text, options.voiceId, {
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume,
      })

      if (cachedBlob) {
        console.warn(
          `[PiperWASM] ✅ Audio trouvé dans le cache pour voiceId="${options.voiceId}" (${cachedBlob.size} bytes)`
        )
        // Utiliser l'audio en cache
        const blobUrl = URL.createObjectURL(cachedBlob)
        this.activeBlobUrls.add(blobUrl)
        const audio = new Audio(blobUrl)
        audio.playbackRate = options.rate ?? 1
        audio.volume = options.volume ?? 1

        console.warn(
          `[PiperWASM] 🔊 Audio depuis cache - volume appliqué: ${audio.volume}, rate: ${audio.playbackRate}, options.volume: ${options.volume}`
        )

        // Connecter les événements
        audio.addEventListener('play', () => {
          console.warn(
            `[PiperWASM] 🎵 Audio PLAY event triggered (cache) - blobUrl: ${blobUrl.substring(0, 50)}...`
          )
          options.onStart?.()
        })
        audio.addEventListener('ended', () => {
          console.warn(
            `[PiperWASM] ✅ Audio ENDED event triggered (cache) - blobUrl: ${blobUrl.substring(0, 50)}...`
          )
          // Nettoyer l'URL blob après la lecture
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl)
            this.activeBlobUrls.delete(blobUrl)
            console.warn(
              `[PiperWASM] 🗑️ Blob URL révoquée (cache, ended): ${blobUrl.substring(0, 50)}...`
            )
          }
          options.onEnd?.()
        })
        audio.addEventListener('error', (e) => {
          console.error(
            `[PiperWASM] ❌ Audio ERROR event triggered (cache) - blobUrl: ${blobUrl.substring(0, 50)}...`,
            e
          )
          // Nettoyer l'URL blob en cas d'erreur
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl)
            this.activeBlobUrls.delete(blobUrl)
            console.warn(
              `[PiperWASM] 🗑️ Blob URL révoquée (cache, error): ${blobUrl.substring(0, 50)}...`
            )
          }
          options.onError?.(new Error(`Audio error: ${e.message}`))
        })

        this.currentAudio = audio

        const totalTime = Date.now() - startTime

        // Enregistrer les métriques (cache hit)
        ttsMetricsService.recordSynthesis({
          sessionLoadTime: undefined,
          inferenceTime: 0,
          totalTime,
          fromCache: true,
          voiceId: options.voiceId,
          textLength: text.length,
          audioSize: cachedBlob.size,
        })

        return {
          audio,
          duration: totalTime,
          fromCache: true,
        }
      } else {
        console.warn(
          `[PiperWASM] ❌ Audio NON trouvé dans le cache pour voiceId="${options.voiceId}", synthèse nécessaire`
        )
      }

      // Pas en cache, synthétiser avec Piper
      // Utiliser actualVoiceId (la voix de base si c'est un profil)
      const modelConfig = PIPER_MODELS.find((m) => m.id === actualVoiceId)
      if (!modelConfig) {
        throw new Error(`Modèle Piper ${actualVoiceId} non trouvé`)
      }

      // Vérifier si nous avons déjà une session pour cette voix de base
      let session = this.sessionCache.get(actualVoiceId)

      if (!session) {
        console.warn(
          `[PiperWASM] 🔄 Création d'une nouvelle session pour ${modelConfig.piperVoiceId}`
        )
        const sessionStartTime = Date.now()

        // CRITICAL: Réinitialiser le singleton TtsSession pour créer une nouvelle instance
        // La bibliothèque @mintplex-labs/piper-tts-web réutilise _instance même avec un voiceId différent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(TtsSession as any)._instance = null

        // Créer une nouvelle session pour cette voix
        session = await TtsSession.create({
          voiceId: modelConfig.piperVoiceId,
          speakerId: modelConfig.speakerId ?? 0, // Support multi-speaker (Jessica=0, Pierre=1)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          progress: (progress: any) => {
            const percent = Math.round((progress.loaded / progress.total) * 100)
            console.warn(
              `[PiperWASM] 📥 Chargement modèle ${modelConfig.piperVoiceId}: ${percent}% (${progress.loaded}/${progress.total} bytes)`
            )
            this.downloadProgress.set(actualVoiceId, percent)
            options.onProgress?.(percent)
          },
        })

        // Mettre en cache la session (avec la voix de base)
        this.sessionCache.set(actualVoiceId, session)

        sessionLoadTime = Date.now() - sessionStartTime
        console.warn(
          `[PiperWASM] ✅ Session créée et mise en cache pour ${modelConfig.piperVoiceId} (${sessionLoadTime}ms)`
        )
      } else {
        console.warn(
          `[PiperWASM] ♻️ Utilisation de la session en cache pour ${modelConfig.piperVoiceId}`
        )
      }

      // CRITICAL: Toujours réinitialiser _instance avant d'utiliser la session
      // Même si la session vient du cache, la bibliothèque pourrait utiliser _instance en interne
      console.warn(
        `[PiperWASM] 🔧 Réinitialisation de TtsSession._instance avant synthèse avec ${modelConfig.piperVoiceId}`
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(TtsSession as any)._instance = session

      // Synthétiser avec la session
      console.warn(
        `[PiperWASM] 🎤 Synthèse avec ${actualVoiceId} (piperVoiceId: ${modelConfig.piperVoiceId})${profile ? ` [Profil: ${profile.displayName}]` : ''}`
      )
      console.warn(`[PiperWASM] Texte à synthétiser: "${text.substring(0, 50)}..."`)

      const synthesisStartTime = Date.now()
      const audioBlob = await session.predict(text)
      inferenceTime = Date.now() - synthesisStartTime

      console.warn(`[PiperWASM] ✅ Synthèse terminée en ${inferenceTime}ms`)
      console.warn(`[PiperWASM] ✅ Audio généré: ${audioBlob.size} bytes pour ${options.voiceId}`)

      // Mettre en cache
      console.warn(
        `[PiperWASM] 💾 Mise en cache de l'audio pour voiceId="${options.voiceId}", texte="${text.substring(0, 30)}..."`
      )
      await audioCacheService.cacheAudio(text, options.voiceId, audioBlob, {
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume,
      })
      console.warn(`[PiperWASM] ✅ Audio mis en cache avec succès`)

      // Créer l'élément audio
      const blobUrl = URL.createObjectURL(audioBlob)
      this.activeBlobUrls.add(blobUrl)
      const audio = new Audio(blobUrl)

      // Appliquer les modificateurs du profil vocal ou les options par défaut
      if (voiceModifiers) {
        console.warn(
          `[PiperWASM] 🎨 Application des modificateurs du profil: playbackRate=${voiceModifiers.playbackRate}, volume=${voiceModifiers.volume ?? 1.0}`
        )
        applyBasicModifiers(audio, voiceModifiers)

        // IMPORTANT: Le volume des options (ex: 0 en mode italienne) a toujours priorité sur le volume du profil
        if (options.volume !== undefined) {
          audio.volume = options.volume
          console.warn(
            `[PiperWASM] 🔊 Volume des options appliqué (priorité sur profil): ${audio.volume}`
          )
        }
      } else {
        audio.playbackRate = options.rate ?? 1
        audio.volume = options.volume ?? 1

        console.warn(
          `[PiperWASM] 🔊 Audio nouvellement synthétisé - volume appliqué: ${audio.volume}, rate: ${audio.playbackRate}`
        )
      }

      // Arrêter complètement tout audio précédent avant d'en démarrer un nouveau
      // SAUF si c'est un prefetch (on ne veut pas interrompre l'audio en cours)
      if (!options.isPrefetch) {
        this.stop()
      }

      // Connecter les événements
      audio.addEventListener('play', () => {
        console.warn(
          `[PiperWASM] 🎵 Audio PLAY event triggered (synth) - blobUrl: ${blobUrl.substring(0, 50)}...`
        )
        options.onStart?.()
      })
      audio.addEventListener('ended', () => {
        console.warn(
          `[PiperWASM] ✅ Audio ENDED event triggered (synth) - blobUrl: ${blobUrl.substring(0, 50)}...`
        )
        // Nettoyer l'URL blob après la lecture
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl)
          this.activeBlobUrls.delete(blobUrl)
          console.warn(
            `[PiperWASM] 🗑️ Blob URL révoquée (synth, ended): ${blobUrl.substring(0, 50)}...`
          )
        }
        options.onEnd?.()
      })
      audio.addEventListener('error', (e) => {
        console.error(
          `[PiperWASM] ❌ Audio ERROR event triggered (synth) - blobUrl: ${blobUrl.substring(0, 50)}...`,
          e
        )
        // Nettoyer l'URL blob en cas d'erreur
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl)
          this.activeBlobUrls.delete(blobUrl)
          console.warn(
            `[PiperWASM] 🗑️ Blob URL révoquée (synth, error): ${blobUrl.substring(0, 50)}...`
          )
        }
        options.onError?.(new Error(`Audio error: ${e.message}`))
      })

      this.currentAudio = audio

      const totalTime = Date.now() - startTime

      // Enregistrer les métriques (cache miss)
      ttsMetricsService.recordSynthesis({
        sessionLoadTime,
        inferenceTime,
        totalTime,
        fromCache: false,
        voiceId: options.voiceId,
        textLength: text.length,
        audioSize: audioBlob.size,
      })

      return {
        audio,
        duration: totalTime,
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
   * Pré-charge un modèle en mémoire pour une utilisation plus rapide
   * En mode déconnecté, les modèles sont déjà disponibles localement
   */
  async preloadModel(voiceId: string, onProgress?: (percent: number) => void): Promise<void> {
    const modelConfig = PIPER_MODELS.find((m) => m.id === voiceId)
    if (!modelConfig) {
      throw new Error(`Modèle Piper ${voiceId} non trouvé`)
    }

    // Vérifier si déjà en cache
    if (this.sessionCache.has(voiceId)) {
      console.warn(`[PiperWASM] ✅ Modèle ${voiceId} déjà en cache, préchargement ignoré`)
      // Simuler une progression rapide pour le feedback visuel
      if (onProgress) {
        onProgress(0)
        await new Promise((resolve) => setTimeout(resolve, 10))
        onProgress(50)
        await new Promise((resolve) => setTimeout(resolve, 10))
        onProgress(100)
      }
      return
    }

    console.warn(`[PiperWASM] 📥 Pré-chargement du modèle ${voiceId}...`)
    const startTime = Date.now()

    // CRITICAL: Réinitialiser le singleton TtsSession pour créer une nouvelle instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(TtsSession as any)._instance = null

    // Créer une nouvelle session pour cette voix
    const session = await TtsSession.create({
      voiceId: modelConfig.piperVoiceId,
      speakerId: modelConfig.speakerId ?? 0, // Support multi-speaker (Jessica=0, Pierre=1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress: (progress: any) => {
        const percent = Math.round((progress.loaded / progress.total) * 100)
        this.downloadProgress.set(voiceId, percent)
        onProgress?.(percent)
      },
    })

    // Mettre en cache la session
    this.sessionCache.set(voiceId, session)

    const loadTime = Date.now() - startTime
    console.warn(`[PiperWASM] ✅ Modèle ${voiceId} pré-chargé avec succès (${loadTime}ms)`)
  }

  /**
   * Arrête la lecture en cours
   */
  stop(): void {
    if (this.currentAudio) {
      const audioState = {
        paused: this.currentAudio.paused,
        ended: this.currentAudio.ended,
        currentTime: this.currentAudio.currentTime,
        duration: this.currentAudio.duration,
        src: this.currentAudio.src?.substring(0, 50),
      }
      console.warn(`[PiperWASM] ⏹️ STOP appelé - état audio:`, audioState)

      // Si l'audio est déjà terminé, ne rien faire - le nettoyage a déjà eu lieu via l'événement 'ended'
      if (this.currentAudio.ended) {
        console.warn(
          `[PiperWASM] ⏹️ STOP ignoré - audio déjà terminé (l'événement 'ended' s'en est occupé)`
        )
        this.currentAudio = null
        this.isPaused = false
        return
      }

      // Arrêter la lecture seulement si elle est encore en cours
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0

      // Ne pas supprimer les événements ni révoquer l'URL blob ici
      // Les événements 'ended' ou 'error' s'occuperont du nettoyage
      // Cela permet à l'événement 'ended' de se déclencher naturellement

      this.currentAudio = null
      console.warn(`[PiperWASM] ⏹️ STOP terminé - currentAudio = null`)
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
    this.downloadProgress.clear()

    // Révoquer toutes les URLs blob actives
    console.warn(`[PiperWASM] 🗑️ Révocation de ${this.activeBlobUrls.size} URLs blob actives`)
    this.activeBlobUrls.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    this.activeBlobUrls.clear()

    // Libérer toutes les sessions en cache
    console.warn(`[PiperWASM] 🗑️ Libération de ${this.sessionCache.size} sessions en cache`)
    this.sessionCache.clear()

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

  /**
   * Vider le cache audio pour une voix spécifique
   * Utile lors du changement d'affectation de voix à un personnage
   */
  async clearCacheForVoice(voiceId: string): Promise<number> {
    return audioCacheService.deleteByVoiceId(voiceId)
  }

  /**
   * Vider le cache de sessions (force le rechargement des modèles)
   */
  async clearSessionCache(): Promise<void> {
    console.warn(`[PiperWASM] 🗑️ Vidage du cache de sessions (${this.sessionCache.size} sessions)`)
    this.sessionCache.clear()
  }

  /**
   * Obtenir les statistiques du cache de sessions
   */
  getSessionCacheStats(): { voiceCount: number; voices: string[] } {
    return {
      voiceCount: this.sessionCache.size,
      voices: Array.from(this.sessionCache.keys()),
    }
  }
}

// Singleton instance
export const piperWASMProvider = new PiperWASMProvider()
