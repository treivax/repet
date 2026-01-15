/**
 * AudioCacheService - Caches synthesized audio in IndexedDB
 *
 * This service stores synthesized audio blobs to avoid re-synthesizing
 * the same text multiple times. Uses IndexedDB for persistent storage.
 */

import { audioCompressionService } from './AudioCompressionService'

export interface CachedAudio {
  key: string
  blob: Blob
  text: string
  voiceId: string
  settings: {
    rate?: number
    pitch?: number
    volume?: number
  }
  createdAt: number
  lastAccess: number
  accessCount: number
}

export type CacheEntry = CachedAudio

export interface CacheMetadata {
  rate?: number
  pitch?: number
  volume?: number
}

export interface CacheStats {
  count: number
  size: number
  sizeFormatted: string
}

export class AudioCacheService {
  private dbName = 'repet-audio-cache'
  private storeName = 'audio-cache'
  private db: IDBDatabase | null = null
  private maxCacheSize = 100 * 1024 * 1024 // 100 MB
  private initPromise: Promise<void> | null = null

  /**
   * Initialize the IndexedDB database and clear cache on startup
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = (async () => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1)

        request.onerror = () => {
          console.error('Failed to open audio cache database:', request.error)
          reject(request.error)
        }

        request.onsuccess = () => {
          this.db = request.result
          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
            store.createIndex('lastAccess', 'lastAccess', { unique: false })
            store.createIndex('createdAt', 'createdAt', { unique: false })
          }
        }
      })

      // Vider le cache au démarrage pour garantir la cohérence avec les modèles rechargés
      // On le fait directement ici pour éviter le deadlock (clearCache() appelle initialize())
      if (this.db) {
        await new Promise<void>((resolve) => {
          console.warn('[AudioCache] 🗑️ Vidage du cache au démarrage (modèles rechargés)')
          const transaction = this.db!.transaction([this.storeName], 'readwrite')
          const store = transaction.objectStore(this.storeName)
          const request = store.clear()

          request.onsuccess = () => {
            console.warn('[AudioCache] ✅ Cache vidé avec succès')
            resolve()
          }

          request.onerror = () => {
            console.error('[AudioCache] ❌ Erreur lors du vidage du cache:', request.error)
            // On ne rejette pas pour ne pas bloquer l'initialisation
            resolve()
          }
        })
      }
    })()

    return this.initPromise
  }

  /**
   * Generate a cache key from text and synthesis options
   * Note: volume is NOT included because it's a playback property, not a synthesis property
   */
  generateCacheKey(
    text: string,
    voiceId: string,
    settings: { rate?: number; pitch?: number; volume?: number } = {}
  ): string {
    // Volume is excluded from cache key - it's applied at playback time
    const data = `${text}|${voiceId}|${settings.rate ?? 1}|${settings.pitch ?? 1}`

    // Simple hash function
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    const key = `audio_${Math.abs(hash).toString(16)}`
    console.warn(`[AudioCache] 🔑 Clé générée: ${key}`)
    console.warn(`[AudioCache]    - voiceId: ${voiceId}`)
    console.warn(`[AudioCache]    - texte: "${text.substring(0, 30)}..."`)
    console.warn(`[AudioCache]    - data complète: "${data.substring(0, 100)}..."`)
    return key
  }

  /**
   * Store audio in cache
   * Phase 2: Integrates audio compression for space optimization
   */
  async cacheAudio(
    text: string,
    voiceId: string,
    blob: Blob,
    settings: { rate?: number; pitch?: number; volume?: number } = {}
  ): Promise<void> {
    await this.initialize()

    if (!this.db) {
      console.warn('Database not initialized')
      return
    }

    const key = this.generateCacheKey(text, voiceId, settings)
    console.warn(`[AudioCache] 💾 Mise en cache avec clé: ${key}`)
    const now = Date.now()

    // Phase 2: Try compression if beneficial
    let finalBlob = blob
    const originalSize = blob.size

    try {
      const result = await audioCompressionService.compress(blob)
      const compressionRatio = result.compressionRatio

      // Only use compression if it saves at least 10% space
      if (compressionRatio < 0.9) {
        finalBlob = result.blob
        console.warn(
          `[AudioCache] 🗜️ Compression réussie: ${originalSize} → ${result.compressedSize} bytes (${Math.round((1 - compressionRatio) * 100)}% économisé)`
        )
      } else {
        console.warn(
          `[AudioCache] ⚠️ Compression non rentable (${Math.round(compressionRatio * 100)}%), conservation de l'original`
        )
      }
    } catch (error) {
      console.warn('[AudioCache] ⚠️ Erreur de compression, utilisation du blob original:', error)
    }

    const cached: CachedAudio = {
      key,
      blob: finalBlob,
      text,
      voiceId,
      settings,
      createdAt: now,
      lastAccess: now,
      accessCount: 1,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(cached)

      request.onsuccess = () => {
        console.warn(
          `[AudioCache] ✅ Audio mis en cache avec succès (clé: ${key}, taille: ${finalBlob.size} bytes)`
        )
        // Check cache size and cleanup if needed
        this.cleanupIfNeeded().catch(console.error)
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to cache audio:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Retrieve audio from cache
   */
  async getAudio(
    text: string,
    voiceId: string,
    settings: { rate?: number; pitch?: number; volume?: number } = {}
  ): Promise<Blob | null> {
    await this.initialize()

    if (!this.db) {
      return null
    }

    const key = this.generateCacheKey(text, voiceId, settings)
    console.warn(`[AudioCache] 🔍 Recherche dans le cache avec clé: ${key}`)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const cached = request.result as CachedAudio | undefined

        if (!cached) {
          console.warn(`[AudioCache] ❌ Clé ${key} NON trouvée dans le cache`)
          resolve(null)
          return
        }

        console.warn(`[AudioCache] ✅ Clé ${key} TROUVÉE dans le cache (${cached.blob.size} bytes)`)
        console.warn(`[AudioCache]    - voiceId: ${cached.voiceId}`)
        console.warn(`[AudioCache]    - texte: "${cached.text.substring(0, 30)}..."`)

        // Update access statistics
        cached.lastAccess = Date.now()
        cached.accessCount++
        store.put(cached)

        resolve(cached.blob)
      }

      request.onerror = () => {
        console.error('Failed to retrieve cached audio:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get total cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    await this.initialize()

    if (!this.db) {
      return 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const items = request.result as CachedAudio[]
        let totalSize = 0

        for (const item of items) {
          totalSize += item.blob.size
        }

        resolve(totalSize)
      }

      request.onerror = () => {
        console.error('Failed to calculate cache size:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get count of cached items
   */
  async getCacheCount(): Promise<number> {
    await this.initialize()

    if (!this.db) {
      return 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.count()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        console.error('Failed to count cache items:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get detailed cache statistics grouped by voice
   */
  async getCacheStats(): Promise<{
    totalEntries: number
    totalSize: number
    byVoice: Record<string, { count: number; totalSize: number }>
  }> {
    await this.initialize()

    if (!this.db) {
      return {
        totalEntries: 0,
        totalSize: 0,
        byVoice: {},
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const items = request.result as CachedAudio[]
        let totalSize = 0
        const byVoice: Record<string, { count: number; totalSize: number }> = {}

        for (const item of items) {
          totalSize += item.blob.size

          if (!byVoice[item.voiceId]) {
            byVoice[item.voiceId] = { count: 0, totalSize: 0 }
          }

          byVoice[item.voiceId].count++
          byVoice[item.voiceId].totalSize += item.blob.size
        }

        resolve({
          totalEntries: items.length,
          totalSize,
          byVoice,
        })
      }

      request.onerror = () => {
        console.error('Failed to get cache stats:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Clean up old cache entries if size exceeds limit
   */
  private async cleanupIfNeeded(): Promise<void> {
    const currentSize = await this.getCacheSize()

    if (currentSize <= this.maxCacheSize) {
      return
    }

    console.warn(
      `Cache size (${currentSize} bytes) exceeds limit (${this.maxCacheSize} bytes). Cleaning up...`
    )

    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('lastAccess')
      const request = index.openCursor()

      const toDelete: string[] = []
      let cleanedSize = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result

        if (cursor && currentSize - cleanedSize > this.maxCacheSize * 0.8) {
          const cached = cursor.value as CachedAudio
          toDelete.push(cached.key)
          cleanedSize += cached.blob.size
          cursor.continue()
        } else {
          // Delete collected entries
          for (const key of toDelete) {
            store.delete(key)
          }

          console.warn(`Cleaned up ${toDelete.length} entries, freed ${cleanedSize} bytes`)
          resolve()
        }
      }

      request.onerror = () => {
        console.error('Failed to cleanup cache:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Clear all cached audio
   */
  async clearCache(): Promise<void> {
    await this.initialize()

    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => {
        console.warn('[AudioCache] ✅ Cache audio vidé avec succès')
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to clear cache:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Delete a specific cached item
   */
  async deleteItem(
    text: string,
    voiceId: string,
    settings: { rate?: number; pitch?: number; volume?: number } = {}
  ): Promise<void> {
    await this.initialize()

    if (!this.db) {
      return
    }

    const key = this.generateCacheKey(text, voiceId, settings)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to delete cache item:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Delete all cached items for a specific voice
   * Useful when changing voice assignment for a character
   */
  async deleteByVoiceId(voiceId: string): Promise<number> {
    await this.initialize()

    if (!this.db) {
      return 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const items = request.result as CachedAudio[]
        const toDelete = items.filter((item) => item.voiceId === voiceId)

        if (toDelete.length === 0) {
          console.warn(`[AudioCache] 🔍 Aucune entrée trouvée pour voiceId: ${voiceId}`)
          resolve(0)
          return
        }

        console.warn(
          `[AudioCache] 🗑️ Suppression de ${toDelete.length} entrées pour voiceId: ${voiceId}`
        )

        let deletedCount = 0
        let processedCount = 0

        for (const item of toDelete) {
          const deleteRequest = store.delete(item.key)

          deleteRequest.onsuccess = () => {
            deletedCount++
            processedCount++

            if (processedCount === toDelete.length) {
              console.warn(`[AudioCache] ✅ ${deletedCount} entrées supprimées`)
              resolve(deletedCount)
            }
          }

          deleteRequest.onerror = () => {
            console.error(`[AudioCache] ❌ Erreur lors de la suppression de ${item.key}`)
            processedCount++

            if (processedCount === toDelete.length) {
              resolve(deletedCount)
            }
          }
        }
      }

      request.onerror = () => {
        console.error('Failed to get items for deletion:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    count: number
    size: number
    sizeFormatted: string
  }> {
    const count = await this.getCacheCount()
    const size = await this.getCacheSize()

    const sizeFormatted = this.formatBytes(size)

    return { count, size, sizeFormatted }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}

// Singleton instance
export const audioCacheService = new AudioCacheService()
