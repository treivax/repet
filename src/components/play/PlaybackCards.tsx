/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type {
  PlaybackItem,
  StageDirectionPlaybackItem,
  StructurePlaybackItem,
  PresentationPlaybackItem,
} from '../../core/models/types'
import type { Character } from '../../core/models/Character'

/**
 * Props communes pour toutes les cartes de lecture
 */
interface BaseCardProps {
  isPlaying: boolean
  hasBeenPlayed: boolean
  onClick: () => void
}

/**
 * Carte pour une didascalie hors réplique
 * Style discret comme les répliques, texte en italique
 */
interface StageDirectionCardProps extends BaseCardProps {
  item: StageDirectionPlaybackItem
}

export function StageDirectionCard({
  item,
  isPlaying,
  hasBeenPlayed: _hasBeenPlayed,
  onClick,
}: StageDirectionCardProps) {
  const cardClasses = `
    my-4 px-4 py-3 rounded-lg cursor-pointer transition-all text-left w-full
    ${
      isPlaying
        ? 'bg-blue-50 dark:bg-blue-900/10 shadow-md border-l-4 border-blue-500'
        : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
    }
  `.trim()

  return (
    <button
      onClick={onClick}
      className={cardClasses}
      aria-label={`Didascalie: ${item.text}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <p
        className={`
          italic whitespace-pre-wrap
          ${
            isPlaying
              ? 'text-blue-600 dark:text-blue-400 font-medium'
              : 'text-gray-600 dark:text-gray-400'
          }
        `}
      >
        {item.text}
      </p>
    </button>
  )
}

/**
 * Carte pour un élément de structure (titre, acte, scène)
 * Style discret comme les répliques, différencié par la typographie
 */
interface StructureCardProps extends BaseCardProps {
  item: StructurePlaybackItem
}

export function StructureCard({
  item,
  isPlaying,
  hasBeenPlayed: _hasBeenPlayed,
  onClick,
}: StructureCardProps) {
  // Déterminer les classes de typographie selon le type de structure
  const getTypographyClasses = () => {
    switch (item.structureType) {
      case 'title':
        // Titre : très grand, gras, centré
        return 'text-4xl font-bold text-center'
      case 'act':
        // Acte : grand, gras, centré
        return 'text-3xl font-bold text-center'
      case 'scene':
        // Scène : moyen, gras, centré
        return 'text-2xl font-bold text-center'
      default:
        return 'text-xl font-semibold text-center'
    }
  }

  // Déterminer les classes de couleur selon l'état
  const getColorClasses = () => {
    if (isPlaying) {
      return 'text-blue-600 dark:text-blue-400'
    }
    return 'text-gray-900 dark:text-gray-100'
  }

  const cardClasses = `
    my-4 px-4 py-6 rounded-lg cursor-pointer transition-all text-left w-full
    ${
      isPlaying
        ? 'bg-blue-50 dark:bg-blue-900/10 shadow-md border-l-4 border-blue-500'
        : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
    }
  `.trim()

  return (
    <button
      onClick={onClick}
      className={cardClasses}
      aria-label={`${item.structureType}: ${item.text}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <p className={`${getTypographyClasses()} ${getColorClasses()} whitespace-pre-wrap`}>
        {item.text}
      </p>
    </button>
  )
}

/**
 * Carte pour la section de présentation (Cast)
 * Style discret comme les répliques
 */
interface PresentationCardProps extends BaseCardProps {
  item: PresentationPlaybackItem
  charactersMap?: Record<string, Character>
}

export function PresentationCard({
  item,
  isPlaying,
  hasBeenPlayed: _hasBeenPlayed,
  onClick,
  charactersMap,
}: PresentationCardProps) {
  // Fonction helper pour trouver un personnage par son nom
  const findCharacterByName = (name: string): Character | undefined => {
    if (!charactersMap) return undefined
    const normalizedSearchName = name.trim().toUpperCase()
    return Object.values(charactersMap).find(
      (char) => char.name.trim().toUpperCase() === normalizedSearchName
    )
  }

  const cardClasses = `
    my-4 px-4 py-3 rounded-lg cursor-pointer transition-all text-left w-full
    ${
      isPlaying
        ? 'bg-blue-50 dark:bg-blue-900/10 shadow-md border-l-4 border-blue-500'
        : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
    }
  `.trim()

  const { castSection } = item

  return (
    <button
      onClick={onClick}
      className={cardClasses}
      aria-label="Section de présentation (Cast)"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <h3
        className={`
          text-2xl font-bold text-center mb-4
          ${isPlaying ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
        `}
      >
        Distribution des rôles
      </h3>

      <div className="space-y-3">
        {/* Blocs de texte libre (en italique comme des didascalies) */}
        {castSection.textBlocks &&
          castSection.textBlocks.map((block, idx) => (
            <p
              key={`text-${idx}`}
              className={`
              italic whitespace-pre-wrap
              ${isPlaying ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}
            `}
            >
              {block}
            </p>
          ))}

        {/* Présentations de personnages */}
        {castSection.presentations &&
          castSection.presentations.map((presentation, idx) => {
            const character = findCharacterByName(presentation.characterName)
            const characterColor = character?.color || '#6366f1'

            return (
              <div key={`pres-${idx}`} className="mb-3">
                {/* Nom du personnage (comme une réplique : gras + couleur) */}
                <div
                  className="font-bold mb-1"
                  style={{ color: isPlaying ? undefined : characterColor }}
                >
                  {presentation.characterName}
                </div>

                {/* Description (en italique comme une didascalie) */}
                {presentation.description && (
                  <p
                    className={`
                    italic whitespace-pre-wrap
                    ${
                      isPlaying
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  `}
                  >
                    {presentation.description}
                  </p>
                )}
              </div>
            )
          })}
      </div>
    </button>
  )
}

/**
 * Composant principal pour rendre une carte de lecture selon son type
 */
interface PlaybackCardProps extends BaseCardProps {
  item: PlaybackItem
  charactersMap?: Record<string, Character>
}

export function PlaybackCard({
  item,
  isPlaying,
  hasBeenPlayed,
  onClick,
  charactersMap,
}: PlaybackCardProps) {
  switch (item.type) {
    case 'stage-direction':
      return (
        <StageDirectionCard
          item={item as StageDirectionPlaybackItem}
          isPlaying={isPlaying}
          hasBeenPlayed={hasBeenPlayed}
          onClick={onClick}
        />
      )

    case 'structure':
      return (
        <StructureCard
          item={item as StructurePlaybackItem}
          isPlaying={isPlaying}
          hasBeenPlayed={hasBeenPlayed}
          onClick={onClick}
        />
      )

    case 'presentation':
      return (
        <PresentationCard
          item={item as PresentationPlaybackItem}
          isPlaying={isPlaying}
          hasBeenPlayed={hasBeenPlayed}
          onClick={onClick}
          charactersMap={charactersMap}
        />
      )

    default:
      // Les répliques normales ne passent pas par ce composant
      return null
  }
}
