/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

interface Props {
  /** Voix off activée (lecture des didascalies) */
  voiceOffEnabled: boolean

  /** Vitesse de lecture par défaut (0.5 - 2.0) */
  defaultSpeed: number

  /** Vitesse de lecture utilisateur en italiennes (0.5 - 2.0) */
  userSpeed: number

  /** Callback pour toggle voix off */
  onVoiceOffToggle: () => void

  /** Callback pour changement vitesse par défaut */
  onDefaultSpeedChange: (speed: number) => void

  /** Callback pour changement vitesse utilisateur */
  onUserSpeedChange: (speed: number) => void

  /** Afficher les réglages italiennes (vitesse utilisateur) */
  showItalianSettings?: boolean

  /** Désactiver le composant */
  disabled?: boolean
}

const MIN_SPEED = 0.5
const MAX_SPEED = 2.0
const SPEED_STEP = 0.1

/**
 * Composant de configuration audio
 * Affiche toggle voix off et sliders de vitesse
 */
export function AudioSettings({
  voiceOffEnabled,
  defaultSpeed,
  userSpeed,
  onVoiceOffToggle,
  onDefaultSpeedChange,
  onUserSpeedChange,
  showItalianSettings = false,
  disabled = false,
}: Props) {
  const formatSpeed = (speed: number): string => {
    return speed.toFixed(1) + 'x'
  }

  return (
    <div className="space-y-6">
      {/* Toggle Voix Off */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label
            htmlFor="voice-off-toggle"
            className="font-medium text-gray-900 dark:text-gray-100"
          >
            Voix off
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lire les didascalies avec une voix différente
          </p>
        </div>

        <button
          id="voice-off-toggle"
          type="button"
          role="switch"
          aria-checked={voiceOffEnabled}
          onClick={onVoiceOffToggle}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
            ${voiceOffEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
        >
          <span
            aria-hidden="true"
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
              ${voiceOffEnabled ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Vitesse par défaut */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="default-speed" className="font-medium text-gray-900 dark:text-gray-100">
            Vitesse de lecture
          </label>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {formatSpeed(defaultSpeed)}
          </span>
        </div>

        <input
          id="default-speed"
          type="range"
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={SPEED_STEP}
          value={defaultSpeed}
          onChange={(e) => onDefaultSpeedChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
              ((defaultSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100
            }%, rgb(229, 231, 235) ${
              ((defaultSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100
            }%, rgb(229, 231, 235) 100%)`,
          }}
        />

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatSpeed(MIN_SPEED)}</span>
          <span>Normal (1.0x)</span>
          <span>{formatSpeed(MAX_SPEED)}</span>
        </div>
      </div>

      {/* Vitesse utilisateur (seulement en mode italiennes) */}
      {showItalianSettings && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="user-speed" className="font-medium text-gray-900 dark:text-gray-100">
              Vitesse de vos répliques
            </label>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatSpeed(userSpeed)}
            </span>
          </div>

          <input
            id="user-speed"
            type="range"
            min={MIN_SPEED}
            max={MAX_SPEED}
            step={SPEED_STEP}
            value={userSpeed}
            onChange={(e) => onUserSpeedChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
                ((userSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100
              }%, rgb(229, 231, 235) ${
                ((userSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100
              }%, rgb(229, 231, 235) 100%)`,
            }}
          />

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatSpeed(MIN_SPEED)}</span>
            <span>Normal (1.0x)</span>
            <span>{formatSpeed(MAX_SPEED)}</span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Vos répliques sont lues à volume 0 mais cette vitesse vous aide à suivre le rythme
          </p>
        </div>
      )}
    </div>
  )
}
