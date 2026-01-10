/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

interface Props {
  /** Index de l'acte actuel */
  currentActIndex: number

  /** Index de la scène actuelle */
  currentSceneIndex: number

  /** Callback pour aller à la scène précédente */
  onPreviousScene: () => void

  /** Callback pour aller à la scène suivante */
  onNextScene: () => void

  /** Callback pour ouvrir le sommaire */
  onOpenSummary: () => void

  /** Y a-t-il une scène précédente */
  canGoPrevious: boolean

  /** Y a-t-il une scène suivante */
  canGoNext: boolean

  /** Désactiver la navigation */
  disabled?: boolean
}

/**
 * Composant de navigation par scène
 * Affiche les contrôles pour naviguer entre les scènes
 */
export function SceneNavigation({
  currentActIndex,
  currentSceneIndex,
  onPreviousScene,
  onNextScene,
  onOpenSummary,
  canGoPrevious,
  canGoNext,
  disabled = false,
}: Props) {
  return (
    <div
      className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
      data-testid="scene-navigation"
    >
      {/* Bouton scène précédente */}
      <button
        onClick={onPreviousScene}
        disabled={!canGoPrevious || disabled}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Scène précédente"
        data-testid="previous-scene-button"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Scène précédente</span>
      </button>

      {/* Indicateur de position - cliquable pour ouvrir le sommaire */}
      <button
        onClick={onOpenSummary}
        className="text-center px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        data-testid="current-scene"
        aria-label="Ouvrir le sommaire"
      >
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Acte {currentActIndex + 1} - Scène {currentSceneIndex + 1}
        </div>
      </button>

      {/* Bouton scène suivante */}
      <button
        onClick={onNextScene}
        disabled={!canGoNext || disabled}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Scène suivante"
        data-testid="next-scene-button"
      >
        <span className="hidden sm:inline">Scène suivante</span>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
