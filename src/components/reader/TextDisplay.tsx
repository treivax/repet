/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useRef, useEffect } from 'react'
import type { Line } from '../../core/models/Line'
import type { ReadingMode } from '../../core/tts/readingModes'
import type { Character } from '../../core/models/Character'
import { LineRenderer } from './LineRenderer'

interface Props {
  /** Lignes de la scène à afficher */
  lines: Line[]

  /** Index de la ligne en cours de lecture */
  currentLineIndex: number

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

  /** Ligne en cours de lecture */
  playingLineIndex?: number

  /** Lignes qui ont été lues */
  readLinesSet: Set<number>

  /** Map des personnages pour récupérer les noms */
  charactersMap: Record<string, Character>

  /** Titre de la pièce */
  playTitle?: string

  /** Numéro de l'acte */
  actNumber?: number

  /** Titre de l'acte */
  actTitle?: string

  /** Numéro de la scène */
  sceneNumber?: number

  /** Titre de la scène */
  sceneTitle?: string

  /** Callback optionnel pour le clic sur une ligne (mode audio) */
  onLineClick?: (lineIndex: number) => void

  /** La lecture est-elle en pause (mode audio) */
  isPaused?: boolean
}

/**
 * Composant d'affichage du texte de la scène
 * Affiche toutes les lignes de la scène avec scroll automatique
 */
export function TextDisplay({
  lines,
  currentLineIndex,
  readingMode,
  userCharacterId,
  hideUserLines,
  showBefore,
  showAfter,
  playingLineIndex,
  readLinesSet,
  charactersMap,
  playTitle,
  actNumber,
  actTitle,
  sceneNumber,
  sceneTitle,
  onLineClick,
  isPaused,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLineRef = useRef<HTMLDivElement>(null)

  // Auto-scroll vers la ligne courante
  useEffect(() => {
    if (currentLineRef.current && containerRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentLineIndex])

  if (lines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Aucune ligne dans cette scène
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-8"
      style={{ scrollBehavior: 'smooth' }}
      data-testid="text-display"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Titre de la pièce - affiché seulement pour l'Acte 1, Scène 1 */}
        {playTitle && actNumber === 1 && sceneNumber === 1 && (
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{playTitle}</h1>
          </div>
        )}

        {/* Acte */}
        {actNumber !== undefined && (
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Acte {actNumber}
              {actTitle && ` : ${actTitle}`}
            </h2>
          </div>
        )}

        {/* Scène */}
        {sceneNumber !== undefined && (
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Scène {sceneNumber}
              {sceneTitle && ` - ${sceneTitle}`}
            </h3>
          </div>
        )}

        {lines.map((line, index) => {
          const isCurrentLine = index === currentLineIndex
          const isPlaying = playingLineIndex !== undefined && index === playingLineIndex
          const hasBeenRead = readLinesSet.has(index)

          return (
            <div
              key={`line-${index}`}
              ref={isCurrentLine ? currentLineRef : null}
              className={`transition-opacity ${
                isCurrentLine ? 'opacity-100' : hasBeenRead ? 'opacity-60' : 'opacity-80'
              }`}
              data-testid={isCurrentLine ? 'current-line' : `line-${index}`}
              data-line-index={index}
            >
              <LineRenderer
                line={line}
                readingMode={readingMode}
                userCharacterId={userCharacterId}
                hideUserLines={hideUserLines}
                showBefore={showBefore}
                showAfter={showAfter}
                isPlaying={isPlaying}
                hasBeenRead={hasBeenRead}
                charactersMap={charactersMap}
                onClick={onLineClick ? () => onLineClick(index) : undefined}
                isPaused={isPaused}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
