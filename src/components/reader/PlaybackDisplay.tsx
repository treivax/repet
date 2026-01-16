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
  /** Callback for clicking on a card */
  onCardClick?: (playbackIndex: number) => void

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

  /** Ref externe pour le container (pour IntersectionObserver) */
  containerRef?: React.RefObject<HTMLDivElement>

  /** Callback pour activer/désactiver le flag de scroll programmatique */
  setScrollingProgrammatically?: (isScrolling: boolean) => void
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
  isPaused,
  progressPercentage,
  elapsedTime,
  estimatedDuration,
  isGenerating,
  containerRef: externalContainerRef,
  setScrollingProgrammatically,
}: Props) {
  const internalContainerRef = useRef<HTMLDivElement>(null)
  const currentItemRef = useRef<HTMLDivElement>(null)

  // Utiliser la ref externe si fournie, sinon la ref interne
  const activeContainerRef = externalContainerRef || internalContainerRef

  // Auto-scroll vers l'item courant
  useEffect(() => {
    // En mode silencieux, ne pas faire de scroll automatique
    // (l'utilisateur scrolle manuellement et l'Observer met à jour la position)
    if (readingMode === 'silent') {
      return
    }

    if (currentPlaybackIndex === undefined) {
      return
    }

    if (!activeContainerRef.current) {
      return
    }

    // Activer le flag pour désactiver l'Observer pendant le scroll
    setScrollingProgrammatically?.(true)

    // Petit délai pour s'assurer que le DOM est rendu
    const scrollTimer = setTimeout(() => {
      // Essayer d'abord avec la ref, sinon chercher l'élément par data-attribute
      let targetElement: HTMLDivElement | HTMLElement | null = currentItemRef.current

      if (!targetElement) {
        // Fallback: chercher par data-playback-index
        targetElement = activeContainerRef.current?.querySelector(
          `[data-playback-index="${currentPlaybackIndex}"]`
        ) as HTMLDivElement | null
      }

      if (targetElement && activeContainerRef.current) {
        // Calculer la position de l'élément par rapport au container
        const containerRect = activeContainerRef.current.getBoundingClientRect()
        const elementRect = targetElement.getBoundingClientRect()

        // Calculer le scroll nécessaire pour centrer l'élément
        const containerHeight = containerRect.height
        const elementHeight = elementRect.height

        // Position actuelle de l'élément par rapport au viewport
        const elementTop = elementRect.top
        const containerTop = containerRect.top

        // Position de l'élément par rapport au container
        const elementRelativeTop = elementTop - containerTop

        // Scroll actuel du container
        const currentScroll = activeContainerRef.current.scrollTop

        // Position absolue de l'élément dans le contenu scrollable
        const elementAbsoluteTop = currentScroll + elementRelativeTop

        // Position cible : centrer l'élément dans le container
        const targetScroll = elementAbsoluteTop - containerHeight / 2 + elementHeight / 2

        // Scroller le container directement
        activeContainerRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        })

        // Désactiver le flag après le scroll (avec délai pour l'animation)
        setTimeout(() => {
          setScrollingProgrammatically?.(false)
        }, 1000)
      } else {
        // Si on ne peut pas scroller, désactiver le flag immédiatement
        setScrollingProgrammatically?.(false)
      }
    }, 150)

    return () => {
      clearTimeout(scrollTimer)
      // Nettoyer le flag si le composant unmount
      setScrollingProgrammatically?.(false)
    }
  }, [currentPlaybackIndex, activeContainerRef, setScrollingProgrammatically, readingMode])

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
      ref={activeContainerRef}
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
