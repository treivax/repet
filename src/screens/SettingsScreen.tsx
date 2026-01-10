/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState } from 'react'
import { Button } from '../components/common/Button'
import { useSettingsStore } from '../state/settingsStore'
import { voiceManager } from '../core/tts/voice-manager'
import type { ReadingMode } from '../core/models/types'
import { MIN_SPEED, MAX_SPEED, SPEED_STEP, MIN_VOLUME, MAX_VOLUME } from '../utils/constants'

/**
 * Écran SettingsScreen
 * Configuration TTS, voix, vitesse, volume et modes de lecture
 */
export function SettingsScreen() {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  // Zustand state
  const readingMode = useSettingsStore((state) => state.readingMode)
  const globalSpeed = useSettingsStore((state) => state.globalSpeed)
  const globalVolume = useSettingsStore((state) => state.globalVolume)
  const maleVoiceName = useSettingsStore((state) => state.maleVoiceName)
  const femaleVoiceName = useSettingsStore((state) => state.femaleVoiceName)
  const neutralVoiceName = useSettingsStore((state) => state.neutralVoiceName)
  const stageDirectionVoiceName = useSettingsStore((state) => state.stageDirectionVoiceName)
  const stageDirectionVolume = useSettingsStore((state) => state.stageDirectionVolume)
  const stageDirectionSpeed = useSettingsStore((state) => state.stageDirectionSpeed)
  const hideUserLinesInItalian = useSettingsStore((state) => state.hideUserLinesInItalian)

  const setReadingMode = useSettingsStore((state) => state.setReadingMode)
  const setGlobalSpeed = useSettingsStore((state) => state.setGlobalSpeed)
  const setGlobalVolume = useSettingsStore((state) => state.setGlobalVolume)
  const setMaleVoice = useSettingsStore((state) => state.setMaleVoice)
  const setFemaleVoice = useSettingsStore((state) => state.setFemaleVoice)
  const setNeutralVoice = useSettingsStore((state) => state.setNeutralVoice)
  const setStageDirectionVoice = useSettingsStore((state) => state.setStageDirectionVoice)
  const setStageDirectionVolume = useSettingsStore((state) => state.setStageDirectionVolume)
  const setStageDirectionSpeed = useSettingsStore((state) => state.setStageDirectionSpeed)
  const toggleHideUserLines = useSettingsStore((state) => state.toggleHideUserLines)
  const resetSettings = useSettingsStore((state) => state.resetSettings)

  // Charger les voix disponibles
  useEffect(() => {
    const loadVoices = async () => {
      await voiceManager.initialize()
      const voices = speechSynthesis.getVoices()
      setAvailableVoices(voices)
    }

    loadVoices()
  }, [])

  const handleResetSettings = () => {
    if (confirm('Réinitialiser tous les paramètres ?')) {
      resetSettings()
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-gray-600">
          Configuration de la synthèse vocale et des modes de lecture
        </p>
      </div>

      {/* Mode de lecture */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">Mode de lecture</h2>
        <p className="mt-1 text-sm text-gray-600">
          Choisissez comment vous souhaitez répéter vos pièces
        </p>

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
            <input
              type="radio"
              name="readingMode"
              value="silent"
              checked={readingMode === 'silent'}
              onChange={(e) => setReadingMode(e.target.value as ReadingMode)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Silencieux</div>
              <div className="text-sm text-gray-600">Lecture à l'écran uniquement, sans audio</div>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
            <input
              type="radio"
              name="readingMode"
              value="audio"
              checked={readingMode === 'audio'}
              onChange={(e) => setReadingMode(e.target.value as ReadingMode)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Audio</div>
              <div className="text-sm text-gray-600">Lecture audio de toutes les répliques</div>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
            <input
              type="radio"
              name="readingMode"
              value="italian"
              checked={readingMode === 'italian'}
              onChange={(e) => setReadingMode(e.target.value as ReadingMode)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Italiennes</div>
              <div className="text-sm text-gray-600">
                Seules les autres répliques sont lues, vous donnez la vôtre
              </div>
            </div>
          </label>
        </div>

        {readingMode === 'italian' && (
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hideUserLinesInItalian}
                onChange={toggleHideUserLines}
                className="rounded"
              />
              <span className="text-sm text-gray-700">
                Masquer mes répliques en mode italiennes
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Vitesse et Volume globaux */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">Audio global</h2>

        <div className="mt-6 space-y-6">
          {/* Vitesse */}
          <div>
            <label htmlFor="global-speed" className="block text-sm font-medium text-gray-700">
              Vitesse de lecture : {globalSpeed.toFixed(1)}x
            </label>
            <input
              id="global-speed"
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={SPEED_STEP}
              value={globalSpeed}
              onChange={(e) => setGlobalSpeed(parseFloat(e.target.value))}
              className="mt-2 w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Lent ({MIN_SPEED}x)</span>
              <span>Rapide ({MAX_SPEED}x)</span>
            </div>
          </div>

          {/* Volume */}
          <div>
            <label htmlFor="global-volume" className="block text-sm font-medium text-gray-700">
              Volume : {Math.round(globalVolume * 100)}%
            </label>
            <input
              id="global-volume"
              type="range"
              min={MIN_VOLUME}
              max={MAX_VOLUME}
              step={0.1}
              value={globalVolume}
              onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
              className="mt-2 w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Muet</span>
              <span>Maximum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voix par personnage */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">Voix des personnages</h2>
        <p className="mt-1 text-sm text-gray-600">
          Sélectionnez les voix selon le genre des personnages
        </p>

        <div className="mt-6 space-y-4">
          {/* Voix masculine */}
          <div>
            <label htmlFor="male-voice" className="block text-sm font-medium text-gray-700">
              Voix masculine
            </label>
            <select
              id="male-voice"
              value={maleVoiceName || ''}
              onChange={(e) => setMaleVoice(e.target.value || null)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Par défaut</option>
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Voix féminine */}
          <div>
            <label htmlFor="female-voice" className="block text-sm font-medium text-gray-700">
              Voix féminine
            </label>
            <select
              id="female-voice"
              value={femaleVoiceName || ''}
              onChange={(e) => setFemaleVoice(e.target.value || null)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Par défaut</option>
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Voix neutre */}
          <div>
            <label htmlFor="neutral-voice" className="block text-sm font-medium text-gray-700">
              Voix neutre
            </label>
            <select
              id="neutral-voice"
              value={neutralVoiceName || ''}
              onChange={(e) => setNeutralVoice(e.target.value || null)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Par défaut</option>
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Didascalies */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">Didascalies</h2>

        <div className="mt-6 space-y-6">
          {/* Voix didascalies */}
          <div>
            <label htmlFor="stage-voice" className="block text-sm font-medium text-gray-700">
              Voix des didascalies
            </label>
            <select
              id="stage-voice"
              value={stageDirectionVoiceName || ''}
              onChange={(e) => setStageDirectionVoice(e.target.value || null)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Par défaut</option>
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Vitesse didascalies */}
          <div>
            <label htmlFor="stage-speed" className="block text-sm font-medium text-gray-700">
              Vitesse : {stageDirectionSpeed.toFixed(1)}x
            </label>
            <input
              id="stage-speed"
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              step={SPEED_STEP}
              value={stageDirectionSpeed}
              onChange={(e) => setStageDirectionSpeed(parseFloat(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          {/* Volume didascalies */}
          <div>
            <label htmlFor="stage-volume" className="block text-sm font-medium text-gray-700">
              Volume : {Math.round(stageDirectionVolume * 100)}%
            </label>
            <input
              id="stage-volume"
              type="range"
              min={MIN_VOLUME}
              max={MAX_VOLUME}
              step={0.1}
              value={stageDirectionVolume}
              onChange={(e) => setStageDirectionVolume(parseFloat(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <Button variant="danger" onClick={handleResetSettings}>
          Réinitialiser les paramètres
        </Button>
      </div>
    </div>
  )
}
