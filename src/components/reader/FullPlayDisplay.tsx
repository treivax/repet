/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useRef, useEffect } from 'react'
import type { ReadingMode } from '../../core/tts/readingModes'
import type { Character } from '../../core/models/Character'
import type { Act } from '../../core/models/Play'
import { LineRenderer } from './LineRenderer'

interface Props {
  /** Actes de la pièce */
  acts: Act[]

  /** Index de l'acte courant */
  currentActIndex: number

  /** Index de la scène courante */
  currentSceneIndex: number

  /** Index de la ligne courante */
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

  /** Callback optionnel pour le clic sur une ligne (mode audio) */
  onLineClick?: (lineIndex: number) => void

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
 * Composant d'affichage de la pièce complète
 * Affiche tous les actes et toutes les scènes en un seul scroll
 */
export function FullPlayDisplay({
  acts,
  currentActIndex,
  currentSceneIndex,
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
  onLineClick,
  isPaused,
  progressPercentage,
  elapsedTime,
  estimatedDuration,
  isGenerating,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLineRef = useRef<HTMLDivElement>(null)

  // Auto-scroll vers la ligne courante ou la scène courante
  useEffect(() => {
    if (currentLineRef.current && containerRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentActIndex, currentSceneIndex, currentLineIndex])

  if (acts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Aucun contenu dans cette pièce
        </p>
      </div>
    )
  }

  // Index global pour les lignes
  let globalLineIndex = 0

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-8"
      style={{ scrollBehavior: 'smooth' }}
      data-testid="full-play-display"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Titre de la pièce - affiché au début */}
        {playTitle && (
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{playTitle}</h1>
          </div>
        )}

        {/* Parcourir tous les actes */}
        {acts.map((act, actIdx) => (
          <div key={`act-${actIdx}`} className="mb-12">
            {/* Titre de l'acte */}
            <div id={`act-${actIdx}`} className="mb-6 text-center" data-act-index={actIdx}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Acte {act.actNumber}
                {act.title && ` : ${act.title}`}
              </h2>
            </div>

            {/* Parcourir toutes les scènes de cet acte */}
            {act.scenes.map((scene, sceneIdx) => (
              <div
                key={`scene-${actIdx}-${sceneIdx}`}
                className="mb-8"
                id={`act-${actIdx}-scene-${sceneIdx}`}
                data-act-index={actIdx}
                data-scene-index={sceneIdx}
              >
                {/* Titre de la scène */}
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Scène {scene.sceneNumber}
                    {scene.title && ` - ${scene.title}`}
                  </h3>
                </div>

                {/* Lignes de cette scène */}
                {scene.lines.map((line, lineIdx) => {
                  // Capturer l'index global dans une constante locale pour éviter le bug de closure
                  const currentGlobalIndex = globalLineIndex

                  // Incrémenter l'index global pour la prochaine ligne AVANT le return
                  globalLineIndex++

                  const isCurrentLine =
                    actIdx === currentActIndex &&
                    sceneIdx === currentSceneIndex &&
                    lineIdx === currentLineIndex

                  const isPlaying =
                    playingLineIndex !== undefined && currentGlobalIndex === playingLineIndex
                  const hasBeenRead = readLinesSet.has(currentGlobalIndex)

                  if (isCurrentLine) {
                    return (
                      <div
                        key={`line-${currentGlobalIndex}`}
                        ref={currentLineRef}
                        className={`transition-opacity ${
                          isCurrentLine ? 'opacity-100' : hasBeenRead ? 'opacity-60' : 'opacity-80'
                        }`}
                        data-testid="current-line"
                        data-line-index={currentGlobalIndex}
                        data-act-index={actIdx}
                        data-scene-index={sceneIdx}
                        data-local-line-index={lineIdx}
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
                          onClick={onLineClick ? () => onLineClick(currentGlobalIndex) : undefined}
                          isPaused={isPaused}
                          progressPercentage={isPlaying ? progressPercentage : 0}
                          elapsedTime={isPlaying ? elapsedTime : 0}
                          estimatedDuration={isPlaying ? estimatedDuration : 0}
                          isGenerating={isPlaying ? isGenerating : false}
                        />
                      </div>
                    )
                  }

                  return (
                    <div
                      key={`line-${currentGlobalIndex}`}
                      className={`transition-opacity ${
                        isCurrentLine ? 'opacity-100' : hasBeenRead ? 'opacity-60' : 'opacity-80'
                      }`}
                      data-testid={`line-${currentGlobalIndex}`}
                      data-line-index={currentGlobalIndex}
                      data-act-index={actIdx}
                      data-scene-index={sceneIdx}
                      data-local-line-index={lineIdx}
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
                        onClick={onLineClick ? () => onLineClick(currentGlobalIndex) : undefined}
                        isPaused={isPaused}
                        progressPercentage={isPlaying ? progressPercentage : 0}
                        elapsedTime={isPlaying ? elapsedTime : 0}
                        estimatedDuration={isPlaying ? estimatedDuration : 0}
                        isGenerating={isPlaying ? isGenerating : false}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
