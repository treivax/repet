/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Cache Cleaner pour Piper TTS
 * Vide le cache OPFS pour forcer le rechargement des modèles depuis les fichiers locaux
 */

/**
 * Vide le cache OPFS de Piper TTS
 * Cela force la bibliothèque à recharger les modèles
 */
export async function clearPiperOPFSCache(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    console.warn('[CacheCleaner] API Storage non disponible')
    return
  }

  try {
    console.warn('[CacheCleaner] 🗑️ Nettoyage du cache OPFS Piper...')

    // Obtenir l'accès au répertoire racine OPFS
    const root = await navigator.storage.getDirectory()

    // Lister tous les fichiers/dossiers
    const entries: string[] = []
    // @ts-expect-error - API OPFS
    for await (const [name] of root.entries()) {
      entries.push(name)
      console.warn(`[CacheCleaner] Trouvé: ${name}`)
    }

    // Supprimer tous les fichiers/dossiers
    for (const name of entries) {
      try {
        await root.removeEntry(name, { recursive: true })
        console.warn(`[CacheCleaner] ✅ Supprimé: ${name}`)
      } catch (error) {
        console.warn(`[CacheCleaner] ⚠️ Impossible de supprimer ${name}:`, error)
      }
    }

    console.warn('[CacheCleaner] ✅ Cache OPFS vidé avec succès')
  } catch (error) {
    console.error('[CacheCleaner] ❌ Erreur lors du nettoyage du cache OPFS:', error)
    throw error
  }
}

/**
 * Vide le cache IndexedDB de l'audio
 */
export async function clearAudioCache(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.warn('[CacheCleaner] 🗑️ Suppression du cache audio IndexedDB...')

    const request = indexedDB.deleteDatabase('repet-audio-cache')

    request.onsuccess = () => {
      console.warn('[CacheCleaner] ✅ Cache audio supprimé')
      resolve()
    }

    request.onerror = () => {
      console.error('[CacheCleaner] ❌ Erreur lors de la suppression du cache audio')
      reject(request.error)
    }

    request.onblocked = () => {
      console.warn('[CacheCleaner] ⚠️ Suppression du cache bloquée (fermer les autres onglets)')
    }
  })
}

/**
 * Vide tous les caches (OPFS + IndexedDB)
 */
export async function clearAllCaches(): Promise<void> {
  console.warn('[CacheCleaner] 🗑️ Nettoyage de tous les caches...')

  try {
    await clearPiperOPFSCache()
    await clearAudioCache()
    console.warn('[CacheCleaner] ✅ Tous les caches ont été vidés avec succès')
  } catch (error) {
    console.error('[CacheCleaner] ❌ Erreur lors du nettoyage des caches:', error)
    throw error
  }
}

/**
 * Obtient les statistiques d'utilisation du stockage
 */
export async function getStorageStats(): Promise<{
  quota: number
  usage: number
  percentUsed: number
  details: Record<string, number>
}> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    throw new Error('API Storage non disponible')
  }

  const estimate = await navigator.storage.estimate()

  const quota = estimate.quota || 0
  const usage = estimate.usage || 0
  const percentUsed = quota > 0 ? (usage / quota) * 100 : 0

  return {
    quota,
    usage,
    percentUsed,
    details: (estimate as { usageDetails?: Record<string, number> }).usageDetails || {},
  }
}

/**
 * Affiche les statistiques de stockage dans la console
 */
export async function logStorageStats(): Promise<void> {
  try {
    const stats = await getStorageStats()

    console.warn('[CacheCleaner] 📊 Statistiques de stockage')
    console.warn(`Quota: ${formatBytes(stats.quota)}`)
    console.warn(`Utilisé: ${formatBytes(stats.usage)} (${stats.percentUsed.toFixed(2)}%)`)
    console.warn('Détails:')
    for (const [key, value] of Object.entries(stats.details)) {
      console.warn(`  - ${key}: ${formatBytes(value)}`)
    }
  } catch (error) {
    console.error("[CacheCleaner] Impossible d'obtenir les statistiques:", error)
  }
}

/**
 * Formatte une taille en octets de manière lisible
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Expose les fonctions de nettoyage dans window pour faciliter le debug
 */
export function exposeCleanerToWindow(): void {
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Exposing debug functions to window
    window.clearPiperCache = clearPiperOPFSCache
    // @ts-expect-error - Exposing debug functions to window
    window.clearAudioCache = clearAudioCache
    // @ts-expect-error - Exposing debug functions to window
    window.clearAllCaches = clearAllCaches
    // @ts-expect-error - Exposing debug functions to window
    window.getStorageStats = getStorageStats
    // @ts-expect-error - Exposing debug functions to window
    window.logStorageStats = logStorageStats

    console.warn('[CacheCleaner] 🔧 Fonctions exposées dans window:')
    console.warn('  - window.clearPiperCache()')
    console.warn('  - window.clearAudioCache()')
    console.warn('  - window.clearAllCaches()')
    console.warn('  - window.getStorageStats()')
    console.warn('  - window.logStorageStats()')
  }
}

/**
 * Expose les utilitaires de diagnostic pour le provider Piper
 */
export function exposePiperDebugToWindow(provider: {
  getSessionCacheStats?: () => { voiceCount: number; voices: string[] }
  clearSessionCache?: () => Promise<void>
  getCacheStats?: () => Promise<{ count: number; size: number; sizeFormatted: string }>
  preloadModel?: (voiceId: string, onProgress: (percent: number) => void) => Promise<void>
}): void {
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Exposing debug functions to window
    window.piperDebug = {
      // Stats du cache de sessions
      getSessionCacheStats: () => {
        if (provider && typeof provider.getSessionCacheStats === 'function') {
          const stats = provider.getSessionCacheStats()
          console.warn('[PiperDebug] 📊 Cache de sessions:')
          console.warn(`  - Voix en cache: ${stats.voiceCount}`)
          console.warn(`  - IDs: ${stats.voices.join(', ')}`)
          return stats
        }
        return { voiceCount: 0, voices: [] }
      },

      // Vider le cache de sessions
      clearSessionCache: async () => {
        if (provider && typeof provider.clearSessionCache === 'function') {
          await provider.clearSessionCache()
          console.warn('[PiperDebug] ✅ Cache de sessions vidé')
        }
      },

      // Stats du cache audio
      getCacheStats: async () => {
        if (provider && typeof provider.getCacheStats === 'function') {
          const stats = await provider.getCacheStats()
          console.warn('[PiperDebug] 📊 Cache audio:')
          console.warn(`  - Nombre d'entrées: ${stats.count}`)
          console.warn(`  - Taille: ${stats.sizeFormatted}`)
          return stats
        }
        return { count: 0, size: 0, sizeFormatted: '0 B' }
      },

      // Pré-charger un modèle
      preloadModel: async (voiceId: string) => {
        if (provider && typeof provider.preloadModel === 'function') {
          console.warn(`[PiperDebug] 📥 Pré-chargement du modèle ${voiceId}...`)
          const start = Date.now()
          await provider.preloadModel(voiceId, (percent: number) => {
            console.warn(`[PiperDebug] Progression: ${percent}%`)
          })
          const duration = Date.now() - start
          console.warn(`[PiperDebug] ✅ Modèle chargé en ${duration}ms`)
        }
      },

      // Afficher toutes les stats
      logAllStats: async () => {
        console.warn('[PiperDebug] 📊 Statistiques complètes')

        // @ts-expect-error - Accessing debug functions from window
        if (window.piperDebug.getSessionCacheStats) {
          // @ts-expect-error - Accessing debug functions from window
          window.piperDebug.getSessionCacheStats()
        }

        // @ts-expect-error - Accessing debug functions from window
        if (window.piperDebug.getCacheStats) {
          // @ts-expect-error - Accessing debug functions from window
          await window.piperDebug.getCacheStats()
        }
      },
    }

    console.warn('[PiperDebug] 🔧 Utilitaires de diagnostic exposés dans window.piperDebug:')
    console.warn('  - window.piperDebug.getSessionCacheStats()')
    console.warn('  - window.piperDebug.clearSessionCache()')
    console.warn('  - window.piperDebug.getCacheStats()')
    console.warn('  - window.piperDebug.preloadModel(voiceId)')
    console.warn('  - window.piperDebug.logAllStats()')
  }
}
