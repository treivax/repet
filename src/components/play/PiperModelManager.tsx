/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useState, useEffect } from 'react'
import { PiperWASMProvider } from '../../core/tts/providers/PiperWASMProvider'

interface ModelInfo {
  id: string
  displayName: string
  language: string
  gender: string
  quality: string
  downloadSize: number
  isDownloaded: boolean
  downloadProgress: number
}

interface Props {
  provider: PiperWASMProvider
  onClose?: () => void
}

export function PiperModelManager({ provider, onClose }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [cacheStats, setCacheStats] = useState({ count: 0, size: 0, sizeFormatted: '0 Bytes' })
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadModelsInfo()
    loadCacheStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadModelsInfo = () => {
    const voices = provider.getVoices()
    const modelInfos: ModelInfo[] = voices.map((voice) => ({
      id: voice.id,
      displayName: voice.displayName || voice.name,
      language: voice.language,
      gender: voice.gender || 'unknown',
      quality: voice.quality || 'medium',
      downloadSize: voice.downloadSize || 0,
      isDownloaded: false, // TODO: Check if actually downloaded
      downloadProgress: provider.getDownloadProgress(voice.id),
    }))
    setModels(modelInfos)
  }

  const loadCacheStats = async () => {
    const stats = await provider.getCacheStats()
    setCacheStats(stats)
  }

  const handlePreloadModel = async (modelId: string) => {
    setDownloadingModels((prev) => new Set(prev).add(modelId))

    try {
      await provider.preloadModel(modelId, (percent) => {
        setModels((prev) =>
          prev.map((m) => (m.id === modelId ? { ...m, downloadProgress: percent } : m))
        )
      })

      // Marquer comme téléchargé
      setModels((prev) =>
        prev.map((m) =>
          m.id === modelId ? { ...m, isDownloaded: true, downloadProgress: 100 } : m
        )
      )

      await loadCacheStats()
    } catch (error) {
      console.error('Failed to preload model:', error)
      alert(
        `Échec du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    } finally {
      setDownloadingModels((prev) => {
        const next = new Set(prev)
        next.delete(modelId)
        return next
      })
    }
  }

  const handleClearCache = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les modèles et audios en cache ?')) {
      return
    }

    setIsLoading(true)
    try {
      await provider.clearCache()
      setModels((prev) => prev.map((m) => ({ ...m, isDownloaded: false, downloadProgress: 0 })))
      await loadCacheStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
      alert(
        `Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getGenderIcon = (gender: string): string => {
    switch (gender.toLowerCase()) {
      case 'male':
        return '👨'
      case 'female':
        return '👩'
      default:
        return '🎭'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Gestion des Modèles Piper
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Cache Stats */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cache audio : <strong>{cacheStats.count}</strong> fichiers,{' '}
                <strong>{cacheStats.sizeFormatted}</strong>
              </p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={isLoading || cacheStats.count === 0}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Suppression...' : '🗑️ Vider le cache'}
            </button>
          </div>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {models.map((model) => {
              const isDownloading = downloadingModels.has(model.id)

              return (
                <div
                  key={model.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getGenderIcon(model.gender)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {model.displayName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {model.language} • {model.quality} • {formatBytes(model.downloadSize)}
                          </p>
                        </div>
                      </div>

                      {/* Download Progress */}
                      {isDownloading &&
                        model.downloadProgress > 0 &&
                        model.downloadProgress < 100 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <span>Téléchargement en cours...</span>
                              <span>{model.downloadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${model.downloadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="ml-4">
                      {model.isDownloaded ? (
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          ✓ Téléchargé
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePreloadModel(model.id)}
                          disabled={isDownloading}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDownloading ? '⏳ Téléchargement...' : '📥 Télécharger'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 Les modèles téléchargés sont stockés localement pour une utilisation hors ligne. Les
            audios générés sont mis en cache automatiquement.
          </p>
        </div>
      </div>
    </div>
  )
}
