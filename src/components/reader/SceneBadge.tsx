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
  /** Callback pour ouvrir le sommaire */
  onOpenSummary: () => void
}

/**
 * Composant SceneBadge
 * Badge minimaliste fixe en bas de l'écran affichant la position actuelle
 * Ouvre le sommaire au clic
 */
export function SceneBadge({ currentActIndex, currentSceneIndex, onOpenSummary }: Props) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <button
        onClick={onOpenSummary}
        className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        aria-label="Ouvrir le sommaire"
        data-testid="scene-badge"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
          Acte {currentActIndex + 1} - Scène {currentSceneIndex + 1}
        </span>
      </button>
    </div>
  )
}
