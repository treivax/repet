/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { Character } from '../../core/models/Character'

interface Props {
  /** Liste des personnages de la pièce */
  characters: Character[]

  /** ID du personnage de l'utilisateur */
  userCharacterId?: string

  /** Cacher les répliques de l'utilisateur */
  hideUserLines: boolean

  /** Afficher les répliques avant lecture */
  showBefore: boolean

  /** Afficher les répliques après lecture */
  showAfter: boolean

  /** Callback pour changement du personnage utilisateur */
  onUserCharacterChange: (characterId: string | undefined) => void

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
 * Permet de choisir le personnage utilisateur et les options de masquage
 */
export function ItalianSettings({
  characters,
  userCharacterId,
  hideUserLines,
  showBefore,
  showAfter,
  onUserCharacterChange,
  onHideUserLinesToggle,
  onShowBeforeToggle,
  onShowAfterToggle,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Sélection du personnage utilisateur */}
      <div className="space-y-2">
        <label
          htmlFor="user-character"
          className="block font-medium text-gray-900 dark:text-gray-100"
        >
          Votre personnage
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sélectionnez le personnage que vous allez jouer
        </p>

        <select
          id="user-character"
          value={userCharacterId || ''}
          onChange={(e) => onUserCharacterChange(e.target.value || undefined)}
          disabled={disabled}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">-- Aucun personnage sélectionné --</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </select>
      </div>

      {/* Options de masquage (seulement si personnage sélectionné) */}
      {userCharacterId && (
        <>
          {/* Cacher les répliques */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label
                htmlFor="hide-lines-toggle"
                className="font-medium text-gray-900 dark:text-gray-100"
              >
                Masquer vos répliques
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
        </>
      )}

      {/* Message d'information si pas de personnage sélectionné */}
      {!userCharacterId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Sélectionnez votre personnage pour activer les options de masquage
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
