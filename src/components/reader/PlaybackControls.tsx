/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

interface Props {
  /** Lecture en cours */
  isPlaying: boolean

  /** Callback pour démarrer la lecture */
  onPlay: () => void

  /** Callback pour mettre en pause */
  onPause: () => void

  /** Callback pour arrêter */
  onStop: () => void

  /** Callback pour passer à la ligne suivante */
  onNext: () => void

  /** Callback pour revenir à la ligne précédente */
  onPrevious: () => void

  /** Y a-t-il une ligne suivante */
  canGoNext: boolean

  /** Y a-t-il une ligne précédente */
  canGoPrevious: boolean

  /** Désactiver les contrôles */
  disabled?: boolean

  /** Mode de lecture actuel */
  readingMode?: 'silent' | 'audio' | 'italian'
}

/**
 * Composant de contrôles de lecture TTS
 * Affiche les boutons play/pause/stop et navigation
 */
export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  disabled = false,
  readingMode = 'audio',
}: Props) {
  // En mode silencieux, pas de contrôles audio
  if (readingMode === 'silent') {
    return (
      <div className="flex items-center justify-center gap-3 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious || disabled}
          className="rounded-full bg-gray-100 p-3 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          aria-label="Ligne précédente"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={onNext}
          disabled={!canGoNext || disabled}
          className="rounded-full bg-gray-100 p-3 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          aria-label="Ligne suivante"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Bouton précédent */}
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious || disabled}
        className="rounded-full bg-gray-100 p-3 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Ligne précédente"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
          />
        </svg>
      </button>

      {/* Bouton Play/Pause */}
      {isPlaying ? (
        <button
          onClick={onPause}
          disabled={disabled}
          className="rounded-full bg-blue-600 p-4 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pause"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 9v6m4-6v6"
            />
          </svg>
        </button>
      ) : (
        <button
          onClick={onPlay}
          disabled={disabled}
          className="rounded-full bg-blue-600 p-4 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Lecture"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-6.518-3.882A1 1 0 007 8.118v7.764a1 1 0 001.234.97l6.518-3.882a1 1 0 000-1.802z"
            />
          </svg>
        </button>
      )}

      {/* Bouton Stop */}
      <button
        onClick={onStop}
        disabled={disabled}
        className="rounded-full bg-gray-100 p-3 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Arrêter"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Bouton suivant */}
      <button
        onClick={onNext}
        disabled={!canGoNext || disabled}
        className="rounded-full bg-gray-100 p-3 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Ligne suivante"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
          />
        </svg>
      </button>
    </div>
  )
}
