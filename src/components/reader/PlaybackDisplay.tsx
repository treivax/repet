/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useRef, useEffect } from 'react'
import type { ReadingMode } from '../../core/tts/readingModes'
import type { Character } from '../../core/models/Character'
import type { Line } from '../../core/models/Line'
import type {
  PlaybackItem,
  LinePlaybackItem,
  StageDirectionPlaybackItem,
  StructurePlaybackItem,
  PresentationPlaybackItem,
} from '../../core/models/types'
import { LineRenderer } from './LineRenderer'
import { StageDirectionCard, StructureCard, PresentationCard } from '../play/PlaybackCards'

interface Props {
  /** Séquence complète d'éléments de lecture */
  playbackSequence: PlaybackItem[]

  /** Lignes plates de la pièce (pour récupérer les Line objects) */
  flatLines: Line[]

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

  /** Index de l'item playback en cours de lecture */
  currentPlaybackIndex?: number

  /** Ligne en cours de lecture (pour les items de type 'line') */
  playingLineIndex?: number

  /** Items playback qui ont été joués */
  playedItems: Set<number>

  /** Lignes qui ont été lues */
  readLinesSet: Set<number>

  /** Map des personnages pour récupérer les noms */
  charactersMap: Record<string, Character>

  /** Titre de la pièce */
  playTitle?: string

  /** Callback pour le clic sur une ligne (mode audio) */
  onLineClick?: (lineIndex: number) => void

  /** Callback pour le clic sur une carte */
  onCardClick?: (playbackIndex: number) => void

  /** Callback pour l'appui long sur une ligne (mode audio/italiennes) */
  onLongPress?: (lineIndex: number) => void

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
 * Composant d'affichage de la séquence de lecture complète
 * Affiche les cartes (didascalies, structure, présentation) et les répliques dans l'ordre
 */
export function PlaybackDisplay({
  playbackSequence,
  flatLines,
  readingMode,
  userCharacterId,
  hideUserLines,
  showBefore,
  showAfter,
  currentPlaybackIndex,
  playingLineIndex,
  playedItems,
  readLinesSet,
  charactersMap,
  playTitle,
  onLineClick,
  onCardClick,
  onLongPress,
  isPaused,
  progressPercentage,
  elapsedTime,
  estimatedDuration,
  isGenerating,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentItemRef = useRef<HTMLDivElement>(null)

  // Auto-scroll vers l'item courant
  useEffect(() => {
    console.warn('[PlaybackDisplay] 🔄 currentPlaybackIndex changed:', currentPlaybackIndex)

    if (currentItemRef.current && containerRef.current) {
      console.warn('[PlaybackDisplay] ✅ Scrolling to item:', currentPlaybackIndex)
      currentItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    } else {
      console.warn('[PlaybackDisplay] ⚠️ Cannot scroll - ref not found:', {
        hasCurrentItemRef: !!currentItemRef.current,
        hasContainerRef: !!containerRef.current,
      })
    }
  }, [currentPlaybackIndex])

  if (playbackSequence.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Aucun contenu dans cette pièce
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-8"
      style={{ scrollBehavior: 'smooth' }}
      data-testid="playback-display"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Titre de la pièce - affiché au début si pas dans la séquence */}
        {playTitle && !playbackSequence.some((item) => item.type === 'structure') && (
          <StructureCard type="title" text={playTitle} onClick={undefined} testId="play-title" />
        )}

        {/* Parcourir tous les items de la séquence */}
        {playbackSequence.map((item) => {
          const isCurrentItem = currentPlaybackIndex === item.index
          const hasBeenPlayed = playedItems.has(item.index)

          // Wrapper avec ref pour l'item courant
          const wrapperRef = isCurrentItem ? currentItemRef : undefined

          // Log pour debug
          if (isCurrentItem) {
            console.warn('[PlaybackDisplay] 🎯 Current item assigned ref:', {
              index: item.index,
              type: item.type,
            })
          }

          switch (item.type) {
            case 'presentation': {
              const presentationItem = item as PresentationPlaybackItem
              return (
                <div
                  key={`playback-${item.index}`}
                  ref={wrapperRef}
                  data-playback-index={item.index}
                  data-playback-type="presentation"
                  className="mb-6"
                >
                  <PresentationCard
                    item={presentationItem}
                    isPlaying={isCurrentItem}
                    hasBeenPlayed={hasBeenPlayed}
                    onClick={onCardClick ? () => onCardClick(item.index) : undefined}
                    charactersMap={charactersMap}
                  />
                </div>
              )
            }

            case 'structure': {
              const structureItem = item as StructurePlaybackItem
              return (
                <div
                  key={`playback-${item.index}`}
                  ref={wrapperRef}
                  data-playback-index={item.index}
                  data-playback-type="structure"
                  data-structure-type={structureItem.structureType}
                  className="mb-6"
                >
                  <StructureCard
                    item={structureItem}
                    isPlaying={isCurrentItem}
                    hasBeenPlayed={hasBeenPlayed}
                    onClick={onCardClick ? () => onCardClick(item.index) : undefined}
                  />
                </div>
              )
            }

            case 'stage-direction': {
              const stageDirectionItem = item as StageDirectionPlaybackItem
              return (
                <div
                  key={`playback-${item.index}`}
                  ref={wrapperRef}
                  data-playback-index={item.index}
                  data-playback-type="stage-direction"
                  className="mb-4"
                >
                  <StageDirectionCard
                    item={stageDirectionItem}
                    isPlaying={isCurrentItem}
                    hasBeenPlayed={hasBeenPlayed}
                    onClick={onCardClick ? () => onCardClick(item.index) : undefined}
                  />
                </div>
              )
            }

            case 'line': {
              const lineItem = item as LinePlaybackItem
              const line = flatLines[lineItem.lineIndex]

              if (!line) {
                console.error(`Line not found at index ${lineItem.lineIndex}`)
                return null
              }

              const isPlaying =
                playingLineIndex !== undefined && lineItem.lineIndex === playingLineIndex
              const hasBeenRead = readLinesSet.has(lineItem.lineIndex)

              return (
                <div
                  key={`playback-${item.index}`}
                  ref={wrapperRef}
                  data-playback-index={item.index}
                  data-playback-type="line"
                  data-line-index={lineItem.lineIndex}
                  className={`transition-opacity ${
                    isCurrentItem ? 'opacity-100' : hasBeenRead ? 'opacity-60' : 'opacity-80'
                  }`}
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
                    onClick={onLineClick ? () => onLineClick(lineItem.lineIndex) : undefined}
                    onLongPress={onLongPress ? () => onLongPress(lineItem.lineIndex) : undefined}
                    isPaused={isPaused}
                    progressPercentage={isPlaying ? progressPercentage : 0}
                    elapsedTime={isPlaying ? elapsedTime : 0}
                    estimatedDuration={isPlaying ? estimatedDuration : 0}
                    isGenerating={isPlaying ? isGenerating : false}
                  />
                </div>
              )
            }

            default:
              console.warn(`Unknown playback item type:`, item)
              return null
          }
        })}
      </div>
    </div>
  )
}
