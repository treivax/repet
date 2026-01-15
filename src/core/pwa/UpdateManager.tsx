/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import type { RegisterSWOptions } from 'vite-plugin-pwa/types'
import { APP_VERSION, isAppUpdated } from '@/config/version'

/**
 * Gestionnaire de mise à jour PWA
 *
 * Ce composant gère automatiquement les mises à jour de la PWA :
 * - Détecte les nouvelles versions du service worker
 * - Affiche une notification à l'utilisateur
 * - Permet de mettre à jour manuellement ou automatiquement
 * - Gère le cycle de vie du service worker
 *
 * Stratégie de mise à jour :
 * - Check automatique toutes les heures
 * - Prompt utilisateur pour confirmer la mise à jour
 * - Rechargement de la page après mise à jour
 */

interface UpdateManagerProps {
  /**
   * Intervalle de vérification des mises à jour (ms)
   * @default 60 * 60 * 1000 (1 heure)
   */
  checkInterval?: number

  /**
   * Mise à jour automatique sans confirmation utilisateur
   * @default false
   */
  autoUpdate?: boolean
}

/**
 * Composant de gestion des mises à jour PWA
 */
export function UpdateManager({
  checkInterval = 60 * 60 * 1000,
  autoUpdate = false,
}: UpdateManagerProps) {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string, registration: ServiceWorkerRegistration | undefined) {
      console.warn('[PWA] Service Worker enregistré:', swUrl)

      // Vérifier les mises à jour périodiquement
      if (registration) {
        setInterval(() => {
          console.warn('[PWA] Vérification des mises à jour...')
          registration.update()
        }, checkInterval)
      }
    },
    onRegisterError(error: Error) {
      console.error("[PWA] Erreur lors de l'enregistrement du Service Worker:", error)
    },
  } as RegisterSWOptions)

  // Détecter si l'app a été mise à jour via version check
  useEffect(() => {
    const wasUpdated = isAppUpdated()
    if (wasUpdated) {
      console.warn(`[PWA] Application mise à jour vers v${APP_VERSION}`)
      // Afficher une notification de succès (optionnel)
    }
  }, [])

  // Gérer l'affichage du prompt de mise à jour
  useEffect(() => {
    if (needRefresh) {
      console.warn('[PWA] Nouvelle version disponible')

      if (autoUpdate) {
        // Mise à jour automatique
        console.warn('[PWA] Mise à jour automatique...')
        handleUpdate()
      } else {
        // Afficher le prompt utilisateur
        setShowUpdatePrompt(true)
      }
    }
    // handleUpdate is stable (doesn't change), safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh, autoUpdate])

  // Gérer le mode offline ready
  useEffect(() => {
    if (offlineReady) {
      console.warn('[PWA] Application prête pour le mode hors ligne')
    }
  }, [offlineReady])

  /**
   * Lance la mise à jour du service worker
   */
  const handleUpdate = async () => {
    setIsUpdating(true)
    setShowUpdatePrompt(false)

    try {
      console.warn('[PWA] Mise à jour du Service Worker...')
      await updateServiceWorker(true) // true = reloadPage
    } catch (error) {
      console.error('[PWA] Erreur lors de la mise à jour:', error)
      setIsUpdating(false)
      setShowUpdatePrompt(true) // Réafficher le prompt en cas d'erreur
    }
  }

  /**
   * Ferme le prompt de mise à jour
   */
  const handleDismiss = () => {
    setShowUpdatePrompt(false)
    setNeedRefresh(false)
  }

  // Notification de mise à jour disponible
  if (showUpdatePrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 rounded-lg shadow-2xl p-4 animate-slide-up">
          {/* En-tête */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-500 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Mise à jour disponible
                </h3>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Une nouvelle version de Répét est disponible. Actualisez pour profiter des dernières
            améliorations.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded transition-colors"
            >
              {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pas de notification à afficher
  return null
}
