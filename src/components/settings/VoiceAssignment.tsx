/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { Character } from '../../core/models/Character'
import type { Gender } from '../../core/models/types'

interface Props {
  /** Liste des personnages de la pièce */
  characters: Character[]

  /** Mapping characterId -> Gender */
  characterVoices: Record<string, Gender>

  /** Callback appelé lors du changement de sexe pour un personnage */
  onVoiceChange: (characterId: string, gender: Gender) => void

  /** Désactiver le composant */
  disabled?: boolean
}

/**
 * Composant d'assignation du sexe aux personnages
 * Affiche une liste des personnages avec un sélecteur de sexe pour chacun
 */
export function VoiceAssignment({
  characters,
  characterVoices,
  onVoiceChange,
  disabled = false,
}: Props) {
  const genderOptions: Array<{ value: Gender; label: string; icon: string }> = [
    { value: 'male', label: 'Homme', icon: '♂' },
    { value: 'female', label: 'Femme', icon: '♀' },
  ]

  if (characters.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucun personnage détecté dans cette pièce
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {characters.map((character) => {
        const currentGender = characterVoices[character.id]

        return (
          <div
            key={character.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Nom du personnage */}
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">{character.name}</div>
            </div>

            {/* Sélecteur de sexe */}
            <div className="flex gap-2">
              {genderOptions.map((option) => {
                const isSelected = currentGender === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onVoiceChange(character.id, option.value)}
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
                    aria-label={`${option.label} pour ${character.name}`}
                  >
                    <span className="text-lg" aria-hidden="true">
                      {option.icon}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
