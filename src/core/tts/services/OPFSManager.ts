/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * OPFS Manager - Gestionnaire de stockage Origin Private File System
 *
 * Ce service gère le stockage persistant des modèles vocaux dans OPFS
 * pour le build online. Il permet de :
 * - Télécharger et stocker les modèles vocaux
 * - Lire les modèles depuis OPFS
 * - Gérer le versioning et l'invalidation du cache
 * - Monitorer l'espace disque disponible
 *
 * OPFS est persistant et survit aux fermetures de page/navigateur.
 * Il est vidé uniquement si l'utilisateur efface les données du site.
 */

import { MODEL_VERSION, MODELS_CDN_URL } from '@/config/version'

/**
 * Configuration d'un modèle vocal
 */
export interface VoiceModelConfig {
  id: string
  /** Nom du fichier .onnx */
  onnxFile: string
  /** Nom du fichier .onnx.json */
  configFile: string
  /** URL de base pour le téléchargement */
  baseUrl: string
  /** Taille estimée en octets */
  estimatedSize: number
}

/**
 * Métadonnées d'un modèle en cache
 */
interface ModelMetadata {
  version: string
  downloadedAt: number
  size: number
}

/**
 * Statistiques OPFS
 */
export interface OPFSStats {
  /** Nombre de modèles en cache */
  modelCount: number
  /** Taille totale utilisée (octets) */
  totalSize: number
  /** Taille formatée (ex: "196 MB") */
  totalSizeFormatted: string
  /** Espace disque disponible (octets, si disponible) */
  availableSpace?: number
  /** Quota total (octets, si disponible) */
  quota?: number
}

/**
 * Gestionnaire OPFS pour les modèles vocaux
 */
export class OPFSManager {
  private static readonly OPFS_ROOT_DIR = 'voice-models'
  private static readonly METADATA_FILE = '.metadata.json'
  private static readonly SUPPORTED = typeof navigator.storage?.getDirectory === 'function'

  private rootHandle: FileSystemDirectoryHandle | null = null
  private initialized = false

  /**
   * Vérifie si OPFS est supporté par le navigateur
   */
  static isSupported(): boolean {
    return this.SUPPORTED
  }

  /**
   * Initialise le gestionnaire OPFS
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    if (!OPFSManager.SUPPORTED) {
      throw new Error('OPFS non supporté par ce navigateur')
    }

    try {
      // Obtenir le répertoire racine OPFS
      const root = await navigator.storage.getDirectory()

      // Créer ou obtenir le répertoire des modèles
      this.rootHandle = await root.getDirectoryHandle(OPFSManager.OPFS_ROOT_DIR, {
        create: true,
      })

      console.warn('[OPFS] ✅ Gestionnaire initialisé')
      this.initialized = true
    } catch (error) {
      console.error("[OPFS] ❌ Erreur lors de l'initialisation:", error)
      throw error
    }
  }

  /**
   * Vérifie si un modèle est en cache et à jour
   */
  async hasModel(modelId: string): Promise<boolean> {
    this.ensureInitialized()

    try {
      // Vérifier l'existence du répertoire du modèle
      const modelHandle = await this.rootHandle!.getDirectoryHandle(modelId, { create: false })

      // Lire les métadonnées
      const metadata = await this.readMetadata(modelHandle)

      // Vérifier la version
      if (metadata.version !== MODEL_VERSION) {
        console.warn(
          `[OPFS] ⚠️ Modèle ${modelId} en cache avec ancienne version (${metadata.version} !== ${MODEL_VERSION})`
        )
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Télécharge et stocke un modèle dans OPFS
   */
  async downloadAndStoreModel(
    config: VoiceModelConfig,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    this.ensureInitialized()

    console.warn(`[OPFS] 📥 Téléchargement du modèle ${config.id}...`)

    try {
      // Créer le répertoire du modèle
      const modelHandle = await this.rootHandle!.getDirectoryHandle(config.id, { create: true })

      let totalDownloaded = 0
      const totalSize = config.estimatedSize

      // Télécharger le fichier .onnx
      console.warn(`[OPFS]    - Téléchargement ${config.onnxFile}...`)
      const onnxUrl = `${config.baseUrl}/${config.onnxFile}`
      const onnxData = await this.downloadFile(onnxUrl, (loaded) => {
        totalDownloaded = loaded
        const percent = Math.round((totalDownloaded / totalSize) * 100)
        onProgress?.(percent)
      })

      // Écrire le fichier .onnx dans OPFS
      await this.writeFile(modelHandle, config.onnxFile, onnxData)
      console.warn(
        `[OPFS]    ✅ ${config.onnxFile} stocké (${this.formatSize(onnxData.byteLength)})`
      )

      // Télécharger le fichier .onnx.json
      console.warn(`[OPFS]    - Téléchargement ${config.configFile}...`)
      const configUrl = `${config.baseUrl}/${config.configFile}`
      const configData = await this.downloadFile(configUrl)

      // Écrire le fichier .onnx.json dans OPFS
      await this.writeFile(modelHandle, config.configFile, configData)
      console.warn(`[OPFS]    ✅ ${config.configFile} stocké`)

      // Écrire les métadonnées
      const metadata: ModelMetadata = {
        version: MODEL_VERSION,
        downloadedAt: Date.now(),
        size: onnxData.byteLength,
      }
      await this.writeMetadata(modelHandle, metadata)

      onProgress?.(100)
      console.warn(`[OPFS] ✅ Modèle ${config.id} téléchargé et stocké avec succès`)
    } catch (error) {
      console.error(`[OPFS] ❌ Erreur lors du téléchargement de ${config.id}:`, error)
      throw error
    }
  }

  /**
   * Lit un modèle depuis OPFS
   */
  async readModel(modelId: string, fileName: string): Promise<ArrayBuffer> {
    this.ensureInitialized()

    try {
      const modelHandle = await this.rootHandle!.getDirectoryHandle(modelId, { create: false })
      const fileHandle = await modelHandle.getFileHandle(fileName, { create: false })
      const file = await fileHandle.getFile()
      return await file.arrayBuffer()
    } catch (error) {
      console.error(`[OPFS] ❌ Erreur lors de la lecture de ${modelId}/${fileName}:`, error)
      throw error
    }
  }

  /**
   * Supprime un modèle d'OPFS
   */
  async deleteModel(modelId: string): Promise<void> {
    this.ensureInitialized()

    try {
      await this.rootHandle!.removeEntry(modelId, { recursive: true })
      console.warn(`[OPFS] 🗑️ Modèle ${modelId} supprimé`)
    } catch (error) {
      console.error(`[OPFS] ❌ Erreur lors de la suppression de ${modelId}:`, error)
      throw error
    }
  }

  /**
   * Vide complètement OPFS (tous les modèles)
   */
  async clearAll(): Promise<void> {
    this.ensureInitialized()

    try {
      // Lister tous les modèles
      const entries: string[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const entry of (this.rootHandle as any).values()) {
        if (entry.kind === 'directory') {
          entries.push(entry.name)
        }
      }

      // Supprimer chaque modèle
      for (const modelId of entries) {
        await this.deleteModel(modelId)
      }

      console.warn('[OPFS] 🗑️ Tous les modèles supprimés')
    } catch (error) {
      console.error('[OPFS] ❌ Erreur lors du vidage OPFS:', error)
      throw error
    }
  }

  /**
   * Obtient les statistiques d'utilisation OPFS
   */
  async getStats(): Promise<OPFSStats> {
    this.ensureInitialized()

    let modelCount = 0
    let totalSize = 0

    try {
      // Parcourir tous les modèles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const entry of (this.rootHandle as any).values()) {
        if (entry.kind === 'directory') {
          modelCount++

          try {
            const modelHandle = entry as FileSystemDirectoryHandle
            const metadata = await this.readMetadata(modelHandle)
            totalSize += metadata.size
          } catch {
            // Ignorer les erreurs de lecture de métadonnées
          }
        }
      }

      // Obtenir les quotas de stockage si disponible
      let availableSpace: number | undefined
      let quota: number | undefined

      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate()
        quota = estimate.quota
        const usage = estimate.usage || 0
        availableSpace = quota ? quota - usage : undefined
      }

      return {
        modelCount,
        totalSize,
        totalSizeFormatted: this.formatSize(totalSize),
        availableSpace,
        quota,
      }
    } catch (error) {
      console.error('[OPFS] ❌ Erreur lors du calcul des stats:', error)
      return {
        modelCount: 0,
        totalSize: 0,
        totalSizeFormatted: '0 B',
      }
    }
  }

  /**
   * Télécharge un fichier depuis une URL
   */
  private async downloadFile(
    url: string,
    onProgress?: (loaded: number) => void
  ): Promise<ArrayBuffer> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('ReadableStream non disponible')
    }

    const chunks: Uint8Array[] = []
    let loaded = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      loaded += value.length

      if (onProgress && total > 0) {
        onProgress(loaded)
      }
    }

    // Combiner tous les chunks
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
   * Écrit un fichier dans OPFS
   */
  private async writeFile(
    dirHandle: FileSystemDirectoryHandle,
    fileName: string,
    data: ArrayBuffer
  ): Promise<void> {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(data)
    await writable.close()
  }

  /**
   * Lit les métadonnées d'un modèle
   */
  private async readMetadata(dirHandle: FileSystemDirectoryHandle): Promise<ModelMetadata> {
    try {
      const fileHandle = await dirHandle.getFileHandle(OPFSManager.METADATA_FILE, {
        create: false,
      })
      const file = await fileHandle.getFile()
      const text = await file.text()
      return JSON.parse(text)
    } catch {
      // Si pas de métadonnées, retourner des valeurs par défaut
      return {
        version: '0.0.0',
        downloadedAt: 0,
        size: 0,
      }
    }
  }

  /**
   * Écrit les métadonnées d'un modèle
   */
  private async writeMetadata(
    dirHandle: FileSystemDirectoryHandle,
    metadata: ModelMetadata
  ): Promise<void> {
    const data = JSON.stringify(metadata, null, 2)
    const encoder = new TextEncoder()
    await this.writeFile(dirHandle, OPFSManager.METADATA_FILE, encoder.encode(data).buffer)
  }

  /**
   * Formate une taille en octets en format lisible
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Vérifie que le manager est initialisé
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("OPFSManager non initialisé. Appelez initialize() d'abord.")
    }
  }
}

/**
 * Instance singleton du gestionnaire OPFS
 */
export const opfsManager = new OPFSManager()

/**
 * Configuration des modèles vocaux pour le téléchargement
 */
export const VOICE_MODEL_CONFIGS: Record<string, VoiceModelConfig> = {
  'fr_FR-siwis-medium': {
    id: 'fr_FR-siwis-medium',
    onnxFile: 'fr_FR-siwis-medium.onnx',
    configFile: 'fr_FR-siwis-medium.onnx.json',
    baseUrl: `${MODELS_CDN_URL}/fr/fr_FR/siwis/medium`,
    estimatedSize: 61 * 1024 * 1024, // 61 MB
  },
  'fr_FR-tom-medium': {
    id: 'fr_FR-tom-medium',
    onnxFile: 'fr_FR-tom-medium.onnx',
    configFile: 'fr_FR-tom-medium.onnx.json',
    baseUrl: `${MODELS_CDN_URL}/fr/fr_FR/tom/medium`,
    estimatedSize: 61 * 1024 * 1024, // 61 MB
  },
  'fr_FR-upmc-medium': {
    id: 'fr_FR-upmc-medium',
    onnxFile: 'fr_FR-upmc-medium.onnx',
    configFile: 'fr_FR-upmc-medium.onnx.json',
    baseUrl: `${MODELS_CDN_URL}/fr/fr_FR/upmc/medium`,
    estimatedSize: 74 * 1024 * 1024, // 74 MB
  },
}
