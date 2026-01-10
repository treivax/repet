/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { test, expect, TestHelpers } from './fixtures'
import path from 'path'

test.describe('Modes de Lecture', () => {
  let playId: string

  test.beforeEach(async ({ pageWithTTS }) => {
    const helpers = new TestHelpers(pageWithTTS)
    await helpers.clearStorage()
    await pageWithTTS.goto('/')

    // Importer une pièce de test
    const filePath = path.join(process.cwd(), 'examples', 'ALEGRIA.txt')
    const fileInput = pageWithTTS.getByTestId('file-input')
    await fileInput.setInputFiles(filePath)
    await pageWithTTS.waitForTimeout(1500)

    // Extraire l'ID de la pièce depuis l'URL ou le DOM
    const playCard = pageWithTTS.locator('[data-testid^="play-card-"]').first()
    const testId = await playCard.getAttribute('data-testid')
    if (testId) {
      playId = testId.replace('play-card-', '')
    }
  })

  test.describe('Mode Silencieux', () => {
    test('devrait permettre de configurer le mode silencieux', async ({ pageWithTTS }) => {
      // Cliquer sur le bouton de config
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      // Sélectionner le mode silencieux
      const silentModeButton = pageWithTTS.getByTestId('reading-mode-silent')
      await silentModeButton.click()
      await pageWithTTS.waitForTimeout(300)

      // Vérifier que le mode est sélectionné
      await expect(silentModeButton).toHaveClass(/border-blue-500/)
    })

    test('devrait permettre la navigation sans TTS', async ({ pageWithTTS }) => {
      // Config: mode silencieux
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      const silentModeButton = pageWithTTS.getByTestId('reading-mode-silent')
      await silentModeButton.click()
      await pageWithTTS.waitForTimeout(300)

      // Sélectionner un personnage pour accéder au lecteur
      const userCharacterSelect = pageWithTTS.getByTestId('user-character-select')
      if (await userCharacterSelect.isVisible()) {
        const options = await userCharacterSelect.locator('option').all()
        if (options.length > 1) {
          await userCharacterSelect.selectOption({ index: 1 })
        }
      }

      // Aller au lecteur
      await pageWithTTS.goto(`/reader/${playId}`)
      await pageWithTTS.waitForTimeout(1000)

      // Vérifier que le lecteur est affiché
      const readerScreen = pageWithTTS.getByTestId('reader-screen')
      await expect(readerScreen).toBeVisible()

      // Utiliser les boutons de navigation
      const nextButton = pageWithTTS.getByTestId('next-button')
      await nextButton.click()
      await pageWithTTS.waitForTimeout(200)

      const helpers = new TestHelpers(pageWithTTS)
      const utterances = await helpers.getTTSUtterances()
      // En mode silencieux, pas de TTS
      expect(utterances.length).toBe(0)
    })
  })

  test.describe('Mode Audio', () => {
    test('devrait permettre de configurer le mode audio', async ({ pageWithTTS }) => {
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      // Sélectionner le mode audio
      const audioModeButton = pageWithTTS.getByTestId('reading-mode-audio')
      await audioModeButton.click()
      await pageWithTTS.waitForTimeout(300)

      // Vérifier que le mode est sélectionné
      await expect(audioModeButton).toHaveClass(/border-blue-500/)
    })

    test('devrait démarrer la lecture TTS en mode audio', async ({ pageWithTTS }) => {
      const helpers = new TestHelpers(pageWithTTS)

      // Config: mode audio
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      const audioModeButton = pageWithTTS.getByTestId('reading-mode-audio')
      await audioModeButton.click()

      // Sélectionner un personnage
      const userCharacterSelect = pageWithTTS.getByTestId('user-character-select')
      if (await userCharacterSelect.isVisible()) {
        const options = await userCharacterSelect.locator('option').all()
        if (options.length > 1) {
          await userCharacterSelect.selectOption({ index: 1 })
        }
      }

      // Aller au lecteur
      await pageWithTTS.goto(`/reader/${playId}`)
      await pageWithTTS.waitForTimeout(1000)

      // Démarrer la lecture
      const playButton = pageWithTTS.getByTestId('play-button')
      await playButton.click()
      await pageWithTTS.waitForTimeout(500)

      // Vérifier que TTS a été appelé
      const utterances = await helpers.getTTSUtterances()
      expect(utterances.length).toBeGreaterThan(0)

      // Vérifier que le bouton pause est maintenant visible
      const pauseButton = pageWithTTS.getByTestId('pause-button')
      await expect(pauseButton).toBeVisible()
    })

    test('devrait permettre de mettre en pause et reprendre', async ({ pageWithTTS }) => {
      // Config: mode audio
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      const audioModeButton = pageWithTTS.getByTestId('reading-mode-audio')
      await audioModeButton.click()

      const userCharacterSelect = pageWithTTS.getByTestId('user-character-select')
      if (await userCharacterSelect.isVisible()) {
        const options = await userCharacterSelect.locator('option').all()
        if (options.length > 1) {
          await userCharacterSelect.selectOption({ index: 1 })
        }
      }

      await pageWithTTS.goto(`/reader/${playId}`)
      await pageWithTTS.waitForTimeout(1000)

      // Démarrer
      const playButton = pageWithTTS.getByTestId('play-button')
      await playButton.click()
      await pageWithTTS.waitForTimeout(300)

      // Pause
      const pauseButton = pageWithTTS.getByTestId('pause-button')
      await pauseButton.click()
      await pageWithTTS.waitForTimeout(200)

      // Le bouton play devrait réapparaître
      await expect(playButton).toBeVisible()
    })
  })

  test.describe('Mode Italiennes', () => {
    test('devrait permettre de configurer le mode italiennes', async ({ pageWithTTS }) => {
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      // Sélectionner le mode italiennes
      const italianModeButton = pageWithTTS.getByTestId('reading-mode-italian')
      await italianModeButton.click()
      await pageWithTTS.waitForTimeout(300)

      // Vérifier que le mode est sélectionné
      await expect(italianModeButton).toHaveClass(/border-blue-500/)
    })

    test('devrait permettre de sélectionner le personnage utilisateur', async ({ pageWithTTS }) => {
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      const italianModeButton = pageWithTTS.getByTestId('reading-mode-italian')
      await italianModeButton.click()
      await pageWithTTS.waitForTimeout(300)

      // Sélectionner un personnage
      const userCharacterSelect = pageWithTTS.getByTestId('user-character-select')
      await expect(userCharacterSelect).toBeVisible()

      const options = await userCharacterSelect.locator('option').all()
      expect(options.length).toBeGreaterThan(1) // Au moins l'option par défaut + 1 personnage

      // Sélectionner le premier personnage
      await userCharacterSelect.selectOption({ index: 1 })

      // Vérifier que des options supplémentaires apparaissent
      const hideUserLinesToggle = pageWithTTS.getByTestId('hide-user-lines-toggle')
      await expect(hideUserLinesToggle).toBeVisible()
    })

    test('devrait activer les options de masquage', async ({ pageWithTTS }) => {
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      const italianModeButton = pageWithTTS.getByTestId('reading-mode-italian')
      await italianModeButton.click()
      await pageWithTTS.waitForTimeout(300)

      // Sélectionner un personnage
      const userCharacterSelect = pageWithTTS.getByTestId('user-character-select')
      await userCharacterSelect.selectOption({ index: 1 })
      await pageWithTTS.waitForTimeout(300)

      // Activer le masquage
      const hideUserLinesToggle = pageWithTTS.getByTestId('hide-user-lines-toggle')
      await hideUserLinesToggle.click()
      await pageWithTTS.waitForTimeout(300)

      // Les options d'affichage devraient apparaître
      const showBeforeToggle = pageWithTTS.getByTestId('show-before-toggle')
      await expect(showBeforeToggle).toBeVisible()

      const showAfterToggle = pageWithTTS.getByTestId('show-after-toggle')
      await expect(showAfterToggle).toBeVisible()

      // Activer/désactiver ces options
      await showBeforeToggle.click()
      await pageWithTTS.waitForTimeout(200)

      await showAfterToggle.click()
      await pageWithTTS.waitForTimeout(200)
    })

    test('devrait afficher le badge MODE ITALIENNES dans le lecteur', async ({ pageWithTTS }) => {
      // Config: mode italiennes
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      const italianModeButton = pageWithTTS.getByTestId('reading-mode-italian')
      await italianModeButton.click()

      const userCharacterSelect = pageWithTTS.getByTestId('user-character-select')
      await userCharacterSelect.selectOption({ index: 1 })

      // Aller au lecteur
      await pageWithTTS.goto(`/reader/${playId}`)
      await pageWithTTS.waitForTimeout(1000)

      // Vérifier le badge
      const readingModeBadge = pageWithTTS.getByTestId('reading-mode')
      await expect(readingModeBadge).toBeVisible()
      await expect(readingModeBadge).toHaveText(/MODE ITALIENNES/i)
    })

    test('devrait afficher le personnage utilisateur dans le header', async ({ pageWithTTS }) => {
      // Config
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      const italianModeButton = pageWithTTS.getByTestId('reading-mode-italian')
      await italianModeButton.click()

      const userCharacterSelect = pageWithTTS.getByTestId('user-character-select')
      const selectedOption = await userCharacterSelect.locator('option').nth(1).textContent()
      await userCharacterSelect.selectOption({ index: 1 })

      // Aller au lecteur
      await pageWithTTS.goto(`/reader/${playId}`)
      await pageWithTTS.waitForTimeout(1000)

      // Vérifier l'affichage du personnage
      const userCharacter = pageWithTTS.getByTestId('user-character')
      await expect(userCharacter).toBeVisible()
      if (selectedOption) {
        await expect(userCharacter).toContainText(selectedOption)
      }
    })
  })

  test.describe('Réglages Audio', () => {
    test('devrait permettre de configurer la voix off', async ({ pageWithTTS }) => {
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      // Toggle voix off
      const voiceOffToggle = pageWithTTS.getByTestId('voice-off-toggle')
      await expect(voiceOffToggle).toBeVisible()

      await voiceOffToggle.click()
      await pageWithTTS.waitForTimeout(200)

      // Toggle à nouveau
      await voiceOffToggle.click()
      await pageWithTTS.waitForTimeout(200)
    })

    test('devrait permettre de régler la vitesse par défaut', async ({ pageWithTTS }) => {
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      const defaultSpeedSlider = pageWithTTS.getByTestId('default-speed-slider')
      await expect(defaultSpeedSlider).toBeVisible()

      // Changer la vitesse
      await defaultSpeedSlider.fill('1.5')
      await pageWithTTS.waitForTimeout(200)

      const value = await defaultSpeedSlider.inputValue()
      expect(parseFloat(value)).toBeCloseTo(1.5, 1)
    })

    test('devrait permettre de régler la vitesse utilisateur en mode italiennes', async ({
      pageWithTTS,
    }) => {
      const configButton = pageWithTTS.getByTestId('config-button')
      await configButton.click()
      await pageWithTTS.waitForTimeout(500)

      // Passer en mode italiennes
      const italianModeButton = pageWithTTS.getByTestId('reading-mode-italian')
      await italianModeButton.click()
      await pageWithTTS.waitForTimeout(300)

      // Le slider de vitesse utilisateur devrait apparaître
      const userSpeedSlider = pageWithTTS.getByTestId('user-speed-slider')
      await expect(userSpeedSlider).toBeVisible()

      // Changer la vitesse
      await userSpeedSlider.fill('0.8')
      await pageWithTTS.waitForTimeout(200)

      const value = await userSpeedSlider.inputValue()
      expect(parseFloat(value)).toBeCloseTo(0.8, 1)
    })
  })
})
