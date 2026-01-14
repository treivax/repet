/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState } from 'react'
import { getBuildMode } from '../../core/tts/offline/NetworkInterceptor'

/**
 * Bannière d'information pour le mode online
 *
 * Affichée uniquement en mode online pour informer l'utilisateur que :
 * - L'application nécessite une connexion Internet
 * - Les voix seront téléchargées à la demande
 * - Les voix seront mises en cache pour usage ultérieur
 * - Compatible avec iOS/Safari
 */
export function OnlineModeBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    const dismissed = localStorage.getItem('online-mode-banner-dismissed')
    return dismissed === 'true'
  })

  const buildMode = getBuildMode()

  // Ne pas afficher la bannière en mode offline
  if (buildMode === 'offline') {
    return null
  }

  // Ne pas afficher si l'utilisateur l'a déjà fermée
  if (isDismissed) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('online-mode-banner-dismissed', 'true')
  }

  return (
    <div className="online-mode-banner bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          {/* Icône et contenu */}
          <div className="flex items-start gap-3">
            {/* Icône */}
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Message */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Mode Online - Compatible iOS/Safari
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>
                  Cette version nécessite une <strong>connexion Internet</strong> pour fonctionner.
                </p>
                <ul className="list-disc list-inside space-y-0.5 mt-2">
                  <li>
                    Les voix sont téléchargées <strong>à la demande</strong> (environ 60-75 MB par
                    voix)
                  </li>
                  <li>
                    Les voix téléchargées sont <strong>mises en cache</strong> pour un usage
                    ultérieur
                  </li>
                  <li>
                    Compatible avec <strong>iOS, Safari et macOS</strong>
                  </li>
                </ul>
                <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  💡 Pour une utilisation 100% hors ligne, utilisez la version Desktop sur{' '}
                  <a
                    href="https://app.repet.com"
                    className="underline hover:no-underline font-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    app.repet.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Bouton de fermeture */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
            aria-label="Fermer la bannière"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
