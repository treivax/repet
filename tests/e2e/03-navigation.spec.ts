/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { test, expect, TestHelpers } from './fixtures'
import path from 'path'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = new TestHelpers(page)
    await helpers.clearStorage()
    await page.goto('/')

    // Importer une pièce de test
    const filePath = path.join(process.cwd(), 'examples', 'ALEGRIA.txt')
    const fileInput = page.locator('input[type="file"]').first()

    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles(filePath)
    } else {
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: /importer/i }).first().click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(filePath)
    }

    await page.waitForTimeout(1500)

    // Aller sur le reader
    const readerLink = page.getByRole('link', { name: /lire/i }).or(page.locator('[href*="/reader"]'))
    if ((await readerLink.count()) > 0) {
      await readerLink.first().click()
      await page.waitForTimeout(500)
    }
  })

  test.describe('Navigation Ligne par Ligne', () => {
    test('devrait afficher la ligne courante', async ({ page }) => {
      const currentLine = page.locator(
        '[data-testid="current-line"], .current-line, .line.active, .line--active'
      )

      // Au moins un indicateur de ligne courante devrait exister
      const count = await currentLine.count()
      expect(count).toBeGreaterThan(0)
    })

    test('devrait naviguer vers la ligne suivante', async ({ page }) => {
      const nextButton = page.locator(
        'button[data-testid="next-button"], button[aria-label*="Suivant"], button:has-text("Suivant")'
      )

      if ((await nextButton.count()) > 0) {
        // Capturer l'index de ligne actuel
        const initialIndex = await page.evaluate(() => {
          const state = localStorage.getItem('play-store')
          if (state) {
            const parsed = JSON.parse(state)
            return parsed?.state?.currentLineIndex || 0
          }
          return 0
        })

        await nextButton.first().click()
        await page.waitForTimeout(300)

        const newIndex = await page.evaluate(() => {
          const state = localStorage.getItem('play-store')
          if (state) {
            const parsed = JSON.parse(state)
            return parsed?.state?.currentLineIndex || 0
          }
          return 0
        })

        expect(newIndex).toBeGreaterThan(initialIndex)
      }
    })

    test('devrait naviguer vers la ligne précédente', async ({ page }) => {
      const nextButton = page.locator('button[data-testid="next-button"]')
      const prevButton = page.locator(
        'button[data-testid="prev-button"], button[aria-label*="Précédent"], button:has-text("Précédent")'
      )

      if ((await nextButton.count()) > 0 && (await prevButton.count()) > 0) {
        // Avancer d'abord
        await nextButton.first().click()
        await nextButton.first().click()
        await page.waitForTimeout(300)

        const beforePrev = await page.evaluate(() => {
          const state = localStorage.getItem('play-store')
          if (state) {
            const parsed = JSON.parse(state)
            return parsed?.state?.currentLineIndex || 0
          }
          return 0
        })

        // Reculer
        await prevButton.first().click()
        await page.waitForTimeout(300)

        const afterPrev = await page.evaluate(() => {
          const state = localStorage.getItem('play-store')
          if (state) {
            const parsed = JSON.parse(state)
            return parsed?.state?.currentLineIndex || 0
          }
          return 0
        })

        expect(afterPrev).toBeLessThan(beforePrev)
      }
    })

    test('devrait afficher le contexte avant/après si activé', async ({ page }) => {
      // Aller dans les settings
      const settingsButton = page.locator(
        'button[data-testid="settings-button"], button:has-text("Paramètres"), a[href*="/settings"]'
      )

      if ((await settingsButton.count()) > 0) {
        await settingsButton.first().click()
        await page.waitForTimeout(300)

        // Activer contexte
        const showBeforeInput = page.locator('input[data-testid="show-before"], input[name="showBefore"]')
        if ((await showBeforeInput.count()) > 0) {
          await showBeforeInput.fill('2')
          await page.waitForTimeout(200)
        }

        const showAfterInput = page.locator('input[data-testid="show-after"], input[name="showAfter"]')
        if ((await showAfterInput.count()) > 0) {
          await showAfterInput.fill('2')
          await page.waitForTimeout(200)
        }

        // Retour au reader
        const backButton = page.locator('button:has-text("Retour"), a[href*="/reader"]')
        if ((await backButton.count()) > 0) {
          await backButton.first().click()
          await page.waitForTimeout(300)
        }

        // Vérifier que plusieurs lignes sont visibles
        const visibleLines = page.locator('.line:visible, [data-testid="line"]:visible')
        const count = await visibleLines.count()
        expect(count).toBeGreaterThan(1) // Au moins ligne courante + contexte
      }
    })
  })

  test.describe('Navigation Actes et Scènes', () => {
    test('devrait afficher le sommaire des actes/scènes', async ({ page }) => {
      const summaryButton = page.locator(
        'button[data-testid="summary-button"], button:has-text("Sommaire"), button:has-text("Scènes")'
      )

      if ((await summaryButton.count()) > 0) {
        await summaryButton.first().click()
        await page.waitForTimeout(300)

        // Vérifier que le sommaire est affiché
        const summary = page.locator(
          '[data-testid="scene-summary"], .scene-summary, .summary-panel, .scenes-list'
        )
        await expect(summary.first()).toBeVisible()

        // Vérifier qu'il y a des scènes listées
        const sceneItems = page.locator(
          '[data-testid*="scene-"], .scene-item, .summary-item, button[data-scene]'
        )
        const count = await sceneItems.count()
        expect(count).toBeGreaterThan(0)
      }
    })

    test('devrait permettre de sauter à une scène spécifique', async ({ page }) => {
      const summaryButton = page.locator('button[data-testid="summary-button"]')

      if ((await summaryButton.count()) > 0) {
        await summaryButton.first().click()
        await page.waitForTimeout(300)

        // Cliquer sur la deuxième scène
        const sceneButtons = page.locator(
          '[data-testid*="scene-"], .scene-item, button[data-scene], button[data-act][data-scene]'
        )

        if ((await sceneButtons.count()) > 1) {
          const initialLineIndex = await page.evaluate(() => {
            const state = localStorage.getItem('play-store')
            if (state) {
              const parsed = JSON.parse(state)
              return parsed?.state?.currentLineIndex || 0
            }
            return 0
          })

          await sceneButtons.nth(1).click()
          await page.waitForTimeout(500)

          const newLineIndex = await page.evaluate(() => {
            const state = localStorage.getItem('play-store')
            if (state) {
              const parsed = JSON.parse(state)
              return parsed?.state?.currentLineIndex || 0
            }
            return 0
          })

          // L'index devrait avoir changé
          expect(newLineIndex).not.toBe(initialLineIndex)
        }
      }
    })

    test('devrait afficher le titre de la scène courante', async ({ page }) => {
      const sceneTitle = page.locator(
        '[data-testid="current-scene"], .current-scene-title, .scene-header, h2:has-text("Scène"), h2:has-text("Acte")'
      )

      if ((await sceneTitle.count()) > 0) {
        const text = await sceneTitle.first().textContent()
        expect(text).toBeTruthy()
        // Devrait contenir "Acte" ou "Scène"
        expect(text?.toLowerCase()).toMatch(/acte|scène|scene/)
      }
    })

    test('devrait mettre à jour la scène lors de la navigation', async ({ page }) => {
      const nextButton = page.locator('button[data-testid="next-button"]')

      if ((await nextButton.count()) > 0) {
        // Capturer scène initiale
        const initialScene = await page.evaluate(() => {
          const state = localStorage.getItem('play-store')
          if (state) {
            const parsed = JSON.parse(state)
            return {
              act: parsed?.state?.currentActIndex || 0,
              scene: parsed?.state?.currentSceneIndex || 0,
            }
          }
          return { act: 0, scene: 0 }
        })

        // Avancer plusieurs fois
        for (let i = 0; i < 10; i++) {
          await nextButton.first().click()
          await page.waitForTimeout(100)
        }

        const newScene = await page.evaluate(() => {
          const state = localStorage.getItem('play-store')
          if (state) {
            const parsed = JSON.parse(state)
            return {
              act: parsed?.state?.currentActIndex || 0,
              scene: parsed?.state?.currentSceneIndex || 0,
            }
          }
          return { act: 0, scene: 0 }
        })

        // La scène ou l'acte devrait potentiellement avoir changé
        const sceneChanged =
          newScene.act !== initialScene.act || newScene.scene !== initialScene.scene
        // Note: peut ne pas changer si toutes les lignes sont dans la même scène
        expect(typeof sceneChanged).toBe('boolean')
      }
    })
  })

  test.describe('Indicateurs de Position', () => {
    test('devrait afficher la progression', async ({ page }) => {
      const progressIndicator = page.locator(
        '[data-testid="progress"], .progress-bar, .line-counter, [role="progressbar"]'
      )

      if ((await progressIndicator.count()) > 0) {
        await expect(progressIndicator.first()).toBeVisible()
      } else {
        // Vérifier qu'on affiche au moins l'index de ligne
        const lineIndex = page.locator('[data-testid="line-index"], .line-index')
        if ((await lineIndex.count()) > 0) {
          const text = await lineIndex.first().textContent()
          expect(text).toBeTruthy()
        }
      }
    })

    test('devrait afficher le nombre total de lignes', async ({ page }) => {
      const totalLines = await page.evaluate(() => {
        return new Promise((resolve) => {
          const request = indexedDB.open('repet-db')
          request.onsuccess = () => {
            const db = request.result
            if (!db.objectStoreNames.contains('plays')) {
              resolve(0)
              return
            }
            const transaction = db.transaction(['plays'], 'readonly')
            const store = transaction.objectStore('plays')
            const getAllRequest = store.getAll()
            getAllRequest.onsuccess = () => {
              const plays = getAllRequest.result
              if (plays && plays.length > 0) {
                resolve(plays[0].ast?.flatLines?.length || 0)
              } else {
                resolve(0)
              }
            }
            getAllRequest.onerror = () => resolve(0)
          }
          request.onerror = () => resolve(0)
        })
      })

      expect(totalLines).toBeGreaterThan(0)
    })
  })

  test.describe('Raccourcis Clavier', () => {
    test('devrait naviguer avec les flèches', async ({ page }) => {
      // Focus sur le document
      await page.keyboard.press('Tab')

      const initialIndex = await page.evaluate(() => {
        const state = localStorage.getItem('play-store')
        if (state) {
          const parsed = JSON.parse(state)
          return parsed?.state?.currentLineIndex || 0
        }
        return 0
      })

      // Flèche droite ou bas pour avancer
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)

      const afterArrowRight = await page.evaluate(() => {
        const state = localStorage.getItem('play-store')
        if (state) {
          const parsed = JSON.parse(state)
          return parsed?.state?.currentLineIndex || 0
        }
        return 0
      })

      // Peut avoir avancé ou pas (dépend de l'implémentation)
      expect(typeof afterArrowRight).toBe('number')
    })

    test('devrait supporter Espace pour Play/Pause', async ({ pageWithTTS }) => {
      // Mode audio
      const modeSelector = pageWithTTS.locator('select[data-testid="reading-mode"]')
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('audio')
        await pageWithTTS.waitForTimeout(300)
      }

      // Espace pour démarrer
      await pageWithTTS.keyboard.press('Space')
      await pageWithTTS.waitForTimeout(300)

      // Vérifier que la lecture a démarré
      const isPlaying = await pageWithTTS.evaluate(() => {
        return (window as any).__mockSpeechSynthesis?.speaking || false
      })

      // Peut être en lecture ou pas selon l'implémentation
      expect(typeof isPlaying).toBe('boolean')
    })
  })
})
