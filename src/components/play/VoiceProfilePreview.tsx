/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState } from 'react'
import type { VoiceProfile } from '../../core/tts/voiceProfiles'
import { ttsProviderManager } from '../../core/tts/providers'

interface Props {
  /** Profil à prévisualiser */
  profile: VoiceProfile

  /** Texte d'exemple pour la prévisualisation */
  sampleText?: string

  /** Callback appelé lors de la sélection du profil */
  onSelect?: (profileId: string) => void

  /** Le profil est-il actuellement sélectionné ? */
  isSelected?: boolean

  /** Désactiver le composant */
  disabled?: boolean
}

/**
 * Composant de prévisualisation d'un profil vocal
 * Permet d'écouter un échantillon du profil avant de l'assigner
 */
export function VoiceProfilePreview({
  profile,
  sampleText = 'Bonjour, voici un exemple de ma voix.',
  onSelect,
  isSelected = false,
  disabled = false,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePreview = async () => {
    if (isPlaying || disabled) return

    setIsPlaying(true)
    setError(null)

    try {
      const provider = ttsProviderManager.getActiveProvider()
      if (!provider) {
        throw new Error('Aucun provider TTS actif')
      }

      // Utiliser le profileId pour la synthèse (qui appliquera les modificateurs)
      const result = await provider.synthesize(sampleText, {
        voiceId: profile.id,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        onStart: () => {
          console.warn(`[VoiceProfilePreview] Lecture du profil ${profile.displayName}`)
        },
        onEnd: () => {
          setIsPlaying(false)
          console.warn(`[VoiceProfilePreview] Fin de la lecture du profil ${profile.displayName}`)
        },
        onError: (err) => {
          setIsPlaying(false)
          setError(err.message)
          console.error(`[VoiceProfilePreview] Erreur lors de la lecture:`, err)
        },
      })

      // Lancer la lecture
      await result.audio.play()
    } catch (err) {
      setIsPlaying(false)
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
      console.error(`[VoiceProfilePreview] Erreur:`, err)
    }
  }

  const handleSelect = () => {
    if (!disabled && onSelect) {
      onSelect(profile.id)
    }
  }

  return (
    <div
      className={`
        rounded-lg border-2 p-3 transition-all
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      onClick={handleSelect}
    >
      {/* En-tête */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{profile.displayName}</h4>
          {profile.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{profile.description}</p>
          )}
        </div>

        {/* Indicateur de sélection */}
        {isSelected && (
          <div className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
            <span className="text-sm" aria-hidden="true">
              ✓
            </span>
          </div>
        )}
      </div>

      {/* Caractéristiques */}
      {profile.characteristics && profile.characteristics.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {profile.characteristics.map((characteristic) => (
            <span
              key={characteristic}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            >
              {characteristic}
            </span>
          ))}
        </div>
      )}

      {/* Paramètres du profil */}
      <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Vitesse:</span> {profile.modifiers.playbackRate.toFixed(2)}x
        </div>
        {profile.modifiers.pitchShift !== undefined && profile.modifiers.pitchShift !== 0 && (
          <div>
            <span className="font-medium">Pitch:</span>{' '}
            {profile.modifiers.pitchShift > 0 ? '+' : ''}
            {profile.modifiers.pitchShift} demi-tons
          </div>
        )}
        {profile.modifiers.bassBoost !== undefined && profile.modifiers.bassBoost > 0 && (
          <div>
            <span className="font-medium">Graves:</span> +
            {Math.round(profile.modifiers.bassBoost * 100)}%
          </div>
        )}
        {profile.modifiers.trebleBoost !== undefined && profile.modifiers.trebleBoost > 0 && (
          <div>
            <span className="font-medium">Aigus:</span> +
            {Math.round(profile.modifiers.trebleBoost * 100)}%
          </div>
        )}
      </div>

      {/* Bouton d'écoute */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handlePreview()
        }}
        disabled={disabled || isPlaying}
        className="
          flex w-full items-center justify-center gap-2 rounded-md border
          border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700
          transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed
          disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700
          dark:text-gray-200 dark:hover:bg-gray-600
        "
      >
        <span aria-hidden="true">{isPlaying ? '⏸️' : '▶️'}</span>
        <span>{isPlaying ? 'Lecture en cours...' : 'Écouter un exemple'}</span>
      </button>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}

/**
 * Grille de prévisualisation de plusieurs profils
 */
interface VoiceProfileGridProps {
  /** Profils à afficher */
  profiles: VoiceProfile[]

  /** Profil actuellement sélectionné */
  selectedProfileId?: string

  /** Callback appelé lors de la sélection d'un profil */
  onSelectProfile: (profileId: string) => void

  /** Texte d'exemple pour la prévisualisation */
  sampleText?: string

  /** Désactiver le composant */
  disabled?: boolean
}

export function VoiceProfileGrid({
  profiles,
  selectedProfileId,
  onSelectProfile,
  sampleText,
  disabled = false,
}: VoiceProfileGridProps) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Aucun profil vocal disponible
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <VoiceProfilePreview
          key={profile.id}
          profile={profile}
          sampleText={sampleText}
          onSelect={onSelectProfile}
          isSelected={profile.id === selectedProfileId}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
