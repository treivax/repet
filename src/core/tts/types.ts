/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * État du moteur TTS
 */
export type TTSState = 'idle' | 'speaking' | 'paused'

/**
 * Configuration de lecture d'une réplique
 */
export interface SpeechConfig {
  /** Texte à lire */
  text: string

  /** URI de la voix à utiliser */
  voiceURI?: string

  /** Vitesse de lecture (0.5 - 2.0) */
  rate?: number

  /** Volume (0.0 - 1.0) */
  volume?: number

  /** Pitch (0.0 - 2.0) */
  pitch?: number

  /** ID de la réplique (pour tracking) */
  lineId?: string
}

/**
 * Événements du moteur TTS
 */
export interface TTSEvents {
  /** Appelé quand une réplique commence */
  onStart?: (lineId?: string) => void

  /** Appelé quand une réplique se termine */
  onEnd?: (lineId?: string) => void

  /** Appelé en cas d'erreur */
  onError?: (error: Error) => void

  /** Appelé lors de la progression (pour animation) */
  onProgress?: (charIndex: number, lineId?: string) => void
}

/**
 * Informations sur une voix système
 */
export interface VoiceInfo {
  /** URI unique de la voix */
  uri: string

  /** Nom de la voix */
  name: string

  /** Langue (ex: "fr-FR") */
  lang: string

  /** Est une voix locale (vs réseau) */
  localService: boolean
}
