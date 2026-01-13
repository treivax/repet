/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { DownloadProgress } from '../../core/tts/online/VoiceCacheService'

interface VoiceDownloadProgressProps {
  progress: DownloadProgress
  onCancel?: () => void
}

/**
 * Composant d'affichage de progression de téléchargement de voix
 *
 * Affiche:
 * - Nom du fichier en cours de téléchargement
 * - Barre de progression visuelle
 * - Pourcentage
 * - Taille téléchargée / taille totale
 * - Vitesse de téléchargement
 * - Temps restant estimé (ETA)
 */
export function VoiceDownloadProgress({ progress, onCancel }: VoiceDownloadProgressProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatSpeed = (bytesPerSecond: number | undefined): string => {
    if (!bytesPerSecond) return '--'
    return `${formatBytes(bytesPerSecond)}/s`
  }

  const formatETA = (seconds: number | undefined): string => {
    if (!seconds || !isFinite(seconds)) return '--'

    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.ceil(seconds % 60)
      return `${minutes}m ${remainingSeconds}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  const percentage = Math.min(100, Math.max(0, progress.percentage))
  const isIndeterminate = progress.total === 0

  return (
    <div className="voice-download-progress w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Téléchargement de la voix
          </h3>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Annuler le téléchargement"
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
        )}
      </div>

      {/* Nom du fichier */}
      <p
        className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate"
        title={progress.fileName}
      >
        {progress.fileName}
      </p>

      {/* Barre de progression */}
      <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        {isIndeterminate ? (
          <div className="absolute inset-0 bg-blue-600 dark:bg-blue-400 animate-pulse" />
        ) : (
          <div
            className="absolute inset-y-0 left-0 bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>

      {/* Statistiques */}
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          {/* Pourcentage */}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {isIndeterminate ? '...' : `${percentage.toFixed(1)}%`}
          </span>

          {/* Taille téléchargée / totale */}
          <span>
            {formatBytes(progress.loaded)}
            {progress.total > 0 && ` / ${formatBytes(progress.total)}`}
          </span>

          {/* Vitesse */}
          {progress.speed !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {formatSpeed(progress.speed)}
            </span>
          )}
        </div>

        {/* ETA */}
        {progress.eta !== undefined && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatETA(progress.eta)}
          </span>
        )}
      </div>
    </div>
  )
}
