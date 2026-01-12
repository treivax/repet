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

/**
 * Configuration d'un modèle Piper
 */
interface PiperModelConfig extends VoiceDescriptor {
  /** URL du modèle .onnx */
  url: string

  /** URL de la config .json */
  configUrl: string

  /** Taille du téléchargement en octets */
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
    downloadSize: 15_000_000, // ~15MB
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx',
    configUrl:
      'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json',
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
    downloadSize: 15_000_000, // ~15MB
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx',
    configUrl:
      'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx.json',
  },
  {
    id: 'fr_FR-upmc-medium-1',
    name: 'fr_FR-upmc-medium',
    displayName: 'UPMC Jessica (Femme, France)',
    language: 'fr-FR',
    gender: 'female',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: true,
    downloadSize: 16_000_000, // ~16MB
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx',
    configUrl:
      'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx.json',
  },
  {
    id: 'fr_FR-mls-medium-1',
    name: 'fr_FR-mls-medium',
    displayName: 'MLS Pierre (Homme, France)',
    language: 'fr-FR',
    gender: 'male',
    provider: 'piper-wasm',
    quality: 'medium',
    isLocal: true,
    requiresDownload: true,
    downloadSize: 14_000_000, // ~14MB
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx',
    configUrl:
      'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx.json',
  },
]

/**
 * Provider TTS utilisant Piper-WASM
 * Note: La synthèse est un placeholder pour l'instant (en attente de l'intégration WASM réelle)
 */
export class PiperWASMProvider implements TTSProvider {
  readonly type = 'piper-wasm' as const
  readonly name = 'Piper (Voix naturelles)'

  private _piperModule: unknown = null
  private loadedModels: Map<string, unknown> = new Map()
  private initialized = false

  /**
   * Initialise le provider
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // TODO: Charger le module Piper-WASM
    // this.piperModule = await import('piper-wasm')
    // await this.piperModule.init()

    // Placeholder: initialisation WASM sera implémentée plus tard
    this._piperModule = null
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

    // Compter l'utilisation actuelle
    Object.values(assignments).forEach((voiceId) => {
      usageCount[voiceId] = (usageCount[voiceId] || 0) + 1
    })

    // Pour chaque personnage sans assignation
    characters.forEach((char) => {
      if (assignments[char.id]) return // Déjà assigné

      // Filtrer voix du bon genre
      let candidateVoices = voices.filter((v) => v.gender === char.gender)

      // Fallback : toutes les voix si aucune du bon genre
      if (candidateVoices.length === 0) {
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
    })

    return assignments
  }

  /**
   * Synthétise du texte en audio
   * PLACEHOLDER: L'intégration WASM réelle sera faite plus tard
   */
  async synthesize(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
    // TODO: Implémenter la vraie synthèse Piper-WASM
    // Pour l'instant, on retourne un résultat placeholder
    // qui permettra de tester l'architecture sans bloquer le développement

    // Placeholder: référencer les méthodes pour éviter erreurs TypeScript
    if (this._piperModule === undefined && options.voiceId === '__never__') {
      void this._downloadAndLoadModel(options.voiceId)
    }

    return new Promise((resolve, reject) => {
      // Simuler un délai de synthèse
      setTimeout(() => {
        try {
          // Créer un audio element vide (placeholder)
          const audio = new Audio()

          // Appeler les callbacks
          options.onStart?.()

          // Simuler la fin de la lecture après un court délai
          setTimeout(() => {
            options.onEnd?.()
          }, 100)

          resolve({
            audio,
            duration: 0,
            fromCache: false,
          })
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Erreur de synthèse Piper')
          options.onError?.(err)
          reject(err)
        }
      }, 50)
    })
  }

  /**
   * Télécharge et charge un modèle Piper
   * PLACEHOLDER: Sera implémenté lors de l'intégration WASM réelle
   */
  private async _downloadAndLoadModel(voiceId: string): Promise<unknown> {
    const modelConfig = PIPER_MODELS.find((m) => m.id === voiceId)
    if (!modelConfig) {
      throw new Error(`Modèle Piper ${voiceId} non trouvé`)
    }

    // Placeholder: téléchargement sera implémenté plus tard

    // TODO: Implémenter le téléchargement et chargement réel
    // const response = await fetch(modelConfig.url)
    // const modelData = await response.arrayBuffer()
    // const model = await this.piperModule.loadModel(modelData)
    // return model

    return {} // Placeholder
  }

  /**
   * Arrête la lecture en cours
   */
  stop(): void {
    // TODO: Implémenter l'arrêt de la synthèse Piper
  }

  /**
   * Libère les ressources
   */
  async dispose(): Promise<void> {
    this.loadedModels.clear()
    this._piperModule = null
    this.initialized = false
  }
}
