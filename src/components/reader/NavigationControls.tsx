/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Button } from '../common/Button';

/**
 * Props du composant NavigationControls
 */
export interface NavigationControlsProps {
  /** Peut aller à la ligne précédente */
  canGoPrevious: boolean;
  /** Peut aller à la ligne suivante */
  canGoNext: boolean;
  /** Audio en cours de lecture */
  isPlaying?: boolean;
  /** Callback précédent */
  onPrevious: () => void;
  /** Callback suivant */
  onNext: () => void;
  /** Callback play/pause */
  onTogglePlay?: () => void;
  /** Mode audio activé */
  audioEnabled?: boolean;
}

/**
 * Composant NavigationControls
 * Boutons de navigation et contrôle lecture TTS
 */
export function NavigationControls({
  canGoPrevious,
  canGoNext,
  isPlaying = false,
  onPrevious,
  onNext,
  onTogglePlay,
  audioEnabled = false,
}: NavigationControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Bouton Précédent */}
      <Button
        variant="secondary"
        size="lg"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="Ligne précédente"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Précédent
      </Button>

      {/* Bouton Play/Pause (si audio activé) */}
      {audioEnabled && onTogglePlay && (
        <Button
          variant="primary"
          size="lg"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Lecture
            </>
          )}
        </Button>
      )}

      {/* Bouton Suivant */}
      <Button
        variant="secondary"
        size="lg"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Ligne suivante"
      >
        Suivant
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Button>
    </div>
  );
}
