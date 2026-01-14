/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlayStore } from '../state/playStore'
import { usePlaySettingsStore } from '../state/playSettingsStore'
import { useUIStore } from '../state/uiStore'

import { playsRepository } from '../core/storage/plays'
import { ttsEngine } from '../core/tts/engine'
import { ttsProviderManager } from '../core/tts/providers'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { FullPlayDisplay } from '../components/reader/FullPlayDisplay'
import { ReadingHeader } from '../components/reader/ReadingHeader'
import { SceneBadge } from '../components/reader/SceneBadge'
import { SceneSummary } from '../components/reader/SceneSummary'
import { getPlayTitle, getPlayAuthor } from '../core/models/playHelpers'
import type { Character } from '../core/models/Character'
import type { Line } from '../core/models/Line'
import { parseTextWithStageDirections, type TextSegment } from '../utils/textParser'

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

  // Settings par pièce - utiliser le même pattern que PlayDetailScreen
  const playSettings = usePlaySettingsStore((state) =>
    playId ? state.playSettings[playId] || state.getPlaySettings(playId) : null
  )

  // Récupérer getPlaySettings pour le useEffect de chargement
  const getPlaySettings = usePlaySettingsStore((state) => state.getPlaySettings)

  const [playingLineIndex, setPlayingLineIndex] = useState<number | undefined>()
  const [isPaused, setIsPaused] = useState(false)
  const [readLinesSet, setReadLinesSet] = useState<Set<number>>(new Set())
  const [showSummary, setShowSummary] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

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
  const currentSegmentIndexRef = useRef<number>(0)
  const segmentsRef = useRef<TextSegment[]>([])

  // Fonction pour mettre en pause/reprendre
  const pausePlayback = useCallback(() => {
    if (ttsEngine.isSpeaking() && !isPaused) {
      ttsEngine.pause()
      setIsPaused(true)
    } else if (isPaused) {
      ttsEngine.resume()
      setIsPaused(false)
    }
  }, [isPaused])

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

  // Initialiser le TTS provider avec le bon provider au montage
  useEffect(() => {
    const initializeTTS = async () => {
      if (!playId || !currentPlay) return

      const settings = getPlaySettings(playId)

      try {
        await ttsProviderManager.initialize()
        console.warn(`TTS Provider initialisé: Piper WASM`)

        // Générer automatiquement les assignations de voix si elles sont vides
        const assignmentMap = settings.characterVoicesPiper

        const needsAssignments = Object.keys(assignmentMap).length === 0

        if (needsAssignments && currentPlay.ast?.characters) {
          console.warn('Génération automatique des assignations de voix...')

          // Créer la liste des personnages avec leurs genres depuis l'AST
          const charactersWithGender = currentPlay.ast.characters
            .filter((char) => char.gender) // Filtrer ceux qui ont un genre défini
            .map((char) => ({
              id: char.id,
              gender: char.gender, // Utiliser directement le genre de l'AST
            }))

          console.warn(
            `${charactersWithGender.length} personnages trouvés avec genres:`,
            charactersWithGender
          )

          // Générer les assignations via le provider actif
          const activeProvider = ttsProviderManager.getActiveProvider()
          if (activeProvider && charactersWithGender.length > 0) {
            const newAssignments = activeProvider.generateVoiceAssignments(charactersWithGender, {})

            // Sauvegarder les genres dans characterVoices (pour compatibilité UI)
            const updatedCharacterVoices = { ...settings.characterVoices }
            charactersWithGender.forEach((char) => {
              updatedCharacterVoices[char.id] = char.gender
            })

            // Sauvegarder les assignations ET les genres
            const { updatePlaySettings } = usePlaySettingsStore.getState()
            updatePlaySettings(playId, {
              characterVoicesPiper: newAssignments,
              characterVoices: updatedCharacterVoices,
            })

            console.warn('Assignations de voix générées:', newAssignments)
            console.warn('Genres sauvegardés:', updatedCharacterVoices)
          }
        }
      } catch (error) {
        console.error('Erreur initialisation TTS provider:', error)
      }
    }

    initializeTTS()
  }, [playId, currentPlay, getPlaySettings])

  // Nettoyer TTS et arrêter la lecture au démontage
  useEffect(() => {
    return () => {
      // Arrêter complètement la lecture audio
      ttsEngine.stop()
      // Nettoyer les états et intervals
      stopProgressTracking()
      isPlayingRef.current = false
      setPlayingLineIndex(undefined)
      setIsPaused(false)
    }
  }, [])

  // Gestionnaire global pour la touche espace en mode lecture audio
  useEffect(() => {
    if (!playSettings || playSettings.readingMode !== 'audio') {
      return
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Intercepter espace uniquement si on est en train de lire
      if (e.key === ' ' || e.code === 'Space') {
        // Vérifier qu'on n'est pas dans un input/textarea
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }

        // Si on est en train de lire, pause/resume
        if (playingLineIndex !== undefined) {
          e.preventDefault()
          e.stopPropagation()
          pausePlayback()
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true })
    }
  }, [playSettings, playingLineIndex, isPaused, pausePlayback])

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
    if (!isPlayingRef.current || estimatedDurationRef.current === 0) {
      return
    }

    let percentage = 0
    let elapsed = 0

    // Calculer le temps écoulé réel
    const now = performance.now()
    const actualElapsed = (now - startTimeRef.current) / 1000

    // Vérifier si le boundary tracking fonctionne (au moins 1 mot après 500ms)
    const boundaryWorking =
      useBoundaryTrackingRef.current &&
      totalWordsRef.current > 0 &&
      (actualElapsed < 0.5 || wordsSpokenRef.current > 0)

    if (boundaryWorking && wordsSpokenRef.current > 0) {
      // Méthode précise : basée sur les mots prononcés (via onboundary)
      percentage = (wordsSpokenRef.current / totalWordsRef.current) * 100

      // Estimer le temps écoulé basé sur les mots prononcés
      const wordsPerSecond = totalWordsRef.current / estimatedDurationRef.current
      elapsed = wordsSpokenRef.current / wordsPerSecond
    } else {
      // Méthode fallback : basée sur le temps écoulé
      // Si boundary ne fonctionne pas après 500ms, désactiver pour cette session
      if (actualElapsed >= 0.5 && wordsSpokenRef.current === 0 && useBoundaryTrackingRef.current) {
        useBoundaryTrackingRef.current = false
      }

      elapsed = actualElapsed
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

  // Fonction pour scroller vers une ligne
  const scrollToLine = (lineIndex: number) => {
    const element = document.querySelector(`[data-line-index="${lineIndex}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Fonction pour arrêter la lecture
  const stopPlayback = () => {
    ttsEngine.stop()
    utteranceRef.current = null
    isPlayingRef.current = false
    setPlayingLineIndex(undefined)
    setIsPaused(false)
    setIsGenerating(false)
    stopProgressTracking()
  }

  /**
   * Lit un segment de texte avec la voix appropriée
   */
  const speakSegment = (
    segment: TextSegment,
    voiceId: string,
    rate: number,
    volume: number,
    globalLineIndex: number,
    onSegmentEnd: () => void
  ) => {
    // Ne rien faire si le segment est vide
    if (!segment.content.trim()) {
      onSegmentEnd()
      return
    }

    console.warn(
      `[PlayScreen] 📖 Lecture segment ${segment.type}: "${segment.content.substring(0, 30)}..." avec voiceId="${voiceId}"`
    )

    ttsEngine.speak({
      text: segment.content,
      voiceURI: voiceId,
      rate,
      pitch: 1.0,
      volume,
      lineId: globalLineIndex.toString(),
    })

    ttsEngine.setEvents({
      onStart: () => {
        setIsGenerating(false)
      },
      onEnd: () => {
        if (!isPlayingRef.current) return
        onSegmentEnd()
      },
      onError: (error) => {
        console.error('Erreur de lecture TTS segment', error)
        if (!isPlayingRef.current) return
        stopPlayback()
      },
      onProgress: (charIndex) => {
        if (!isPlayingRef.current) return
        // Mettre à jour les mots prononcés pour le segment actuel
        const textSoFar = segment.content.substring(0, charIndex)
        const wordsInSegment = countWords(textSoFar)

        // Calculer le nombre total de mots prononcés en incluant les segments précédents
        let wordsBefore = 0
        for (let i = 0; i < currentSegmentIndexRef.current; i++) {
          wordsBefore += countWords(segmentsRef.current[i].content)
        }
        wordsSpokenRef.current = wordsBefore + wordsInSegment
      },
    })
  }

  /**
   * Lit les segments d'une ligne séquentiellement
   */
  const speakLineSegments = (
    segments: TextSegment[],
    characterVoiceId: string,
    narratorVoiceId: string,
    rate: number,
    volume: number,
    globalLineIndex: number
  ) => {
    segmentsRef.current = segments
    currentSegmentIndexRef.current = 0

    const speakNextSegment = (): void => {
      if (!isPlayingRef.current) return

      const segmentIndex = currentSegmentIndexRef.current
      if (segmentIndex >= segments.length) {
        // Tous les segments ont été lus, passer à la ligne suivante
        stopProgressTracking()
        setIsGenerating(false)

        if (!currentPlay) return

        const nextGlobalIndex = globalLineIndex + 1
        const totalLines = getTotalLines()

        if (nextGlobalIndex < totalLines) {
          speakLine(nextGlobalIndex)
        } else {
          // Fin de la pièce
          stopPlayback()
        }
        return
      }

      const segment = segments[segmentIndex]

      // Déterminer la voix à utiliser pour ce segment
      let voiceId = characterVoiceId
      let segmentRate = rate

      if (segment.type === 'stage-direction') {
        // Didascalie : utiliser la voix off si activée, sinon ne pas lire
        if (!playSettings?.voiceOffEnabled) {
          // Passer au segment suivant sans lire
          currentSegmentIndexRef.current++
          speakNextSegment()
          return
        }
        voiceId = narratorVoiceId
        // Les didascalies sont lues légèrement plus lentement
        segmentRate = rate * 0.9
      }

      currentSegmentIndexRef.current++
      speakSegment(segment, voiceId, segmentRate, volume, globalLineIndex, speakNextSegment)
    }

    // Commencer la lecture du premier segment
    speakNextSegment()
  }

  // Fonction pour lire une ligne (avec index global)
  const speakLine = (globalLineIndex: number) => {
    if (!playSettings || !currentPlay) return

    const coords = getLineCoordinates(globalLineIndex)
    if (!coords) return

    const { line } = coords

    // Arrêter toute lecture en cours complètement
    ttsEngine.stop()
    stopProgressTracking()

    if (utteranceRef.current) {
      utteranceRef.current = null
    }

    setPlayingLineIndex(globalLineIndex)
    setIsPaused(false)
    setReadLinesSet((prev) => new Set(prev).add(globalLineIndex))
    isPlayingRef.current = true
    setIsGenerating(true) // Indiquer qu'on génère l'audio

    // Sélection de la voix via le système d'assignation
    let voiceId = ''

    if (line.characterId) {
      // Obtenir l'assignation de voix pour ce personnage
      const assignmentMap = playSettings.characterVoicesPiper

      voiceId = assignmentMap[line.characterId] || ''

      console.warn(
        `[PlayScreen] 🎭 Personnage: ${line.characterId}, voiceId assignée: "${voiceId}"`
      )
      console.warn(`[PlayScreen] 📋 Assignment map:`, assignmentMap)

      // Si pas d'assignation, utiliser la première voix du bon genre (fallback)
      if (!voiceId) {
        const character = charactersMap[line.characterId]
        const gender = character?.gender || playSettings.characterVoices[line.characterId]

        if (gender) {
          const voices = ttsProviderManager.getVoices()
          const matchingVoice = voices.find((v) => v.gender === gender)
          if (matchingVoice) {
            voiceId = matchingVoice.id
            console.warn(
              `Utilisation voix fallback pour ${line.characterId}: ${matchingVoice.displayName}`
            )
          }
        }
      }
    }

    // Didascalies : voix off si activée
    if (line.type === 'stage-direction' && playSettings.voiceOffEnabled) {
      const voices = ttsProviderManager.getVoices()
      const neutralVoice = voices.find((v) => v.gender === 'neutral') || voices[0]
      if (neutralVoice) {
        voiceId = neutralVoice.id
      }
    }

    // Fallback : première voix disponible
    if (!voiceId) {
      const voices = ttsProviderManager.getVoices()
      if (voices.length > 0) {
        voiceId = voices[0].id
      }
    }

    // Mode italiennes : répliques utilisateur à volume 0
    console.warn('[PlayScreen] 🔍 DEBUG - Vérification ligne:')
    console.warn(`  - line.characterId: "${line.characterId}"`)
    console.warn(
      `  - userCharacter: ${userCharacter ? JSON.stringify({ id: userCharacter.id, name: userCharacter.name }) : 'null'}`
    )
    console.warn(`  - playSettings.readingMode: "${playSettings.readingMode}"`)

    const isUserLine = userCharacter && line.characterId === userCharacter.id
    console.warn(`  - isUserLine: ${isUserLine}`)

    const volume = playSettings.readingMode === 'italian' && isUserLine ? 0 : 1
    const rate = isUserLine ? playSettings.userSpeed : playSettings.defaultSpeed

    console.warn(`  - volume calculé: ${volume}`)
    console.warn(`  - rate calculé: ${rate}`)

    // Log pour le mode italiennes
    if (playSettings.readingMode === 'italian' && isUserLine) {
      console.warn(
        `[PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=${volume}, rate=${rate}`
      )
    } else if (playSettings.readingMode === 'italian' && !isUserLine) {
      console.warn(
        `[PlayScreen] 🎭 Mode italiennes - Ligne autre personnage: volume=${volume}, rate=${rate}`
      )
    }

    // Parser le texte en segments (texte normal et didascalies)
    const segments = parseTextWithStageDirections(line.text)

    // Calculer la durée totale basée sur le texte complet
    const totalWords = countWords(line.text)
    const duration = estimateLineDuration(line.text, rate)
    startProgressTracking(duration, totalWords)

    // Créer une référence fictive pour compatibilité
    utteranceRef.current = { text: line.text } as SpeechSynthesisUtterance

    // Obtenir la voix du narrateur pour les didascalies
    let narratorVoiceId = ''
    const assignmentMap = playSettings.characterVoicesPiper

    narratorVoiceId = assignmentMap['__narrator__'] || ''

    // Si pas de voix narrateur assignée, utiliser une voix neutre
    if (!narratorVoiceId) {
      const voices = ttsProviderManager.getVoices()
      const neutralVoice = voices.find((v) => v.gender === 'neutral') || voices[0]
      if (neutralVoice) {
        narratorVoiceId = neutralVoice.id
      }
    }

    // Log pour debug
    console.warn(
      `[PlayScreen] ▶️ LECTURE ligne ${globalLineIndex} (${line.characterId}): voiceId="${voiceId}", narratorVoiceId="${narratorVoiceId}", volume=${volume}, rate=${rate}, segments=${segments.length}`
    )

    // Lire les segments séquentiellement
    speakLineSegments(segments, voiceId, narratorVoiceId, rate, volume, globalLineIndex)

    // Scroll vers la ligne (l'élément a data-line-index={globalLineIndex})
    scrollToLine(globalLineIndex)
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
      <ReadingHeader
        title={getPlayTitle(currentPlay)}
        author={getPlayAuthor(currentPlay)}
        modeBadge={
          playSettings ? (
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
          ) : undefined
        }
        onBack={handleClose}
        testId="play-header"
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
            onLineClick={
              playSettings.readingMode === 'audio' || playSettings.readingMode === 'italian'
                ? handleLineClick
                : undefined
            }
            isPaused={isPaused}
            isGenerating={isGenerating}
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
