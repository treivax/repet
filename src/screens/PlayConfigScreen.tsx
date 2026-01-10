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
import { getPlayTitle, getPlayCharacters } from '../core/models/playHelpers'
import { ReadingModeSelector } from '../components/settings/ReadingModeSelector'
import { VoiceAssignment } from '../components/settings/VoiceAssignment'
import { AudioSettings } from '../components/settings/AudioSettings'
import { ItalianSettings } from '../components/settings/ItalianSettings'

/**
 * Écran de configuration d'une pièce
 * Permet de configurer le mode de lecture, les voix, et les options audio
 */
export function PlayConfigScreen() {
  const navigate = useNavigate()
  const { playId } = useParams<{ playId: string }>()
  const [play, setPlay] = useState<Play | null>(null)

  // Récupération et actions des settings
  const getPlaySettings = usePlaySettingsStore((state) => state.getPlaySettings)
  const setReadingMode = usePlaySettingsStore((state) => state.setReadingMode)
  const setCharacterGender = usePlaySettingsStore((state) => state.setCharacterGender)
  const setUserCharacter = usePlaySettingsStore((state) => state.setUserCharacter)
  const toggleHideUserLines = usePlaySettingsStore((state) => state.toggleHideUserLines)
  const toggleShowBefore = usePlaySettingsStore((state) => state.toggleShowBefore)
  const toggleShowAfter = usePlaySettingsStore((state) => state.toggleShowAfter)
  const setUserSpeed = usePlaySettingsStore((state) => state.setUserSpeed)
  const setDefaultSpeed = usePlaySettingsStore((state) => state.setDefaultSpeed)
  const toggleVoiceOff = usePlaySettingsStore((state) => state.toggleVoiceOff)
  const deletePlaySettings = usePlaySettingsStore((state) => state.deletePlaySettings)

  const settings = playId ? getPlaySettings(playId) : null

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
      }
    }

    loadPlay()
  }, [playId, navigate])

  if (!playId || !play || !settings) {
    return null
  }

  const characters = getPlayCharacters(play)
  const isItalianMode = settings.readingMode === 'italian'

  const handleDeletePlay = async () => {
    if (!play) return

    if (confirm(`Êtes-vous sûr de vouloir supprimer "${getPlayTitle(play)}" ?`)) {
      try {
        await playsRepository.delete(playId)
        deletePlaySettings(playId)
        navigate('/')
      } catch {
        // Gérer l'erreur si nécessaire
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
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
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Configuration
            </h1>
            <div className="w-16" /> {/* Spacer pour centrer le titre */}
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="space-y-8">
          {/* Informations de la pièce */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              {getPlayTitle(play)}
            </h2>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {play.ast.metadata.author && <p>Auteur : {play.ast.metadata.author}</p>}
              {play.ast.metadata.year && <p>Année : {play.ast.metadata.year}</p>}
              <p>Personnages : {characters.length}</p>
              <p>Actes : {play.ast.acts.length}</p>
            </div>
          </section>

          {/* Méthode de lecture */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Méthode de lecture
            </h2>
            <ReadingModeSelector
              value={settings.readingMode}
              onChange={(mode) => setReadingMode(playId, mode)}
            />
          </section>

          {/* Voix par personnage */}
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

          {/* Réglages audio */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Réglages audio
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Configurez la vitesse de lecture et la voix off
            </p>
            <AudioSettings
              voiceOffEnabled={settings.voiceOffEnabled}
              defaultSpeed={settings.defaultSpeed}
              userSpeed={settings.userSpeed}
              onVoiceOffToggle={() => toggleVoiceOff(playId)}
              onDefaultSpeedChange={(speed) => setDefaultSpeed(playId, speed)}
              onUserSpeedChange={(speed) => setUserSpeed(playId, speed)}
              showItalianSettings={isItalianMode}
            />
          </section>

          {/* Réglages italiennes (seulement si mode italien) */}
          {isItalianMode && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Réglages du mode italiennes
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Configurez votre personnage et les options de masquage
              </p>
              <ItalianSettings
                characters={characters}
                userCharacterId={settings.userCharacterId}
                hideUserLines={settings.hideUserLines}
                showBefore={settings.showBefore}
                showAfter={settings.showAfter}
                onUserCharacterChange={(characterId) => setUserCharacter(playId, characterId)}
                onHideUserLinesToggle={() => toggleHideUserLines(playId)}
                onShowBeforeToggle={() => toggleShowBefore(playId)}
                onShowAfterToggle={() => toggleShowAfter(playId)}
              />
            </section>
          )}

          {/* Suppression */}
          <section className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <h2 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
              Zone de danger
            </h2>
            <p className="mb-4 text-sm text-red-700 dark:text-red-300">
              Supprimer cette pièce effacera définitivement toutes ses données et paramètres
            </p>
            <button
              onClick={handleDeletePlay}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Supprimer cette pièce
            </button>
          </section>
        </div>

        {/* Bouton d'action principal */}
        <div className="sticky bottom-0 mt-8 border-t border-gray-200 bg-gray-50 py-4 dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={() => navigate(`/play/${playId}`)}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Commencer la lecture
          </button>
        </div>
      </main>
    </div>
  )
}
