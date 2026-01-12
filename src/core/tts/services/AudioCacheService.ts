/**
 * AudioCacheService - Caches synthesized audio in IndexedDB
 *
 * This service stores synthesized audio blobs to avoid re-synthesizing
 * the same text multiple times. Uses IndexedDB for persistent storage.
 */

interface CachedAudio {
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

export class AudioCacheService {
  private dbName = 'repet-audio-cache'
  private storeName = 'audio-cache'
  private db: IDBDatabase | null = null
  private maxCacheSize = 100 * 1024 * 1024 // 100 MB
  private initPromise: Promise<void> | null = null

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
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

    return this.initPromise
  }

  /**
   * Generate a cache key from text and synthesis options
   */
  generateCacheKey(
    text: string,
    voiceId: string,
    settings: { rate?: number; pitch?: number; volume?: number } = {}
  ): string {
    const data = `${text}|${voiceId}|${settings.rate || 1}|${settings.pitch || 1}|${settings.volume || 1}`

    // Simple hash function
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    return `audio_${Math.abs(hash).toString(16)}`
  }

  /**
   * Store audio in cache
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
    const now = Date.now()

    const cached: CachedAudio = {
      key,
      blob,
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

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const cached = request.result as CachedAudio | undefined

        if (!cached) {
          resolve(null)
          return
        }

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
        console.log('Audio cache cleared')
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
