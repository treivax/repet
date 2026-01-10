/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import path from 'path'

/**
 * Fixtures personnalisées pour les tests Répét
 */
type RepetFixtures = {
  /**
   * Page avec mocks Web Speech API initialisés
   */
  pageWithTTS: Page

  /**
   * Helper pour importer un fichier de pièce
   */
  importPlay: (fileName: string) => Promise<void>

  /**
   * Helper pour attendre que l'app soit prête
   */
  waitForAppReady: () => Promise<void>
}

/**
 * Mock Web Speech API pour tests TTS
 */
async function mockSpeechAPI(page: Page) {
  await page.addInitScript(() => {
    // Mock utterances pour tracking
    const utterances: SpeechSynthesisUtterance[] = []

    // Mock SpeechSynthesisUtterance
    class MockUtterance {
      text = ''
      lang = 'fr-FR'
      voice: SpeechSynthesisVoice | null = null
      volume = 1
      rate = 1
      pitch = 1
      onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null = null
      onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null = null
      onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => void) | null =
        null

      constructor(text?: string) {
        if (text) this.text = text
      }
    }

    // Mock voices
    const mockVoices: SpeechSynthesisVoice[] = [
      {
        name: 'Google français',
        lang: 'fr-FR',
        localService: false,
        default: true,
        voiceURI: 'Google français',
      } as SpeechSynthesisVoice,
      {
        name: 'Thomas (fr-FR)',
        lang: 'fr-FR',
        localService: true,
        default: false,
        voiceURI: 'Thomas',
      } as SpeechSynthesisVoice,
      {
        name: 'Julie (fr-FR)',
        lang: 'fr-FR',
        localService: true,
        default: false,
        voiceURI: 'Julie',
      } as SpeechSynthesisVoice,
    ]

    // Mock speechSynthesis
    const mockSpeechSynthesis = {
      pending: false,
      speaking: false,
      paused: false,

      speak(utterance: SpeechSynthesisUtterance) {
        utterances.push(utterance)
        this.speaking = true

        // Simuler la lecture avec un délai court
        setTimeout(() => {
          if (utterance.onstart) {
            utterance.onstart.call(utterance, {} as SpeechSynthesisEvent)
          }
        }, 10)

        setTimeout(() => {
          this.speaking = false
          if (utterance.onend) {
            utterance.onend.call(utterance, {} as SpeechSynthesisEvent)
          }
        }, 100)
      },

      cancel() {
        utterances.length = 0
        this.speaking = false
        this.paused = false
      },

      pause() {
        this.paused = true
      },

      resume() {
        this.paused = false
      },

      getVoices() {
        return mockVoices
      },
    }

    // Remplacer l'API native
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: false,
      configurable: true,
    })

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: MockUtterance,
      writable: false,
      configurable: true,
    })

    // Exposer pour les tests
    ;(window as any).__utterances = utterances
    ;(window as any).__mockSpeechSynthesis = mockSpeechSynthesis
  })
}

/**
 * Test avec fixtures Répét
 */
export const test = base.extend<RepetFixtures>({
  pageWithTTS: async ({ page }, use) => {
    await mockSpeechAPI(page)
    await use(page)
  },

  importPlay: async ({ page }, use) => {
    const importPlayHelper = async (fileName: string) => {
      const filePath = path.join(process.cwd(), 'examples', fileName)

      // Aller sur la page d'accueil
      await page.goto('/')

      // Attendre que la page soit chargée
      await page.waitForLoadState('networkidle')

      // Cliquer sur le bouton d'import
      const importButton = page.locator(
        '[data-testid="import-button"], button:has-text("Importer")'
      )
      await importButton.click()

      // Uploader le fichier
      const fileChooserPromise = page.waitForEvent('filechooser')
      await fileChooserPromise.then((fileChooser) => fileChooser.setFiles(filePath))

      // Attendre que l'import soit terminé
      await page.waitForURL(/\/reader/, { timeout: 5000 }).catch(() => {
        // Peut-être que l'URL ne change pas, chercher un indicateur de succès
      })
    }

    await use(importPlayHelper)
  },

  waitForAppReady: async ({ page }, use) => {
    const waitHelper = async () => {
      // Attendre que React soit monté
      await page.waitForLoadState('domcontentloaded')

      // Attendre que l'app soit hydratée
      await page.waitForFunction(() => {
        const root = document.getElementById('root')
        return root && root.children.length > 0
      })

      // Attendre que les stores soient initialisés
      await page.waitForTimeout(100)
    }

    await use(waitHelper)
  },
})

/**
 * Export expect pour cohérence
 */
export { expect }

/**
 * Helpers utilitaires pour les tests
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Attendre qu'un élément soit visible et cliquable
   */
  async clickWhenReady(selector: string) {
    const element = this.page.locator(selector)
    await element.waitFor({ state: 'visible' })
    await element.click()
  }

  /**
   * Vérifier que la navigation a fonctionné
   */
  async expectToBeOnReader() {
    await expect(this.page).toHaveURL(/\/reader/)
  }

  /**
   * Obtenir les utterances TTS émises
   */
  async getTTSUtterances(): Promise<any[]> {
    return await this.page.evaluate(() => (window as any).__utterances || [])
  }

  /**
   * Vérifier qu'un utterance TTS a été émis avec le texte
   */
  async expectTTSToHaveSpoken(textFragment: string) {
    const utterances = await this.getTTSUtterances()
    const found = utterances.some((u) => u.text?.includes(textFragment))
    expect(found).toBeTruthy()
  }

  /**
   * Réinitialiser le stockage (IndexedDB + localStorage)
   */
  async clearStorage() {
    // Utiliser le context pour effacer les données
    await this.page.context().clearCookies()

    // Naviguer vers la page pour avoir accès au storage
    await this.page.goto('http://localhost:5173')
    await this.page.waitForLoadState('domcontentloaded')

    // Effacer le storage via evaluate
    await this.page.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()

        // Supprimer IndexedDB
        if (window.indexedDB) {
          const dbs = ['repet-db']
          dbs.forEach((dbName) => {
            try {
              indexedDB.deleteDatabase(dbName)
            } catch (e) {
              console.log('Could not delete', dbName)
            }
          })
        }
      } catch (e) {
        // Ignorer les erreurs de storage
      }
    })

    // Recharger pour avoir un état propre
    await this.page.reload()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Attendre que le Service Worker soit prêt
   */
  async waitForServiceWorker() {
    await this.page.waitForFunction(
      () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
      { timeout: 10000 }
    )
  }

  /**
   * Simuler mode offline
   */
  async goOffline() {
    await this.page.context().setOffline(true)
  }

  /**
   * Revenir en ligne
   */
  async goOnline() {
    await this.page.context().setOffline(false)
  }
}
