/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { ReadingMode } from '../../core/tts/readingModes'

interface Props {
  /** Mode de lecture actuellement sélectionné */
  value: ReadingMode

  /** Callback appelé lors du changement de mode */
  onChange: (mode: ReadingMode) => void

  /** Désactiver le sélecteur */
  disabled?: boolean
}

/**
 * Composant de sélection du mode de lecture
 * Affiche 3 boutons : Silencieux, Audio, Italiennes
 */
export function ReadingModeSelector({ value, onChange, disabled = false }: Props) {
  const modes: Array<{ value: ReadingMode; label: string; description: string }> = [
    {
      value: 'silent',
      label: 'Silencieux',
      description: 'Lecture silencieuse sans audio',
    },
    {
      value: 'audio',
      label: 'Audio',
      description: 'Lecture audio de toutes les répliques',
    },
    {
      value: 'italian',
      label: 'Italiennes',
      description: 'Répétition avec masquage de vos répliques',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {modes.map((mode) => {
          const isSelected = value === mode.value

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              disabled={disabled}
              className={`
                relative rounded-lg border-2 p-4 text-left transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              {/* Indicateur de sélection */}
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Contenu */}
              <div className="space-y-1">
                <div
                  className={`text-sm font-semibold ${
                    isSelected
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {mode.label}
                </div>
                <div
                  className={`text-xs ${
                    isSelected
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {mode.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
