/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { SpeechConfig, TTSEvents, TTSState } from './types'
import { voiceManager, VoiceManager } from './voice-manager'
import { SpeechQueue } from './queue'

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
    if (!VoiceManager.isAvailable()) {
      throw new Error("La synthèse vocale n'est pas disponible dans ce navigateur")
    }

    await voiceManager.initialize()
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
      const utterance = new SpeechSynthesisUtterance(config.text)

      // Configuration de la voix
      if (config.voiceURI) {
        const voice = voiceManager.getVoiceByURI(config.voiceURI)
        if (voice) {
          utterance.voice = voice
        }
      }

      // Configuration des paramètres
      utterance.rate = config.rate ?? 1.0
      utterance.volume = config.volume ?? 1.0
      utterance.pitch = config.pitch ?? 1.0
      utterance.lang = 'fr-FR'

      // Événements
      utterance.onstart = () => {
        this.state = 'speaking'
        this.events.onStart?.(config.lineId)
      }

      utterance.onend = () => {
        if (this.queue.isEmpty()) {
          this.state = 'idle'
        }
        this.events.onEnd?.(config.lineId)
      }

      utterance.onerror = (event) => {
        console.error('Erreur TTS:', event.error)
        this.events.onError?.(new Error(`Erreur TTS: ${event.error}`))
        this.state = 'idle'
      }

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          this.events.onProgress?.(event.charIndex, config.lineId)
        }
      }

      // Ajouter à la file d'attente
      this.queue.enqueue(config, utterance)
    } catch (error) {
      console.error("Erreur lors de la création de l'utterance:", error)
      this.events.onError?.(error instanceof Error ? error : new Error('Erreur inconnue'))
    }
  }

  /**
   * Pause la lecture
   */
  pause(): void {
    if (this.state === 'speaking') {
      this.queue.pause()
      this.state = 'paused'
    }
  }

  /**
   * Reprend la lecture
   */
  resume(): void {
    if (this.state === 'paused') {
      this.queue.resume()
      this.state = 'speaking'
    }
  }

  /**
   * Arrête la lecture et vide la file
   */
  stop(): void {
    this.queue.clear()
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
