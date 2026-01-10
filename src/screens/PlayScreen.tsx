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

import { playsRepository } from '../core/storage/plays'
import { voiceManager } from '../core/tts/voice-manager'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { FullPlayDisplay } from '../components/reader/FullPlayDisplay'
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

  const [playingLineIndex, setPlayingLineIndex] = useState<number | undefined>()
  const [isPaused, setIsPaused] = useState(false)
  const [readLinesSet, setReadLinesSet] = useState<Set<number>>(new Set())
  const [showSummary, setShowSummary] = useState(false)

  // États pour le tracking du temps de lecture
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0) // en secondes
  const [elapsedTime, setElapsedTime] = useState<number>(0) // en secondes
  const [progressPercentage, setProgressPercentage] = useState<number>(0)

  // Refs pour gérer la lecture audio
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isPlayingRef = useRef(false)
  const startTimeRef = useRef<number>(0)
  const progressIntervalRef = useRef<number | null>(null)
  const estimatedDurationRef = useRef<number>(0)
  const totalWordsRef = useRef<number>(0)
  const wordsSpokenRef = useRef<number>(0)
  const useBoundaryTrackingRef = useRef<boolean>(true)

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

  // Nettoyer TTS et arrêter la lecture au démontage
  useEffect(() => {
    return () => {
      // Arrêter complètement la lecture audio
      if (utteranceRef.current) {
        utteranceRef.current.onend = null
        utteranceRef.current.onerror = null
        utteranceRef.current.onboundary = null
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
      // Nettoyer les états et intervals
      stopProgressTracking()
      isPlayingRef.current = false
      setPlayingLineIndex(undefined)
      setIsPaused(false)
    }
  }, [])

  // Créer la map des personnages
  const charactersMap: Record<string, Character> = {}
  if (currentPlay?.ast?.characters) {
    currentPlay.ast.characters.forEach((char) => {
      charactersMap[char.id] = char
    })
  }

  /**
   * Compte le nombre de mots dans un texte
   */
  const countWords = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  /**
   * Estime la durée de lecture d'une ligne en secondes
   * Basé sur le nombre de mots et la vitesse de lecture (rate)
   * Formule approximative : (nombre de mots / rate) × temps moyen par mot
   */
  const estimateLineDuration = (text: string, rate: number): number => {
    const wordCount = countWords(text)

    // Vitesse moyenne : environ 2.5 mots par seconde à rate=1
    // Cette valeur peut être ajustée selon les observations
    const baseWordsPerSecond = 2.5
    const wordsPerSecond = baseWordsPerSecond * rate

    // Calculer la durée estimée
    const estimatedSeconds = wordCount / wordsPerSecond

    // Ajouter un petit buffer pour la latence
    return estimatedSeconds + 0.3
  }

  /**
   * Met à jour la progression de lecture en temps réel
   * Utilise le tracking mot par mot si disponible, sinon l'estimation temps
   */
  const updateProgress = () => {
    if (!isPlayingRef.current || estimatedDurationRef.current === 0) return

    let percentage = 0
    let elapsed = 0

    if (useBoundaryTrackingRef.current && totalWordsRef.current > 0) {
      // Méthode précise : basée sur les mots prononcés (via onboundary)
      percentage = (wordsSpokenRef.current / totalWordsRef.current) * 100

      // Estimer le temps écoulé basé sur les mots prononcés
      const wordsPerSecond = totalWordsRef.current / estimatedDurationRef.current
      elapsed = wordsSpokenRef.current / wordsPerSecond
    } else {
      // Méthode fallback : basée sur le temps écoulé
      const now = performance.now()
      elapsed = (now - startTimeRef.current) / 1000
      percentage = (elapsed / estimatedDurationRef.current) * 100
    }

    setElapsedTime(elapsed)
    setProgressPercentage(Math.min(percentage, 100))
  }

  /**
   * Démarre le tracking de progression
   */
  const startProgressTracking = (duration: number, totalWords: number) => {
    estimatedDurationRef.current = duration
    totalWordsRef.current = totalWords
    wordsSpokenRef.current = 0
    setEstimatedDuration(duration)
    setElapsedTime(0)
    setProgressPercentage(0)
    startTimeRef.current = performance.now()

    // Nettoyer l'ancien interval s'il existe
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    // Mettre à jour la progression toutes les 100ms
    progressIntervalRef.current = window.setInterval(updateProgress, 100)
  }

  /**
   * Arrête le tracking de progression
   */
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    estimatedDurationRef.current = 0
    totalWordsRef.current = 0
    wordsSpokenRef.current = 0
    setEstimatedDuration(0)
    setElapsedTime(0)
    setProgressPercentage(0)
  }

  // Nettoyer l'interval au démontage
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  /**
   * Convertit un index global de ligne en coordonnées acte/scène/ligne locale
   */
  const getLineCoordinates = (
    globalIndex: number
  ): {
    actIndex: number
    sceneIndex: number
    lineIndex: number
    line: Line
  } | null => {
    if (!currentPlay) return null

    let currentIndex = 0
    for (let actIdx = 0; actIdx < currentPlay.ast.acts.length; actIdx++) {
      const act = currentPlay.ast.acts[actIdx]
      for (let sceneIdx = 0; sceneIdx < act.scenes.length; sceneIdx++) {
        const scene = act.scenes[sceneIdx]
        for (let lineIdx = 0; lineIdx < scene.lines.length; lineIdx++) {
          if (currentIndex === globalIndex) {
            return {
              actIndex: actIdx,
              sceneIndex: sceneIdx,
              lineIndex: lineIdx,
              line: scene.lines[lineIdx],
            }
          }
          currentIndex++
        }
      }
    }
    return null
  }

  /**
   * Compte le nombre total de lignes dans la pièce
   */
  const getTotalLines = (): number => {
    if (!currentPlay) return 0

    let total = 0
    for (const act of currentPlay.ast.acts) {
      for (const scene of act.scenes) {
        total += scene.lines.length
      }
    }
    return total
  }

  // Fonction pour lire une ligne (avec index global)
  const speakLine = (globalLineIndex: number) => {
    if (!playSettings || !currentPlay) return

    const coords = getLineCoordinates(globalLineIndex)
    if (!coords) return

    const { line } = coords

    // Arrêter toute lecture en cours complètement
    if (utteranceRef.current) {
      // Désactiver les callbacks avant cancel pour éviter interférences
      utteranceRef.current.onend = null
      utteranceRef.current.onerror = null
      utteranceRef.current.onboundary = null
      window.speechSynthesis.cancel()
      utteranceRef.current = null
      stopProgressTracking()
      stopPlayback()
    }

    setPlayingLineIndex(globalLineIndex)
    setIsPaused(false)
    setReadLinesSet((prev) => new Set(prev).add(globalLineIndex))
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

    // Estimer et démarrer le tracking de la durée
    const rate = utterance.rate
    const totalWords = countWords(line.text)
    const duration = estimateLineDuration(line.text, rate)
    startProgressTracking(duration, totalWords)

    // Événement onboundary pour tracking mot par mot (précision accrue)
    utterance.onboundary = (event) => {
      if (!isPlayingRef.current) return

      // L'événement se déclenche à chaque frontière de mot
      if (event.name === 'word') {
        wordsSpokenRef.current += 1
        // updateProgress sera appelé par l'interval, pas besoin de l'appeler ici
      }
    }

    utterance.onend = () => {
      stopProgressTracking()

      if (!isPlayingRef.current || !currentPlay) return

      // Passer à la ligne suivante automatiquement
      const nextGlobalIndex = globalLineIndex + 1
      const totalLines = getTotalLines()

      if (nextGlobalIndex < totalLines) {
        speakLine(nextGlobalIndex)
      } else {
        // Fin de la pièce
        stopPlayback()
      }
    }

    utterance.onerror = (event) => {
      stopProgressTracking()

      // Ne rien faire si on a déjà arrêté manuellement
      if (!isPlayingRef.current) return
      console.error('Erreur de lecture TTS', event)

      // Désactiver le tracking par boundary si erreur
      if (event.error === 'synthesis-unavailable' || event.error === 'not-allowed') {
        useBoundaryTrackingRef.current = false
      }

      stopPlayback()
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)

    // Scroll vers la ligne (l'élément a data-line-index={globalLineIndex})
    scrollToLine(globalLineIndex)
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
    stopProgressTracking()
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

  // Handler pour le clic sur une ligne (reçoit l'index global)
  const handleLineClick = (globalLineIndex: number) => {
    if (!currentPlay) return

    // Si c'est la ligne en cours de lecture
    if (playingLineIndex === globalLineIndex) {
      // Toggle pause/resume
      pausePlayback()
    } else {
      // Démarrer la nouvelle lecture (speakLine gère l'arrêt de l'ancienne)
      speakLine(globalLineIndex)
    }
  }

  // Handler pour le clic en dehors d'une ligne

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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900" data-testid="play-screen">
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

          {/* Centre : titre avec badge mode de lecture */}
          <div className="flex-1 mx-4 flex items-center justify-center gap-2">
            <h1
              className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center truncate"
              data-testid="play-title"
            >
              {getPlayTitle(currentPlay)}
            </h1>
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
        {currentPlay && playSettings ? (
          <FullPlayDisplay
            acts={currentPlay.ast.acts}
            currentActIndex={currentActIndex}
            currentSceneIndex={currentSceneIndex}
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
            onLineClick={playSettings.readingMode === 'audio' ? handleLineClick : undefined}
            isPaused={isPaused}
            progressPercentage={progressPercentage}
            elapsedTime={elapsedTime}
            estimatedDuration={estimatedDuration}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Spinner size="lg" />
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
