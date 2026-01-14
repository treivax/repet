/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

interface Props {
  /** Cacher les répliques de l'utilisateur */
  hideUserLines: boolean

  /** Afficher les répliques avant lecture */
  showBefore: boolean

  /** Afficher les répliques après lecture */
  showAfter: boolean

  /** Callback pour toggle masquage */
  onHideUserLinesToggle: () => void

  /** Callback pour toggle afficher avant */
  onShowBeforeToggle: () => void

  /** Callback pour toggle afficher après */
  onShowAfterToggle: () => void

  /** Désactiver le composant */
  disabled?: boolean
}

/**
 * Composant de configuration du mode italiennes
 * Permet de configurer les options de masquage des répliques
 */
export function ItalianSettings({
  hideUserLines,
  showBefore,
  showAfter,
  onHideUserLinesToggle,
  onShowBeforeToggle,
  onShowAfterToggle,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Cacher les répliques */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label
            htmlFor="hide-lines-toggle"
            className="font-medium text-gray-900 dark:text-gray-100"
          >
            Masquer vos répliques dans le mode Italiennes
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cache vos répliques pendant la lecture
          </p>
        </div>

        <button
          id="hide-lines-toggle"
          type="button"
          role="switch"
          aria-checked={hideUserLines}
          onClick={onHideUserLinesToggle}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
            ${hideUserLines ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
          data-testid="hide-user-lines-toggle"
        >
          <span
            aria-hidden="true"
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
              ${hideUserLines ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Options d'affichage (seulement si masquage activé) */}
      {hideUserLines && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Options d'affichage
          </p>

          {/* Afficher avant */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label
                htmlFor="show-before-toggle"
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Afficher avant lecture
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Montre la réplique avant que le minuteur démarre
              </p>
            </div>

            <button
              id="show-before-toggle"
              type="button"
              role="switch"
              aria-checked={showBefore}
              onClick={onShowBeforeToggle}
              disabled={disabled}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
                ${showBefore ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              data-testid="show-before-toggle"
            >
              <span
                aria-hidden="true"
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${showBefore ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Afficher après */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label
                htmlFor="show-after-toggle"
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Afficher après lecture
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Révèle la réplique une fois le minuteur terminé
              </p>
            </div>

            <button
              id="show-after-toggle"
              type="button"
              role="switch"
              aria-checked={showAfter}
              onClick={onShowAfterToggle}
              disabled={disabled}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
                ${showAfter ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              data-testid="show-after-toggle"
            >
              <span
                aria-hidden="true"
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${showAfter ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
