/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import type { Line } from '../../core/models/Line'
import type { ReadingMode } from '../../core/tts/readingModes'
import type { Character } from '../../core/models/Character'

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
}: Props) {
  // Déterminer si c'est une réplique utilisateur
  const isUserLine =
    readingMode === 'italian' && userCharacterId && line.characterId === userCharacterId

  // Déterminer si la ligne doit être masquée
  const shouldHide = isUserLine && hideUserLines && !showBefore && !hasBeenRead
  const shouldReveal = isUserLine && hideUserLines && showAfter && hasBeenRead

  // Rendu selon le type de ligne
  if (line.type === 'stage-direction') {
    return (
      <div className="my-4 text-center italic text-gray-600 dark:text-gray-400">{line.text}</div>
    )
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

    // Indicateur visuel si ligne en cours de lecture
    const borderClasses = isPlaying
      ? 'border-l-4 border-blue-500 pl-4 bg-blue-50 dark:bg-blue-900/10 py-2 rounded-r'
      : ''

    return (
      <div className={`my-4 ${borderClasses}`}>
        <div className="font-bold uppercase text-gray-900 dark:text-gray-100">{characterName}</div>
        <div className={textClasses}>{line.text}</div>
        {shouldReveal && (
          <div className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Révélée</div>
        )}
      </div>
    )
  }

  // Type de ligne inconnu
  return <div className="my-2 text-gray-900 dark:text-gray-100">{line.text}</div>
}
