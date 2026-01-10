/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Gender } from '../models/types'
import { VoiceInfo } from './types'

/**
 * Gestionnaire de voix pour le TTS
 */
export class VoiceManager {
  private voices: SpeechSynthesisVoice[] = []
  private initialized = false

  /**
   * Initialise le gestionnaire de voix
   * À appeler au démarrage de l'application
   */
  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      if (this.initialized) {
        resolve()
        return
      }

      // Charger les voix
      const loadVoices = () => {
        this.voices = speechSynthesis.getVoices()

        if (this.voices.length > 0) {
          this.initialized = true
          resolve()
        }
      }

      // Les voix peuvent être chargées de façon asynchrone
      loadVoices()

      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices
      }

      // Timeout de sécurité
      setTimeout(() => {
        if (!this.initialized) {
          loadVoices()
          resolve()
        }
      }, 1000)
    })
  }

  /**
   * Récupère toutes les voix disponibles
   *
   * @returns Liste des voix
   */
  getVoices(): VoiceInfo[] {
    return this.voices.map((voice) => ({
      uri: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
    }))
  }

  /**
   * Récupère les voix françaises uniquement
   *
   * @returns Liste des voix françaises
   */
  getFrenchVoices(): VoiceInfo[] {
    return this.getVoices().filter((voice) => voice.lang.startsWith('fr'))
  }

  /**
   * Sélectionne automatiquement une voix selon le genre
   *
   * @param gender - Genre du personnage
   * @returns Voix sélectionnée ou null
   */
  selectVoiceForGender(gender: Gender): SpeechSynthesisVoice | null {
    const frenchVoices = this.voices.filter((v) => v.lang.startsWith('fr'))

    if (frenchVoices.length === 0) {
      console.warn('Aucune voix française disponible')
      return null
    }

    // Heuristiques pour détecter les voix homme/femme
    // (basées sur les noms courants des voix système)
    const femalePatterns = /female|femme|woman|féminin|amélie|audrey|céline/i
    const malePatterns = /male|homme|man|masculin|thomas|daniel|nicolas/i

    let selectedVoice: SpeechSynthesisVoice | undefined

    if (gender === 'female') {
      selectedVoice = frenchVoices.find((v) => femalePatterns.test(v.name))
    } else if (gender === 'male') {
      selectedVoice = frenchVoices.find((v) => malePatterns.test(v.name))
    }

    // Fallback : première voix française disponible
    if (!selectedVoice) {
      selectedVoice = frenchVoices[0]
    }

    return selectedVoice || null
  }

  /**
   * Récupère une voix par son URI
   *
   * @param uri - URI de la voix
   * @returns Voix correspondante ou undefined
   */
  getVoiceByURI(uri: string): SpeechSynthesisVoice | undefined {
    return this.voices.find((v) => v.voiceURI === uri)
  }

  /**
   * Vérifie si le TTS est disponible dans le navigateur
   *
   * @returns true si disponible
   */
  static isAvailable(): boolean {
    return 'speechSynthesis' in window
  }
}

/**
 * Instance singleton du gestionnaire de voix
 */
export const voiceManager = new VoiceManager()
