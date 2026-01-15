/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlayStore } from '../state/playStore'
import { usePlaySettingsStore } from '../state/playSettingsStore'
import { useUIStore } from '../state/uiStore'
import { globalLineIndexToPosition } from '../core/models/playHelpers'
import { playsRepository } from '../core/storage/plays'
import { ttsEngine } from '../core/tts'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { FullPlayDisplay } from '../components/reader/FullPlayDisplay'
import { ReadingHeader } from '../components/reader/ReadingHeader'
import { SceneBadge } from '../components/reader/SceneBadge'
import { SceneSummary } from '../components/reader/SceneSummary'
import { getPlayTitle, getPlayAuthor } from '../core/models/playHelpers'
import type { Character } from '../core/models/Character'

import { pdfExportService } from '../core/export/pdfExportService'

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
    closePlay,
  } = usePlayStore()

  const { startLoading, stopLoading, addError } = useUIStore()

  // Settings par pièce
  const { getPlaySettings } = usePlaySettingsStore()
  const playSettings = playId ? getPlaySettings(playId) : null

  const [isPlaying, setIsPlaying] = useState(false)
  const [playingLineIndex, setPlayingLineIndex] = useState<number | undefined>()
  const [showSummary, setShowSummary] = useState(false)
  const readLinesSet = new Set<number>() // Set vide pour FullPlayDisplay

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

  const handleGoToScene = (actIndex: number, sceneIndex: number) => {
    if (isPlaying) {
      handleStop()
    }
    goToScene(actIndex, sceneIndex)
    setShowSummary(false)
  }

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

  // Fonction pour naviguer vers l'écran de sélection de méthode de lecture
  const handleReadingModeClick = () => {
    if (playId) {
      navigate(`/play/${playId}/detail`)
    }
  }

  // Handler pour l'appui long sur une ligne en mode silencieux
  const handleLongPress = (globalLineIndex: number) => {
    if (!currentPlay || !playId || !playSettings) return

    // Ne gérer l'appui long que si on est en mode silencieux
    if (playSettings.readingMode !== 'silent') return

    // Si aucun personnage n'est sélectionné, rediriger vers la sélection
    if (!userCharacter) {
      navigate(`/play/${playId}/detail`)
      return
    }

    // Basculer vers le mode italiennes
    const { updatePlaySettings } = usePlaySettingsStore.getState()
    updatePlaySettings(playId, {
      readingMode: 'italian',
    })

    // Calculer la position de la ligne pour le PlayScreen
    const position = globalLineIndexToPosition(currentPlay.ast.acts, globalLineIndex)
    if (position) {
      const { goToScene } = usePlayStore.getState()
      goToScene(position.actIndex, position.sceneIndex)
    }

    // Naviguer vers le PlayScreen
    navigate(`/play/${playId}`)
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
      <ReadingHeader
        title={getPlayTitle(currentPlay)}
        author={getPlayAuthor(currentPlay)}
        modeBadge={
          playSettings ? (
            <button
              onClick={handleReadingModeClick}
              className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap transition-colors cursor-pointer hover:opacity-80 ${
                playSettings.readingMode === 'silent'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  : playSettings.readingMode === 'audio'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              }`}
              data-testid="reading-mode-badge"
              aria-label="Retour aux détails"
            >
              {getReadingModeLabel()}
            </button>
          ) : undefined
        }
        onBack={handleClose}
        onExportPDF={handleExportPDF}
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
          <FullPlayDisplay
            acts={currentPlay.ast.acts}
            currentActIndex={currentActIndex}
            currentSceneIndex={currentSceneIndex}
            currentLineIndex={currentLineIndex}
            readingMode={playSettings.readingMode}
            userCharacterId={userCharacter?.id}
            hideUserLines={playSettings.hideUserLines}
            showBefore={playSettings.showBefore}
            showAfter={playSettings.showAfter}
            playingLineIndex={playingLineIndex}
            readLinesSet={readLinesSet}
            charactersMap={charactersMap}
            playTitle={getPlayTitle(currentPlay)}
            castSection={currentPlay.ast.metadata?.castSection}
            onLongPress={playSettings.readingMode === 'silent' ? handleLongPress : undefined}
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
