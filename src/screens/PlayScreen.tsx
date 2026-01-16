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
import type { VoiceGender } from '../core/tts/types'
import { useAudioOptimization } from '../hooks/useAudioOptimization'
import { Button } from '../components/common/Button'
import { Spinner } from '../components/common/Spinner'
import { PlaybackDisplay } from '../components/reader/PlaybackDisplay'
import { Header, type HeaderMenuItem } from '../components/common/Header'
import { SceneBadge } from '../components/reader/SceneBadge'
import { SceneSummary } from '../components/reader/SceneSummary'
import { getPlayTitle, getPlayAuthor } from '../core/models/playHelpers'
import type { Character } from '../core/models/Character'
import type { Line } from '../core/models/Line'

import { parseTextWithStageDirections, type TextSegment } from '../utils/textParser'
import { buildPlaybackSequence } from '../utils/playbackSequence'
import type {
  PlaybackItem,
  LinePlaybackItem,
  StageDirectionPlaybackItem,
  StructurePlaybackItem,
  PresentationPlaybackItem,
} from '../core/models/types'

import { pdfExportService } from '../core/export/pdfExportService'
import { downloadPlayAsText } from '../core/export/textExportService'

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

  // États pour la séquence de lecture (cartes + répliques)
  const [playbackSequence, setPlaybackSequence] = useState<PlaybackItem[]>([])
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState<number | undefined>()
  const [playedItems, setPlayedItems] = useState<Set<number>>(new Set())

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
  const isScrollingProgrammaticallyRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Construire la séquence de lecture quand le play ou les settings changent
  useEffect(() => {
    if (!currentPlay || !playSettings) {
      setPlaybackSequence([])
      return
    }

    const sequence = buildPlaybackSequence(currentPlay.ast, {
      includeStageDirections: playSettings.readStageDirections,
      includeStructure: playSettings.readStructure,
      includePresentation: playSettings.readPresentation,
    })

    setPlaybackSequence(sequence)
  }, [currentPlay, playSettings])

  // Calculer currentPlaybackIndex basé sur currentLineIndex / currentActIndex / currentSceneIndex
  // UNIQUEMENT pendant la lecture (ne pas sélectionner de carte à l'ouverture)
  useEffect(() => {
    if (!playbackSequence.length) {
      setCurrentPlaybackIndex(undefined)
      return
    }

    // Ne calculer currentPlaybackIndex que si on est en train de lire
    // (évite de sélectionner une carte automatiquement à l'ouverture)
    if (!isPlayingRef.current) {
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
          const charactersWithGender = currentPlay.ast.characters.map((char) => ({
            id: char.id,
            gender: (settings.characterVoices[char.id] || char.gender || 'male') as VoiceGender,
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
            // Ne pas écraser les genres existants
            const updatedCharacterVoices = { ...settings.characterVoices }
            charactersWithGender.forEach((char) => {
              if (!updatedCharacterVoices[char.id]) {
                updatedCharacterVoices[char.id] = char.gender
              }
            })

            // Sauvegarder les assignations ET les genres
            const { updatePlaySettings } = usePlaySettingsStore.getState()
            updatePlaySettings(playId, {
              characterVoicesPiper: newAssignments,
              characterVoices: updatedCharacterVoices,
            })

            // Logger les genres détectés et utilisés
            charactersWithGender.forEach((char) => {
              const character = currentPlay.ast.characters.find((c) => c.id === char.id)
              const existingGender = settings.characterVoices[char.id]
              const astGender = character?.gender
              console.warn(
                `  ${character?.name}: AST=${astGender}, Existing=${existingGender}, Used=${char.gender}`
              )
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

  // Phase 1 Optimizations: Voice preload & audio prefetch
  const { preloadSceneVoices, prefetchNextLines } = useAudioOptimization()

  // Précharger les voix de la scène actuelle au montage
  useEffect(() => {
    if (!currentPlay || !playSettings || !playId) return

    const act = currentPlay.ast.acts[currentActIndex]
    const scene = act?.scenes[currentSceneIndex]
    if (!scene) return

    // Collecter les voix utilisées dans la scène
    const voiceIds = new Set<string>()
    const assignmentMap = playSettings.characterVoicesPiper

    // Parcourir les lignes de la scène
    scene.lines.forEach((line) => {
      if (line.characterId && assignmentMap[line.characterId]) {
        voiceIds.add(assignmentMap[line.characterId])
      }
      if (line.characterIds) {
        line.characterIds.forEach((charId) => {
          if (assignmentMap[charId]) {
            voiceIds.add(assignmentMap[charId])
          }
        })
      }
    })

    // Ajouter la voix du narrateur si nécessaire
    if (assignmentMap['__narrator__']) {
      voiceIds.add(assignmentMap['__narrator__'])
    }

    // Précharger toutes les voix
    if (voiceIds.size > 0) {
      console.warn(`[PlayScreen] 🚀 Préchargement de ${voiceIds.size} voix pour la scène...`)
      // Convertir en Map avec usage count = 1 pour chaque voix
      const voiceUsageMap: Record<string, number> = {}
      voiceIds.forEach((id) => {
        voiceUsageMap[id] = 1
      })
      preloadSceneVoices(voiceUsageMap)
    }
  }, [currentPlay, currentActIndex, currentSceneIndex, playSettings, playId, preloadSceneVoices])

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

  // NOTE: L'annonce automatique de structure est maintenant gérée par les cartes cliquables
  // dans le système de playback. Ce useEffect est désactivé pour éviter les lectures automatiques.
  // Les structures (titre, acte, scène) doivent être lues uniquement quand l'utilisateur clique dessus.
  /*
  useEffect(() => {
    if (!currentPlay || !playSettings) return
    if (!playSettings.readStructure) return

    const act = currentPlay.ast.acts[currentActIndex]
    const scene = act?.scenes[currentSceneIndex]

    if (act && scene) {
      const announce = () => {
        let announcement = ''

        if (act.title) {
          announcement = act.title
        } else {
          announcement = `Acte ${act.actNumber}`
        }

        if (scene.title) {
          announcement += `. ${scene.title}`
        } else {
          announcement += `. Scène ${scene.sceneNumber}`
        }

        const assignmentMap = playSettings.characterVoicesPiper
        let narratorVoiceId = assignmentMap['__narrator__'] || ''

        if (!narratorVoiceId) {
          const voices = ttsProviderManager.getVoices()
          const neutralVoice = voices.find((v) => v.gender === 'neutral') || voices[0]
          if (neutralVoice) {
            narratorVoiceId = neutralVoice.id
          }
        }

        if (narratorVoiceId) {
          const rate = playSettings.defaultSpeed * 0.9

          ttsEngine.setEvents({
            onEnd: () => {
              console.warn(`[PlayScreen] 📢 Structure annoncée: "${announcement}"`)
            },
            onError: (error: Error) => {
              console.error("[PlayScreen] ❌ Erreur lors de l'annonce de structure:", error)
            },
          })

          ttsEngine.speak({
            text: announcement,
            voiceURI: narratorVoiceId,
            rate,
            pitch: 1.0,
            volume: 1.0,
          })
        }
      }

      announce()
    }
  }, [currentActIndex, currentSceneIndex, currentPlay, playSettings])
  */

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

  // Fonction pour arrêter la lecture
  const stopPlayback = useCallback(() => {
    ttsEngine.stop()
    utteranceRef.current = null
    isPlayingRef.current = false
    setPlayingLineIndex(undefined)
    setIsPaused(false)
    setIsGenerating(false)
    stopProgressTracking()
  }, [])

  /**
   * Obtient l'ID de la voix narrateur/voix off
   */
  const getNarratorVoiceId = (): string => {
    if (!playSettings) return ''

    const assignmentMap = playSettings.characterVoicesPiper
    let narratorVoiceId = assignmentMap['__narrator__'] || ''

    // Si pas de voix narrateur assignée, utiliser une voix neutre
    if (!narratorVoiceId) {
      const voices = ttsProviderManager.getVoices()
      const neutralVoice = voices.find((v) => v.gender === 'neutral') || voices[0]
      if (neutralVoice) {
        narratorVoiceId = neutralVoice.id
      }
    }

    return narratorVoiceId
  }

  /**
   * Lire un segment de texte avec une voix donnée
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

    ttsEngine.speak({
      text: segment.content,
      voiceURI: voiceId,
      rate,
      pitch: 1.0,
      volume,
      lineId: globalLineIndex.toString(),
    })
  }

  /**
   * Lit les segments d'une ligne séquentiellement
   */
  const speakLineSegments = (
    segments: TextSegment[],
    voiceId: string,
    narratorVoiceId: string,
    rate: number,
    volume: number,
    globalLineIndex: number,
    onComplete?: () => void
  ) => {
    segmentsRef.current = segments
    currentSegmentIndexRef.current = 0

    const speakNextSegment = (): void => {
      if (!isPlayingRef.current) return

      const segmentIndex = currentSegmentIndexRef.current
      if (segmentIndex >= segments.length) {
        // Tous les segments ont été lus
        stopProgressTracking()
        setIsGenerating(false)

        // Appeler le callback si fourni, sinon comportement par défaut (ligne suivante)
        if (onComplete) {
          onComplete()
        } else {
          // Comportement par défaut : passer à la ligne suivante
          if (!currentPlay) return

          const nextGlobalIndex = globalLineIndex + 1
          const totalLines = getTotalLines()

          if (nextGlobalIndex < totalLines) {
            speakLine(nextGlobalIndex)
          } else {
            // Fin de la pièce
            stopPlayback()
          }
        }
        return
      }

      const segment = segments[segmentIndex]

      // Déterminer la voix à utiliser pour ce segment
      let segmentVoiceId = voiceId
      let segmentRate = rate

      if (segment.type === 'stage-direction') {
        // Didascalie : utiliser la voix off selon le réglage
        if (!playSettings?.readStageDirections) {
          // Ne pas lire les didascalies si désactivé
          currentSegmentIndexRef.current++
          speakNextSegment()
          return
        }
        // Lire les didascalies avec la voix du narrateur
        segmentVoiceId = narratorVoiceId
        // Les didascalies sont lues légèrement plus lentement
        segmentRate = rate * 0.9
      }

      currentSegmentIndexRef.current++
      speakSegment(segment, segmentVoiceId, segmentRate, volume, globalLineIndex, speakNextSegment)
    }

    // Commencer la lecture du premier segment
    speakNextSegment()
  }

  /**
   * Lit une carte de didascalie hors réplique
   */
  const playStageDirection = (item: StageDirectionPlaybackItem) => {
    if (!playSettings) return

    setCurrentPlaybackIndex(item.index)
    setPlayedItems((prev) => new Set(prev).add(item.index))

    // Si shouldRead est false, passer directement au suivant sans lire
    if (item.shouldRead === false) {
      console.warn(`[PlayScreen] ⏭️  Didascalie non lue (toggle désactivé): "${item.text}"`)
      playNextPlaybackItem(item.index)
      return
    }

    const narratorVoiceId = getNarratorVoiceId()
    if (!narratorVoiceId) return

    const rate = playSettings.defaultSpeed * 0.9 // Didascalies légèrement plus lentes

    ttsEngine.setEvents({
      onEnd: () => {
        console.warn(`[PlayScreen] 📢 Didascalie lue: "${item.text}"`)
        // Passer automatiquement à l'élément suivant
        playNextPlaybackItem(item.index)
      },
      onError: (error: Error) => {
        console.error('[PlayScreen] ❌ Erreur lecture didascalie:', error)
        setCurrentPlaybackIndex(undefined)
      },
    })

    ttsEngine.speak({
      text: item.text,
      voiceURI: narratorVoiceId,
      rate,
      pitch: 1.0,
      volume: 1.0,
    })
  }

  /**
   * Lit une carte de structure (titre/acte/scène)
   */
  const playStructure = (item: StructurePlaybackItem) => {
    if (!playSettings) return

    setCurrentPlaybackIndex(item.index)
    setPlayedItems((prev) => new Set(prev).add(item.index))

    // Si shouldRead est false, passer directement au suivant sans lire
    if (item.shouldRead === false) {
      console.warn(`[PlayScreen] ⏭️  Structure non lue (toggle désactivé): "${item.text}"`)
      playNextPlaybackItem(item.index)
      return
    }

    const narratorVoiceId = getNarratorVoiceId()
    if (!narratorVoiceId) return

    const rate = playSettings.defaultSpeed * 0.9

    ttsEngine.setEvents({
      onEnd: () => {
        console.warn(`[PlayScreen] 📢 Structure lue: "${item.text}"`)
        // Passer automatiquement à l'élément suivant
        playNextPlaybackItem(item.index)
      },
      onError: (error: Error) => {
        console.error('[PlayScreen] ❌ Erreur lecture structure:', error)
        setCurrentPlaybackIndex(undefined)
      },
    })

    ttsEngine.speak({
      text: item.text,
      voiceURI: narratorVoiceId,
      rate,
      pitch: 1.0,
      volume: 1.0,
    })
  }

  /**
   * Lit la carte de présentation (Cast)
   */
  const playPresentation = (item: PresentationPlaybackItem) => {
    if (!playSettings) return

    setCurrentPlaybackIndex(item.index)
    setPlayedItems((prev) => new Set(prev).add(item.index))

    // Si shouldRead est false, passer directement au suivant sans lire
    if (item.shouldRead === false) {
      console.warn('[PlayScreen] ⏭️  Présentation non lue (toggle désactivé)')
      playNextPlaybackItem(item.index)
      return
    }

    const narratorVoiceId = getNarratorVoiceId()
    if (!narratorVoiceId) return

    const rate = playSettings.defaultSpeed

    ttsEngine.setEvents({
      onEnd: () => {
        console.warn('[PlayScreen] 📢 Présentation lue')
        // Passer automatiquement à l'élément suivant
        playNextPlaybackItem(item.index)
      },
      onError: (error: Error) => {
        console.error('[PlayScreen] ❌ Erreur lecture présentation:', error)
        setCurrentPlaybackIndex(undefined)
      },
    })

    ttsEngine.speak({
      text: item.text,
      voiceURI: narratorVoiceId,
      rate,
      pitch: 1.0,
      volume: 1.0,
    })
  }

  /**
   * Lit l'élément suivant dans la séquence de lecture
   */
  const playNextPlaybackItem = (currentIndex: number) => {
    const nextItem = playbackSequence.find((item) => item.index === currentIndex + 1)
    if (nextItem) {
      playPlaybackItem(nextItem)
    } else {
      // Fin de la séquence
      setCurrentPlaybackIndex(undefined)
      setPlayingLineIndex(undefined)
      setIsPaused(false)
      isPlayingRef.current = false
      console.warn('[PlayScreen] ✅ Fin de la séquence de lecture')
    }
  }

  /**
   * Dispatcher pour lire n'importe quel type d'élément de lecture
   */
  const playPlaybackItem = (item: PlaybackItem) => {
    // Arrêter toute lecture en cours
    ttsEngine.stop()
    stopProgressTracking()

    switch (item.type) {
      case 'line':
        speakLine((item as LinePlaybackItem).lineIndex)
        break
      case 'stage-direction':
        playStageDirection(item as StageDirectionPlaybackItem)
        break
      case 'structure':
        playStructure(item as StructurePlaybackItem)
        break
      case 'presentation':
        playPresentation(item as PresentationPlaybackItem)
        break
    }
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

    // Trouver l'item de playback correspondant et mettre à jour currentPlaybackIndex
    const currentItem = playbackSequence.find(
      (item) => item.type === 'line' && (item as LinePlaybackItem).lineIndex === globalLineIndex
    )
    if (currentItem) {
      setCurrentPlaybackIndex(currentItem.index)
    }

    setPlayingLineIndex(globalLineIndex)
    setIsPaused(false)
    setReadLinesSet((prev) => new Set(prev).add(globalLineIndex))
    isPlayingRef.current = true
    setIsGenerating(true) // Indiquer qu'on génère l'audio

    // === Gestion des répliques multi-personnages ===

    // Déterminer le personnage effectif selon les règles
    let effectiveCharacterId = line.characterId
    let isUserLineEffective = false

    if (line.characterIds && line.characterIds.length > 0) {
      // Réplique multi-personnages ou TOUS
      console.warn(`[PlayScreen] 🎭 Réplique multi-personnages: ${line.characterIds.join(', ')}`)

      if (line.isAllCharacters) {
        // Cas spécial: TOUS
        if (playSettings.readingMode === 'italian') {
          // En mode italienne, TOUS est traité comme réplique utilisateur
          isUserLineEffective = true
          effectiveCharacterId = userCharacter?.id || line.characterIds[0]
          console.warn(`[PlayScreen] 🎭 TOUS en mode italienne → réplique utilisateur`)
        } else {
          // En mode lecture (audio), utiliser le premier personnage de la pièce
          effectiveCharacterId = currentPlay.ast.characters[0]?.id || line.characterIds[0]
          console.warn(
            `[PlayScreen] 🎭 TOUS en mode audio → premier personnage: ${effectiveCharacterId}`
          )
        }
      } else {
        // Plusieurs personnages listés
        if (playSettings.readingMode === 'italian' && userCharacter) {
          // Vérifier si l'utilisateur fait partie de la liste
          const userIsInList = line.characterIds.includes(userCharacter.id)
          if (userIsInList) {
            // L'utilisateur fait partie de la liste → réplique utilisateur
            isUserLineEffective = true
            effectiveCharacterId = userCharacter.id
            console.warn(`[PlayScreen] 🎭 Utilisateur dans la liste → réplique utilisateur`)
          } else {
            // L'utilisateur n'est pas dans la liste → utiliser le premier personnage
            effectiveCharacterId = line.characterIds[0]
            console.warn(
              `[PlayScreen] 🎭 Utilisateur absent de la liste → premier personnage: ${effectiveCharacterId}`
            )
          }
        } else {
          // Mode audio ou pas d'utilisateur défini → utiliser le premier personnage
          effectiveCharacterId = line.characterIds[0]
          console.warn(
            `[PlayScreen] 🎭 Multi-personnages → premier personnage: ${effectiveCharacterId}`
          )
        }
      }
    } else if (line.characterId) {
      // Réplique simple (compatibilité)
      effectiveCharacterId = line.characterId
      if (playSettings.readingMode === 'italian' && userCharacter) {
        isUserLineEffective = line.characterId === userCharacter.id
      }
    }

    // === Sélection de la voix via le système d'assignation ===
    let voiceId = ''

    if (effectiveCharacterId) {
      // Obtenir l'assignation de voix pour ce personnage
      const assignmentMap = playSettings.characterVoicesPiper

      voiceId = assignmentMap[effectiveCharacterId] || ''

      console.warn(
        `[PlayScreen] 🎭 Personnage effectif: ${effectiveCharacterId}, voiceId assignée: "${voiceId}"`
      )
      console.warn(`[PlayScreen] 📋 Assignment map:`, assignmentMap)

      // Si pas d'assignation, utiliser la première voix du bon genre (fallback)
      if (!voiceId) {
        const character = charactersMap[effectiveCharacterId]
        const gender = character?.gender || playSettings.characterVoices[effectiveCharacterId]

        if (gender) {
          const voices = ttsProviderManager.getVoices()
          const matchingVoice = voices.find((v) => v.gender === gender)
          if (matchingVoice) {
            voiceId = matchingVoice.id
            console.warn(
              `Utilisation voix fallback pour ${effectiveCharacterId}: ${matchingVoice.displayName}`
            )
          }
        }
      }
    }

    // Didascalies : voix off selon le mode
    if (line.type === 'stage-direction') {
      if (playSettings.readStageDirections) {
        // Lire les didascalies hors répliques avec la voix du narrateur
        const voices = ttsProviderManager.getVoices()
        const neutralVoice = voices.find((v) => v.gender === 'neutral') || voices[0]
        if (neutralVoice) {
          voiceId = neutralVoice.id
        }
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
    console.warn(`  - effectiveCharacterId: "${effectiveCharacterId}"`)
    console.warn(`  - isUserLineEffective: ${isUserLineEffective}`)
    console.warn(
      `  - userCharacter: ${userCharacter ? JSON.stringify({ id: userCharacter.id, name: userCharacter.name }) : 'null'}`
    )
    console.warn(`  - playSettings.readingMode: "${playSettings.readingMode}"`)

    const volume = playSettings.readingMode === 'italian' && isUserLineEffective ? 0 : 1
    const rate = isUserLineEffective ? playSettings.userSpeed : playSettings.defaultSpeed

    console.warn(`  - volume calculé: ${volume}`)
    console.warn(`  - rate calculé: ${rate}`)

    // Log pour le mode italiennes
    if (playSettings.readingMode === 'italian' && isUserLineEffective) {
      console.warn(
        `[PlayScreen] 🎭 Mode italiennes - Ligne utilisateur détectée: volume=${volume}, rate=${rate}`
      )
    } else if (playSettings.readingMode === 'italian' && !isUserLineEffective) {
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
    const narratorVoiceId = getNarratorVoiceId()

    // Log pour debug
    console.warn(
      `[PlayScreen] ▶️ LECTURE ligne ${globalLineIndex} (effectif: ${effectiveCharacterId}, original: ${line.characterId}${line.characterIds ? `, multi: ${line.characterIds.join('+')}` : ''}): voiceId="${voiceId}", narratorVoiceId="${narratorVoiceId}", volume=${volume}, rate=${rate}, segments=${segments.length}`
    )

    // Lire les segments séquentiellement avec callback pour passer à l'élément suivant
    speakLineSegments(segments, voiceId, narratorVoiceId, rate, volume, globalLineIndex, () => {
      // Une fois la ligne terminée, passer à l'élément suivant de la séquence
      const currentItem = playbackSequence.find(
        (item) => item.type === 'line' && (item as LinePlaybackItem).lineIndex === globalLineIndex
      )
      if (currentItem) {
        playNextPlaybackItem(currentItem.index)
      }

      // Phase 1 Optimization: Prefetch des 2-3 prochaines répliques
      if (currentItem && playSettings && currentPlay) {
        const nextLines: Array<{ text: string; voiceId: string }> = []

        // Collecter les 2-3 prochaines répliques de type 'line'
        for (
          let i = currentItem.index + 1;
          i < Math.min(currentItem.index + 4, playbackSequence.length);
          i++
        ) {
          const nextItem = playbackSequence[i]
          if (nextItem.type === 'line') {
            const lineItem = nextItem as LinePlaybackItem
            const coords = getLineCoordinates(lineItem.lineIndex)
            if (coords) {
              const { line } = coords
              let charId = line.characterId
              if (line.characterIds && line.characterIds.length > 0) {
                charId = line.characterIds[0]
              }
              const assignedVoiceId = charId ? playSettings.characterVoicesPiper[charId] : ''
              if (assignedVoiceId && line.text) {
                nextLines.push({ text: line.text, voiceId: assignedVoiceId })
              }
            }
          }
        }

        if (nextLines.length > 0) {
          console.warn(`[PlayScreen] 🔄 Prefetch de ${nextLines.length} prochaines répliques...`)
          const prefetchItems = nextLines.map((line, idx) => ({
            id: `prefetch_${currentItem.index + idx + 1}`,
            text: line.text,
            voiceId: line.voiceId,
          }))
          prefetchNextLines(prefetchItems)
        }
      }
    })

    // Note: Le scroll automatique est géré par PlaybackDisplay via currentPlaybackIndex
    // pour éviter les conflits entre plusieurs systèmes de scroll
  }

  /**
   * Handler pour le clic sur une carte (didascalie, structure, présentation)
   */
  const handleCardClick = (playbackIndex: number) => {
    const item = playbackSequence.find((item) => item.index === playbackIndex)
    if (!item) return

    // Si c'est l'élément en cours de lecture
    if (currentPlaybackIndex === playbackIndex) {
      // Toggle pause/resume
      pausePlayback()
    } else {
      // Démarrer la lecture de cet élément
      playPlaybackItem(item)
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

  const handleGoToScene = useCallback(
    (actIndex: number, sceneIndex: number) => {
      stopPlayback()

      // Activer le flag de scroll programmatique
      isScrollingProgrammaticallyRef.current = true

      // Mettre à jour le store
      goToScene(actIndex, sceneIndex)
      setShowSummary(false)

      // Trouver le premier élément de playback de la scène sélectionnée
      const firstSceneItem = playbackSequence.find((item) => {
        if (item.type === 'structure') {
          const structItem = item as StructurePlaybackItem
          return structItem.actIndex === actIndex && structItem.sceneIndex === sceneIndex
        }
        return false
      })

      // Si trouvé, scroller vers cet élément
      if (firstSceneItem) {
        setTimeout(() => {
          const element = document.querySelector(
            `[data-playback-index="${firstSceneItem.index}"]`
          ) as HTMLElement
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            })
          }
        }, 200)
      }

      // Désactiver le flag après un délai pour permettre le scroll
      setTimeout(() => {
        isScrollingProgrammaticallyRef.current = false
      }, 1500)
    },
    [stopPlayback, goToScene, playbackSequence]
  )

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

  // Handler pour l'export PDF
  const handleExportPDF = useCallback(async () => {
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
  }, [currentPlay, startLoading, stopLoading, addError])

  // Handler pour l'export TXT
  const handleExportText = useCallback(() => {
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
  }, [currentPlay, addError])

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

  // Construire les items de menu pour l'export
  const menuItems: HeaderMenuItem[] = [
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
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900" data-testid="play-screen">
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
        menuItems={menuItems}
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
        {currentPlay && playSettings && playbackSequence.length > 0 ? (
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
            onLineClick={
              playSettings.readingMode === 'audio' || playSettings.readingMode === 'italian'
                ? handleLineClick
                : undefined
            }
            onCardClick={
              playSettings.readingMode === 'audio' || playSettings.readingMode === 'italian'
                ? handleCardClick
                : undefined
            }
            isPaused={isPaused}
            isGenerating={isGenerating}
            progressPercentage={progressPercentage}
            elapsedTime={elapsedTime}
            estimatedDuration={estimatedDuration}
            containerRef={containerRef}
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
