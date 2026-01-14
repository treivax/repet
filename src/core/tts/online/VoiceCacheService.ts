/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import Dexie, { Table } from 'dexie'

/**
 * Service de cache des voix pour le mode online
 *
 * Gère le téléchargement et le stockage des fichiers vocaux depuis le CDN.
 * Utilise IndexedDB pour stocker les fichiers volumineux (.onnx, .json).
 * Implémente une stratégie LRU (Least Recently Used) pour respecter les quotas de stockage.
 */

/**
 * Entrée de cache pour un fichier vocal
 */
interface VoiceCacheEntry {
  url: string // URL complète du fichier (clé primaire)
  fileName: string // Nom du fichier (ex: fr_FR-siwis-medium.onnx)
  data: ArrayBuffer // Contenu du fichier
  size: number // Taille en bytes
  mimeType: string // Type MIME (application/octet-stream, application/json)
  lastAccessed: Date // Date du dernier accès (pour stratégie LRU)
  downloadedAt: Date // Date du téléchargement initial
  checksum?: string // Checksum MD5 optionnel pour validation
}

/**
 * Statistiques du cache
 */
export interface VoiceCacheStats {
  totalEntries: number
  totalSize: number
  oldestEntry?: Date
  newestEntry?: Date
  availableQuota: number
  usedQuota: number
}

/**
 * Événement de progression de téléchargement
 */
export interface DownloadProgress {
  url: string
  fileName: string
  loaded: number // Bytes téléchargés
  total: number // Taille totale (si connue)
  percentage: number // Pourcentage (0-100)
  speed?: number // Vitesse en bytes/seconde
  eta?: number // Temps restant estimé en secondes
}

/**
 * Base de données IndexedDB pour le cache des voix
 */
class VoiceCacheDatabase extends Dexie {
  voiceCache!: Table<VoiceCacheEntry, string>

  constructor() {
    super('RepetVoiceCacheDB')

    this.version(1).stores({
      voiceCache: 'url, fileName, lastAccessed, downloadedAt, size',
    })
  }
}

/**
 * Service de gestion du cache des voix
 */
export class VoiceCacheService {
  private db: VoiceCacheDatabase
  private maxCacheSize: number // Taille maximale du cache en bytes

  /**
   * Constructeur
   * @param maxCacheSize Taille maximale du cache en MB (défaut: 400 MB)
   */
  constructor(maxCacheSize: number = 400) {
    this.db = new VoiceCacheDatabase()
    this.maxCacheSize = maxCacheSize * 1024 * 1024 // Convertir MB en bytes
  }

  /**
   * Récupérer un fichier vocal depuis le cache ou le télécharger
   */
  async getVoiceFile(
    url: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<ArrayBuffer> {
    // 1. Vérifier si le fichier est déjà en cache
    const cached = await this.db.voiceCache.get(url)

    if (cached) {
      console.warn(`[VoiceCacheService] ✅ Cache hit: ${cached.fileName}`)

      // Mettre à jour la date de dernier accès (stratégie LRU)
      await this.db.voiceCache.update(url, { lastAccessed: new Date() })

      return cached.data
    }

    // 2. Fichier non en cache → télécharger
    console.warn(`[VoiceCacheService] ⬇️ Téléchargement: ${url}`)

    const data = await this.downloadWithProgress(url, onProgress)

    // 3. Stocker dans le cache
    await this.storeInCache(url, data)

    return data
  }

  /**
   * Télécharger un fichier avec suivi de progression
   */
  private async downloadWithProgress(
    url: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<ArrayBuffer> {
    const fileName = this.extractFileName(url)
    const startTime = Date.now()

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Échec du téléchargement: ${response.status} ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let loaded = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      loaded += value.length

      // Calculer progression
      const percentage = total > 0 ? (loaded / total) * 100 : 0
      const elapsed = (Date.now() - startTime) / 1000 // secondes
      const speed = elapsed > 0 ? loaded / elapsed : 0
      const eta = speed > 0 && total > 0 ? (total - loaded) / speed : undefined

      // Notifier la progression
      if (onProgress) {
        onProgress({
          url,
          fileName,
          loaded,
          total,
          percentage,
          speed,
          eta,
        })
      }
    }

    // Fusionner tous les chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result.buffer
  }

  /**
   * Stocker un fichier dans le cache (avec gestion du quota)
   */
  private async storeInCache(url: string, data: ArrayBuffer): Promise<void> {
    const fileName = this.extractFileName(url)
    const size = data.byteLength

    // 1. Vérifier si on a assez d'espace
    const stats = await this.getCacheStats()
    const availableSpace = this.maxCacheSize - stats.totalSize

    if (size > this.maxCacheSize) {
      console.warn(
        `[VoiceCacheService] ⚠️ Fichier trop volumineux pour être mis en cache: ${fileName} (${this.formatBytes(size)})`
      )
      // Ne pas mettre en cache, mais retourner les données quand même
      return
    }

    // 2. Libérer de l'espace si nécessaire (stratégie LRU)
    if (size > availableSpace) {
      await this.evictOldestEntries(size - availableSpace)
    }

    // 3. Stocker dans IndexedDB
    const entry: VoiceCacheEntry = {
      url,
      fileName,
      data,
      size,
      mimeType: this.getMimeType(fileName),
      lastAccessed: new Date(),
      downloadedAt: new Date(),
    }

    await this.db.voiceCache.put(entry)

    console.warn(`[VoiceCacheService] 💾 Mise en cache: ${fileName} (${this.formatBytes(size)})`)
  }

  /**
   * Supprimer les entrées les plus anciennes pour libérer de l'espace
   */
  private async evictOldestEntries(spaceNeeded: number): Promise<void> {
    console.warn(`[VoiceCacheService] 🗑️ Libération d'espace: ${this.formatBytes(spaceNeeded)}`)

    // Récupérer toutes les entrées triées par date d'accès (les plus anciennes en premier)
    const entries = await this.db.voiceCache.orderBy('lastAccessed').toArray()

    let freedSpace = 0

    for (const entry of entries) {
      if (freedSpace >= spaceNeeded) {
        break
      }

      console.warn(`[VoiceCacheService] 🗑️ Éviction: ${entry.fileName}`)
      await this.db.voiceCache.delete(entry.url)
      freedSpace += entry.size
    }

    console.warn(`[VoiceCacheService] ✅ Espace libéré: ${this.formatBytes(freedSpace)}`)
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getCacheStats(): Promise<VoiceCacheStats> {
    const entries = await this.db.voiceCache.toArray()

    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    const lastAccessed = entries.map((e) => e.lastAccessed)

    // Obtenir le quota de stockage disponible
    let availableQuota = 0
    let usedQuota = 0

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      usedQuota = estimate.usage || 0
      availableQuota = (estimate.quota || 0) - usedQuota
    }

    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry:
        lastAccessed.length > 0
          ? new Date(Math.min(...lastAccessed.map((d) => d.getTime())))
          : undefined,
      newestEntry:
        lastAccessed.length > 0
          ? new Date(Math.max(...lastAccessed.map((d) => d.getTime())))
          : undefined,
      availableQuota,
      usedQuota,
    }
  }

  /**
   * Vider complètement le cache
   */
  async clearCache(): Promise<void> {
    console.warn('[VoiceCacheService] 🗑️ Vidage complet du cache')
    await this.db.voiceCache.clear()
  }

  /**
   * Supprimer une entrée spécifique du cache
   */
  async removeFromCache(url: string): Promise<void> {
    const entry = await this.db.voiceCache.get(url)
    if (entry) {
      console.warn(`[VoiceCacheService] 🗑️ Suppression: ${entry.fileName}`)
      await this.db.voiceCache.delete(url)
    }
  }

  /**
   * Vérifier si un fichier est en cache
   */
  async isCached(url: string): Promise<boolean> {
    const entry = await this.db.voiceCache.get(url)
    return !!entry
  }

  /**
   * Obtenir la liste des fichiers en cache
   */
  async getCachedFiles(): Promise<Array<{ url: string; fileName: string; size: number }>> {
    const entries = await this.db.voiceCache.toArray()
    return entries.map((entry) => ({
      url: entry.url,
      fileName: entry.fileName,
      size: entry.size,
    }))
  }

  /**
   * Pré-télécharger un fichier sans le retourner immédiatement
   */
  async prefetchVoiceFile(
    url: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    await this.getVoiceFile(url, onProgress)
  }

  /**
   * Extraire le nom de fichier depuis une URL
   */
  private extractFileName(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const parts = pathname.split('/')
      return parts[parts.length - 1] || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * Déterminer le type MIME depuis l'extension
   */
  private getMimeType(fileName: string): string {
    if (fileName.endsWith('.onnx')) {
      return 'application/octet-stream'
    } else if (fileName.endsWith('.json')) {
      return 'application/json'
    } else if (fileName.endsWith('.wasm')) {
      return 'application/wasm'
    }
    return 'application/octet-stream'
  }

  /**
   * Formater une taille en bytes en format lisible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }
}

/**
 * Instance singleton du service de cache
 */
let voiceCacheServiceInstance: VoiceCacheService | null = null

/**
 * Obtenir l'instance singleton du service de cache
 */
export function getVoiceCacheService(): VoiceCacheService {
  if (!voiceCacheServiceInstance) {
    voiceCacheServiceInstance = new VoiceCacheService()
  }
  return voiceCacheServiceInstance
}
