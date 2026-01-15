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

/**
 * Types de providers TTS disponibles
 */
export type TTSProviderType = 'piper-wasm' | 'piper-native'

/**
 * Genre d'une voix (pour l'assignation par personnage)
 */
export type VoiceGender = 'male' | 'female' | 'neutral'

/**
 * Qualité d'une voix
 */
export type VoiceQuality = 'low' | 'medium' | 'high'

/**
 * Description d'une voix TTS (format unifié multi-provider)
 */
export interface VoiceDescriptor {
  /** ID unique de la voix */
  id: string

  /** Nom technique de la voix */
  name: string

  /** Nom d'affichage convivial */
  displayName: string

  /** Langue (ex: "fr-FR") */
  language: string

  /** Genre de la voix */
  gender: VoiceGender

  /** Provider source */
  provider: TTSProviderType

  /** Qualité de la voix */
  quality: VoiceQuality

  /** Voix locale (vs cloud) */
  isLocal: boolean

  /** Nécessite téléchargement (pour Piper) */
  requiresDownload?: boolean

  /** Taille du téléchargement en octets (pour Piper) */
  downloadSize?: number

  /** URL du modèle (pour Piper) */
  url?: string

  /** URL de la config du modèle (pour Piper) */
  configUrl?: string
}

/**
 * Options pour la synthèse vocale
 */
export interface SynthesisOptions {
  /** ID de la voix à utiliser */
  voiceId: string

  /** Vitesse de lecture (0.5 - 2.0) */
  rate?: number

  /** Pitch/tonalité (0.0 - 2.0) */
  pitch?: number

  /** Volume (0.0 - 1.0) */
  volume?: number

  /** Indique si c'est un prefetch (ne pas arrêter l'audio en cours) */
  isPrefetch?: boolean

  /** Callbacks d'événements */
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
  onProgress?: (progress: number) => void
}

/**
 * Résultat de la synthèse vocale
 */
export interface SynthesisResult {
  /** Élément audio prêt à être joué */
  audio: HTMLAudioElement

  /** Durée en secondes */
  duration: number

  /** Provient du cache */
  fromCache: boolean
}

/**
 * Disponibilité d'un provider TTS
 */
export interface TTSProviderAvailability {
  /** Provider disponible */
  available: boolean

  /** Raison si indisponible */
  reason?: string
}

/**
 * Interface commune pour tous les providers TTS
 */
export interface TTSProvider {
  /** Type de provider */
  readonly type: TTSProviderType

  /** Nom d'affichage du provider */
  readonly name: string

  /** Initialise le provider */
  initialize(): Promise<void>

  /** Vérifie la disponibilité du provider */
  checkAvailability(): Promise<TTSProviderAvailability>

  /** Récupère la liste des voix disponibles */
  getVoices(): VoiceDescriptor[]

  /**
   * Génère une assignation de voix pour des personnages
   * @param characters Liste des personnages avec leur genre
   * @param existingAssignments Assignations existantes (pour préservation)
   * @returns Map characterId -> voiceId
   */
  generateVoiceAssignments(
    characters: Array<{ id: string; gender: VoiceGender }>,
    existingAssignments?: Record<string, string>
  ): Record<string, string>

  /** Synthétise du texte en audio */
  synthesize(text: string, options: SynthesisOptions): Promise<SynthesisResult>

  /** Précharge un modèle de voix (optionnel) */
  preloadModel?(voiceId: string, onProgress?: (percent: number) => void): Promise<void>

  /** Arrête la lecture en cours */
  stop(): void

  /** Libère les ressources */
  dispose(): Promise<void>
}
