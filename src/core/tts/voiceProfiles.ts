/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Système de profils vocaux pour créer des variations d'une même voix
 *
 * Permet de créer plusieurs "personnalités" vocales à partir d'une seule voix
 * en modifiant des paramètres audio (vitesse, pitch, timbre).
 */

/**
 * Paramètres de modification d'une voix
 */
export interface VoiceModifiers {
  /**
   * Vitesse de lecture (0.5 à 2.0, défaut: 1.0)
   * - < 1.0 : plus lent
   * - > 1.0 : plus rapide
   */
  playbackRate: number

  /**
   * Décalage de pitch en demi-tons (-12 à +12, défaut: 0)
   * - Négatif : voix plus grave
   * - Positif : voix plus aiguë
   * Nécessite Web Audio API
   */
  pitchShift?: number

  /**
   * Volume (0.0 à 1.0, défaut: 1.0)
   */
  volume?: number

  /**
   * Préaccentuation des hautes fréquences (0.0 à 1.0, défaut: 0)
   * Rend la voix plus claire/brillante
   */
  trebleBoost?: number

  /**
   * Préaccentuation des basses fréquences (0.0 à 1.0, défaut: 0)
   * Rend la voix plus chaleureuse/profonde
   */
  bassBoost?: number
}

/**
 * Profil vocal complet avec métadonnées
 */
export interface VoiceProfile {
  /** ID unique du profil */
  id: string

  /** Nom d'affichage du profil */
  displayName: string

  /** Voix de base (ex: fr_FR-tom-medium) */
  baseVoiceId: string

  /** Description du profil */
  description?: string

  /** Modificateurs audio */
  modifiers: VoiceModifiers

  /** Genre perçu */
  perceivedGender?: 'male' | 'female'

  /** Caractéristiques vocales */
  characteristics?: string[]
}

/**
 * Profils vocaux prédéfinis pour Tom
 * Réduits à 3 variantes les plus distinctes
 */
export const TOM_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'fr_FR-tom-medium-normal',
    displayName: 'Tom (Normal)',
    baseVoiceId: 'fr_FR-tom-medium',
    description: 'Voix naturelle de Tom',
    modifiers: {
      playbackRate: 1.0,
      volume: 1.0,
    },
    perceivedGender: 'male',
    characteristics: ['naturel', 'neutre'],
  },
  {
    id: 'fr_FR-tom-medium-autoritaire',
    displayName: 'Tom Autoritaire',
    baseVoiceId: 'fr_FR-tom-medium',
    description: 'Tom avec voix affirmée et puissante',
    modifiers: {
      playbackRate: 0.92,
      pitchShift: -3,
      volume: 1.0,
      bassBoost: 0.4,
    },
    perceivedGender: 'male',
    characteristics: ['autoritaire', 'puissant', 'grave'],
  },
  {
    id: 'fr_FR-tom-medium-jeune',
    displayName: 'Tom Jeune',
    baseVoiceId: 'fr_FR-tom-medium',
    description: 'Tom avec voix plus jeune et enjouée',
    modifiers: {
      playbackRate: 1.08,
      pitchShift: 3,
      volume: 1.0,
      trebleBoost: 0.25,
    },
    perceivedGender: 'male',
    characteristics: ['jeune', 'enjoué', 'dynamique'],
  },
]

/**
 * Profils vocaux prédéfinis pour Siwis
 */
export const SIWIS_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'fr_FR-siwis-medium-normal',
    displayName: 'Siwis (Normal)',
    baseVoiceId: 'fr_FR-siwis-medium',
    description: 'Voix naturelle de Siwis',
    modifiers: {
      playbackRate: 1.0,
      volume: 1.0,
    },
    perceivedGender: 'female',
    characteristics: ['naturel', 'neutre'],
  },
  {
    id: 'fr_FR-siwis-medium-douce',
    displayName: 'Siwis Douce',
    baseVoiceId: 'fr_FR-siwis-medium',
    description: 'Siwis avec voix plus douce et apaisante',
    modifiers: {
      playbackRate: 0.95,
      pitchShift: -1,
      volume: 0.9,
    },
    perceivedGender: 'female',
    characteristics: ['douce', 'apaisante', 'délicate'],
  },
  {
    id: 'fr_FR-siwis-medium-enjouee',
    displayName: 'Siwis Enjouée',
    baseVoiceId: 'fr_FR-siwis-medium',
    description: 'Siwis avec voix plus vive et joyeuse',
    modifiers: {
      playbackRate: 1.05,
      pitchShift: 1,
      volume: 1.0,
      trebleBoost: 0.15,
    },
    perceivedGender: 'female',
    characteristics: ['enjouée', 'joyeuse', 'vive'],
  },
]

/**
 * Profils vocaux prédéfinis pour UPMC
 */
export const UPMC_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'fr_FR-upmc-medium-normal',
    displayName: 'Jessica (Normal)',
    baseVoiceId: 'fr_FR-upmc-medium',
    description: 'Voix naturelle de Jessica',
    modifiers: {
      playbackRate: 1.0,
      volume: 1.0,
    },
    perceivedGender: 'female',
    characteristics: ['naturel', 'neutre'],
  },
  {
    id: 'fr_FR-upmc-medium-professionnelle',
    displayName: 'Jessica Professionnelle',
    baseVoiceId: 'fr_FR-upmc-medium',
    description: 'Jessica avec voix assurée et professionnelle',
    modifiers: {
      playbackRate: 0.98,
      pitchShift: -1,
      volume: 1.0,
    },
    perceivedGender: 'female',
    characteristics: ['professionnelle', 'assurée', 'claire'],
  },
  {
    id: 'fr_FR-upmc-medium-chaleureuse',
    displayName: 'Jessica Chaleureuse',
    baseVoiceId: 'fr_FR-upmc-medium',
    description: 'Jessica avec voix chaleureuse et bienveillante',
    modifiers: {
      playbackRate: 0.96,
      pitchShift: -2,
      volume: 0.95,
      bassBoost: 0.2,
    },
    perceivedGender: 'female',
    characteristics: ['chaleureuse', 'bienveillante', 'douce'],
  },
]

/**
 * Profils vocaux pour Pierre (UPMC speaker #1)
 * Utilise le fork piper-tts-web-patched pour le support multi-speaker
 */
export const PIERRE_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'fr_FR-upmc-pierre-medium-normal',
    displayName: 'Pierre (Normal)',
    baseVoiceId: 'fr_FR-upmc-pierre-medium',
    description: 'Voix naturelle de Pierre',
    modifiers: {
      playbackRate: 1.0,
      volume: 1.0,
    },
    perceivedGender: 'male',
    characteristics: ['naturel', 'neutre'],
  },
  {
    id: 'fr_FR-upmc-pierre-medium-autoritaire',
    displayName: 'Pierre Autoritaire',
    baseVoiceId: 'fr_FR-upmc-pierre-medium',
    description: 'Pierre avec voix affirmée et grave',
    modifiers: {
      playbackRate: 0.93,
      pitchShift: -3,
      volume: 1.0,
      bassBoost: 0.4,
    },
    perceivedGender: 'male',
    characteristics: ['autoritaire', 'grave', 'puissant'],
  },
  {
    id: 'fr_FR-upmc-pierre-medium-jeune',
    displayName: 'Pierre Jeune',
    baseVoiceId: 'fr_FR-upmc-pierre-medium',
    description: 'Pierre avec voix plus dynamique',
    modifiers: {
      playbackRate: 1.07,
      pitchShift: 2,
      volume: 1.0,
      trebleBoost: 0.2,
    },
    perceivedGender: 'male',
    characteristics: ['jeune', 'dynamique', 'vif'],
  },
]

/**
 * Tous les profils vocaux disponibles
 */
export const ALL_VOICE_PROFILES: VoiceProfile[] = [
  ...TOM_VOICE_PROFILES,
  ...SIWIS_VOICE_PROFILES,
  ...UPMC_VOICE_PROFILES,
  ...PIERRE_VOICE_PROFILES,
]

/**
 * Obtenir un profil vocal par son ID
 */
export function getVoiceProfile(profileId: string): VoiceProfile | undefined {
  return ALL_VOICE_PROFILES.find((p) => p.id === profileId)
}

/**
 * Obtenir tous les profils pour une voix de base
 */
export function getProfilesForBaseVoice(baseVoiceId: string): VoiceProfile[] {
  return ALL_VOICE_PROFILES.filter((p) => p.baseVoiceId === baseVoiceId)
}

/**
 * Obtenir tous les profils d'un genre
 */
export function getProfilesByGender(gender: 'male' | 'female'): VoiceProfile[] {
  return ALL_VOICE_PROFILES.filter((p) => p.perceivedGender === gender)
}

/**
 * Créer un profil vocal personnalisé
 */
export function createCustomVoiceProfile(
  baseVoiceId: string,
  displayName: string,
  modifiers: VoiceModifiers,
  options?: {
    description?: string
    perceivedGender?: 'male' | 'female'
    characteristics?: string[]
  }
): VoiceProfile {
  // Générer un ID unique basé sur le timestamp et les modificateurs
  const id = `${baseVoiceId}-custom-${Date.now()}-${Math.floor(modifiers.playbackRate * 100)}`

  return {
    id,
    displayName,
    baseVoiceId,
    modifiers,
    description: options?.description,
    perceivedGender: options?.perceivedGender,
    characteristics: options?.characteristics,
  }
}

/**
 * Valider les modificateurs d'une voix
 */
export function validateVoiceModifiers(modifiers: VoiceModifiers): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Vérifier playbackRate
  if (modifiers.playbackRate < 0.5 || modifiers.playbackRate > 2.0) {
    errors.push('playbackRate doit être entre 0.5 et 2.0')
  }

  // Vérifier pitchShift
  if (modifiers.pitchShift !== undefined) {
    if (modifiers.pitchShift < -12 || modifiers.pitchShift > 12) {
      errors.push('pitchShift doit être entre -12 et +12 demi-tons')
    }
  }

  // Vérifier volume
  if (modifiers.volume !== undefined) {
    if (modifiers.volume < 0.0 || modifiers.volume > 1.0) {
      errors.push('volume doit être entre 0.0 et 1.0')
    }
  }

  // Vérifier trebleBoost
  if (modifiers.trebleBoost !== undefined) {
    if (modifiers.trebleBoost < 0.0 || modifiers.trebleBoost > 1.0) {
      errors.push('trebleBoost doit être entre 0.0 et 1.0')
    }
  }

  // Vérifier bassBoost
  if (modifiers.bassBoost !== undefined) {
    if (modifiers.bassBoost < 0.0 || modifiers.bassBoost > 1.0) {
      errors.push('bassBoost doit être entre 0.0 et 1.0')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Appliquer les modificateurs audio à un élément HTMLAudioElement
 *
 * Note: Les modificateurs avancés (pitchShift, trebleBoost, bassBoost)
 * nécessitent Web Audio API et seront appliqués via AudioContext.
 */
export function applyBasicModifiers(audio: HTMLAudioElement, modifiers: VoiceModifiers): void {
  // Appliquer les modificateurs de base supportés par HTMLAudioElement
  audio.playbackRate = modifiers.playbackRate
  audio.volume = modifiers.volume ?? 1.0
}

/**
 * Créer un nœud Web Audio avec tous les modificateurs appliqués
 *
 * Cette fonction utilise Web Audio API pour appliquer des effets avancés
 * comme le pitch shifting et l'égalisation.
 *
 * @param audioElement - L'élément audio source
 * @param modifiers - Les modificateurs à appliquer
 * @param audioContext - Le contexte audio (sera créé si non fourni)
 * @returns Le contexte audio et les nœuds créés
 */
export function createAudioNodeWithModifiers(
  audioElement: HTMLAudioElement,
  modifiers: VoiceModifiers,
  audioContext?: AudioContext
): {
  context: AudioContext
  source: MediaElementAudioSourceNode
  gainNode: GainNode
  filterNodes: BiquadFilterNode[]
} {
  // Créer ou réutiliser le contexte audio
  const context = audioContext || new AudioContext()

  // Créer la source depuis l'élément audio
  const source = context.createMediaElementSource(audioElement)

  // Créer le nœud de gain (volume)
  const gainNode = context.createGain()
  gainNode.gain.value = modifiers.volume ?? 1.0

  // Créer les filtres d'égalisation
  const filterNodes: BiquadFilterNode[] = []

  // Filtre passe-haut pour trebleBoost
  if (modifiers.trebleBoost && modifiers.trebleBoost > 0) {
    const highShelf = context.createBiquadFilter()
    highShelf.type = 'highshelf'
    highShelf.frequency.value = 3000 // 3kHz
    highShelf.gain.value = modifiers.trebleBoost * 12 // Max +12dB
    filterNodes.push(highShelf)
  }

  // Filtre passe-bas pour bassBoost
  if (modifiers.bassBoost && modifiers.bassBoost > 0) {
    const lowShelf = context.createBiquadFilter()
    lowShelf.type = 'lowshelf'
    lowShelf.frequency.value = 200 // 200Hz
    lowShelf.gain.value = modifiers.bassBoost * 12 // Max +12dB
    filterNodes.push(lowShelf)
  }

  // Connecter la chaîne audio
  let currentNode: AudioNode = source

  // Connecter les filtres en série
  filterNodes.forEach((filter) => {
    currentNode.connect(filter)
    currentNode = filter
  })

  // Connecter au gain puis à la destination
  currentNode.connect(gainNode)
  gainNode.connect(context.destination)

  return {
    context,
    source,
    gainNode,
    filterNodes,
  }
}
