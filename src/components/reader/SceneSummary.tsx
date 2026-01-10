/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { Act } from '../../core/models/Play'

interface Props {
  /** Liste des actes de la pièce */
  acts: Act[]

  /** Index de l'acte actuel */
  currentActIndex: number

  /** Index de la scène actuelle */
  currentSceneIndex: number

  /** Callback appelé lors de la sélection d'une scène */
  onSceneSelect: (actIndex: number, sceneIndex: number) => void

  /** Afficher/masquer le sommaire */
  isOpen: boolean

  /** Callback pour fermer le sommaire */
  onClose: () => void
}

/**
 * Composant d'affichage du sommaire actes/scènes
 * Permet la navigation rapide dans la pièce
 */
export function SceneSummary({
  acts,
  currentActIndex,
  currentSceneIndex,
  onSceneSelect,
  isOpen,
  onClose,
}: Props) {
  if (!isOpen) return null

  const handleSceneClick = (actIndex: number, sceneIndex: number) => {
    onSceneSelect(actIndex, sceneIndex)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel du sommaire */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sommaire</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Fermer le sommaire"
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
        </div>

        {/* Liste des actes et scènes */}
        <div className="p-4">
          {acts.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Aucun acte disponible
            </p>
          ) : (
            <div className="space-y-4">
              {acts.map((act, actIndex) => {
                const isCurrentAct = actIndex === currentActIndex

                return (
                  <div key={`act-${actIndex}`} className="space-y-2">
                    {/* Titre de l'acte */}
                    <div
                      className={`font-semibold ${
                        isCurrentAct
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                      data-testid={`act-${actIndex}`}
                    >
                      ACTE {act.actNumber}
                      {act.title && ` - ${act.title}`}
                    </div>

                    {/* Scènes de l'acte */}
                    <div className="ml-4 space-y-1">
                      {act.scenes.map((scene, sceneIndex) => {
                        const isCurrentScene = isCurrentAct && sceneIndex === currentSceneIndex

                        return (
                          <button
                            key={`scene-${actIndex}-${sceneIndex}`}
                            onClick={() => handleSceneClick(actIndex, sceneIndex)}
                            className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                              isCurrentScene
                                ? 'bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                            data-testid={`scene-${actIndex}-${sceneIndex}`}
                          >
                            Scène {scene.sceneNumber}
                            {scene.title && ` - ${scene.title}`}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({scene.lines.length} lignes)
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
