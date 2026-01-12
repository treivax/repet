/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { SpeechConfig, TTSEvents, TTSState, SynthesisOptions } from './types'
import { voiceManager, VoiceManager } from './voice-manager'
import { SpeechQueue } from './queue'
import { ttsProviderManager } from './providers'

/**
 * Moteur de synthèse vocale
 */
export class TTSEngine {
  private state: TTSState = 'idle'
  private queue = new SpeechQueue()
  private events: TTSEvents = {}

  /**
   * Initialise le moteur TTS
   */
  async initialize(): Promise<void> {
    // Initialiser le provider manager (par défaut : piper-wasm)
    await ttsProviderManager.initialize()

    // Garder l'ancien voice manager pour compatibilité
    if (VoiceManager.isAvailable()) {
      await voiceManager.initialize()
    }
  }

  /**
   * Configure les événements
   *
   * @param events - Callbacks d'événements
   */
  setEvents(events: TTSEvents): void {
    this.events = events
  }

  /**
   * Lit un texte avec la configuration spécifiée
   *
   * @param config - Configuration de lecture
   */
  speak(config: SpeechConfig): void {
    try {
      // Utiliser le provider manager pour la synthèse
      const options: SynthesisOptions = {
        voiceId: config.voiceURI || '',
        rate: config.rate ?? 1.0,
        pitch: config.pitch ?? 1.0,
        volume: config.volume ?? 1.0,
        onStart: () => {
          this.state = 'speaking'
          this.events.onStart?.(config.lineId)
        },
        onEnd: () => {
          if (this.queue.isEmpty()) {
            this.state = 'idle'
          }
          this.events.onEnd?.(config.lineId)
        },
        onError: (error) => {
          console.error('Erreur TTS:', error)
          this.events.onError?.(error)
          this.state = 'idle'
        },
        onProgress: (charIndex) => {
          this.events.onProgress?.(charIndex, config.lineId)
        },
      }

      // Synthétiser avec le provider actif
      ttsProviderManager
        .speak(config.text, options)
        .then((result) => {
          // Jouer l'audio résultant
          result.audio.play().catch((error) => {
            console.error('Erreur lors de la lecture audio:', error)
            this.events.onError?.(error)
          })
        })
        .catch((error) => {
          console.error('Erreur lors de la synthèse:', error)
          this.events.onError?.(error instanceof Error ? error : new Error('Erreur inconnue'))
        })
    } catch (error) {
      console.error('Erreur lors de la synthèse:', error)
      this.events.onError?.(error instanceof Error ? error : new Error('Erreur inconnue'))
    }
  }

  /**
   * Pause la lecture
   */
  pause(): void {
    if (this.state === 'speaking') {
      ttsProviderManager.pause()
      this.state = 'paused'
    }
  }

  /**
   * Reprend la lecture
   */
  resume(): void {
    if (this.state === 'paused') {
      ttsProviderManager.resume()
      this.state = 'speaking'
    }
  }

  /**
   * Arrête la lecture et vide la file
   */
  stop(): void {
    this.queue.clear()
    ttsProviderManager.stop()
    this.state = 'idle'
  }

  /**
   * Récupère l'état actuel du moteur
   *
   * @returns État du moteur
   */
  getState(): TTSState {
    return this.state
  }

  /**
   * Vérifie si le moteur est en train de lire
   *
   * @returns true si en lecture
   */
  isSpeaking(): boolean {
    return this.state === 'speaking'
  }

  /**
   * Vérifie si le moteur est en pause
   *
   * @returns true si en pause
   */
  isPaused(): boolean {
    return this.state === 'paused'
  }
}

/**
 * Instance singleton du moteur TTS
 */
export const ttsEngine = new TTSEngine()
