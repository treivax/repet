/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { Play } from '../../core/models/Play'
import {
  getPlayTitle,
  getPlayAuthor,
  getPlayYear,
  getPlayCategory,
  getPlayCharacters,
  getPlayActs,
} from '../../core/models/playHelpers'
import { formatDate } from '../../utils/formatting'

/**
 * Props du composant PlayCard
 */
export interface PlayCardProps {
  /** Pièce à afficher */
  play: Play
  /** Callback au clic */
  onClick?: (play: Play) => void
  /** Afficher le bouton de suppression */
  showDeleteButton?: boolean
  /** Callback pour la suppression */
  onDelete?: (play: Play) => void
}

/**
 * Composant PlayCard
 * Affiche une carte de pièce dans la bibliothèque
 */
export function PlayCard({ play, onClick, showDeleteButton = false, onDelete }: PlayCardProps) {
  const handleClick = () => {
    onClick?.(play)
  }

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onDelete?.(play)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.(play)
    }
  }

  return (
    <div
      className="group relative cursor-pointer rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg transition-all hover:border-blue-400 hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-500 dark:border-blue-800 dark:from-blue-900/20 dark:to-gray-800"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir ${getPlayTitle(play)}`}
      data-testid={`play-card-${play.id}`}
    >
      {/* Titre */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3
          className="flex-1 text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100"
          data-testid="play-title"
        >
          {getPlayTitle(play)}
        </h3>

        {/* Bouton de suppression */}
        {showDeleteButton && (
          <button
            onClick={handleDeleteClick}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            aria-label="Supprimer cette pièce"
            title="Supprimer"
            data-testid="delete-button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Métadonnées */}
      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {getPlayAuthor(play) && (
          <p data-testid="play-author">
            <span className="font-medium">Auteur :</span> {getPlayAuthor(play)}
          </p>
        )}

        {getPlayYear(play) && (
          <p data-testid="play-year">
            <span className="font-medium">Année :</span> {getPlayYear(play)}
          </p>
        )}

        {getPlayCategory(play) && (
          <p data-testid="play-category">
            <span className="font-medium">Genre :</span> {getPlayCategory(play)}
          </p>
        )}

        <p data-testid="play-acts-count">
          <span className="font-medium">Actes :</span> {getPlayActs(play).length}
        </p>

        <p data-testid="play-characters-count">
          <span className="font-medium">Personnages :</span> {getPlayCharacters(play).length}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-500" data-testid="play-created-date">
          Importé le {formatDate(play.createdAt)}
        </p>
      </div>
    </div>
  )
}
