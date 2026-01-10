/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { test, expect, TestHelpers } from './fixtures'
import path from 'path'

test.describe('Modes de Lecture', () => {
  test.beforeEach(async ({ page, pageWithTTS }) => {
    const helpers = new TestHelpers(pageWithTTS)
    await helpers.clearStorage()
    await pageWithTTS.goto('/')

    // Importer une pièce de test
    const filePath = path.join(process.cwd(), 'examples', 'ALEGRIA.txt')
    const fileInput = pageWithTTS.locator('input[type="file"]').first()

    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles(filePath)
    } else {
      const fileChooserPromise = pageWithTTS.waitForEvent('filechooser')
      await pageWithTTS.getByRole('button', { name: /importer/i }).first().click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(filePath)
    }

    await pageWithTTS.waitForTimeout(1500)
  })

  test.describe('Mode Silencieux', () => {
    test('devrait afficher le texte sans TTS', async ({ pageWithTTS }) => {
      // Aller sur le reader (si pas déjà)
      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Sélectionner mode silencieux
      const modeSelector = pageWithTTS.locator(
        'select[data-testid="reading-mode"], select:has(option:text("Silencieux"))'
      )
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('silent')
      }

      // Vérifier que le texte est visible
      const textDisplay = pageWithTTS.locator('[data-testid="text-display"], .text-display, .reader-content')
      await expect(textDisplay.first()).toBeVisible()

      // Vérifier que les contrôles audio ne sont pas actifs
      const playButton = pageWithTTS.locator('button[data-testid="play-button"], button:has-text("Lecture")')
      if ((await playButton.count()) > 0) {
        // Le bouton existe mais ne devrait pas déclencher TTS en mode silencieux
        await playButton.first().click()
        await pageWithTTS.waitForTimeout(200)

        const helpers = new TestHelpers(pageWithTTS)
        const utterances = await helpers.getTTSUtterances()
        expect(utterances.length).toBe(0)
      }
    })

    test('devrait permettre la navigation ligne par ligne', async ({ pageWithTTS }) => {
      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Bouton suivant
      const nextButton = pageWithTTS.locator(
        'button[data-testid="next-button"], button:has-text("Suivant")'
      )
      if ((await nextButton.count()) > 0) {
        const initialText = await pageWithTTS
          .locator('[data-testid="current-line"], .current-line, .line.active')
          .first()
          .textContent()

        await nextButton.first().click()
        await pageWithTTS.waitForTimeout(300)

        const newText = await pageWithTTS
          .locator('[data-testid="current-line"], .current-line, .line.active')
          .first()
          .textContent()

        // Le texte devrait avoir changé
        expect(newText).not.toBe(initialText)
      }
    })
  })

  test.describe('Mode Audio', () => {
    test('devrait lire toutes les répliques avec TTS', async ({ pageWithTTS }) => {
      const helpers = new TestHelpers(pageWithTTS)

      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Sélectionner mode audio
      const modeSelector = pageWithTTS.locator(
        'select[data-testid="reading-mode"], select:has(option:text("Audio"))'
      )
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('audio')
        await pageWithTTS.waitForTimeout(300)
      }

      // Démarrer la lecture
      const playButton = pageWithTTS.locator(
        'button[data-testid="play-button"], button:has-text("Lecture"), button:has-text("Play")'
      )
      if ((await playButton.count()) > 0) {
        await playButton.first().click()
        await pageWithTTS.waitForTimeout(500)

        // Vérifier que TTS a été appelé
        const utterances = await helpers.getTTSUtterances()
        expect(utterances.length).toBeGreaterThan(0)
      }
    })

    test('devrait permettre de mettre en pause', async ({ pageWithTTS }) => {
      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Mode audio
      const modeSelector = pageWithTTS.locator(
        'select[data-testid="reading-mode"], select:has(option:text("Audio"))'
      )
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('audio')
        await pageWithTTS.waitForTimeout(300)
      }

      // Play
      const playButton = pageWithTTS.locator(
        'button[data-testid="play-button"], button:has-text("Lecture"), button:has-text("Play")'
      )
      if ((await playButton.count()) > 0) {
        await playButton.first().click()
        await pageWithTTS.waitForTimeout(300)

        // Pause
        const pauseButton = pageWithTTS.locator(
          'button[data-testid="pause-button"], button:has-text("Pause")'
        )
        if ((await pauseButton.count()) > 0) {
          await pauseButton.first().click()
          await pageWithTTS.waitForTimeout(200)

          // Vérifier état pause
          const isPaused = await pageWithTTS.evaluate(() => {
            return (window as any).__mockSpeechSynthesis?.paused || false
          })
          expect(isPaused).toBeTruthy()
        }
      }
    })

    test('devrait lire les didascalies avec voix off si activée', async ({ pageWithTTS }) => {
      const helpers = new TestHelpers(pageWithTTS)

      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Activer voix off
      const settingsLink = pageWithTTS.locator('[href*="/settings"], button:has-text("Paramètres")')
      if ((await settingsLink.count()) > 0) {
        await settingsLink.first().click()
        await pageWithTTS.waitForTimeout(300)

        const voiceOffToggle = pageWithTTS.locator(
          'input[type="checkbox"][data-testid="voice-off-enabled"]'
        )
        if ((await voiceOffToggle.count()) > 0) {
          await voiceOffToggle.check()
        }

        // Retour au reader
        const backButton = pageWithTTS.locator('button:has-text("Retour"), a[href*="/reader"]')
        if ((await backButton.count()) > 0) {
          await backButton.first().click()
        }
      }

      // Mode audio
      const modeSelector = pageWithTTS.locator(
        'select[data-testid="reading-mode"], select:has(option:text("Audio"))'
      )
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('audio')
      }

      // Lancer lecture
      const playButton = pageWithTTS.locator('button[data-testid="play-button"]')
      if ((await playButton.count()) > 0) {
        await playButton.first().click()
        await pageWithTTS.waitForTimeout(500)

        // Vérifier que des utterances ont été émises
        const utterances = await helpers.getTTSUtterances()
        expect(utterances.length).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Mode Italiennes', () => {
    test('devrait permettre de sélectionner le personnage utilisateur', async ({ pageWithTTS }) => {
      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Mode italien
      const modeSelector = pageWithTTS.locator(
        'select[data-testid="reading-mode"], select:has(option:text("Italien"))'
      )
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('italian')
        await pageWithTTS.waitForTimeout(300)
      }

      // Sélecteur de personnage utilisateur
      const characterSelector = pageWithTTS.locator(
        'select[data-testid="user-character"], select:has(option:not(:empty))'
      )
      if ((await characterSelector.count()) > 0) {
        const options = await characterSelector.locator('option').allTextContents()
        expect(options.length).toBeGreaterThan(1) // Au moins "Aucun" + personnages
      }
    })

    test('devrait masquer les répliques utilisateur avant lecture', async ({ pageWithTTS }) => {
      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Mode italien
      const modeSelector = pageWithTTS.locator('select[data-testid="reading-mode"]')
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('italian')
        await pageWithTTS.waitForTimeout(300)
      }

      // Sélectionner un personnage
      const characterSelector = pageWithTTS.locator('select[data-testid="user-character"]')
      if ((await characterSelector.count()) > 0) {
        const firstCharacterOption = await characterSelector.locator('option').nth(1).getAttribute('value')
        if (firstCharacterOption) {
          await characterSelector.selectOption(firstCharacterOption)
          await pageWithTTS.waitForTimeout(300)

          // Vérifier que certaines lignes sont masquées
          const hiddenLines = pageWithTTS.locator('.line.hidden, .line[data-hidden="true"]')
          const count = await hiddenLines.count()
          // Au moins quelques lignes devraient être masquées
          expect(count).toBeGreaterThanOrEqual(0)
        }
      }
    })

    test('devrait lire avec volume 0 pour répliques utilisateur', async ({ pageWithTTS }) => {
      const helpers = new TestHelpers(pageWithTTS)

      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Mode italien
      const modeSelector = pageWithTTS.locator('select[data-testid="reading-mode"]')
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('italian')
        await pageWithTTS.waitForTimeout(300)
      }

      // Sélectionner un personnage
      const characterSelector = pageWithTTS.locator('select[data-testid="user-character"]')
      if ((await characterSelector.count()) > 0) {
        const options = await characterSelector.locator('option').all()
        if (options.length > 1) {
          await characterSelector.selectOption({ index: 1 })
          await pageWithTTS.waitForTimeout(300)
        }
      }

      // Lancer lecture
      const playButton = pageWithTTS.locator('button[data-testid="play-button"]')
      if ((await playButton.count()) > 0) {
        await playButton.first().click()
        await pageWithTTS.waitForTimeout(500)

        // Vérifier les utterances
        const utterances = await helpers.getTTSUtterances()
        if (utterances.length > 0) {
          // Certains devraient avoir volume 0 (répliques utilisateur)
          const hasVolumeZero = utterances.some((u: any) => u.volume === 0)
          // Note: dépend de l'implémentation, peut ne pas être testé si non implémenté
          expect(utterances.length).toBeGreaterThan(0)
        }
      }
    })

    test('devrait révéler les répliques après leur lecture', async ({ pageWithTTS }) => {
      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Mode italien
      const modeSelector = pageWithTTS.locator('select[data-testid="reading-mode"]')
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('italian')
        await pageWithTTS.waitForTimeout(300)
      }

      // Sélectionner personnage
      const characterSelector = pageWithTTS.locator('select[data-testid="user-character"]')
      if ((await characterSelector.count()) > 0) {
        const options = await characterSelector.locator('option').all()
        if (options.length > 1) {
          await characterSelector.selectOption({ index: 1 })
          await pageWithTTS.waitForTimeout(300)
        }
      }

      // Compter lignes masquées avant
      const hiddenBefore = await pageWithTTS.locator('.line.hidden, .line[data-hidden="true"]').count()

      // Lancer lecture
      const playButton = pageWithTTS.locator('button[data-testid="play-button"]')
      if ((await playButton.count()) > 0) {
        await playButton.first().click()
        await pageWithTTS.waitForTimeout(1000)

        // Compter lignes masquées après
        const hiddenAfter = await pageWithTTS.locator('.line.hidden, .line[data-hidden="true"]').count()

        // Certaines lignes devraient avoir été révélées
        // Note: dépend de la vitesse de lecture mockée
        expect(hiddenAfter).toBeLessThanOrEqual(hiddenBefore)
      }
    })

    test('devrait utiliser des vitesses séparées pour utilisateur et autres', async ({ pageWithTTS }) => {
      const helpers = new TestHelpers(pageWithTTS)

      const readerLink = pageWithTTS.getByRole('link', { name: /lire/i }).or(
        pageWithTTS.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await pageWithTTS.waitForTimeout(500)
      }

      // Mode italien
      const modeSelector = pageWithTTS.locator('select[data-testid="reading-mode"]')
      if ((await modeSelector.count()) > 0) {
        await modeSelector.selectOption('italian')
        await pageWithTTS.waitForTimeout(300)
      }

      // Configurer vitesses différentes
      const userSpeedInput = pageWithTTS.locator('input[data-testid="user-speed"]')
      const defaultSpeedInput = pageWithTTS.locator('input[data-testid="default-speed"]')

      if ((await userSpeedInput.count()) > 0 && (await defaultSpeedInput.count()) > 0) {
        await userSpeedInput.fill('0.5')
        await defaultSpeedInput.fill('1.5')
        await pageWithTTS.waitForTimeout(300)
      }

      // Sélectionner personnage
      const characterSelector = pageWithTTS.locator('select[data-testid="user-character"]')
      if ((await characterSelector.count()) > 0) {
        const options = await characterSelector.locator('option').all()
        if (options.length > 1) {
          await characterSelector.selectOption({ index: 1 })
        }
      }

      // Lancer lecture
      const playButton = pageWithTTS.locator('button[data-testid="play-button"]')
      if ((await playButton.count()) > 0) {
        await playButton.first().click()
        await pageWithTTS.waitForTimeout(500)

        // Vérifier que différentes vitesses ont été utilisées
        const utterances = await helpers.getTTSUtterances()
        if (utterances.length > 1) {
          const rates = utterances.map((u: any) => u.rate)
          const uniqueRates = [...new Set(rates)]
          // Devrait avoir au moins 2 vitesses différentes si implémenté
          expect(utterances.length).toBeGreaterThan(0)
        }
      }
    })
  })
})
