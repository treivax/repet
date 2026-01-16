/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlayStore } from '../state/playStore'
import { usePlaySettingsStore } from '../state/playSettingsStore'
import { useUIStore } from '../state/uiStore'

import { playsRepository } from '../core/storage/plays'
import { ttsEngine } from '../core/tts'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { PlaybackDisplay } from '../components/reader/PlaybackDisplay'
import { Header } from '../components/common/Header'
import type { HeaderMenuItem } from '../components/common/Header'
import { SceneBadge } from '../components/reader/SceneBadge'
import { SceneSummary } from '../components/reader/SceneSummary'
import { getPlayTitle, getPlayAuthor } from '../core/models/playHelpers'
import type { Character } from '../core/models/Character'

import { pdfExportService } from '../core/export/pdfExportService'
import { downloadPlayAsText } from '../core/export/textExportService'
import { buildPlaybackSequence } from '../utils/playbackSequence'
import type { PlaybackItem, LinePlaybackItem, StructurePlaybackItem } from '../core/models/types'

/**
 * Écran de lecture focalisée (mode lecteur)
 * Utilise les nouveaux composants et playSettingsStore
 */
export function ReaderScreen() {
  const { playId } = useParams<{ playId: string }>()
  const navigate = useNavigate()

  // State
  const {
    currentPlay,
    userCharacter,
    currentLineIndex,
    currentActIndex,
    currentSceneIndex,
    loadPlay,
    setUserCharacter,
    goToScene,
    goToLine,
    closePlay,
  } = usePlayStore()

  const { startLoading, stopLoading, addError } = useUIStore()

  // Settings par pièce
  const { getPlaySettings } = usePlaySettingsStore()
  const playSettings = playId ? getPlaySettings(playId) : null

  const [isPlaying, setIsPlaying] = useState(false)
  const [playingLineIndex, setPlayingLineIndex] = useState<number | undefined>()
  const [showSummary, setShowSummary] = useState(false)
  const [playbackSequence, setPlaybackSequence] = useState<PlaybackItem[]>([])
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState<number | undefined>()
  const readLinesSet = new Set<number>()
  const playedItems = new Set<number>()
  const isScrollingProgrammaticallyRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Charger la pièce au montage
  useEffect(() => {
    if (!playId) {
      navigate('/')
      return
    }

    const loadPlayData = async () => {
      startLoading()
      try {
        const play = await playsRepository.get(playId)
        if (!play) {
          addError('Pièce non trouvée')
          navigate('/')
          return
        }
        loadPlay(play)

        // Charger le personnage utilisateur depuis les settings
        const settings = getPlaySettings(playId)
        if (settings.userCharacterId && play.ast?.characters) {
          const char = play.ast.characters.find((c) => c.id === settings.userCharacterId)
          if (char) {
            setUserCharacter(char)
          }
        }
      } catch (error) {
        console.error('Error loading play:', error)
        addError('Erreur lors du chargement de la pièce')
        navigate('/')
      } finally {
        stopLoading()
      }
    }

    loadPlayData()
  }, [
    playId,
    navigate,
    loadPlay,
    startLoading,
    stopLoading,
    addError,
    getPlaySettings,
    setUserCharacter,
  ])

  // Construire la séquence de lecture quand la pièce ou les settings changent
  useEffect(() => {
    if (!currentPlay || !playSettings) {
      setPlaybackSequence([])
      return
    }

    const sequence = buildPlaybackSequence(currentPlay.ast, {
      includeStructure: playSettings.readStructure,
      includeStageDirections: playSettings.readStageDirections,
      includePresentation: playSettings.readPresentation,
    })
    setPlaybackSequence(sequence)
  }, [currentPlay, playSettings])

  // Calculer currentPlaybackIndex basé sur currentLineIndex / currentActIndex / currentSceneIndex
  useEffect(() => {
    if (!playbackSequence.length) {
      setCurrentPlaybackIndex(undefined)
      return
    }

    // Chercher d'abord un item de type 'line' correspondant à currentLineIndex
    let foundIndex = playbackSequence.findIndex(
      (item) => item.type === 'line' && (item as LinePlaybackItem).lineIndex === currentLineIndex
    )

    // Si pas trouvé, chercher un item de structure (scene/act) correspondant
    if (foundIndex === -1) {
      foundIndex = playbackSequence.findIndex(
        (item) =>
          item.type === 'structure' &&
          (item as StructurePlaybackItem).structureType === 'scene' &&
          (item as StructurePlaybackItem).actIndex === currentActIndex &&
          (item as StructurePlaybackItem).sceneIndex === currentSceneIndex
      )
    }

    // Si toujours pas trouvé, chercher un item d'acte
    if (foundIndex === -1) {
      foundIndex = playbackSequence.findIndex(
        (item) =>
          item.type === 'structure' &&
          (item as StructurePlaybackItem).structureType === 'act' &&
          (item as StructurePlaybackItem).actIndex === currentActIndex
      )
    }

    setCurrentPlaybackIndex(foundIndex !== -1 ? foundIndex : undefined)
  }, [playbackSequence, currentLineIndex, currentActIndex, currentSceneIndex])

  // IntersectionObserver pour détecter le scroll manuel et mettre à jour le badge
  useEffect(() => {
    if (!containerRef.current || !playbackSequence.length || !currentPlay) {
      return
    }

    const observerOptions = {
      root: containerRef.current,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Ne rien faire si on est en train de scroller programmatiquement
      if (isScrollingProgrammaticallyRef.current) {
        return
      }

      // Trouver l'élément le plus visible
      let maxRatio = 0
      let targetEntry: IntersectionObserverEntry | undefined

      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio
          targetEntry = entry
        }
      }

      if (!targetEntry) {
        return
      }

      const element = targetEntry.target as HTMLElement
      const playbackIndexStr = element.getAttribute('data-playback-index')
      const playbackType = element.getAttribute('data-playback-type')

      if (playbackIndexStr === null) {
        return
      }

      const playbackIdx = parseInt(playbackIndexStr, 10)
      const item = playbackSequence[playbackIdx]

      if (!item) {
        return
      }

      // Mettre à jour silencieusement le store en fonction du type d'item
      if (item.type === 'line') {
        const lineItem = item as LinePlaybackItem
        const lineIdx = lineItem.lineIndex
        const line = currentPlay.ast.flatLines[lineIdx]
        if (line) {
          goToLine(lineIdx)
        }
      } else if (item.type === 'structure' && playbackType === 'structure') {
        const structureItem = item as StructurePlaybackItem
        const actIdx = structureItem.actIndex ?? currentActIndex
        const sceneIdx = structureItem.sceneIndex ?? currentSceneIndex
        if (structureItem.structureType === 'scene' && structureItem.sceneIndex !== undefined) {
          goToScene(actIdx, sceneIdx)
        }
      }
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Observer tous les éléments avec data-playback-index
    const elements = containerRef.current.querySelectorAll('[data-playback-index]')
    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [playbackSequence, currentPlay, currentActIndex, currentSceneIndex, goToLine, goToScene])

  // Nettoyer TTS au démontage et arrêter la lecture audio
  useEffect(() => {
    return () => {
      ttsEngine.stop()
      // Arrêter aussi la lecture Web Speech API si active
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
      setIsPlaying(false)
      setPlayingLineIndex(undefined)
    }
  }, [])

  // Créer la map des personnages
  const charactersMap: Record<string, Character> = {}
  if (currentPlay?.ast?.characters) {
    currentPlay.ast.characters.forEach((char) => {
      charactersMap[char.id] = char
    })
  }

  const handleStop = () => {
    ttsEngine.stop()
    setIsPlaying(false)
    setPlayingLineIndex(undefined)
  }

  const handleGoToScene = useCallback(
    (actIndex: number, sceneIndex: number) => {
      if (isPlaying) {
        handleStop()
      }

      // Activer le flag de scroll programmatique
      isScrollingProgrammaticallyRef.current = true

      // Mettre à jour le store
      goToScene(actIndex, sceneIndex)
      setShowSummary(false)

      // Désactiver le flag après un délai pour permettre le scroll
      setTimeout(() => {
        isScrollingProgrammaticallyRef.current = false
      }, 1500)
    },
    [isPlaying, goToScene]
  )

  const handleClose = () => {
    if (isPlaying) {
      handleStop()
    }
    closePlay()
    navigate('/')
  }

  // Déterminer le mode
  const isSilentMode = playSettings?.readingMode === 'silent'

  // Fonction pour obtenir le label du tag de méthode de lecture
  const getReadingModeLabel = () => {
    if (!playSettings) return ''

    switch (playSettings.readingMode) {
      case 'silent':
        return 'LECTURE'
      case 'audio':
        return 'LECTURE AUDIO'
      case 'italian':
        return userCharacter ? `ITALIENNES (${userCharacter.name.toUpperCase()})` : 'ITALIENNES'
      default:
        return ''
    }
  }

  // Handler pour l'export PDF
  const handleExportPDF = async () => {
    if (!currentPlay) return

    try {
      startLoading()
      const charactersMap = currentPlay.ast.characters.reduce(
        (acc, char) => {
          acc[char.id] = char
          return acc
        },
        {} as Record<string, Character>
      )

      await pdfExportService.exportPlayToPDF(currentPlay, charactersMap, {
        playTitle: getPlayTitle(currentPlay),
        playAuthor: getPlayAuthor(currentPlay),
        includeCover: true,
        includeCast: true,
        includePageNumbers: true,
        theme: 'light', // Toujours clair pour l'impression
      })
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error)
      addError("Erreur lors de l'export PDF")
    } finally {
      stopLoading()
    }
  }

  // Handler pour l'export TXT
  const handleExportText = () => {
    if (!currentPlay) return

    try {
      const fileName = getPlayTitle(currentPlay)
      downloadPlayAsText(currentPlay.ast, fileName, {
        includeSpacing: true,
        maxLineWidth: 0, // Pas de limite de largeur
      })
    } catch (error) {
      console.error("Erreur lors de l'export TXT:", error)
      addError("Erreur lors de l'export TXT")
    }
  }

  // Fonction pour naviguer vers l'écran de sélection de méthode de lecture
  const handleReadingModeClick = () => {
    if (playId) {
      navigate(`/play/${playId}/detail`)
    }
  }

  // Rendu
  if (!currentPlay) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  // En mode silencieux, pas besoin de personnage sélectionné
  if (!isSilentMode && !userCharacter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Personnage non sélectionné
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Veuillez sélectionner votre personnage pour utiliser le mode lecteur.
          </p>
          <Button onClick={() => navigate(`/play/${playId}/detail`)}>
            Sélectionner un personnage
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900" data-testid="reader-screen">
      {/* Header */}
      <Header
        showBackButton
        onBack={handleClose}
        centerContent={
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
              {getPlayTitle(currentPlay)}
            </h1>
            {getPlayAuthor(currentPlay) && (
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate hidden sm:inline">
                par {getPlayAuthor(currentPlay)}
              </span>
            )}
            {playSettings && (
              <button
                onClick={handleReadingModeClick}
                className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap transition-colors cursor-pointer hover:opacity-80 ${
                  playSettings.readingMode === 'silent'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : playSettings.readingMode === 'audio'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                }`}
                data-testid="reading-mode"
                aria-label="Changer de méthode de lecture"
              >
                {getReadingModeLabel()}
              </button>
            )}
          </div>
        }
        menuItems={
          [
            {
              id: 'export-text',
              label: 'Enregistrer sous (.txt)',
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
              ),
              onClick: handleExportText,
            },
            {
              id: 'export-pdf',
              label: 'Exporter en PDF',
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              ),
              onClick: handleExportPDF,
            },
          ] as HeaderMenuItem[]
        }
        testId="reader-header"
      />

      {/* Sommaire (modal overlay) */}
      {showSummary && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSummary(false)}
          data-testid="summary-overlay"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-testid="scene-summary"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sommaire</h2>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              <SceneSummary
                acts={currentPlay.ast.acts}
                currentActIndex={currentActIndex}
                currentSceneIndex={currentSceneIndex}
                onSceneSelect={handleGoToScene}
                isOpen={showSummary}
                onClose={() => setShowSummary(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden" data-testid="text-display-container">
        {currentPlay && playSettings ? (
          <PlaybackDisplay
            playbackSequence={playbackSequence}
            flatLines={currentPlay.ast.flatLines}
            readingMode={playSettings.readingMode}
            userCharacterId={userCharacter?.id}
            hideUserLines={playSettings.hideUserLines}
            showBefore={playSettings.showBefore}
            showAfter={playSettings.showAfter}
            currentPlaybackIndex={currentPlaybackIndex}
            playingLineIndex={playingLineIndex}
            playedItems={playedItems}
            readLinesSet={readLinesSet}
            charactersMap={charactersMap}
            playTitle={getPlayTitle(currentPlay)}
            onCardClick={undefined}
            onLineClick={undefined}
            containerRef={containerRef}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Aucun contenu à afficher</p>
          </div>
        )}
      </div>

      {/* Badge de scène */}
      {currentPlay && (
        <SceneBadge
          currentActIndex={currentActIndex}
          currentSceneIndex={currentSceneIndex}
          onOpenSummary={() => setShowSummary(true)}
        />
      )}
    </div>
  )
}
