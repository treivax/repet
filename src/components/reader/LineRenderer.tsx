/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState } from 'react'
import type { Line } from '../../core/models/Line'
import type { ReadingMode } from '../../core/tts/readingModes'
import type { Character } from '../../core/models/Character'
import { generateCharacterColor } from '../../utils/colors'
import { parseTextWithStageDirections } from '../../utils/textParser'

interface Props {
  /** Ligne à afficher */
  line: Line

  /** Mode de lecture actuel */
  readingMode: ReadingMode

  /** ID du personnage utilisateur (pour mode italiennes) */
  userCharacterId?: string

  /** Masquer les répliques utilisateur */
  hideUserLines: boolean

  /** Afficher avant lecture (mode italiennes) */
  showBefore: boolean

  /** Afficher après lecture (mode italiennes) */
  showAfter: boolean

  /** La ligne est-elle en cours de lecture */
  isPlaying: boolean

  /** La ligne a-t-elle été lue */
  hasBeenRead: boolean

  /** Map des personnages pour récupérer les noms */
  charactersMap: Record<string, Character>

  /** Callback optionnel pour le clic (mode audio) */
  onClick?: () => void

  /** Callback optionnel pour l'appui long (mode audio/italiennes) */
  onLongPress?: () => void

  /** La lecture est-elle en pause (mode audio) */
  isPaused?: boolean

  /** Pourcentage de progression de la lecture (0-100) */
  progressPercentage?: number

  /** Temps écoulé en secondes */
  elapsedTime?: number

  /** Durée estimée totale en secondes */
  estimatedDuration?: number

  /** Audio en cours de génération (synthèse) */
  isGenerating?: boolean
}

/**
 * Composant de rendu d'une ligne de texte
 * Gère l'affichage selon le mode (silencieux, audio, italiennes)
 */
export function LineRenderer({
  line,
  readingMode,
  userCharacterId,
  hideUserLines,
  showBefore,
  showAfter,
  isPlaying,
  hasBeenRead,
  charactersMap,
  onClick,
  onLongPress,
  isPaused,
  progressPercentage = 0,
  elapsedTime = 0,
  estimatedDuration = 0,
  isGenerating = false,
}: Props) {
  // Déterminer si c'est une réplique utilisateur (avec support multi-personnages)
  const isUserLine =
    readingMode === 'italian' &&
    userCharacterId &&
    (line.isAllCharacters ||
      (line.characterIds && line.characterIds.includes(userCharacterId)) ||
      line.characterId === userCharacterId)

  // Déterminer si la ligne doit être masquée
  // Logique pour le mode italiennes avec hideUserLines activé :
  // - PENDANT la lecture (isPlaying) : TOUJOURS masquer (l'utilisateur doit jouer sans voir)
  // - AVANT la lecture (!hasBeenRead) : masquer sauf si showBefore = true
  // - APRÈS la lecture (hasBeenRead) : masquer sauf si showAfter = true
  let shouldHide = false
  if (isUserLine && hideUserLines) {
    if (isPlaying) {
      // Pendant la lecture : toujours masquer
      shouldHide = true
    } else if (!hasBeenRead) {
      // Avant lecture : masquer sauf si showBefore
      shouldHide = !showBefore
    } else {
      // Après lecture : masquer sauf si showAfter
      shouldHide = !showAfter
    }
  }

  const shouldReveal = isUserLine && hideUserLines && showAfter && hasBeenRead

  // État local pour savoir si la carte est cliquée/active
  const [isClicked, setIsClicked] = useState(false)

  // État pour gérer l'appui long
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null)

  // Rendu selon le type de ligne
  if (line.type === 'stage-direction') {
    return <div className="my-4 italic text-gray-500 dark:text-gray-500">{line.text}</div>
  }

  if (line.type === 'dialogue') {
    // Récupérer le(s) nom(s) du/des personnage(s)
    let characterDisplay = 'INCONNU'

    if (line.isAllCharacters) {
      characterDisplay = 'TOUS'
    } else if (line.characterIds && line.characterIds.length > 1) {
      // Réplique multi-personnages : afficher tous les noms séparés par " + "
      characterDisplay = line.characterIds
        .map((charId) => charactersMap[charId]?.name || charId)
        .join(' + ')
    } else if (line.characterId) {
      characterDisplay = charactersMap[line.characterId]?.name || line.characterId
    }

    // Pour la couleur, utiliser le premier personnage (ou l'ID unique)
    const primaryCharacterId = line.characterIds?.[0] || line.characterId || 'UNKNOWN'

    // Ligne masquée (mode italiennes, avant lecture)
    if (shouldHide) {
      // Créer une carte cliquable même pour les lignes masquées
      const hiddenCardClasses = `
        my-4 px-4 py-3 rounded-lg cursor-pointer transition-all text-left w-full
        ${
          isPlaying
            ? isPaused
              ? 'bg-yellow-50 dark:bg-yellow-900/10 shadow-md border-l-4 border-yellow-500'
              : 'bg-blue-50 dark:bg-blue-900/10 shadow-md border-l-4 border-blue-500'
            : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
        }
      `.trim()

      // Couleur du nom du personnage pour ligne masquée
      const allCharacterNames = Object.values(charactersMap).map((char) => char.name)
      const characterColor = generateCharacterColor(
        charactersMap[primaryCharacterId]?.name || primaryCharacterId,
        allCharacterNames
      )

      const handleHiddenClick = () => {
        if (onClick) {
          onClick()
        }
      }

      const handleHiddenMouseDown = () => {
        if (onLongPress) {
          const timer = window.setTimeout(() => {
            onLongPress()
          }, 500) // 500ms pour l'appui long
          setLongPressTimer(timer)
        }
      }

      const handleHiddenMouseUp = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer)
          setLongPressTimer(null)
        }
      }

      const handleHiddenTouchStart = () => {
        if (onLongPress) {
          const timer = window.setTimeout(() => {
            onLongPress()
          }, 500)
          setLongPressTimer(timer)
        }
      }

      const handleHiddenTouchEnd = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer)
          setLongPressTimer(null)
        }
      }

      return (
        <button
          onClick={handleHiddenClick}
          onMouseDown={handleHiddenMouseDown}
          onMouseUp={handleHiddenMouseUp}
          onMouseLeave={handleHiddenMouseUp}
          onTouchStart={handleHiddenTouchStart}
          onTouchEnd={handleHiddenTouchEnd}
          onTouchCancel={handleHiddenTouchEnd}
          className={hiddenCardClasses}
          data-testid="hidden-line"
        >
          <div className="flex items-center justify-between">
            <div className="font-bold uppercase" style={{ color: characterColor }}>
              {characterDisplay}
            </div>
            {isPlaying && (
              <div className="flex items-center gap-2">
                {/* Temps restant - largeur fixe pour éviter le déplacement du cercle */}
                <div
                  className={`text-xs font-medium text-right ${
                    isPaused
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                  style={{ minWidth: '180px' }}
                >
                  {isGenerating
                    ? '⏳ Génération en cours...'
                    : isPaused
                      ? '⏸ En pause · ' +
                        Math.max(0, Math.ceil(estimatedDuration - elapsedTime)) +
                        's'
                      : Math.max(0, Math.ceil(estimatedDuration - elapsedTime)) + 's'}
                </div>
                {/* Indicateur de progression circulaire */}
                <svg className="h-6 w-6 -rotate-90 transform flex-shrink-0" viewBox="0 0 24 24">
                  {/* Cercle de fond */}
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-gray-300 dark:text-gray-600"
                  />
                  {/* Cercle de progression */}
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - progressPercentage / 100)}`}
                    className={
                      isPaused
                        ? 'text-yellow-500 dark:text-yellow-400'
                        : 'text-blue-500 dark:text-blue-400'
                    }
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="mt-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-100 p-4 text-center text-sm italic text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
            [Réplique masquée - À vous de jouer]
          </div>
        </button>
      )
    }

    // Classes de base pour la réplique
    let textClasses = 'mt-2 whitespace-pre-wrap'

    // Coloration selon le contexte
    if (isPlaying) {
      textClasses += ' text-blue-600 dark:text-blue-400 font-medium'
    } else if (shouldReveal) {
      textClasses += ' text-green-600 dark:text-green-400'
    } else if (isUserLine) {
      textClasses += ' text-purple-600 dark:text-purple-400'
    } else {
      textClasses += ' text-gray-900 dark:text-gray-100'
    }

    // Couleur du nom du personnage
    const allCharacterNames = Object.values(charactersMap).map((char) => char.name)
    const characterColor = generateCharacterColor(
      charactersMap[primaryCharacterId]?.name || primaryCharacterId,
      allCharacterNames
    )

    // Parser le texte pour extraire les didascalies
    const textSegments = parseTextWithStageDirections(line.text)

    // Classes pour la carte cliquable
    const cardClasses = `
      my-4 px-4 py-3 rounded-lg cursor-pointer transition-all text-left w-full
      ${
        isPlaying
          ? isPaused
            ? 'bg-yellow-50 dark:bg-yellow-900/10 shadow-md border-l-4 border-yellow-500'
            : 'bg-blue-50 dark:bg-blue-900/10 shadow-md border-l-4 border-blue-500'
          : isClicked
            ? 'bg-gray-100 dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700'
            : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
      }
    `.trim()

    // Handler de clic : mode audio ou mode silencieux
    const handleClick = () => {
      if (onClick) {
        // Mode audio : appeler le callback
        onClick()
      } else {
        // Mode silencieux : toggle sélection visuelle uniquement
        setIsClicked(true)
      }
    }

    // Handlers pour l'appui long
    const handleMouseDown = () => {
      if (onLongPress) {
        const timer = window.setTimeout(() => {
          onLongPress()
        }, 500) // 500ms pour l'appui long
        setLongPressTimer(timer)
      } else if (!onClick) {
        setIsClicked(true)
      }
    }

    const handleMouseUp = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      if (!onClick) {
        setIsClicked(false)
      }
    }

    const handleTouchStart = () => {
      if (onLongPress) {
        const timer = window.setTimeout(() => {
          onLongPress()
        }, 500)
        setLongPressTimer(timer)
      } else if (!onClick) {
        setIsClicked(true)
      }
    }

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      if (!onClick) {
        setIsClicked(false)
      }
    }

    return (
      <div
        className={cardClasses}
        onClick={(e) => {
          e.stopPropagation()
          handleClick()
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            if (onClick) {
              onClick()
              // Ne pas modifier l'état clicked quand onClick est défini
              // pour éviter la sélection visuelle lors de pause/resume
            } else {
              setIsClicked(true)
              setTimeout(() => setIsClicked(false), 150)
            }
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="font-bold uppercase"
            style={characterColor ? { color: characterColor } : undefined}
          >
            {characterDisplay}
          </div>
          {isPlaying && (
            <div className="flex items-center gap-2">
              {/* Temps restant - largeur fixe pour éviter le déplacement du cercle */}
              <div
                className={`text-xs font-medium text-right ${
                  isPaused
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
                style={{ minWidth: '180px' }}
              >
                {isGenerating
                  ? '⏳ Génération en cours...'
                  : isPaused
                    ? '⏸ En pause · ' +
                      Math.max(0, Math.ceil(estimatedDuration - elapsedTime)) +
                      's'
                    : Math.max(0, Math.ceil(estimatedDuration - elapsedTime)) + 's'}
              </div>
              {/* Indicateur de progression circulaire */}
              <svg className="h-6 w-6 -rotate-90 transform flex-shrink-0" viewBox="0 0 24 24">
                {/* Cercle de fond */}
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-300 dark:text-gray-600"
                />
                {/* Cercle de progression */}
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - progressPercentage / 100)}`}
                  className={
                    isPaused
                      ? 'text-yellow-500 dark:text-yellow-400'
                      : 'text-blue-500 dark:text-blue-400'
                  }
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
        <div className={textClasses}>
          {textSegments.map((segment, idx) => {
            if (segment.type === 'stage-direction') {
              return (
                <span key={idx} className="italic text-gray-500 dark:text-gray-500">
                  ({segment.content})
                </span>
              )
            }
            return <span key={idx}>{segment.content}</span>
          })}
        </div>
        {shouldReveal && (
          <div className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Révélée</div>
        )}
      </div>
    )
  }

  // Type de ligne inconnu
  return <div className="my-2 text-gray-900 dark:text-gray-100">{line.text}</div>
}
