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
 * Provider TTS utilisant l'API Web Speech du navigateur
 */
export class WebSpeechProvider implements TTSProvider {
  readonly type = 'web-speech' as const
  readonly name = 'Google / Web Speech API'

  private voices: SpeechSynthesisVoice[] = []
  private initialized = false

  /**
   * Initialise le provider
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = speechSynthesis.getVoices()

        if (this.voices.length > 0) {
          this.initialized = true
          resolve()
        }
      }

      // Charger les voix immédiatement
      loadVoices()

      // Les voix peuvent être chargées de façon asynchrone
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true })
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
   * Vérifie la disponibilité du provider
   */
  async checkAvailability(): Promise<TTSProviderAvailability> {
    if (!('speechSynthesis' in window)) {
      return {
        available: false,
        reason: 'Web Speech API non supportée par ce navigateur',
      }
    }

    return { available: true }
  }

  /**
   * Détecte le genre d'une voix selon son nom
   */
  private detectGender(voiceName: string): VoiceGender {
    const nameLower = voiceName.toLowerCase()

    // Patterns féminins
    const femalePatterns =
      /female|femme|woman|féminin|amélie|amélie|alice|anna|audrey|céline|claire|marie|pauline|samantha|victoria|zoe|zoé/i
    if (femalePatterns.test(nameLower)) {
      return 'female'
    }

    // Patterns masculins
    const malePatterns =
      /male|homme|man|masculin|thomas|daniel|nicolas|antoine|jacques|laurent|pierre|alex|david|oliver|william/i
    if (malePatterns.test(nameLower)) {
      return 'male'
    }

    // Par défaut : neutre
    return 'neutral'
  }

  /**
   * Récupère la liste des voix disponibles
   */
  getVoices(): VoiceDescriptor[] {
    // Filtrer uniquement les voix françaises
    const frenchVoices = this.voices.filter((v) => v.lang.startsWith('fr'))

    return frenchVoices.map((voice) => ({
      id: voice.voiceURI,
      name: voice.name,
      displayName: `${voice.name} (${voice.localService ? 'Local' : 'Cloud'})`,
      language: voice.lang,
      gender: this.detectGender(voice.name),
      provider: this.type,
      quality: voice.localService ? 'medium' : 'high',
      isLocal: voice.localService,
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
        console.warn(`Aucune voix disponible pour le personnage ${char.id}`)
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
   */
  async synthesize(text: string, options: SynthesisOptions): Promise<SynthesisResult> {
    return new Promise((resolve, reject) => {
      // Trouver la voix
      const voice = this.voices.find((v) => v.voiceURI === options.voiceId)

      if (!voice) {
        reject(new Error(`Voix ${options.voiceId} non trouvée`))
        return
      }

      // Créer l'utterance
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = voice
      utterance.rate = options.rate || 1.0
      utterance.pitch = options.pitch || 1.0
      utterance.volume = options.volume || 1.0

      // Événements
      utterance.onstart = () => {
        options.onStart?.()
      }

      utterance.onend = () => {
        options.onEnd?.()

        // Note: Web Speech API ne retourne pas d'objet Audio
        // On crée un Audio element vide pour respecter l'interface
        const audio = new Audio()
        resolve({
          audio,
          duration: 0, // Non disponible avec Web Speech API
          fromCache: false,
        })
      }

      utterance.onerror = (event) => {
        const error = new Error(`Erreur de synthèse vocale: ${event.error}`)
        options.onError?.(error)
        reject(error)
      }

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          options.onProgress?.(event.charIndex)
        }
      }

      // Lancer la synthèse
      speechSynthesis.speak(utterance)
    })
  }

  /**
   * Arrête la lecture en cours
   */
  stop(): void {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }
  }

  /**
   * Met en pause la lecture en cours
   */
  pause(): void {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause()
    }
  }

  /**
   * Reprend la lecture en pause
   */
  resume(): void {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
    }
  }

  /**
   * Libère les ressources
   */
  async dispose(): Promise<void> {
    this.stop()
    this.voices = []
    this.initialized = false
  }
}
