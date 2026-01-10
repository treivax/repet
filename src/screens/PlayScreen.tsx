/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlayStore } from '../state/playStore'
import { usePlaySettingsStore } from '../state/playSettingsStore'
import { useUIStore } from '../state/uiStore'
import { useCurrentScene } from '../state/selectors'
import { playsRepository } from '../core/storage/plays'
import { voiceManager } from '../core/tts/voice-manager'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { TextDisplay } from '../components/reader/TextDisplay'
import { SceneNavigation } from '../components/reader/SceneNavigation'
import { SceneSummary } from '../components/reader/SceneSummary'
import { getPlayTitle } from '../core/models/playHelpers'
import type { Character } from '../core/models/Character'
import type { Line } from '../core/models/Line'

/**
 * Écran de lecture audio
 * Affiche tout le texte et permet la lecture audio au clic sur les répliques
 */
export function PlayScreen() {
  const { playId } = useParams<{ playId: string }>()
  const navigate = useNavigate()

  // State
  const {
    currentPlay,
    userCharacter,
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

  const currentScene = useCurrentScene()

  const [playingLineIndex, setPlayingLineIndex] = useState<number | undefined>()
  const [isPaused, setIsPaused] = useState(false)
  const [readLinesSet, setReadLinesSet] = useState<Set<number>>(new Set())
  const [showSummary, setShowSummary] = useState(false)

  // Refs pour gérer la lecture audio
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isPlayingRef = useRef(false)
  const currentSceneRef = useRef(currentScene)

  // Mettre à jour la ref de la scène courante
  useEffect(() => {
    currentSceneRef.current = currentScene
  }, [currentScene])

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

  // Nettoyer TTS au démontage
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel()
      }
      isPlayingRef.current = false
    }
  }, [])

  // Créer la map des personnages
  const charactersMap: Record<string, Character> = {}
  if (currentPlay?.ast?.characters) {
    currentPlay.ast.characters.forEach((char) => {
      charactersMap[char.id] = char
    })
  }

  // Fonction pour lire une ligne
  const speakLine = (line: Line, lineIndex: number) => {
    if (!playSettings || !currentSceneRef.current) return

    // Arrêter toute lecture en cours complètement
    if (utteranceRef.current) {
      window.speechSynthesis.cancel()
      utteranceRef.current = null
    }

    setPlayingLineIndex(lineIndex)
    setIsPaused(false)
    setReadLinesSet((prev) => new Set(prev).add(lineIndex))
    isPlayingRef.current = true

    // Sélection de la voix
    let selectedVoice: SpeechSynthesisVoice | null = null
    if (line.characterId && playSettings.characterVoices[line.characterId]) {
      const gender = playSettings.characterVoices[line.characterId]
      selectedVoice = voiceManager.selectVoiceForGender(gender)
    } else if (line.characterId && charactersMap[line.characterId]?.gender) {
      selectedVoice = voiceManager.selectVoiceForGender(charactersMap[line.characterId].gender!)
    }

    // Didascalies : voix off si activée
    if (line.type === 'stage-direction' && playSettings.voiceOffEnabled) {
      selectedVoice = voiceManager.selectVoiceForGender('neutral')
    }

    // Mode italiennes : répliques utilisateur à volume 0
    const isUserLine = userCharacter && line.characterId === userCharacter.id
    const volume = playSettings.readingMode === 'italian' && isUserLine ? 0 : 1

    const utterance = new SpeechSynthesisUtterance(line.text)
    if (selectedVoice) utterance.voice = selectedVoice
    utterance.rate = isUserLine ? playSettings.userSpeed : playSettings.defaultSpeed
    utterance.volume = volume

    utterance.onend = () => {
      if (!isPlayingRef.current || !currentSceneRef.current) return

      // Passer à la ligne suivante automatiquement
      const nextIndex = lineIndex + 1
      if (nextIndex < currentSceneRef.current.lines.length) {
        const nextLine = currentSceneRef.current.lines[nextIndex]
        speakLine(nextLine, nextIndex)
      } else {
        // Fin de la scène
        stopPlayback()
      }
    }

    utterance.onerror = (event) => {
      // Ne rien faire si on a déjà arrêté manuellement
      if (!isPlayingRef.current) return
      console.error('Erreur de lecture TTS', event)
      stopPlayback()
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)

    // Scroll vers la ligne
    scrollToLine(lineIndex)
  }

  // Fonction pour scroller vers une ligne
  const scrollToLine = (lineIndex: number) => {
    const element = document.querySelector(`[data-line-index="${lineIndex}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Fonction pour arrêter la lecture
  const stopPlayback = () => {
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    isPlayingRef.current = false
    setPlayingLineIndex(undefined)
    setIsPaused(false)
  }

  // Fonction pour mettre en pause/reprendre
  const pausePlayback = () => {
    if (window.speechSynthesis.speaking && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    } else if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  // Handler pour le clic sur une ligne
  const handleLineClick = (lineIndex: number) => {
    if (!currentSceneRef.current) return

    const line = currentSceneRef.current.lines[lineIndex]

    // Si c'est la ligne en cours de lecture
    if (playingLineIndex === lineIndex) {
      // Toggle pause/resume
      pausePlayback()
    } else {
      // Arrêter complètement la lecture en cours
      if (utteranceRef.current) {
        // IMPORTANT: Désactiver les callbacks AVANT d'annuler
        utteranceRef.current.onend = null
        utteranceRef.current.onerror = null
        utteranceRef.current = null
      }

      // Annuler la synthèse vocale
      window.speechSynthesis.cancel()

      // Réinitialiser l'état (important: après cancel et avant speakLine)
      isPlayingRef.current = false
      setIsPaused(false)

      // Démarrer la nouvelle lecture
      speakLine(line, lineIndex)
    }
  }

  // Handler pour le clic en dehors d'une ligne
  const handleBackgroundClick = () => {
    if (isPlayingRef.current) {
      stopPlayback()
    }
  }

  const handlePreviousScene = () => {
    stopPlayback()
    if (!currentPlay) return

    if (currentSceneIndex > 0) {
      goToScene(currentActIndex, currentSceneIndex - 1)
    } else if (currentActIndex > 0) {
      const prevAct = currentPlay.ast.acts[currentActIndex - 1]
      goToScene(currentActIndex - 1, prevAct.scenes.length - 1)
    }
  }

  const handleNextScene = () => {
    stopPlayback()
    if (!currentPlay) return

    const currentAct = currentPlay.ast.acts[currentActIndex]
    if (currentSceneIndex < currentAct.scenes.length - 1) {
      goToScene(currentActIndex, currentSceneIndex + 1)
    } else if (currentActIndex < currentPlay.ast.acts.length - 1) {
      goToScene(currentActIndex + 1, 0)
    }
  }

  const handleGoToScene = (actIndex: number, sceneIndex: number) => {
    stopPlayback()
    goToScene(actIndex, sceneIndex)
    setShowSummary(false)
  }

  const handleClose = () => {
    stopPlayback()
    closePlay()
    navigate('/')
  }

  // Navigation scènes
  const canGoPreviousScene = currentSceneIndex > 0 || currentActIndex > 0
  const canGoNextScene =
    currentPlay &&
    (currentSceneIndex < currentPlay.ast.acts[currentActIndex].scenes.length - 1 ||
      currentActIndex < currentPlay.ast.acts.length - 1)

  // Déterminer le mode
  const isItalianMode = playSettings?.readingMode === 'italian'

  // Rendu
  if (!currentPlay) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  // En mode audio/italiennes, vérifier qu'un personnage est sélectionné pour le mode italiennes
  if (!userCharacter && isItalianMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Personnage non sélectionné
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Veuillez sélectionner votre personnage pour utiliser le mode italiennes.
          </p>
          <Button onClick={() => navigate(`/play/${playId}/detail`)}>
            Sélectionner un personnage
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900"
      data-testid="play-screen"
      onClick={handleBackgroundClick}
    >
      {/* Header */}
      <header
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0"
        data-testid="play-header"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header épuré similaire au mode silencieux */}
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

          {/* Centre : titre avec badge mode si italiennes */}
          <div className="flex-1 mx-4 flex items-center justify-center gap-2">
            <h1
              className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center truncate"
              data-testid="play-title"
            >
              {getPlayTitle(currentPlay)}
            </h1>
            {isItalianMode && (
              <span
                className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-semibold whitespace-nowrap"
                data-testid="reading-mode"
              >
                ITALIENNES
              </span>
            )}
          </div>

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
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
        {currentScene && playSettings ? (
          <TextDisplay
            lines={currentScene.lines}
            currentLineIndex={0}
            readingMode={playSettings.readingMode}
            userCharacterId={userCharacter?.id}
            hideUserLines={playSettings.hideUserLines}
            showBefore={playSettings.showBefore}
            showAfter={playSettings.showAfter}
            playingLineIndex={playingLineIndex}
            readLinesSet={readLinesSet}
            charactersMap={charactersMap}
            playTitle={getPlayTitle(currentPlay)}
            actNumber={currentPlay.ast.acts[currentActIndex].actNumber}
            actTitle={currentPlay.ast.acts[currentActIndex].title}
            sceneNumber={currentScene.sceneNumber}
            sceneTitle={currentScene.title}
            onLineClick={handleLineClick}
            isPaused={isPaused}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Aucune scène sélectionnée</p>
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
          disabled={isPlayingRef.current}
        />
      )}
    </div>
  )
}
