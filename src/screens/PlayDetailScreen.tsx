/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlaySettingsStore } from '../state/playSettingsStore'
import { playsRepository } from '../core/storage/plays'
import type { Play } from '../core/models/Play'
import { getPlayTitle, getPlayCharacters, getPlayAuthor } from '../core/models/playHelpers'
import { TTSProviderSelector } from '../components/play/TTSProviderSelector'
import { CharacterVoiceEditor } from '../components/play/CharacterVoiceEditor'

import { ItalianSettings } from '../components/play/ItalianSettings'
import { Button } from '../components/common/Button'
import { Modal } from '../components/common/Modal'
import { CharacterSelector } from '../components/play/CharacterSelector'
import { StandardHeader } from '../components/common/StandardHeader'
import { useFrenchVoices } from '../hooks/useFrenchVoices'
import { ttsProviderManager } from '../core/tts/providers'
import type { VoiceDescriptor, VoiceGender } from '../core/tts/types'

/**
 * Écran de présentation détaillée d'une pièce (Écran "Texte" dans la spec)
 * Affiche les informations de la pièce et permet de choisir le mode de lecture
 * avant de passer à l'écran de lecture
 */
export function PlayDetailScreen() {
  const navigate = useNavigate()
  const { playId } = useParams<{ playId: string }>()
  const [play, setPlay] = useState<Play | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCharacterSelector, setShowCharacterSelector] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<VoiceDescriptor[]>([])

  // Compter les voix françaises disponibles
  const frenchVoices = useFrenchVoices()

  // Récupération réactive des settings pour ce playId
  const settings = usePlaySettingsStore((state) =>
    playId ? state.playSettings[playId] || state.getPlaySettings(playId) : null
  )

  // Actions des settings
  const setCharacterGender = usePlaySettingsStore((state) => state.setCharacterGender)
  const setUserCharacter = usePlaySettingsStore((state) => state.setUserCharacter)
  const toggleHideUserLines = usePlaySettingsStore((state) => state.toggleHideUserLines)
  const toggleShowBefore = usePlaySettingsStore((state) => state.toggleShowBefore)
  const toggleShowAfter = usePlaySettingsStore((state) => state.toggleShowAfter)
  const setDefaultSpeed = usePlaySettingsStore((state) => state.setDefaultSpeed)
  const toggleVoiceOff = usePlaySettingsStore((state) => state.toggleVoiceOff)
  const deletePlaySettings = usePlaySettingsStore((state) => state.deletePlaySettings)
  const setTTSProvider = usePlaySettingsStore((state) => state.setTTSProvider)
  const setCharacterVoiceAssignment = usePlaySettingsStore(
    (state) => state.setCharacterVoiceAssignment
  )

  // Chargement de la pièce
  useEffect(() => {
    const loadPlay = async () => {
      if (!playId) {
        navigate('/')
        return
      }

      try {
        const loadedPlay = await playsRepository.get(playId)
        if (!loadedPlay) {
          navigate('/')
          return
        }
        setPlay(loadedPlay)
      } catch {
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadPlay()
  }, [playId, navigate])

  // Charger les voix disponibles quand le provider change
  useEffect(() => {
    if (!settings) return

    const loadVoices = async () => {
      try {
        // Initialiser le provider manager avec le provider des settings
        await ttsProviderManager.initialize(settings.ttsProvider)

        // Récupérer les voix
        const voices = ttsProviderManager.getVoices()
        setAvailableVoices(voices)

        // Auto-générer les assignations si vides OU si les voix assignées n'existent plus
        const assignmentMap =
          settings.ttsProvider === 'piper-wasm'
            ? settings.characterVoicesPiper
            : settings.characterVoicesGoogle

        // Vérifier si toutes les voix assignées existent dans le provider actuel
        const voiceIds = voices.map((v) => v.id)
        const allVoicesExist = Object.values(assignmentMap).every((voiceId) =>
          voiceIds.includes(voiceId)
        )

        const needsRegeneration =
          Object.keys(assignmentMap).length === 0 || !allVoicesExist || characters.length === 0

        if (needsRegeneration && characters.length > 0) {
          // Générer les assignations automatiquement
          const charactersWithGender = characters.map((char) => ({
            id: char.id,
            gender: (settings.characterVoices[char.id] || 'male') as VoiceGender,
          }))

          const provider = ttsProviderManager.getActiveProvider()
          if (provider) {
            const newAssignments = provider.generateVoiceAssignments(charactersWithGender, {})

            // Sauvegarder
            if (playId) {
              if (settings.ttsProvider === 'piper-wasm') {
                usePlaySettingsStore
                  .getState()
                  .updatePlaySettings(playId, { characterVoicesPiper: newAssignments })
              } else {
                usePlaySettingsStore
                  .getState()
                  .updatePlaySettings(playId, { characterVoicesGoogle: newAssignments })
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des voix:', error)
      }
    }

    loadVoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.ttsProvider, playId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!playId || !play || !settings) {
    return null
  }

  const characters = getPlayCharacters(play)

  // Obtenir le personnage actuellement sélectionné ou le premier par défaut
  const selectedCharacter = settings.userCharacterId
    ? characters.find((c) => c.id === settings.userCharacterId)
    : characters[0]

  // Naviguer vers l'écran de lecture avec le mode choisi
  const handleStartReading = (mode: 'silent' | 'audio' | 'italian') => {
    // Pour le mode italien, s'assurer qu'un personnage est sélectionné
    if (mode === 'italian' && !settings.userCharacterId && characters.length > 0) {
      setUserCharacter(playId, characters[0].id)
    }

    // Mettre à jour le mode de lecture dans les settings
    usePlaySettingsStore.getState().setReadingMode(playId, mode)

    // Rediriger vers l'écran de lecture approprié
    if (mode === 'silent') {
      navigate(`/reader/${playId}`)
    } else {
      navigate(`/play/${playId}`)
    }
  }

  const handleSelectCharacter = (characterId: string) => {
    setUserCharacter(playId, characterId)
    setShowCharacterSelector(false)
  }

  const handleOpenCharacterSelector = (event: React.MouseEvent) => {
    event.stopPropagation()
    setShowCharacterSelector(true)
  }

  const handleDeletePlay = async () => {
    try {
      await playsRepository.delete(playId)
      deletePlaySettings(playId)
      navigate('/')
    } catch {
      // Gérer l'erreur si nécessaire
    }
  }

  const handleProviderChange = async (provider: 'web-speech' | 'piper-wasm') => {
    if (!playId) return

    try {
      // Changer le provider dans le manager
      await ttsProviderManager.switchProvider(provider)

      // Mettre à jour les settings
      setTTSProvider(playId, provider)

      // Recharger les voix
      const voices = ttsProviderManager.getVoices()
      setAvailableVoices(voices)
    } catch (error) {
      console.error('Erreur lors du changement de provider:', error)
    }
  }

  const handleReassignVoices = () => {
    if (!playId || !settings) return

    // Régénérer toutes les voix (pas de réutilisation des assignations existantes)
    const charactersWithGender = characters.map((char) => ({
      id: char.id,
      gender: (settings.characterVoices[char.id] || 'male') as VoiceGender,
    }))

    const provider = ttsProviderManager.getActiveProvider()
    if (provider) {
      // Passer un objet vide pour forcer une réassignation complète
      const newAssignments = provider.generateVoiceAssignments(charactersWithGender, {})

      // Sauvegarder selon le provider
      if (settings.ttsProvider === 'piper-wasm') {
        usePlaySettingsStore
          .getState()
          .updatePlaySettings(playId, { characterVoicesPiper: newAssignments })
      } else {
        usePlaySettingsStore
          .getState()
          .updatePlaySettings(playId, { characterVoicesGoogle: newAssignments })
      }
    }
  }

  const handleVoiceChange = (characterId: string, voiceId: string) => {
    if (!playId || !settings) return
    setCharacterVoiceAssignment(playId, settings.ttsProvider, characterId, voiceId)
  }

  const handleGenderChange = (characterId: string, gender: 'male' | 'female' | 'neutral') => {
    if (!playId) return

    // Mettre à jour le genre
    setCharacterGender(playId, characterId, gender as 'male' | 'female')

    // Réassigner automatiquement une voix du nouveau genre
    if (gender !== 'neutral') {
      const voices = availableVoices.filter((v) => v.gender === gender)
      if (voices.length > 0) {
        setCharacterVoiceAssignment(playId, settings!.ttsProvider, characterId, voices[0].id)
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <StandardHeader
        leftContent={
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour
          </button>
        }
        className="border-b"
      />

      {/* Contenu */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="space-y-6">
            {/* BLOC 1 : Informations de la pièce - BIEN MIS EN AVANT */}
            <section className="rounded-lg border-2 border-blue-200 bg-white p-8 shadow-lg dark:border-blue-800 dark:bg-gray-800">
              <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {getPlayTitle(play)}
              </h1>
              <div className="space-y-2 text-lg text-gray-700 dark:text-gray-300">
                {getPlayAuthor(play) && (
                  <p>
                    <span className="font-semibold">Auteur :</span> {getPlayAuthor(play)}
                  </p>
                )}
                {play.ast.metadata.year && (
                  <p>
                    <span className="font-semibold">Année :</span> {play.ast.metadata.year}
                  </p>
                )}
                {play.ast.metadata.category && (
                  <p>
                    <span className="font-semibold">Catégorie :</span> {play.ast.metadata.category}
                  </p>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                <div>
                  <span className="font-semibold">Personnages :</span> {characters.length}
                </div>
                <div>
                  <span className="font-semibold">Actes :</span> {play.ast.acts.length}
                </div>
                <div>
                  <span className="font-semibold">Voix FR :</span> {frenchVoices}
                </div>
              </div>
            </section>

            {/* BLOC 2 : Méthode de lecture - BIEN MIS EN AVANT */}
            <section className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg dark:border-blue-800 dark:from-blue-900/20 dark:to-gray-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
                Choisir la méthode de lecture
              </h2>
              <div className="space-y-3">
                {/* Lecture silencieuse */}
                <button
                  onClick={() => handleStartReading('silent')}
                  className="group flex w-full items-center gap-4 rounded-lg border-2 border-gray-300 bg-white p-4 text-left transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Lecture silencieuse
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lire la pièce en toute tranquillité, sans audio
                    </p>
                  </div>
                </button>

                {/* Lecture audio */}
                <button
                  onClick={() => handleStartReading('audio')}
                  className="group flex w-full items-center gap-4 rounded-lg border-2 border-gray-300 bg-white p-4 text-left transition-all hover:border-green-500 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:hover:border-green-400"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Lecture audio
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Écouter la pièce avec synthèse vocale
                    </p>
                  </div>
                </button>

                {/* Italiennes avec sélection de personnage */}
                <div className="rounded-lg border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700">
                  <button
                    onClick={() => handleStartReading('italian')}
                    className="group flex w-full items-center gap-4 p-4 text-left transition-all hover:bg-purple-50 dark:hover:bg-purple-900/10"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 015.628-5.628m0 0a5.002 5.002 0 015.357 1.857M7 20v-2m10 2v-2m-6 2v-2m2-2h.01"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Italiennes
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Répéter votre rôle avec synthèse vocale
                      </p>
                    </div>
                  </button>

                  {/* Sélecteur de personnage intégré */}
                  <div className="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Votre personnage :</span>
                        <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                          {selectedCharacter?.name || 'Aucun'}
                        </span>
                      </div>
                      <button
                        onClick={handleOpenCharacterSelector}
                        className="rounded-md bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
                      >
                        Changer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* BLOC 3 : Les voix */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Voix des personnages
              </h2>

              {/* Provider Selector */}
              <div className="mb-6">
                <TTSProviderSelector
                  currentProvider={settings.ttsProvider}
                  onProviderChange={handleProviderChange}
                  onReassignVoices={handleReassignVoices}
                />
              </div>

              {/* Liste des personnages avec éditeur de voix */}
              <div className="space-y-3">
                {characters.map((character) => {
                  const gender = settings.characterVoices[character.id] || 'male'
                  const assignmentMap =
                    settings.ttsProvider === 'piper-wasm'
                      ? settings.characterVoicesPiper
                      : settings.characterVoicesGoogle
                  const voiceId = assignmentMap[character.id]
                  const voice = availableVoices.find((v) => v.id === voiceId) || null

                  return (
                    <CharacterVoiceEditor
                      key={character.id}
                      characterId={character.id}
                      characterName={character.name}
                      currentGender={gender}
                      currentVoice={voice}
                      availableVoices={availableVoices}
                      onGenderChange={handleGenderChange}
                      onVoiceChange={handleVoiceChange}
                    />
                  )
                })}

                {/* Voix off / Narrateur */}
                <div className="mt-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">
                        🎙️
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Voix off / Narrateur
                      </span>
                    </div>
                  </div>
                  <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                    Utilisée pour les didascalies, actes et scènes
                  </p>

                  {/* Toggle Ne pas lire les didascalies */}
                  <div className="mb-3 flex items-center justify-between rounded-md border border-blue-300 bg-white p-2 dark:border-blue-700 dark:bg-gray-800">
                    <div className="flex-1">
                      <label
                        htmlFor="skip-stage-directions-toggle"
                        className="text-sm font-medium text-gray-900 dark:text-gray-100"
                      >
                        Ne pas lire les didascalies
                      </label>
                    </div>
                    <button
                      id="skip-stage-directions-toggle"
                      type="button"
                      role="switch"
                      aria-checked={!settings.voiceOffEnabled}
                      onClick={() => toggleVoiceOff(playId)}
                      className={`
                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
                        ${!settings.voiceOffEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      `}
                    >
                      <span
                        aria-hidden="true"
                        className={`
                          inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                          ${!settings.voiceOffEnabled ? 'translate-x-5' : 'translate-x-0'}
                        `}
                      />
                    </button>
                  </div>
                  {(() => {
                    const assignmentMap =
                      settings.ttsProvider === 'piper-wasm'
                        ? settings.characterVoicesPiper
                        : settings.characterVoicesGoogle
                    const narratorVoiceId = assignmentMap['__narrator__']
                    const narratorVoice = availableVoices.find((v) => v.id === narratorVoiceId)
                    const neutralVoices = availableVoices.filter((v) => v.gender === 'neutral')
                    const voicesForNarrator =
                      neutralVoices.length > 0 ? neutralVoices : availableVoices

                    return (
                      <CharacterVoiceEditor
                        key="__narrator__"
                        characterId="__narrator__"
                        characterName="Voix off"
                        currentGender="neutral"
                        currentVoice={narratorVoice || null}
                        availableVoices={voicesForNarrator}
                        onGenderChange={() => {
                          /* Pas de changement de genre pour le narrateur */
                        }}
                        onVoiceChange={handleVoiceChange}
                      />
                    )
                  })()}
                </div>
              </div>
            </section>

            {/* BLOC 4 : Réglages */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Réglages
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Configurez la vitesse de lecture et les options de masquage
              </p>

              {/* Réglages audio de base */}
              <div className="space-y-6">
                {/* Vitesse par défaut */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="default-speed"
                      className="font-medium text-gray-900 dark:text-gray-100"
                    >
                      Vitesse de lecture
                    </label>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {settings.defaultSpeed.toFixed(1)}x
                    </span>
                  </div>

                  <input
                    id="default-speed"
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={settings.defaultSpeed}
                    onChange={(e) => setDefaultSpeed(playId, parseFloat(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
                        ((settings.defaultSpeed - 0.5) / (2.0 - 0.5)) * 100
                      }%, rgb(229, 231, 235) ${
                        ((settings.defaultSpeed - 0.5) / (2.0 - 0.5)) * 100
                      }%, rgb(229, 231, 235) 100%)`,
                    }}
                  />

                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>0.5x</span>
                    <span>Normal (1.0x)</span>
                    <span>2.0x</span>
                  </div>
                </div>
              </div>

              {/* Réglages italiennes */}
              <div className="mt-6">
                <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
                  Options pour le mode Italiennes
                </h3>
                <ItalianSettings
                  hideUserLines={settings.hideUserLines}
                  showBefore={settings.showBefore}
                  showAfter={settings.showAfter}
                  onHideUserLinesToggle={() => toggleHideUserLines(playId)}
                  onShowBeforeToggle={() => toggleShowBefore(playId)}
                  onShowAfterToggle={() => toggleShowAfter(playId)}
                />
              </div>
            </section>

            {/* BLOC 5 : Suppression */}
            <section className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
              <h2 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
                Supprimer cette pièce
              </h2>
              <p className="mb-4 text-sm text-red-700 dark:text-red-300">
                Supprimer cette pièce effacera définitivement toutes ses données et paramètres.
                Cette action est irréversible.
              </p>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                Supprimer la pièce
              </Button>
            </section>
          </div>
        </div>
      </main>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        maxWidth="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeletePlay}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Êtes-vous sûr de vouloir supprimer{' '}
          <span className="font-semibold">{getPlayTitle(play)}</span> ?
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Cette action est irréversible.
        </p>
      </Modal>

      {/* Modal de sélection de personnage */}
      {showCharacterSelector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowCharacterSelector(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Choisissez votre personnage
              </h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <CharacterSelector
                characters={characters}
                selectedCharacter={selectedCharacter || null}
                onSelectCharacter={(char) => char && handleSelectCharacter(char.id)}
              />
            </div>
            <div className="flex justify-end border-t border-gray-200 p-4 dark:border-gray-700">
              <Button variant="secondary" onClick={() => setShowCharacterSelector(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
