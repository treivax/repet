/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState } from 'react'
import { ttsProviderManager } from '../../core/tts/providers/TTSProviderManager'
import type { PiperWASMProvider } from '../../core/tts/providers/PiperWASMProvider'

interface VoicePreloaderProps {
  /** Callback appelé lorsque toutes les voix sont chargées */
  onComplete: () => void
}

interface VoiceLoadingState {
  voiceId: string
  displayName: string
  progress: number
  loaded: boolean
  error?: string
}

/**
 * Composant de préchargement des voix Piper au démarrage
 * Affiche une barre de progression pendant le chargement de tous les modèles
 */
export function VoicePreloader({ onComplete }: VoicePreloaderProps) {
  const [voices, setVoices] = useState<VoiceLoadingState[]>([])
  const [currentVoiceIndex, setCurrentVoiceIndex] = useState(0)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    preloadAllVoices()
  }, [])

  const preloadAllVoices = async () => {
    try {
      const provider = ttsProviderManager.getActiveProvider() as PiperWASMProvider

      if (!provider || provider.type !== 'piper-wasm') {
        throw new Error('Provider Piper WASM non disponible')
      }

      // Récupérer toutes les voix disponibles
      const availableVoices = provider.getVoices()

      // Initialiser l'état de chargement
      const initialVoicesState: VoiceLoadingState[] = availableVoices.map((voice) => ({
        voiceId: voice.id,
        displayName: voice.displayName,
        progress: 0,
        loaded: false,
      }))

      setVoices(initialVoicesState)

      console.warn(`[VoicePreloader] 🚀 Préchargement de ${availableVoices.length} voix...`)

      // Charger chaque voix séquentiellement
      for (let i = 0; i < availableVoices.length; i++) {
        const voice = availableVoices[i]
        setCurrentVoiceIndex(i)

        console.warn(
          `[VoicePreloader] 📥 Chargement ${i + 1}/${availableVoices.length}: ${voice.displayName}`
        )

        try {
          await provider.preloadModel(voice.id, (percent) => {
            // Mettre à jour la progression de la voix courante
            setVoices((prev) => prev.map((v, idx) => (idx === i ? { ...v, progress: percent } : v)))

            // Calculer la progression globale
            const voicesCompleted = i
            const currentVoiceProgress = percent / 100
            const total = availableVoices.length
            const global = ((voicesCompleted + currentVoiceProgress) / total) * 100

            setGlobalProgress(Math.round(global))
          })

          // Marquer comme chargée
          setVoices((prev) =>
            prev.map((v, idx) => (idx === i ? { ...v, progress: 100, loaded: true } : v))
          )

          console.warn(`[VoicePreloader] ✅ ${voice.displayName} chargée avec succès`)
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
          console.error(
            `[VoicePreloader] ❌ Erreur lors du chargement de ${voice.displayName}:`,
            err
          )

          setVoices((prev) =>
            prev.map((v, idx) => (idx === i ? { ...v, error: errorMsg, loaded: false } : v))
          )
        }
      }

      // Progression globale à 100%
      setGlobalProgress(100)

      console.warn('[VoicePreloader] ✅ Toutes les voix sont chargées !')

      // Attendre un court instant pour montrer 100%
      setTimeout(() => {
        onComplete()
      }, 500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('[VoicePreloader] ❌ Erreur fatale:', err)
      setError(errorMsg)
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erreur de chargement</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Répét</h1>
          <p className="text-gray-300">Chargement des voix de synthèse vocale...</p>
        </div>

        {/* Progression globale */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progression globale</span>
            <span>{globalProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>

        {/* Liste des voix */}
        <div className="space-y-3">
          {voices.map((voice, index) => (
            <div
              key={voice.voiceId}
              className={`p-3 rounded-lg border transition-all ${
                voice.loaded
                  ? 'bg-green-900/30 border-green-700'
                  : voice.error
                    ? 'bg-red-900/30 border-red-700'
                    : index === currentVoiceIndex
                      ? 'bg-blue-900/30 border-blue-700'
                      : 'bg-gray-800/30 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">{voice.displayName}</span>
                <span className="text-xs text-gray-400">
                  {voice.loaded ? (
                    <span className="text-green-400">✓ Chargée</span>
                  ) : voice.error ? (
                    <span className="text-red-400">✗ Erreur</span>
                  ) : index === currentVoiceIndex ? (
                    `${voice.progress}%`
                  ) : (
                    'En attente...'
                  )}
                </span>
              </div>

              {/* Barre de progression individuelle */}
              {index === currentVoiceIndex && !voice.loaded && !voice.error && (
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${voice.progress}%` }}
                  />
                </div>
              )}

              {/* Message d'erreur */}
              {voice.error && <p className="text-xs text-red-400 mt-1">{voice.error}</p>}
            </div>
          ))}
        </div>

        {/* Conseil */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Les voix sont chargées une seule fois au démarrage.</p>
          <p>Ensuite, la synthèse vocale sera instantanée ! 🚀</p>
        </div>
      </div>
    </div>
  )
}
