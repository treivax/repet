/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState } from 'react'
import type { Line } from '../../core/models/Line'
import type { ReadingMode } from '../../core/tts/readingModes'
import type { Character } from '../../core/models/Character'

/**
 * Génère une couleur unique pour un personnage basée sur son ID
 */
function getCharacterColor(characterId: string): string {
  // Utiliser un hash simple du characterId pour générer une couleur cohérente
  let hash = 0
  for (let i = 0; i < characterId.length; i++) {
    hash = characterId.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Palette de couleurs prédéfinies pour une bonne lisibilité
  const colors = [
    'text-blue-700 dark:text-blue-400',
    'text-green-700 dark:text-green-400',
    'text-purple-700 dark:text-purple-400',
    'text-pink-700 dark:text-pink-400',
    'text-indigo-700 dark:text-indigo-400',
    'text-red-700 dark:text-red-400',
    'text-orange-700 dark:text-orange-400',
    'text-teal-700 dark:text-teal-400',
    'text-cyan-700 dark:text-cyan-400',
    'text-rose-700 dark:text-rose-400',
  ]

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Parse le texte pour extraire les didascalies (texte entre parenthèses)
 * et retourne un tableau de segments avec leur type
 */
function parseTextWithStageDirections(
  text: string
): Array<{ type: 'text' | 'stage-direction'; content: string }> {
  const segments: Array<{ type: 'text' | 'stage-direction'; content: string }> = []
  let currentPos = 0
  let openParen = -1

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(' && openParen === -1) {
      // Début d'une didascalie
      if (i > currentPos) {
        segments.push({ type: 'text', content: text.substring(currentPos, i) })
      }
      openParen = i
    } else if (text[i] === ')' && openParen !== -1) {
      // Fin d'une didascalie
      segments.push({ type: 'stage-direction', content: text.substring(openParen + 1, i) })
      currentPos = i + 1
      openParen = -1
    }
  }

  // Ajouter le reste du texte
  if (currentPos < text.length) {
    segments.push({ type: 'text', content: text.substring(currentPos) })
  }

  return segments
}

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

  /** La lecture est-elle en pause (mode audio) */
  isPaused?: boolean
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
  isPaused,
}: Props) {
  // Déterminer si c'est une réplique utilisateur
  const isUserLine =
    readingMode === 'italian' && userCharacterId && line.characterId === userCharacterId

  // Déterminer si la ligne doit être masquée
  const shouldHide = isUserLine && hideUserLines && !showBefore && !hasBeenRead
  const shouldReveal = isUserLine && hideUserLines && showAfter && hasBeenRead

  // État local pour savoir si la carte est cliquée/active
  const [isClicked, setIsClicked] = useState(false)

  // Rendu selon le type de ligne
  if (line.type === 'stage-direction') {
    return <div className="my-4 italic text-gray-500 dark:text-gray-500">{line.text}</div>
  }

  if (line.type === 'dialogue') {
    // Récupérer le nom du personnage
    const characterName = line.characterId
      ? charactersMap[line.characterId]?.name || 'INCONNU'
      : 'INCONNU'

    // Ligne masquée (mode italiennes, avant lecture)
    if (shouldHide) {
      return (
        <div className="my-4">
          <div className="font-bold uppercase text-gray-900 dark:text-gray-100">
            {characterName}
          </div>
          <div className="mt-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-100 p-4 text-center text-sm italic text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
            [Réplique masquée - À vous de jouer]
          </div>
        </div>
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
    const characterColor = line.characterId
      ? getCharacterColor(line.characterId)
      : 'text-gray-900 dark:text-gray-100'

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

    return (
      <div
        className={cardClasses}
        onClick={(e) => {
          e.stopPropagation()
          handleClick()
        }}
        onMouseDown={() => !onClick && setIsClicked(true)}
        onMouseUp={() => !onClick && setIsClicked(false)}
        onMouseLeave={() => !onClick && setIsClicked(false)}
        onTouchStart={() => !onClick && setIsClicked(true)}
        onTouchEnd={() => !onClick && setIsClicked(false)}
        onTouchCancel={() => !onClick && setIsClicked(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (onClick) {
              onClick()
            } else {
              setIsClicked(true)
              setTimeout(() => setIsClicked(false), 150)
            }
          }
        }}
      >
        <div className={`font-bold uppercase ${characterColor}`}>{characterName}</div>
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
        {isPlaying && isPaused && (
          <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">⏸ En pause</div>
        )}
      </div>
    )
  }

  // Type de ligne inconnu
  return <div className="my-2 text-gray-900 dark:text-gray-100">{line.text}</div>
}
