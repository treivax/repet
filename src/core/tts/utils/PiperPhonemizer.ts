/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Emscripten File System API
 */
interface EmscriptenFS {
  writeFile(path: string, data: string | ArrayBufferView, opts?: { encoding?: string }): void
  readFile(path: string, opts?: { encoding?: string }): string | Uint8Array
  unlink(path: string): void
  mkdir(path: string): void
  rmdir(path: string): void
}

/**
 * Interface pour le module Piper Phonemize WASM
 */
interface PiperPhonemizeModule {
  FS: EmscriptenFS
  callMain: (args: string[]) => number
  locateFile?: (path: string, scriptDirectory?: string) => string
}

/**
 * Wrapper pour le module piper_phonemize.wasm
 * Convertit du texte en phonèmes IPA pour les modèles Piper
 */
export class PiperPhonemizer {
  private module: PiperPhonemizeModule | null = null
  private initialized = false
  private initPromise: Promise<void> | null = null

  /**
   * Initialise le phonemizer WASM
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._doInitialize()
    return this.initPromise
  }

  private async _doInitialize(): Promise<void> {
    console.log('[PiperPhonemizer] Initialisation...')

    try {
      // Charger le script piper_phonemize.js qui créera le module
      const script = document.createElement('script')
      script.src = '/wasm/piper_phonemize.js'

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Échec du chargement de piper_phonemize.js'))
        document.head.appendChild(script)
      })

      // Le script devrait avoir créé une fonction createPiperPhonemize globale
      const createModule = (window as any).createPiperPhonemize
      if (!createModule) {
        throw new Error('createPiperPhonemize non trouvé')
      }

      // Créer l'instance du module WASM
      this.module = await createModule({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return '/wasm/piper_phonemize.wasm'
          }
          if (path.endsWith('.data')) {
            return '/wasm/piper_phonemize.data'
          }
          return path
        },
      })

      this.initialized = true
      console.log('[PiperPhonemizer] Initialisé avec succès')
    } catch (error) {
      this.initPromise = null
      console.error("[PiperPhonemizer] Erreur lors de l'initialisation:", error)
      throw new Error(`Échec de l'initialisation du phonemizer: ${error}`)
    }
  }

  /**
   * Convertit du texte en phonèmes IPA
   */
  async textToPhonemes(text: string, voice: string = 'fr'): Promise<string> {
    if (!this.initialized) {
      await this.initialize()
    }

    if (!this.module) {
      throw new Error('Module non initialisé')
    }

    try {
      // Créer un fichier temporaire dans le système de fichiers WASM
      const inputPath = '/tmp/input.txt'
      const outputPath = '/tmp/output.txt'

      // Écrire le texte dans le fichier d'entrée
      this.module.FS.writeFile(inputPath, text)

      // Exécuter piper_phonemize
      const args = [
        '--espeak_data',
        '/espeak-ng-data',
        '--voice',
        voice,
        '--input',
        inputPath,
        '--output',
        outputPath,
      ]

      const exitCode = this.module.callMain(args)

      if (exitCode !== 0) {
        throw new Error(`piper_phonemize a échoué avec le code ${exitCode}`)
      }

      // Lire le résultat
      const phonemes = this.module.FS.readFile(outputPath, { encoding: 'utf8' })

      // Nettoyer les fichiers temporaires
      try {
        this.module.FS.unlink(inputPath)
        this.module.FS.unlink(outputPath)
      } catch (e) {
        // Ignorer les erreurs de nettoyage
      }

      return phonemes as string
    } catch (error) {
      console.error('[PiperPhonemizer] Erreur lors de la phonemization:', error)
      throw new Error(`Échec de la phonemization: ${error}`)
    }
  }

  /**
   * Convertit des phonèmes IPA en IDs numériques
   */
  phonemesToIds(phonemes: string, phonemeIdMap: Record<string, number[]>): number[] {
    const ids: number[] = []

    for (const char of phonemes) {
      const mapping = phonemeIdMap[char]
      if (mapping && mapping.length > 0) {
        ids.push(mapping[0])
      } else {
        // Caractère inconnu, utiliser un padding ou ignorer
        console.warn(`[PiperPhonemizer] Phonème inconnu: "${char}" (code: ${char.charCodeAt(0)})`)
      }
    }

    return ids
  }

  /**
   * Convertit du texte directement en IDs de phonèmes
   */
  async textToPhonemeIds(
    text: string,
    phonemeIdMap: Record<string, number[]>,
    voice: string = 'fr'
  ): Promise<number[]> {
    const phonemes = await this.textToPhonemes(text, voice)
    return this.phonemesToIds(phonemes, phonemeIdMap)
  }

  /**
   * Libère les ressources
   */
  dispose(): void {
    this.module = null
    this.initialized = false
    this.initPromise = null
    console.log('[PiperPhonemizer] Ressources libérées')
  }
}

/**
 * Instance singleton du phonemizer
 */
export const piperPhonemizer = new PiperPhonemizer()
