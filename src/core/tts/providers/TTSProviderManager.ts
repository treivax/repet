/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { TTSProvider, VoiceDescriptor, SynthesisOptions, SynthesisResult } from '../types'
import { PiperWASMProvider } from './PiperWASMProvider'
// import { PiperNativeProvider } from './PiperNativeProvider'

/**
 * Gestionnaire centralisé du provider TTS
 *
 * Utilise PiperWASMProvider (fork avec support speakerId pour multi-speaker)
 */
export class TTSProviderManager {
  private provider: TTSProvider
  private initialized = false

  constructor() {
    this.provider = new PiperWASMProvider()
  }

  /**
   * Initialise le provider TTS
   */
  async initialize(): Promise<void> {
    // Si déjà initialisé, ne rien faire
    if (this.initialized) {
      return
    }

    // Vérifier disponibilité
    const availability = await this.provider.checkAvailability()
    if (!availability.available) {
      throw new Error(`Provider TTS indisponible: ${availability.reason}`)
    }

    // Initialiser le provider
    await this.provider.initialize()
    this.initialized = true
  }

  /**
   * Récupère les voix du provider TTS
   */
  getVoices(): VoiceDescriptor[] {
    return this.provider.getVoices()
  }

  /**
   * Récupère le provider actif
   */
  getActiveProvider(): TTSProvider {
    return this.provider
  }

  /**
   * Synthétise du texte avec le provider TTS
   */
  async speak(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
    return this.provider.synthesize(text, options)
  }

  /**
   * Arrête la lecture en cours
   */
  stop(): void {
    this.provider.stop()
  }

  /**
   * Met en pause la lecture en cours
   */
  pause(): void {
    if ('pause' in this.provider) {
      ;(this.provider as { pause: () => void }).pause()
    }
  }

  /**
   * Reprend la lecture en pause
   */
  resume(): void {
    if ('resume' in this.provider) {
      ;(this.provider as { resume: () => void }).resume()
    }
  }

  /**
   * Libère toutes les ressources
   */
  async dispose(): Promise<void> {
    await this.provider.dispose()
    this.initialized = false
  }
}

/**
 * Instance singleton du TTSProviderManager
 */
export const ttsProviderManager = new TTSProviderManager()
