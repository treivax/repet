/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState } from 'react'
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
}: Props) {
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false)

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

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(characterId, voiceId)
    setShowVoiceDropdown(false)
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      {/* Nom du personnage */}
      <div className="font-medium text-gray-900 dark:text-gray-100">{characterName}</div>

      {/* Sélecteur de genre */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Genre :</span>
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
      </div>

      {/* Voix assignée + Bouton Edit */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Voix : </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {currentVoice?.displayName || 'Non assignée'}
          </span>
        </div>

        {/* Bouton Edit */}
        <button
          type="button"
          onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
          disabled={disabled || voicesForDropdown.length === 0}
          className="
            flex items-center gap-1 rounded-md border border-gray-300 bg-white
            px-2 py-1 text-xs font-medium text-gray-700 transition-colors
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
            dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200
            dark:hover:bg-gray-600
          "
          title="Choisir une voix spécifique"
        >
          <span aria-hidden="true">✏️</span>
          <span>Modifier</span>
        </button>
      </div>

      {/* Dropdown de sélection de voix */}
      {showVoiceDropdown && (
        <div className="mt-2 rounded-md border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-700">
          <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            Choisir une voix :
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {voicesForDropdown.map((voice) => {
              const isSelected = voice.id === currentVoice?.id

              return (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => handleVoiceSelect(voice.id)}
                  className={`
                    w-full rounded px-2 py-1.5 text-left text-sm transition-colors
                    ${
                      isSelected
                        ? 'bg-blue-100 font-medium text-blue-900 dark:bg-blue-900/40 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {voice.displayName}
                  {isSelected && (
                    <span className="ml-2 text-xs" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
