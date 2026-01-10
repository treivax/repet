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

  /** Nombre total d'actes */
  totalActs: number

  /** Nombre total de scènes dans l'acte actuel */
  totalScenesInAct: number

  /** Callback pour aller à la scène précédente */
  onPreviousScene: () => void

  /** Callback pour aller à la scène suivante */
  onNextScene: () => void

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
  totalActs,
  totalScenesInAct,
  onPreviousScene,
  onNextScene,
  canGoPrevious,
  canGoNext,
  disabled = false,
}: Props) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      {/* Bouton scène précédente */}
      <button
        onClick={onPreviousScene}
        disabled={!canGoPrevious || disabled}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Scène précédente"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="hidden sm:inline">Scène précédente</span>
      </button>

      {/* Indicateur de position */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Acte {currentActIndex + 1} / {totalActs}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Scène {currentSceneIndex + 1} / {totalScenesInAct}
        </div>
      </div>

      {/* Bouton scène suivante */}
      <button
        onClick={onNextScene}
        disabled={!canGoNext || disabled}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Scène suivante"
      >
        <span className="hidden sm:inline">Scène suivante</span>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
