/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { Gender } from '../../core/models/types'
import type { VoiceDescriptor } from '../../core/tts/types'

interface Props {
  /** ID du personnage */
  characterId: string

  /** Nom du personnage */
  characterName: string

  /** Genre actuel du personnage */
  currentGender: Gender

  /** Voix actuellement assignée */
  currentVoice: VoiceDescriptor | null

  /** Liste des voix disponibles */
  availableVoices: VoiceDescriptor[]

  /** Callback appelé lors du changement de genre */
  onGenderChange: (characterId: string, gender: Gender) => void

  /** Callback appelé lors du changement de voix */
  onVoiceChange: (characterId: string, voiceId: string) => void

  /** Désactiver le composant */
  disabled?: boolean

  /** Masquer le sélecteur de genre (utile pour voix off) */
  hideGenderSelector?: boolean
}

/**
 * Composant d'édition de voix pour un personnage
 * Affiche le nom, les boutons de genre, et permet l'édition manuelle de la voix
 */
export function CharacterVoiceEditor({
  characterId,
  characterName,
  currentGender,
  currentVoice,
  availableVoices,
  onGenderChange,
  onVoiceChange,
  disabled = false,
  hideGenderSelector = false,
}: Props) {
  const genderOptions: Array<{ value: Gender; label: string; icon: string }> = [
    { value: 'male', label: 'Homme', icon: '♂' },
    { value: 'female', label: 'Femme', icon: '♀' },
  ]

  // Filtrer les voix par genre actuel
  const voicesOfGender = availableVoices.filter((v) => v.gender === currentGender)
  const voicesForDropdown = voicesOfGender.length > 0 ? voicesOfGender : availableVoices

  const handleGenderChange = (gender: Gender) => {
    onGenderChange(characterId, gender)
  }

  const handleVoiceSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceId = event.target.value
    if (voiceId) {
      onVoiceChange(characterId, voiceId)
    }
  }

  return (
    <div className="grid grid-cols-[minmax(120px,200px)_auto_1fr] items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      {/* Nom du personnage */}
      <div className="font-medium text-gray-900 dark:text-gray-100">{characterName}</div>

      {/* Sélecteur de genre */}
      {!hideGenderSelector ? (
        <div className="flex gap-2">
          {genderOptions.map((option) => {
            const isSelected = currentGender === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleGenderChange(option.value)}
                disabled={disabled}
                title={option.label}
                className={`
                  flex h-9 w-9 items-center justify-center rounded-md border-2 transition-all
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
                aria-label={`${option.label} pour ${characterName}`}
              >
                <span className="text-lg" aria-hidden="true">
                  {option.icon}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div></div>
      )}

      {/* Sélecteur de voix */}
      <div>
        <select
          value={currentVoice?.id || ''}
          onChange={handleVoiceSelect}
          disabled={disabled || voicesForDropdown.length === 0}
          className="
            w-full rounded-md border border-gray-300 bg-white px-3 py-2
            text-sm text-gray-900 transition-colors
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:opacity-50
            dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100
            dark:focus:border-blue-400 dark:focus:ring-blue-400
          "
        >
          {!currentVoice && <option value="">Sélectionner une voix...</option>}
          {voicesForDropdown.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.displayName}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
