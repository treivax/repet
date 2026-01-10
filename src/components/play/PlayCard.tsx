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
  getPlayLines,
} from '../../core/models/playHelpers'
import { formatDate } from '../../utils/formatting'
import { useNavigate } from 'react-router-dom'

/**
 * Props du composant PlayCard
 */
export interface PlayCardProps {
  /** Pièce à afficher */
  play: Play
  /** Callback au clic */
  onClick?: (play: Play) => void
  /** Afficher le bouton de configuration */
  showConfigButton?: boolean
}

/**
 * Composant PlayCard
 * Affiche une carte de pièce dans la bibliothèque
 */
export function PlayCard({ play, onClick, showConfigButton = false }: PlayCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    onClick?.(play)
  }

  const handleConfigClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    navigate(`/play/${play.id}/config`)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.(play)
    }
  }

  return (
    <div
      className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
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

        {/* Bouton de configuration */}
        {showConfigButton && (
          <button
            onClick={handleConfigClick}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Configurer cette pièce"
            title="Configuration"
            data-testid="config-button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
            <span className="font-medium">Catégorie :</span> {getPlayCategory(play)}
          </p>
        )}

        <p data-testid="play-characters-count">
          <span className="font-medium">Personnages :</span> {getPlayCharacters(play).length}
        </p>

        <p data-testid="play-lines-count">
          <span className="font-medium">Lignes :</span> {getPlayLines(play).length}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-500" data-testid="play-created-date">
          Importé le {formatDate(play.createdAt)}
        </p>
      </div>
    </div>
  )
}
