/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState, useRef, useEffect } from 'react'
import type { Character } from '../../core/models/Character'
import type {
  PlaybackItem,
  StageDirectionPlaybackItem,
  StructurePlaybackItem,
  PresentationPlaybackItem,
} from '../../core/models/types'
import type { Annotation } from '../../core/models/Annotation'
import { generateCharacterColor } from '../../utils/colors'
import { AnnotationNote } from '../reader/AnnotationNote'

/**
 * Props communes pour toutes les cartes de lecture
 */
interface BaseCardProps {
  isPlaying?: boolean
  hasBeenPlayed?: boolean
  onClick?: () => void
  annotation?: Annotation
  onAnnotationCreate?: () => void
  onAnnotationUpdate?: (content: string) => void
  onAnnotationToggle?: () => void
  onAnnotationDelete?: () => void
}

/**
 * Carte pour une didascalie hors réplique
 * Style discret comme les répliques, texte en italique
 */
interface StageDirectionCardProps extends BaseCardProps {
  item?: StageDirectionPlaybackItem
  text?: string
  testId?: string
}

export function StageDirectionCard({
  item,
  text,
  isPlaying = false,
  hasBeenPlayed: _hasBeenPlayed = false,
  onClick,
  testId,
  annotation,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationToggle,
  onAnnotationDelete,
}: StageDirectionCardProps) {
  const displayText = text || item?.text || ''
  const [isClicked, setIsClicked] = useState(false)
  const longPressTimer = useRef<number | null>(null)
  const longPressTriggered = useRef(false)

  // Nettoyage du timer lors du démontage
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const cardClasses = `
    my-4 px-4 py-3 rounded-lg transition-all text-left w-full
    ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20' : 'cursor-pointer'}
    ${
      isPlaying
        ? 'bg-blue-50 dark:bg-blue-900/10 shadow-md border-l-4 border-blue-500'
        : isClicked
          ? 'bg-gray-100 dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700'
          : ''
    }
  `.trim()

  const content = (
    <p
      className={`
        italic whitespace-pre-wrap
        ${
          isPlaying
            ? 'text-blue-600 dark:text-blue-400 font-medium'
            : 'text-gray-500 dark:text-gray-500'
        }
      `}
    >
      {displayText}
    </p>
  )

  const handleMouseDown = () => {
    console.warn('[StageDirectionCard] handleMouseDown', {
      hasOnAnnotationCreate: !!onAnnotationCreate,
      hasAnnotation: !!annotation,
    })
    longPressTriggered.current = false
    if (onAnnotationCreate && !annotation) {
      const timer = window.setTimeout(() => {
        longPressTriggered.current = true
        onAnnotationCreate()
      }, 500)
      longPressTimer.current = timer
    } else {
      setIsClicked(true)
    }
  }

  const handleMouseUp = () => {
    console.warn('[StageDirectionCard] handleMouseUp', {
      hadTimer: !!longPressTimer.current,
      longPressTriggered: longPressTriggered.current,
    })
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsClicked(false)
  }

  const handleTouchStart = () => {
    longPressTriggered.current = false
    if (onAnnotationCreate && !annotation) {
      const timer = window.setTimeout(() => {
        longPressTriggered.current = true
        onAnnotationCreate()
      }, 500)
      longPressTimer.current = timer
    } else {
      setIsClicked(true)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsClicked(false)
  }

  const cardContent = !onClick ? (
    <div
      className={cardClasses}
      data-testid={testId}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {content}
    </div>
  ) : (
    <button
      onClick={(_e) => {
        console.warn('[StageDirectionCard] onClick déclenché', {
          hasTimer: !!longPressTimer.current,
          longPressTriggered: longPressTriggered.current,
          hasOnClick: !!onClick,
        })
        // Si un timer d'appui long est actif, c'est un clic court : annuler le timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        // Ne pas appeler onClick si l'appui long a déjà déclenché l'annotation
        if (!longPressTriggered.current) {
          console.warn('[StageDirectionCard] Appel de onClick()')
          onClick()
        } else {
          console.warn('[StageDirectionCard] onClick ignoré car long press déclenché')
        }
        longPressTriggered.current = false
      }}
      className={cardClasses}
      aria-label={`Didascalie: ${displayText}`}
      data-testid={testId}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {content}
    </button>
  )

  return (
    <div className="relative">
      {cardContent}
      {annotation && (
        <AnnotationNote
          annotation={annotation}
          onUpdate={onAnnotationUpdate || (() => {})}
          onToggle={onAnnotationToggle || (() => {})}
          onDelete={onAnnotationDelete}
        />
      )}
    </div>
  )
}

/**
 * Carte pour un élément de structure (titre, acte, scène)
 * Style discret comme les répliques, différencié par la typographie
 */
interface StructureCardProps extends BaseCardProps {
  item?: StructurePlaybackItem
  type?: 'title' | 'act' | 'scene'
  text?: string
  subtitle?: string
  testId?: string
}

export function StructureCard({
  item,
  type,
  text,
  subtitle,
  isPlaying = false,
  hasBeenPlayed: _hasBeenPlayed = false,
  onClick,
  testId,
  annotation,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationToggle,
  onAnnotationDelete,
}: StructureCardProps) {
  const structureType = type || item?.structureType || 'title'
  const displayText = text || item?.text || ''
  const [isClicked, setIsClicked] = useState(false)
  const longPressTimer = useRef<number | null>(null)
  const longPressTriggered = useRef(false)

  // Nettoyage du timer lors du démontage
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  // Déterminer les classes de typographie selon le type de structure
  const getTypographyClasses = () => {
    switch (structureType) {
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
    my-4 px-6 py-4 rounded-lg transition-all text-left w-full
    ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20' : 'cursor-pointer'}
    ${
      isPlaying
        ? 'bg-blue-50 dark:bg-blue-900/10 shadow-md border-l-4 border-blue-500'
        : isClicked
          ? 'bg-gray-100 dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700'
          : ''
    }
  `.trim()

  const content = (
    <div className={`${getTypographyClasses()} ${getColorClasses()} whitespace-pre-wrap`}>
      {displayText}
      {subtitle && (
        <span className="block text-xl font-normal mt-1 text-gray-600 dark:text-gray-400">
          {subtitle}
        </span>
      )}
    </div>
  )

  const handleMouseDown = () => {
    longPressTriggered.current = false
    if (onAnnotationCreate && !annotation) {
      const timer = window.setTimeout(() => {
        longPressTriggered.current = true
        onAnnotationCreate()
      }, 500)
      longPressTimer.current = timer
    } else {
      setIsClicked(true)
    }
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsClicked(false)
  }

  const handleTouchStart = () => {
    longPressTriggered.current = false
    if (onAnnotationCreate && !annotation) {
      const timer = window.setTimeout(() => {
        longPressTriggered.current = true
        onAnnotationCreate()
      }, 500)
      longPressTimer.current = timer
    } else {
      setIsClicked(true)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsClicked(false)
  }

  const cardContent = !onClick ? (
    <div
      className={cardClasses}
      data-testid={testId}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {content}
    </div>
  ) : (
    <button
      onClick={(_e) => {
        // Si un timer d'appui long est actif, c'est un clic court : annuler le timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        // Ne pas appeler onClick si l'appui long a déjà déclenché l'annotation
        if (!longPressTriggered.current) {
          onClick()
        }
        longPressTriggered.current = false
      }}
      className={cardClasses}
      aria-label={`${structureType}: ${displayText}`}
      data-testid={testId}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {content}
    </button>
  )

  return (
    <div className="relative">
      {cardContent}
      {annotation && (
        <AnnotationNote
          annotation={annotation}
          onUpdate={onAnnotationUpdate || (() => {})}
          onToggle={onAnnotationToggle || (() => {})}
          onDelete={onAnnotationDelete}
        />
      )}
    </div>
  )
}

/**
 * Carte pour la section de présentation (Cast)
 * Style discret comme les répliques
 */
interface PresentationCardProps extends BaseCardProps {
  item: PresentationPlaybackItem
  charactersMap?: Record<string, Character>
  testId?: string
}

export function PresentationCard({
  item,
  isPlaying = false,
  hasBeenPlayed: _hasBeenPlayed = false,
  onClick,
  charactersMap,
  testId,
  annotation,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationToggle,
  onAnnotationDelete,
}: PresentationCardProps) {
  const [isClicked, setIsClicked] = useState(false)
  const longPressTimer = useRef<number | null>(null)
  const longPressTriggered = useRef(false)

  // Nettoyage du timer lors du démontage
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const cardClasses = `
    my-4 px-4 py-3 rounded-lg transition-all text-left w-full
    ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20' : 'cursor-pointer'}
    ${
      isPlaying
        ? 'bg-blue-50 dark:bg-blue-900/10 shadow-md border-l-4 border-blue-500'
        : isClicked
          ? 'bg-gray-100 dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700'
          : ''
    }
  `.trim()

  const { castSection } = item

  const content = (
    <>
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
              ${isPlaying ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'}
            `}
            >
              {block}
            </p>
          ))}

        {/* Présentations de personnages */}
        {castSection.presentations &&
          castSection.presentations.map((presentation, idx) => {
            // Générer la couleur comme dans LineRenderer
            const allCharacterNames = charactersMap
              ? Object.values(charactersMap).map((char) => char.name)
              : []
            const characterColor = generateCharacterColor(
              presentation.characterName,
              allCharacterNames
            )

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
    </>
  )

  const handleMouseDown = () => {
    longPressTriggered.current = false
    if (onAnnotationCreate && !annotation) {
      const timer = window.setTimeout(() => {
        longPressTriggered.current = true
        onAnnotationCreate()
      }, 500)
      longPressTimer.current = timer
    } else {
      setIsClicked(true)
    }
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsClicked(false)
  }

  const handleTouchStart = () => {
    longPressTriggered.current = false
    if (onAnnotationCreate && !annotation) {
      const timer = window.setTimeout(() => {
        longPressTriggered.current = true
        onAnnotationCreate()
      }, 500)
      longPressTimer.current = timer
    } else {
      setIsClicked(true)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsClicked(false)
  }

  const cardContent = !onClick ? (
    <div
      className={cardClasses}
      data-testid={testId}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {content}
    </div>
  ) : (
    <button
      onClick={(_e) => {
        // Si un timer d'appui long est actif, c'est un clic court : annuler le timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        // Ne pas appeler onClick si l'appui long a déjà déclenché l'annotation
        if (!longPressTriggered.current) {
          onClick()
        }
        longPressTriggered.current = false
      }}
      className={cardClasses}
      aria-label="Section de présentation (Cast)"
      data-testid={testId}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {content}
    </button>
  )

  return (
    <div className="relative">
      {cardContent}
      {annotation && (
        <AnnotationNote
          annotation={annotation}
          onUpdate={onAnnotationUpdate || (() => {})}
          onToggle={onAnnotationToggle || (() => {})}
          onDelete={onAnnotationDelete}
        />
      )}
    </div>
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
