/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { TTSProviderType } from '../../core/tts/types'

interface Props {
  /** Provider TTS actuellement sélectionné */
  currentProvider: TTSProviderType

  /** Callback appelé lors du changement de provider */
  onProviderChange: (provider: TTSProviderType) => void

  /** Callback appelé lors du clic sur "Réassigner les voix" */
  onReassignVoices: () => void

  /** Désactiver le composant */
  disabled?: boolean
}

/**
 * Composant de sélection du moteur TTS (provider)
 * Permet de choisir entre Piper et Web Speech API
 */
export function TTSProviderSelector({
  currentProvider,
  onProviderChange,
  onReassignVoices,
  disabled = false,
}: Props) {
  const providers: Array<{
    value: TTSProviderType
    label: string
    description: string
  }> = [
    {
      value: 'piper-wasm',
      label: 'Piper',
      description: 'Voix naturelles, fonctionne hors-ligne',
    },
    {
      value: 'web-speech',
      label: 'Google / Web Speech API',
      description: 'Utilise les voix du système',
    },
  ]

  const handleReassign = () => {
    if (
      window.confirm(
        'Réassigner toutes les voix ?\n\nLes assignations manuelles seront perdues et de nouvelles voix seront automatiquement attribuées à tous les personnages.'
      )
    ) {
      onReassignVoices()
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Titre */}
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">
          🔊
        </span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Moteur de synthèse vocale
        </h3>
      </div>

      {/* Options de provider */}
      <div className="space-y-2">
        {providers.map((provider) => {
          const isSelected = currentProvider === provider.value

          return (
            <label
              key={provider.value}
              className={`
                flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              {/* Radio button */}
              <input
                type="radio"
                name="tts-provider"
                value={provider.value}
                checked={isSelected}
                onChange={(e) => onProviderChange(e.target.value as TTSProviderType)}
                disabled={disabled}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />

              {/* Label et description */}
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {provider.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {provider.description}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {/* Bouton Réassigner */}
      <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
        <button
          type="button"
          onClick={handleReassign}
          disabled={disabled}
          className="
            flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300
            bg-white px-4 py-2 text-sm font-medium text-gray-700
            transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2
            focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed
            disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700
            dark:text-gray-200 dark:hover:bg-gray-600
          "
        >
          <span aria-hidden="true">🔄</span>
          <span>Réassigner les voix</span>
        </button>
      </div>
    </div>
  )
}
