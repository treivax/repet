/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState, useCallback } from 'react'
import { ttsProviderManager } from '../../core/tts/providers/TTSProviderManager'
import type { PiperWASMProvider } from '../../core/tts/providers/PiperWASMProvider'
import { BUILD_MODE, shouldReloadModels } from '@/config/version'

interface InitializationModalProps {
  /** Callback appelé lorsque toutes les voix sont chargées */
  onComplete: () => void
}

/**
 * État du chargement d'une voix
 */
interface VoiceLoadingState {
  id: string
  displayName: string
  progress: number
  status: 'pending' | 'loading' | 'completed' | 'error'
  error?: string
}

/**
 * Modale d'initialisation affichée au démarrage
 *
 * Stratégie de chargement optimisée :
 * 1. Lazy loading : Charge d'abord la voix principale (personnage sélectionné)
 * 2. Parallélisation : Charge les autres voix en parallèle en arrière-plan
 * 3. Adaptation build : Gère automatiquement offline (local) vs online (OPFS)
 *
 * Temps attendus :
 * - Build offline : 5-9s (voix principale) → 15-17s (total)
 * - Build online : Réseau-dépendant (première visite) → 5-9s (visites suivantes)
 */
export function InitializationModal({ onComplete }: InitializationModalProps) {
  const [primaryVoice, setPrimaryVoice] = useState<VoiceLoadingState | null>(null)
  const [secondaryVoices, setSecondaryVoices] = useState<VoiceLoadingState[]>([])
  const [globalProgress, setGlobalProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'primary' | 'secondary' | 'complete'>('primary')

  /**
   * Charge toutes les voix avec optimisation lazy loading + parallélisation
   */
  const preloadAllVoices = useCallback(async () => {
    const startTime = performance.now()
    let primaryDuration = 0
    let secondaryDuration = 0

    try {
      const provider = ttsProviderManager.getActiveProvider() as PiperWASMProvider

      if (!provider || provider.type !== 'piper-wasm') {
        throw new Error('Provider Piper WASM non disponible')
      }

      // Récupérer UNIQUEMENT les modèles de base (pas les profils)
      const availableVoices = provider.getBaseModels()
      const totalVoices = availableVoices.length

      console.warn('🚀 [InitializationModal] Chargement optimisé des voix')
      console.warn(`Mode: ${BUILD_MODE}`)
      console.warn(`Voix à charger: ${totalVoices}`)
      console.warn(`Stratégie: Lazy loading + parallélisation`)
      console.warn(
        `Voix:`,
        availableVoices.map((v) => v.displayName)
      )

      // Vérifier si les modèles doivent être rechargés (changement de version)
      if (BUILD_MODE === 'online') {
        const shouldReload = shouldReloadModels()
        if (shouldReload) {
          console.warn('⚠️ Changement de version détecté - rechargement des modèles requis')
        }
      }

      // === PHASE 1: Chargement de la voix principale (lazy loading) ===
      setPhase('primary')
      console.warn('\n📥 Phase 1: Chargement voix principale')

      // TODO: Détecter la voix du personnage sélectionné
      // Pour l'instant, on charge la première voix (Siwis)
      const mainVoice = availableVoices[0]
      const remainingVoices = availableVoices.slice(1)

      const primaryState: VoiceLoadingState = {
        id: mainVoice.id,
        displayName: mainVoice.displayName,
        progress: 0,
        status: 'loading',
      }
      setPrimaryVoice(primaryState)

      const primaryStartTime = performance.now()

      try {
        await provider.preloadModel(mainVoice.id, (percent) => {
          setPrimaryVoice((prev) => (prev ? { ...prev, progress: percent } : null))
          // Progression globale : 40% pour la voix principale
          setGlobalProgress(Math.round(percent * 0.4))
        })

        primaryDuration = performance.now() - primaryStartTime
        console.warn(
          `✅ Voix principale chargée: ${mainVoice.displayName} (${Math.round(primaryDuration)}ms)`
        )

        setPrimaryVoice((prev) => (prev ? { ...prev, status: 'completed', progress: 100 } : null))
        setGlobalProgress(40)

        // Application utilisable dès maintenant !
        console.warn('✨ Application utilisable (voix principale prête)')
      } catch (err) {
        console.error(`❌ Erreur chargement voix principale:`, err)
        setPrimaryVoice((prev) =>
          prev
            ? {
                ...prev,
                status: 'error',
                error: err instanceof Error ? err.message : 'Erreur inconnue',
              }
            : null
        )
        throw err
      }

      // === PHASE 2: Chargement parallèle des voix secondaires ===
      if (remainingVoices.length > 0) {
        setPhase('secondary')
        console.warn('\n📥 Phase 2: Chargement parallèle des voix secondaires')

        // Initialiser les états des voix secondaires
        const secondaryStates: VoiceLoadingState[] = remainingVoices.map((voice) => ({
          id: voice.id,
          displayName: voice.displayName,
          progress: 0,
          status: 'pending',
        }))
        setSecondaryVoices(secondaryStates)

        // Lancer le chargement en parallèle
        const secondaryStartTime = performance.now()
        const loadPromises = remainingVoices.map((voice, index) => {
          return provider
            .preloadModel(voice.id, (percent) => {
              // Mettre à jour le progrès de cette voix spécifique
              setSecondaryVoices((prev) => {
                const updated = [...prev]
                updated[index] = { ...updated[index], progress: percent, status: 'loading' }
                return updated
              })

              // Calculer la progression globale (60% pour les voix secondaires)
              const avgProgress =
                secondaryStates.reduce((sum, _, i) => {
                  const currentProgress = i === index ? percent : secondaryStates[i].progress
                  return sum + currentProgress
                }, 0) / remainingVoices.length

              setGlobalProgress(40 + Math.round(avgProgress * 0.6))
            })
            .then(() => {
              // Marquer comme complété
              setSecondaryVoices((prev) => {
                const updated = [...prev]
                updated[index] = { ...updated[index], status: 'completed', progress: 100 }
                return updated
              })
              console.warn(`✅ Voix secondaire chargée: ${voice.displayName}`)
            })
            .catch((err) => {
              // Marquer comme erreur mais continuer
              console.error(`❌ Erreur chargement ${voice.displayName}:`, err)
              setSecondaryVoices((prev) => {
                const updated = [...prev]
                updated[index] = {
                  ...updated[index],
                  status: 'error',
                  progress: 0,
                  error: err instanceof Error ? err.message : 'Erreur inconnue',
                }
                return updated
              })
            })
        })

        // Attendre que toutes les voix secondaires soient chargées
        await Promise.allSettled(loadPromises)

        secondaryDuration = performance.now() - secondaryStartTime
        console.warn(`✅ Voix secondaires chargées (${Math.round(secondaryDuration)}ms`)
      }

      // === PHASE 3: Terminé ===
      setPhase('complete')
      setGlobalProgress(100)

      const totalDuration = performance.now() - startTime
      console.warn(`\n✅ Chargement complet en ${Math.round(totalDuration)}ms`)
      console.warn(`   - Voix principale: ${Math.round(primaryDuration)}ms`)
      if (remainingVoices.length > 0) {
        console.warn(`   - Voix secondaires: ${Math.round(secondaryDuration)}ms (parallèle)`)
      }
      console.warn('─'.repeat(50)) // Close group visually

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

  // Affichage des erreurs
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
            {phase === 'primary' && 'Chargement de la voix principale...'}
            {phase === 'secondary' && 'Chargement des voix supplémentaires...'}
            {phase === 'complete' && 'Finalisation...'}
          </p>
        </div>

        {/* Voix principale */}
        {primaryVoice && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {primaryVoice.displayName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {primaryVoice.status === 'completed' ? '✓' : `${primaryVoice.progress}%`}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ease-out ${
                  primaryVoice.status === 'completed'
                    ? 'bg-green-600 dark:bg-green-500'
                    : 'bg-blue-600 dark:bg-blue-500'
                }`}
                style={{ width: `${primaryVoice.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Barre de progression globale */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progression totale</span>
            <span className="font-medium">{globalProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>

        {/* Voix secondaires (si en cours) */}
        {phase === 'secondary' && secondaryVoices.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Chargement en arrière-plan :
            </p>
            <div className="space-y-1">
              {secondaryVoices.map((voice) => (
                <div key={voice.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                    {voice.displayName}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500 ml-2">
                    {voice.status === 'completed' && '✓'}
                    {voice.status === 'loading' && `${voice.progress}%`}
                    {voice.status === 'pending' && '⋯'}
                    {voice.status === 'error' && '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message d'information */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            {BUILD_MODE === 'offline'
              ? 'Chargement depuis le build local'
              : 'Téléchargement et mise en cache'}
          </p>
          {phase === 'primary' && (
            <p className="mt-1">L'application sera utilisable dans quelques secondes</p>
          )}
          {phase === 'secondary' && (
            <p className="mt-1 text-green-600 dark:text-green-400 font-medium">
              ✨ Application prête ! Chargement des voix restantes...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
