/**
 * Wrapper pour le phonemizer Piper (espeak-ng WASM)
 *
 * Ce module charge et utilise piper_phonemize.wasm pour convertir du texte en phonèmes.
 *
 * IMPORTANT: piper_phonemize est un programme CLI compilé avec Emscripten qui:
 * - Lit le texte depuis STDIN (pas de --input)
 * - Écrit le JSON sur STDOUT (pas de --output)
 * - callMain() ne peut être appelé qu'une seule fois par instance
 * Solution: créer une nouvelle instance pour chaque phonemization.
 */

import type { PiperPhonemizeModule } from '../../../types/emscripten'

interface PhonemizeResult {
  phonemes: number[]
  phoneme_ids?: number[]
  text?: string
}

export class PiperPhonemizer {
  private scriptLoaded = false
  private scriptLoadPromise: Promise<void> | null = null

  /**
   * Charge le script piper_phonemize.js (une seule fois)
   */
  private async loadScript(): Promise<void> {
    if (this.scriptLoaded) {
      return
    }

    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise
    }

    this.scriptLoadPromise = this._doLoadScript()
    await this.scriptLoadPromise
    this.scriptLoaded = true
  }

  private async _doLoadScript(): Promise<void> {
    // Vérifier si déjà chargé
    if (window.createPiperPhonemize) {
      return
    }

    const script = document.createElement('script')
    script.src = '/wasm/piper_phonemize.js'

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Échec du chargement de piper_phonemize.js'))
      document.head.appendChild(script)
    })
  }

  /**
   * Crée une nouvelle instance du module WASM configurée pour stdin/stdout
   */
  private async createModule(
    text: string,
    stdoutCharCallback: (charCode: number) => void,
    stderrCharCallback: (charCode: number) => void
  ): Promise<PiperPhonemizeModule> {
    await this.loadScript()

    const createModuleFn = window.createPiperPhonemize
    if (!createModuleFn) {
      throw new Error('createPiperPhonemize non trouvé après chargement du script')
    }

    // Préparer stdin avec le texte à phonemizer
    const stdinContent = text + '\n'
    let stdinPos = 0

    // Créer le module avec stdin/stdout configurés
    const module = await createModuleFn({
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) {
          return '/wasm/piper_phonemize.wasm'
        }
        if (path.endsWith('.data')) {
          return '/wasm/piper_phonemize.data'
        }
        return path
      },
      stdin: () => {
        // Fournir le texte caractère par caractère
        if (stdinPos < stdinContent.length) {
          return stdinContent.charCodeAt(stdinPos++)
        }
        return null // EOF
      },
      stdout: stdoutCharCallback,
      stderr: stderrCharCallback,
      noInitialRun: true, // Ne pas appeler main() automatiquement
    })

    // Attendre que le système de fichiers soit prêt
    await this.waitForFilesystem(module)

    return module
  }

  /**
   * Attend que le fichier .data soit chargé et que le FS soit prêt
   */
  private async waitForFilesystem(module: PiperPhonemizeModule): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 200 // 10 secondes max

      const check = () => {
        attempts++

        try {
          if (!module.FS) {
            if (attempts >= maxAttempts) {
              reject(new Error('Timeout: FS non disponible'))
              return
            }
            setTimeout(check, 50)
            return
          }

          // Vérifier que espeak-ng-data est monté
          const espeakPath = module.FS.analyzePath('/espeak-ng-data')
          if (!espeakPath.exists) {
            if (attempts >= maxAttempts) {
              reject(new Error('Timeout: /espeak-ng-data non monté'))
              return
            }
            setTimeout(check, 50)
            return
          }

          // Vérifier que le contenu est là
          const langPath = module.FS.analyzePath('/espeak-ng-data/lang')
          if (!langPath.exists) {
            if (attempts >= maxAttempts) {
              reject(new Error('espeak-ng-data incomplet: lang/ manquant'))
              return
            }
            setTimeout(check, 50)
            return
          }

          resolve()
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error)
            return
          }
          setTimeout(check, 50)
        }
      }

      check()
    })
  }

  /**
   * Convertit du texte en phonèmes IPA
   *
   * Note: Crée une nouvelle instance du module pour chaque appel
   * car callMain() ne peut être appelé qu'une fois.
   *
   * piper_phonemize lit depuis stdin et écrit du JSON sur stdout.
   */
  async textToPhonemes(text: string, voice: string = 'fr'): Promise<string> {
    // Buffers pour capturer stdout/stderr au niveau caractère
    const stdoutCharBuffer: number[] = []
    const stderrCharBuffer: number[] = []

    // Créer un module avec stdin configuré et callbacks stdout/stderr
    const module = await this.createModule(
      text,
      (charCode) => {
        if (charCode !== null && charCode !== 0) {
          stdoutCharBuffer.push(charCode)
        }
      },
      (charCode) => {
        if (charCode !== null && charCode !== 0) {
          stderrCharBuffer.push(charCode)
        }
      }
    )

    try {
      // Préparer les arguments pour piper_phonemize
      // Le programme lit depuis stdin et écrit sur stdout
      // On ne passe PAS --input ou --output
      const args = [
        'piper_phonemize', // argv[0]
        '--language',
        voice,
        '--espeak_data',
        '/espeak-ng-data',
      ]

      // Appeler le programme
      // Note: callMain peut lancer une exception C++ (pointeur mémoire comme 404048)
      // mais stdout sera quand même capturé avant l'exception
      try {
        module.callMain(args)
      } catch (error) {
        // Exception attendue avec piper_phonemize - le programme peut fonctionner
        // correctement mais lancer une exception au lieu d'un code de sortie propre
        console.warn(`[PiperPhonemizer] callMain exception (peut-être normal): ${error}`)
      }

      // Vérifier si on a capturé du stdout
      if (stdoutCharBuffer.length === 0) {
        const stderrOutput = String.fromCharCode(...stderrCharBuffer)
        throw new Error(
          `piper_phonemize n'a rien retourné sur stdout. Stderr: ${stderrOutput || '(vide)'}`
        )
      }

      // Convertir le buffer de caractères en string
      const outputJson = String.fromCharCode(...stdoutCharBuffer)

      try {
        const result = JSON.parse(outputJson) as PhonemizeResult

        if (!result.phonemes || result.phonemes.length === 0) {
          throw new Error('Le résultat JSON ne contient pas de phonèmes')
        }

        // Les phonèmes sont retournés comme un array d'entiers (codes IPA)
        // Convertir en string
        const phonemesString = result.phonemes.map((code) => String.fromCharCode(code)).join('')

        return phonemesString
      } catch (parseError) {
        throw new Error(
          `Erreur de parsing du JSON de piper_phonemize: ${parseError}. JSON brut: ${outputJson.substring(0, 200)}`
        )
      }
    } catch (error) {
      console.error('[PiperPhonemizer] Erreur lors de la phonemization:', error)
      throw error
    }
  }

  /**
   * Convertit des phonèmes IPA en IDs numériques
   */
  phonemesToIds(phonemes: string, phonemeIdMap: Record<string, number[]>): number[] {
    const ids: number[] = []
    let i = 0

    while (i < phonemes.length) {
      let matched = false

      // Essayer de matcher les phonèmes les plus longs en premier
      for (let len = Math.min(4, phonemes.length - i); len > 0; len--) {
        const substr = phonemes.substring(i, i + len)
        if (phonemeIdMap[substr]) {
          ids.push(...phonemeIdMap[substr])
          i += len
          matched = true
          break
        }
      }

      if (!matched) {
        // Phonème inconnu, ignorer
        console.warn(`[PiperPhonemizer] Phonème inconnu: "${phonemes[i]}"`)
        i++
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
}

// Export d'une instance singleton
export const piperPhonemizer = new PiperPhonemizer()
