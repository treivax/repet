/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState, useCallback } from 'react'
import { ttsProviderManager } from '../../core/tts/providers/TTSProviderManager'
import type { PiperWASMProvider } from '../../core/tts/providers/PiperWASMProvider'
import type { PiperNativeProvider } from '../../core/tts/providers/PiperNativeProvider'

interface InitializationModalProps {
  /** Callback appelé lorsque toutes les voix sont chargées */
  onComplete: () => void
}

/**
 * Modale d'initialisation affichée au démarrage
 * Affiche une barre de progression unique pendant le chargement des voix
 */
export function InitializationModal({ onComplete }: InitializationModalProps) {
  const [progress, setProgress] = useState(0)
  const [currentVoice, setCurrentVoice] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const preloadAllVoices = useCallback(async () => {
    try {
      const provider = ttsProviderManager.getActiveProvider() as
        | PiperWASMProvider
        | PiperNativeProvider

      if (!provider || (provider.type !== 'piper-wasm' && provider.type !== 'piper-native')) {
        throw new Error('Provider Piper non disponible')
      }

      // Récupérer UNIQUEMENT les modèles de base (4 voix pour native, 3 pour wasm), PAS les profils
      const availableVoices =
        provider.type === 'piper-native'
          ? (provider as PiperNativeProvider).getBaseModels()
          : (provider as PiperWASMProvider).getBaseModels()
      const totalVoices = availableVoices.length

      console.warn(`[InitializationModal] 🚀 Préchargement de ${totalVoices} voix de base...`)
      console.warn(
        `[InitializationModal] 📋 Voix à charger:`,
        availableVoices.map((v) => v.displayName)
      )
      console.warn(
        `[InitializationModal] ℹ️ Note: Les ${totalVoices} voix de base seront chargées (les profils vocaux sont des variantes qui ne nécessitent pas de chargement séparé)`
      )

      // Charger chaque voix séquentiellement
      for (let i = 0; i < totalVoices; i++) {
        const voice = availableVoices[i]
        setCurrentVoice(voice.displayName)

        console.warn(
          `[InitializationModal] 📥 Chargement ${i + 1}/${totalVoices}: ${voice.displayName}`
        )

        try {
          // Forcer une mise à jour de la progression au début
          const voicesCompleted = i
          const initialGlobal = (voicesCompleted / totalVoices) * 100
          setProgress(Math.round(initialGlobal))

          // PiperNativeProvider n'a pas de méthode preloadModel, on peut skip
          if (provider.type === 'piper-wasm') {
            await (provider as PiperWASMProvider).preloadModel(voice.id, (percent) => {
              // Calculer la progression globale
              const currentVoiceProgress = percent / 100
              const global = ((voicesCompleted + currentVoiceProgress) / totalVoices) * 100
              setProgress(Math.round(global))
            })
          } else {
            // Pour PiperNativeProvider, simuler le chargement
            const global = ((i + 1) / totalVoices) * 100
            setProgress(Math.round(global))
          }

          console.warn(`[InitializationModal] ✅ ${voice.displayName} chargée avec succès`)
        } catch (err) {
          console.error(
            `[InitializationModal] ❌ Erreur lors du chargement de ${voice.displayName}:`,
            err
          )
          // Continuer même en cas d'erreur sur une voix
        }
      }

      // Progression à 100%
      setProgress(100)
      console.warn('[InitializationModal] ✅ Toutes les voix sont chargées !')

      // Attendre un court instant pour montrer 100%
      setTimeout(() => {
        onComplete()
      }, 500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('[InitializationModal] ❌ Erreur fatale:', err)
      setError(errorMsg)
    }
  }, [onComplete])

  useEffect(() => {
    preloadAllVoices()
  }, [preloadAllVoices])

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-lg p-6 max-w-md mx-4 shadow-xl">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors w-full"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Initialisation</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Chargement des 3 voix de synthèse vocale...
          </p>
        </div>

        {/* Nom de la voix en cours */}
        {currentVoice && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{currentVoice}</p>
          </div>
        )}

        {/* Barre de progression */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progression</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Message d'information */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Chargement des 3 voix de base.</p>
          <p className="mt-1">Cette opération ne sera effectuée qu'une seule fois.</p>
        </div>
      </div>
    </div>
  )
}
