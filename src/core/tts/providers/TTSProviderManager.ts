/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type {
  TTSProvider,
  TTSProviderType,
  VoiceDescriptor,
  SynthesisOptions,
  SynthesisResult,
} from '../types'
import { WebSpeechProvider } from './WebSpeechProvider'
import { PiperWASMProvider } from './PiperWASMProvider'

/**
 * Informations sur un provider disponible
 */
export interface ProviderInfo {
  /** Type du provider */
  type: TTSProviderType

  /** Nom d'affichage */
  name: string

  /** Provider disponible */
  available: boolean

  /** Raison si indisponible */
  reason?: string
}

/**
 * Gestionnaire centralisé des providers TTS
 * Permet de switcher entre différents moteurs (Web Speech, Piper, etc.)
 */
export class TTSProviderManager {
  private providers: Map<TTSProviderType, TTSProvider> = new Map()
  private activeProvider: TTSProvider | null = null
  private initialized = false

  constructor() {
    this.registerProviders()
  }

  /**
   * Enregistre tous les providers disponibles
   */
  private registerProviders(): void {
    this.providers.set('web-speech', new WebSpeechProvider())
    this.providers.set('piper-wasm', new PiperWASMProvider())
  }

  /**
   * Initialise le provider manager avec un provider par défaut
   */
  async initialize(providerType: TTSProviderType = 'piper-wasm'): Promise<void> {
    if (this.initialized) return

    const provider = this.providers.get(providerType)
    if (!provider) {
      throw new Error(`Provider ${providerType} non trouvé`)
    }

    // Vérifier disponibilité
    const availability = await provider.checkAvailability()
    if (!availability.available) {
      console.warn(
        `Provider ${providerType} indisponible: ${availability.reason}. Fallback vers web-speech.`
      )
      // Fallback vers Web Speech
      const fallbackProvider = this.providers.get('web-speech')
      if (fallbackProvider) {
        await fallbackProvider.initialize()
        this.activeProvider = fallbackProvider
        this.initialized = true
        return
      }
      throw new Error('Aucun provider TTS disponible')
    }

    // Initialiser le provider
    await provider.initialize()
    this.activeProvider = provider
    this.initialized = true

    console.info(`[TTSProviderManager] Initialisé avec provider: ${provider.name}`)
  }

  /**
   * Change le provider actif
   */
  async switchProvider(providerType: TTSProviderType): Promise<void> {
    const provider = this.providers.get(providerType)
    if (!provider) {
      throw new Error(`Provider ${providerType} non trouvé`)
    }

    // Arrêter le provider actuel
    if (this.activeProvider) {
      this.activeProvider.stop()
    }

    // Vérifier disponibilité
    const availability = await provider.checkAvailability()
    if (!availability.available) {
      throw new Error(`Provider ${providerType} indisponible: ${availability.reason}`)
    }

    // Initialiser le nouveau provider
    await provider.initialize()
    this.activeProvider = provider

    console.info(`[TTSProviderManager] Provider changé vers: ${provider.name}`)
  }

  /**
   * Récupère la liste de tous les providers avec leur disponibilité
   */
  async getAvailableProviders(): Promise<ProviderInfo[]> {
    const results: ProviderInfo[] = []

    for (const [type, provider] of this.providers.entries()) {
      const availability = await provider.checkAvailability()

      results.push({
        type,
        name: provider.name,
        available: availability.available,
        reason: availability.reason,
      })
    }

    return results
  }

  /**
   * Récupère les voix du provider actif
   */
  getVoices(): VoiceDescriptor[] {
    if (!this.activeProvider) {
      console.warn('[TTSProviderManager] Aucun provider actif')
      return []
    }

    return this.activeProvider.getVoices()
  }

  /**
   * Récupère le provider actif
   */
  getActiveProvider(): TTSProvider | null {
    return this.activeProvider
  }

  /**
   * Récupère le type du provider actif
   */
  getActiveProviderType(): TTSProviderType | null {
    if (!this.activeProvider) return null
    return this.activeProvider.type
  }

  /**
   * Synthétise du texte avec le provider actif
   */
  async speak(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
    if (!this.activeProvider) {
      throw new Error('Aucun provider TTS actif')
    }

    return this.activeProvider.synthesize(text, options)
  }

  /**
   * Arrête la lecture en cours
   */
  stop(): void {
    if (this.activeProvider) {
      this.activeProvider.stop()
    }
  }

  /**
   * Libère toutes les ressources
   */
  async dispose(): Promise<void> {
    // Disposer tous les providers
    const disposePromises = Array.from(this.providers.values()).map((provider) =>
      provider.dispose()
    )

    await Promise.all(disposePromises)

    this.activeProvider = null
    this.initialized = false

    console.info('[TTSProviderManager] Ressources libérées')
  }
}

/**
 * Instance singleton du TTSProviderManager
 */
export const ttsProviderManager = new TTSProviderManager()
