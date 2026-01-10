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
import { useCurrentScene, useCanGoNext, useCanGoPrevious } from '../state/selectors'
import { playsRepository } from '../core/storage/plays'
import { ttsEngine } from '../core/tts'
import { voiceManager } from '../core/tts/voice-manager'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { FullPlayDisplay } from '../components/reader/FullPlayDisplay'
import { SceneNavigation } from '../components/reader/SceneNavigation'
import { PlaybackControls } from '../components/reader/PlaybackControls'
import { SceneSummary } from '../components/reader/SceneSummary'
import { getPlayTitle } from '../core/models/playHelpers'
import type { Character } from '../core/models/Character'

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
    nextLine,
    previousLine,
    goToScene,
    closePlay,
  } = usePlayStore()

  const { startLoading, stopLoading, addError } = useUIStore()

  // Settings par pièce
  const { getPlaySettings } = usePlaySettingsStore()
  const playSettings = playId ? getPlaySettings(playId) : null

  const currentScene = useCurrentScene()
  const canGoNext = useCanGoNext()
  const canGoPrevious = useCanGoPrevious()

  const [isPlaying, setIsPlaying] = useState(false)
  const [playingLineIndex, setPlayingLineIndex] = useState<number | undefined>()
  const [readLinesSet, setReadLinesSet] = useState<Set<number>>(new Set())
  const [showSummary, setShowSummary] = useState(false)

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

  // Handlers TTS
  const handlePlay = () => {
    if (isPlaying || !currentScene || !playSettings) return

    const lines = currentScene.lines
    const startIndex = currentLineIndex

    setIsPlaying(true)

    const speakLine = (index: number) => {
      if (index >= lines.length) {
        setIsPlaying(false)
        setPlayingLineIndex(undefined)
        return
      }

      const line = lines[index]
      setPlayingLineIndex(index)
      setReadLinesSet((prev) => new Set(prev).add(index))

      // Mode italiennes : répliques utilisateur à volume 0
      const isUserLine = userCharacter && line.characterId === userCharacter.id
      const volume = playSettings.readingMode === 'italian' && isUserLine ? 0 : 1

      // Sélection voix
      let selectedVoice: SpeechSynthesisVoice | null = null
      if (line.characterId && playSettings.characterVoices[line.characterId]) {
        // Assignation de voix par sexe
        const gender = playSettings.characterVoices[line.characterId]
        selectedVoice = voiceManager.selectVoiceForGender(gender)
      } else if (line.characterId && charactersMap[line.characterId]?.gender) {
        selectedVoice = voiceManager.selectVoiceForGender(charactersMap[line.characterId].gender!)
      }

      // Didascalies : voix off si activée
      if (line.type === 'stage-direction' && playSettings.voiceOffEnabled) {
        selectedVoice = voiceManager.selectVoiceForGender('neutral')
      }

      const utterance = new SpeechSynthesisUtterance(line.text)
      if (selectedVoice) utterance.voice = selectedVoice
      utterance.rate = isUserLine ? playSettings.userSpeed : playSettings.defaultSpeed
      utterance.volume = volume

      utterance.onend = () => {
        speakLine(index + 1)
      }

      window.speechSynthesis.speak(utterance)
    }

    speakLine(startIndex)
  }

  const handlePause = () => {
    ttsEngine.stop()
    setIsPlaying(false)
    setPlayingLineIndex(undefined)
  }

  const handleStop = () => {
    ttsEngine.stop()
    setIsPlaying(false)
    setPlayingLineIndex(undefined)
  }

  const handleNext = () => {
    if (isPlaying) {
      handleStop()
    }
    nextLine()
  }

  const handlePrevious = () => {
    if (isPlaying) {
      handleStop()
    }
    previousLine()
  }

  const handlePreviousScene = () => {
    if (isPlaying) {
      handleStop()
    }
    if (!currentPlay) return

    if (currentSceneIndex > 0) {
      goToScene(currentActIndex, currentSceneIndex - 1)
    } else if (currentActIndex > 0) {
      const prevAct = currentPlay.ast.acts[currentActIndex - 1]
      goToScene(currentActIndex - 1, prevAct.scenes.length - 1)
    }
  }

  const handleNextScene = () => {
    if (isPlaying) {
      handleStop()
    }
    if (!currentPlay) return

    const currentAct = currentPlay.ast.acts[currentActIndex]
    if (currentSceneIndex < currentAct.scenes.length - 1) {
      goToScene(currentActIndex, currentSceneIndex + 1)
    } else if (currentActIndex < currentPlay.ast.acts.length - 1) {
      goToScene(currentActIndex + 1, 0)
    }
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

  const handleChangeCharacter = () => {
    if (isPlaying) {
      handleStop()
    }
    navigate(`/play/${playId}/detail`)
  }

  // Navigation scènes
  const canGoPreviousScene = currentSceneIndex > 0 || currentActIndex > 0
  const canGoNextScene =
    currentPlay &&
    (currentSceneIndex < currentPlay.ast.acts[currentActIndex].scenes.length - 1 ||
      currentActIndex < currentPlay.ast.acts.length - 1)

  // Déterminer le mode
  const isSilentMode = playSettings?.readingMode === 'silent'
  const isItalianMode = playSettings?.readingMode === 'italian'

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
      <header
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0"
        data-testid="reader-header"
      >
        {isSilentMode ? (
          /* Header épuré pour mode silencieux */
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Gauche : icône retour */}
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              aria-label="Retour à l'accueil"
              data-testid="close-button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Centre : titre tronqué */}
            <h1
              className="flex-1 mx-4 text-lg font-bold text-gray-900 dark:text-gray-100 text-center truncate"
              data-testid="play-title"
            >
              {getPlayTitle(currentPlay)}
            </h1>

            {/* Droite : icône aide */}
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              aria-label="Aide"
              data-testid="help-button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        ) : (
          /* Header complet pour modes audio et italiennes */
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={handleClose} data-testid="close-button">
                ← Retour
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="text-xl font-bold text-gray-900 dark:text-gray-100"
                    data-testid="play-title"
                  >
                    {getPlayTitle(currentPlay)}
                  </h1>
                  {isItalianMode && (
                    <span
                      className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-semibold"
                      data-testid="reading-mode"
                    >
                      MODE ITALIENNES
                    </span>
                  )}
                </div>
                <p
                  className="text-sm text-gray-600 dark:text-gray-400"
                  data-testid="user-character"
                >
                  Mode Lecteur - {userCharacter?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowSummary(!showSummary)}
                data-testid="summary-button"
              >
                {showSummary ? 'Masquer sommaire' : 'Sommaire'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleChangeCharacter}
                data-testid="change-character-button"
              >
                Changer de personnage
              </Button>
            </div>
          </div>
        )}
      </header>

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
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Aucun contenu à afficher</p>
          </div>
        )}
      </div>

      {/* Navigation par scène */}
      {currentPlay && (
        <SceneNavigation
          currentActIndex={currentActIndex}
          currentSceneIndex={currentSceneIndex}
          onPreviousScene={handlePreviousScene}
          onNextScene={handleNextScene}
          onOpenSummary={() => setShowSummary(true)}
          canGoPrevious={canGoPreviousScene}
          canGoNext={!!canGoNextScene}
          disabled={isPlaying}
        />
      )}

      {/* Contrôles de lecture */}
      {playSettings && (
        <PlaybackControls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          readingMode={playSettings.readingMode}
        />
      )}
    </div>
  )
}
