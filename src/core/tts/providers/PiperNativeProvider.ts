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
import * as ort from 'onnxruntime-web'
import { audioCacheService } from '../services/AudioCacheService'
import { ALL_VOICE_PROFILES, getVoiceProfile } from '../voiceProfiles'
import { piperPhonemizer } from '../utils/PiperPhonemizer'

/**
 * Configuration d'un modèle Piper avec support multi-speaker
 */
interface PiperModelConfig extends VoiceDescriptor {
  /** Chemin relatif vers le fichier ONNX */
  onnxPath: string

  /** Chemin relatif vers le fichier JSON de configuration */
  configPath: string

  /** Taille estimée du modèle en octets */
  modelSize: number

  /** ID du speaker pour les modèles multi-speaker (optionnel) */
  speakerId?: number
}

/**
 * Configuration JSON d'un modèle Piper
 */
interface PiperConfig {
  audio: {
    sample_rate: number
    quality: string
  }
  espeak: {
    voice: string
  }
  inference: {
    noise_scale: number
    length_scale: number
    noise_w: number
  }
  phoneme_type: string
  phoneme_id_map: Record<string, number[]>
  num_symbols: number
  num_speakers?: number
  speaker_id_map?: Record<string, number>
}

/**
 * Session ONNX en cache avec métadonnées
 */
interface CachedSession {
  session: ort.InferenceSession
  config: PiperConfig
  loadedAt: number
  lastUsed: number
}

/**
 * Configuration des modèles Piper disponibles avec support multi-speaker
 */
const PIPER_MODELS: PiperModelConfig[] = [
  {
    id: 'fr_FR-siwis-medium',
    name: 'fr_FR-siwis-medium',
    displayName: 'Siwis (Femme, France)',
    language: 'fr-FR',
    gender: 'female',
    provider: 'piper-native',
    quality: 'medium',
    isLocal: true,
    requiresDownload: false,
    onnxPath: '/voices/fr_FR-siwis-medium/fr_FR-siwis-medium.onnx',
    configPath: '/voices/fr_FR-siwis-medium/fr_FR-siwis-medium.onnx.json',
    modelSize: 15_000_000,
  },
  {
    id: 'fr_FR-tom-medium',
    name: 'fr_FR-tom-medium',
    displayName: 'Tom (Homme, France)',
    language: 'fr-FR',
    gender: 'male',
    provider: 'piper-native',
    quality: 'medium',
    isLocal: true,
    requiresDownload: false,
    onnxPath: '/voices/fr_FR-tom-medium/fr_FR-tom-medium.onnx',
    configPath: '/voices/fr_FR-tom-medium/fr_FR-tom-medium.onnx.json',
    modelSize: 15_000_000,
  },
  {
    id: 'fr_FR-upmc-jessica-medium',
    name: 'fr_FR-upmc-jessica-medium',
    displayName: 'Jessica (Femme, UPMC)',
    language: 'fr-FR',
    gender: 'female',
    provider: 'piper-native',
    quality: 'medium',
    isLocal: true,
    requiresDownload: false,
    onnxPath: '/voices/fr_FR-upmc-medium/fr_FR-upmc-medium.onnx',
    configPath: '/voices/fr_FR-upmc-medium/fr_FR-upmc-medium.onnx.json',
    modelSize: 16_000_000,
    speakerId: 0, // jessica
  },
  {
    id: 'fr_FR-upmc-pierre-medium',
    name: 'fr_FR-upmc-pierre-medium',
    displayName: 'Pierre (Homme, UPMC)',
    language: 'fr-FR',
    gender: 'male',
    provider: 'piper-native',
    quality: 'medium',
    isLocal: true,
    requiresDownload: false,
    onnxPath: '/voices/fr_FR-upmc-medium/fr_FR-upmc-medium.onnx',
    configPath: '/voices/fr_FR-upmc-medium/fr_FR-upmc-medium.onnx.json',
    modelSize: 16_000_000,
    speakerId: 1, // pierre
  },
]

/**
 * Provider TTS natif utilisant onnxruntime-web directement
 * Supporte les modèles multi-speaker de Piper
 */
export class PiperNativeProvider implements TTSProvider {
  readonly type = 'piper-native' as const
  readonly name = 'Piper Native (Multi-speaker)'

  private currentAudio: HTMLAudioElement | null = null
  private initialized = false
  private sessionCache: Map<string, CachedSession> = new Map()

  /**
   * Initialise le provider et ONNX Runtime
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[PiperNativeProvider] Déjà initialisé')
      return
    }

    console.log('[PiperNativeProvider] Initialisation...')

    try {
      // Configuration ONNX Runtime Web
      ort.env.wasm.numThreads = 1
      ort.env.wasm.simd = true
      ort.env.wasm.proxy = false

      // Chemins vers les fichiers WASM
      ort.env.wasm.wasmPaths = '/wasm/'

      console.log('[PiperNativeProvider] ONNX Runtime configuré')

      // Initialiser le phonemizer
      await piperPhonemizer.initialize()
      console.log('[PiperNativeProvider] Phonemizer initialisé')

      this.initialized = true
      console.log('[PiperNativeProvider] Initialisé avec succès')
    } catch (error) {
      console.error("[PiperNativeProvider] Erreur lors de l'initialisation:", error)
      throw new Error(`Échec de l'initialisation de Piper Native: ${error}`)
    }
  }

  /**
   * Vérifie la disponibilité du provider
   */
  async checkAvailability(): Promise<TTSProviderAvailability> {
    try {
      // Vérifier si ONNX Runtime est disponible
      if (!ort || !ort.InferenceSession) {
        return {
          available: false,
          reason: 'ONNX Runtime non disponible',
        }
      }

      return { available: true }
    } catch (error) {
      return {
        available: false,
        reason: `Erreur: ${error}`,
      }
    }
  }

  /**
   * Retourne les modèles de base disponibles
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
    }))
  }

  /**
   * Retourne toutes les voix disponibles (modèles de base + profils)
   */
  getVoices(): VoiceDescriptor[] {
    const baseVoices = this.getBaseModels()

    // Ajouter les profils vocaux
    const profileVoices = ALL_VOICE_PROFILES.map((profile) => ({
      id: profile.id,
      name: profile.displayName,
      displayName: profile.displayName,
      language: 'fr-FR',
      gender: (profile.perceivedGender as VoiceGender) || 'male',
      provider: this.type,
      quality: 'medium' as const,
      isLocal: true,
      requiresDownload: false,
    }))

    return [...baseVoices, ...profileVoices]
  }

  /**
   * Génère des assignations de voix pour les personnages
   */
  generateVoiceAssignments(
    characters: Array<{ id: string; gender: VoiceGender }>,
    existingAssignments?: Record<string, string>
  ): Record<string, string> {
    const assignments: Record<string, string> = existingAssignments || {}
    const voices = this.getVoices()
    const usageCount = new Map<string, number>()

    console.log('[PiperNativeProvider] Génération des assignations pour', {
      charactersCount: characters.length,
      characters: characters.map((c) => ({ id: c.id, gender: c.gender })),
      voicesCount: voices.length,
      voices: voices.map((v) => ({ id: v.id, name: v.displayName, gender: v.gender })),
    })

    // Voix neutres pour le narrateur
    const neutralVoices = voices.filter((v) => v.id.includes('normal'))
    const narratorCandidates = neutralVoices.length > 0 ? neutralVoices : voices.slice(0, 1)

    // Narrateur toujours en premier
    let selectedVoice = narratorCandidates[0]
    let minUsage = Infinity

    for (const voice of narratorCandidates) {
      const usage = usageCount.get(voice.id) || 0
      if (usage < minUsage) {
        minUsage = usage
        selectedVoice = voice
      }
    }

    assignments['NARRATEUR'] = selectedVoice.id
    usageCount.set(selectedVoice.id, (usageCount.get(selectedVoice.id) || 0) + 1)

    console.log(
      `[PiperNativeProvider] NARRATEUR → ${selectedVoice.displayName} (${selectedVoice.id})`
    )

    // Assigner les autres personnages
    for (const character of characters) {
      if (character.id === 'NARRATEUR') continue

      // Filtrer les voix par genre
      let candidateVoices = voices.filter((v) => v.gender === character.gender)

      if (candidateVoices.length === 0) {
        candidateVoices = voices
      }

      // Sélectionner la voix la moins utilisée
      let selectedVoice = candidateVoices[0]
      let minUsage = Infinity

      for (const voice of candidateVoices) {
        const usage = usageCount.get(voice.id) || 0
        if (usage < minUsage) {
          minUsage = usage
          selectedVoice = voice
        }
      }

      assignments[character.id] = selectedVoice.id
      usageCount.set(selectedVoice.id, (usageCount.get(selectedVoice.id) || 0) + 1)

      console.log(
        `[PiperNativeProvider] ${character.id} (${character.gender}) → ${selectedVoice.displayName} (${selectedVoice.id})`
      )
    }

    return assignments
  }

  /**
   * Charge un modèle ONNX et sa configuration
   */
  private async loadModel(modelConfig: PiperModelConfig): Promise<CachedSession> {
    const cacheKey = modelConfig.onnxPath

    // Vérifier le cache
    if (this.sessionCache.has(cacheKey)) {
      const cached = this.sessionCache.get(cacheKey)!
      cached.lastUsed = Date.now()
      console.log(`[PiperNativeProvider] Modèle ${modelConfig.id} trouvé en cache`)
      return cached
    }

    console.log(`[PiperNativeProvider] Chargement du modèle ${modelConfig.id}...`)

    try {
      // Charger la configuration JSON
      const configResponse = await fetch(modelConfig.configPath)
      if (!configResponse.ok) {
        throw new Error(`Impossible de charger la config: ${configResponse.statusText}`)
      }
      const config: PiperConfig = await configResponse.json()

      // Charger le modèle ONNX
      const session = await ort.InferenceSession.create(modelConfig.onnxPath, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      })

      const cached: CachedSession = {
        session,
        config,
        loadedAt: Date.now(),
        lastUsed: Date.now(),
      }

      this.sessionCache.set(cacheKey, cached)
      console.log(`[PiperNativeProvider] Modèle ${modelConfig.id} chargé avec succès`)

      return cached
    } catch (error) {
      console.error(
        `[PiperNativeProvider] Erreur lors du chargement du modèle ${modelConfig.id}:`,
        error
      )
      throw new Error(`Échec du chargement du modèle: ${error}`)
    }
  }

  /**
   * Convertit du texte en phonèmes en utilisant PiperPhonemizer
   */
  private async textToPhonemes(text: string, config: PiperConfig): Promise<number[]> {
    try {
      const espeakVoice = config.espeak.voice
      console.log(`[PiperNativeProvider] Conversion en phonèmes avec voix espeak: ${espeakVoice}`)

      const phonemeIds = await piperPhonemizer.textToPhonemeIds(
        text,
        config.phoneme_id_map,
        espeakVoice
      )

      console.log(`[PiperNativeProvider] ${phonemeIds.length} phonèmes générés`)
      return phonemeIds
    } catch (error) {
      console.error('[PiperNativeProvider] Erreur lors de la phonemization:', error)
      throw new Error(`Échec de la phonemization: ${error}`)
    }
  }

  /**
   * Convertit des données audio PCM en WAV
   */
  private pcmToWav(pcmData: Float32Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = pcmData.length * bytesPerSample
    const headerSize = 44
    const fileSize = headerSize + dataSize

    const buffer = new ArrayBuffer(fileSize)
    const view = new DataView(buffer)

    // En-tête WAV
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, fileSize - 8, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // Taille du chunk fmt
    view.setUint16(20, 1, true) // Format audio (1 = PCM)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitsPerSample, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    // Données audio (conversion Float32 → Int16)
    let offset = 44
    for (let i = 0; i < pcmData.length; i++) {
      const sample = Math.max(-1, Math.min(1, pcmData[i]))
      const intSample = Math.floor(sample * 32767)
      view.setInt16(offset, intSample, true)
      offset += 2
    }

    return buffer
  }

  /**
   * Synthétise de la parole à partir de texte
   */
  async synthesize(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
    if (!this.initialized) {
      await this.initialize()
    }

    const startTime = performance.now()
    console.log(`[PiperNativeProvider] Synthèse pour voix: ${options.voiceId}`)

    // Récupérer le profil vocal si applicable
    const profile = getVoiceProfile(options.voiceId)
    let actualVoiceId = options.voiceId
    let voiceModifiers = null

    if (profile) {
      actualVoiceId = profile.baseVoiceId
      voiceModifiers = profile.modifiers
      console.log(`[PiperNativeProvider] Profil vocal détecté: ${profile.displayName}`)
    }

    // Vérifier le cache audio
    const cachedBlob = await audioCacheService.getAudio(text, actualVoiceId, {
      rate: voiceModifiers?.playbackRate || 1.0,
      pitch: voiceModifiers?.pitchShift || 0,
      volume: voiceModifiers?.volume || 1.0,
    })

    if (cachedBlob) {
      const audio = new Audio(URL.createObjectURL(cachedBlob))
      console.log(`[PiperNativeProvider] Audio trouvé en cache pour "${text.substring(0, 30)}..."`)
      return {
        audio,
        duration: audio.duration || 0,
        fromCache: true,
      }
    }

    // Trouver la configuration du modèle
    const modelConfig = PIPER_MODELS.find((m) => m.id === actualVoiceId)
    if (!modelConfig) {
      throw new Error(`Modèle non trouvé: ${actualVoiceId}`)
    }

    // Charger le modèle et sa config
    const { session, config } = await this.loadModel(modelConfig)

    // Convertir le texte en phonèmes
    const phonemeIds = await this.textToPhonemes(text, config)

    // Préparer les tenseurs d'entrée
    const inputIds = new ort.Tensor('int64', BigInt64Array.from(phonemeIds.map(BigInt)), [
      1,
      phonemeIds.length,
    ])
    const inputLengths = new ort.Tensor(
      'int64',
      BigInt64Array.from([BigInt(phonemeIds.length)]),
      [1]
    )
    const scales = new ort.Tensor(
      'float32',
      new Float32Array([
        config.inference.noise_scale,
        config.inference.length_scale,
        config.inference.noise_w,
      ]),
      [3]
    )

    // Préparer le speaker ID si multi-speaker
    const feeds: Record<string, ort.Tensor> = {
      input: inputIds,
      input_lengths: inputLengths,
      scales: scales,
    }

    if (config.num_speakers && config.num_speakers > 1) {
      const speakerId = modelConfig.speakerId ?? 0
      console.log(`[PiperNativeProvider] Utilisation du speaker ID: ${speakerId}`)
      feeds.sid = new ort.Tensor('int64', BigInt64Array.from([BigInt(speakerId)]), [1])
    }

    // Inférence
    console.log(`[PiperNativeProvider] Exécution de l'inférence...`)
    const results = await session.run(feeds)

    // Récupérer l'audio généré
    const audioTensor = results.output
    const audioData = audioTensor.data as Float32Array

    console.log(`[PiperNativeProvider] Audio généré: ${audioData.length} échantillons`)

    // Convertir en WAV
    const wavBuffer = this.pcmToWav(audioData, config.audio.sample_rate)
    const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' })

    // Note: Les modificateurs vocaux (rate, pitch, volume) seront appliqués
    // lors de la lecture audio, pas lors de la synthèse
    // applyBasicModifiers nécessite HTMLAudioElement, pas Blob

    // Créer l'élément audio
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    // Mettre en cache
    await audioCacheService.cacheAudio(text, actualVoiceId, audioBlob, {
      rate: voiceModifiers?.playbackRate || 1.0,
      pitch: voiceModifiers?.pitchShift || 0,
      volume: voiceModifiers?.volume || 1.0,
    })

    const duration = performance.now() - startTime
    console.log(`[PiperNativeProvider] Synthèse terminée en ${duration.toFixed(0)}ms`)

    return {
      audio,
      duration: audio.duration || 0,
      fromCache: false,
    }
  }

  /**
   * Arrête la lecture audio en cours
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  /**
   * Met en pause la lecture audio
   */
  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause()
    }
  }

  /**
   * Reprend la lecture audio
   */
  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch((error) => {
        console.error('[PiperNativeProvider] Erreur lors de la reprise:', error)
      })
    }
  }

  /**
   * Libère les ressources
   */
  async dispose(): Promise<void> {
    this.stop()

    // Libérer les sessions ONNX
    for (const [key, cached] of this.sessionCache.entries()) {
      await cached.session.release()
      this.sessionCache.delete(key)
    }

    // Libérer le phonemizer
    piperPhonemizer.dispose()

    this.initialized = false
    console.log('[PiperNativeProvider] Ressources libérées')
  }

  /**
   * Statistiques du cache
   */
  async getCacheStats() {
    return audioCacheService.getCacheStats()
  }

  /**
   * Vide le cache audio
   */
  async clearCache() {
    return audioCacheService.clearCache()
  }

  /**
   * Vide le cache pour une voix spécifique
   */
  async clearCacheForVoice(voiceId: string): Promise<void> {
    // Nettoyer les entrées du cache qui correspondent à cette voix
    console.log(`[PiperNativeProvider] Nettoyage du cache pour ${voiceId}`)
    // TODO: Implémenter le nettoyage par voiceId dans AudioCacheService
  }

  /**
   * Vide le cache de sessions
   */
  async clearSessionCache() {
    for (const [key, cached] of this.sessionCache.entries()) {
      await cached.session.release()
      this.sessionCache.delete(key)
    }
    console.log('[PiperNativeProvider] Cache de sessions vidé')
  }

  /**
   * Statistiques du cache de sessions
   */
  getSessionCacheStats() {
    return {
      voiceCount: this.sessionCache.size,
      voices: Array.from(this.sessionCache.keys()),
    }
  }
}

/**
 * Instance singleton du provider
 */
export const piperNativeProvider = new PiperNativeProvider()
