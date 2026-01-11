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
import { VoiceAssignment } from '../components/play/VoiceAssignment'
import { AudioSettings } from '../components/play/AudioSettings'
import { ItalianSettings } from '../components/play/ItalianSettings'
import { Button } from '../components/common/Button'
import { Modal } from '../components/common/Modal'
import { CharacterSelector } from '../components/play/CharacterSelector'
import { StandardHeader } from '../components/common/StandardHeader'

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
  const setUserSpeed = usePlaySettingsStore((state) => state.setUserSpeed)
  const setDefaultSpeed = usePlaySettingsStore((state) => state.setDefaultSpeed)
  const toggleVoiceOff = usePlaySettingsStore((state) => state.toggleVoiceOff)
  const deletePlaySettings = usePlaySettingsStore((state) => state.deletePlaySettings)

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
      <main className="mx-auto max-w-4xl px-4 py-6">
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
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
              <div>
                <span className="font-semibold">Personnages :</span> {characters.length}
              </div>
              <div>
                <span className="font-semibold">Actes :</span> {play.ast.acts.length}
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
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Voix des personnages
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Choisissez le sexe pour chaque personnage afin d'assigner la voix appropriée
            </p>
            <VoiceAssignment
              characters={characters}
              characterVoices={settings.characterVoices}
              onVoiceChange={(characterId, gender) =>
                setCharacterGender(playId, characterId, gender)
              }
            />
          </section>

          {/* BLOC 4 : Réglages */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Réglages
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Configurez la vitesse de lecture, la voix off et les options de masquage
            </p>

            {/* Réglages audio de base */}
            <AudioSettings
              voiceOffEnabled={settings.voiceOffEnabled}
              defaultSpeed={settings.defaultSpeed}
              userSpeed={settings.userSpeed}
              onVoiceOffToggle={() => toggleVoiceOff(playId)}
              onDefaultSpeedChange={(speed) => setDefaultSpeed(playId, speed)}
              onUserSpeedChange={(speed) => setUserSpeed(playId, speed)}
              showItalianSettings={false}
            />

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
              Supprimer cette pièce effacera définitivement toutes ses données et paramètres. Cette
              action est irréversible.
            </p>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Supprimer la pièce
            </Button>
          </section>
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
