/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { test, expect, TestHelpers } from './fixtures'
import path from 'path'

test.describe('Navigation de Sommaire', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = new TestHelpers(page)
    await helpers.clearStorage()
    await page.goto('/')

    // Importer une pièce de test
    const filePath = path.join(process.cwd(), 'examples', 'ALEGRIA.txt')
    const fileInput = page.getByTestId('file-input')
    await fileInput.setInputFiles(filePath)

    // Attendre la navigation vers /play/:id
    await page.waitForURL(/\/play\//, { timeout: 10000 })

    // Extraire l'ID de la pièce depuis l'URL
    const url = page.url()
    const match = url.match(/\/play\/([^/]+)/)
    let playId = ''
    if (match && match[1]) {
      playId = match[1]
    }

    // Sélectionner le mode lecture silencieuse
    await page.goto(`/play/${playId}/config`)
    await page.waitForTimeout(1000)

    const silentModeButton = page.getByTestId('reading-mode-silent')
    await expect(silentModeButton).toBeVisible()
    await silentModeButton.click()
    await page.waitForTimeout(500)

    // Naviguer vers le reader
    await page.goto(`/reader/${playId}`)
    await page.waitForTimeout(2000)

    // Vérifier qu'on est bien sur le ReaderScreen
    const readerScreen = page.getByTestId('reader-screen')
    await expect(readerScreen).toBeVisible({ timeout: 10000 })
  })

  test.describe('Scroll vers Scène via Sommaire', () => {
    test('devrait scroller vers la scène sélectionnée dans le sommaire', async ({ page }) => {
      // Vérifier le badge initial
      const sceneBadge = page.getByTestId('scene-badge')
      await expect(sceneBadge).toBeVisible()
      const initialBadgeText = await sceneBadge.textContent()

      // Ouvrir le sommaire
      await sceneBadge.click()
      await page.waitForTimeout(300)

      // Vérifier que le sommaire est visible
      const sceneSummary = page.getByTestId('scene-summary')
      await expect(sceneSummary).toBeVisible()

      // Compter les boutons de scène disponibles
      const sceneButtons = page.locator('[data-testid^="scene-button-"]')
      const sceneCount = await sceneButtons.count()

      if (sceneCount > 2) {
        // Sélectionner la 3ème scène (index 2)
        const targetSceneButton = sceneButtons.nth(2)
        const targetSceneText = await targetSceneButton.textContent()

        await targetSceneButton.click()
        await page.waitForTimeout(1500) // Attendre l'animation de scroll

        // Vérifier que le sommaire s'est fermé
        await expect(sceneSummary).not.toBeVisible()

        // Vérifier que le badge s'est mis à jour
        const newBadgeText = await sceneBadge.textContent()
        expect(newBadgeText).not.toBe(initialBadgeText)

        // Vérifier que l'élément de la scène cible est visible
        const playbackDisplay = page.getByTestId('playback-display')
        await expect(playbackDisplay).toBeVisible()

        // Vérifier que l'index de ligne a changé dans le store
        const newLineIndex = await page.evaluate(() => {
          const state = localStorage.getItem('repet-play-storage')
          if (state) {
            const parsed = JSON.parse(state)
            return parsed?.state?.currentLineIndex || 0
          }
          return 0
        })

        expect(newLineIndex).toBeGreaterThan(0)
      }
    })

    test('devrait mettre à jour le badge pendant le scroll manuel', async ({ page }) => {
      // Récupérer le badge initial
      const sceneBadge = page.getByTestId('scene-badge')
      await expect(sceneBadge).toBeVisible()
      const initialBadgeText = await sceneBadge.textContent()

      // Récupérer le conteneur de scroll
      const playbackDisplay = page.getByTestId('playback-display')
      await expect(playbackDisplay).toBeVisible()

      // Scroller manuellement vers le bas (beaucoup)
      await playbackDisplay.evaluate((element) => {
        element.scrollTop = element.scrollHeight / 2
      })

      // Attendre que l'IntersectionObserver détecte le changement
      await page.waitForTimeout(1000)

      // Vérifier que le badge a changé (peut-être)
      const newBadgeText = await sceneBadge.textContent()

      // Le badge peut avoir changé ou pas selon la longueur des scènes
      expect(newBadgeText).toBeTruthy()
      expect(newBadgeText).toMatch(/Acte \d+ - Scène \d+/)

      // Vérifier que les indices dans le store sont cohérents
      const { actIndex, sceneIndex } = await page.evaluate(() => {
        const state = localStorage.getItem('repet-play-storage')
        if (state) {
          const parsed = JSON.parse(state)
          return {
            actIndex: parsed?.state?.currentActIndex || 0,
            sceneIndex: parsed?.state?.currentSceneIndex || 0,
          }
        }
        return { actIndex: 0, sceneIndex: 0 }
      })

      expect(actIndex).toBeGreaterThanOrEqual(0)
      expect(sceneIndex).toBeGreaterThanOrEqual(0)
    })

    test('devrait afficher la scène courante correctement dans le sommaire', async ({ page }) => {
      // Ouvrir le sommaire
      const sceneBadge = page.getByTestId('scene-badge')
      await expect(sceneBadge).toBeVisible()
      await sceneBadge.click()
      await page.waitForTimeout(300)

      // Vérifier que le sommaire est visible
      const sceneSummary = page.getByTestId('scene-summary')
      await expect(sceneSummary).toBeVisible()

      // Récupérer l'acte et la scène courants depuis le store
      const { actIndex, sceneIndex } = await page.evaluate(() => {
        const state = localStorage.getItem('repet-play-storage')
        if (state) {
          const parsed = JSON.parse(state)
          return {
            actIndex: parsed?.state?.currentActIndex || 0,
            sceneIndex: parsed?.state?.currentSceneIndex || 0,
          }
        }
        return { actIndex: 0, sceneIndex: 0 }
      })

      // Vérifier que la scène courante est mise en évidence dans le sommaire
      const currentSceneButton = page.getByTestId(`scene-button-${actIndex}-${sceneIndex}`)
      if ((await currentSceneButton.count()) > 0) {
        await expect(currentSceneButton).toBeVisible()

        // Vérifier que le bouton a la classe de mise en évidence
        const className = await currentSceneButton.getAttribute('class')
        expect(className).toContain('bg-blue')
      }

      // Fermer le sommaire
      const closeButton = page.locator('button:has-text("✕")')
      if ((await closeButton.count()) > 0) {
        await closeButton.click()
        await page.waitForTimeout(300)
        await expect(sceneSummary).not.toBeVisible()
      }
    })

    test('devrait pouvoir naviguer entre plusieurs scènes successivement', async ({ page }) => {
      const sceneBadge = page.getByTestId('scene-badge')
      await expect(sceneBadge).toBeVisible()

      // Ouvrir le sommaire
      await sceneBadge.click()
      await page.waitForTimeout(300)

      const sceneSummary = page.getByTestId('scene-summary')
      await expect(sceneSummary).toBeVisible()

      const sceneButtons = page.locator('[data-testid^="scene-button-"]')
      const sceneCount = await sceneButtons.count()

      if (sceneCount > 3) {
        // Navigation 1: Aller à la scène 2
        await sceneButtons.nth(1).click()
        await page.waitForTimeout(1500)

        const badge1 = await sceneBadge.textContent()

        // Ouvrir à nouveau le sommaire
        await sceneBadge.click()
        await page.waitForTimeout(300)

        // Navigation 2: Aller à la scène 4
        await sceneButtons.nth(3).click()
        await page.waitForTimeout(1500)

        const badge2 = await sceneBadge.textContent()

        // Les badges doivent être différents
        expect(badge1).not.toBe(badge2)

        // Ouvrir à nouveau le sommaire
        await sceneBadge.click()
        await page.waitForTimeout(300)

        // Navigation 3: Retour à la scène 1
        await sceneButtons.nth(0).click()
        await page.waitForTimeout(1500)

        const badge3 = await sceneBadge.textContent()

        // Le 3ème badge doit être différent des 2 précédents
        expect(badge3).not.toBe(badge1)
        expect(badge3).not.toBe(badge2)
      }
    })
  })

  test.describe('Badge de Scène', () => {
    test('devrait afficher le badge de scène en bas de l\'écran', async ({ page }) => {
      const sceneBadge = page.getByTestId('scene-badge')
      await expect(sceneBadge).toBeVisible()

      // Vérifier le format du texte
      const badgeText = await sceneBadge.textContent()
      expect(badgeText).toMatch(/Acte \d+ - Scène \d+/)
    })

    test('devrait ouvrir le sommaire au clic sur le badge', async ({ page }) => {
      const sceneBadge = page.getByTestId('scene-badge')
      await expect(sceneBadge).toBeVisible()

      await sceneBadge.click()
      await page.waitForTimeout(300)

      const sceneSummary = page.getByTestId('scene-summary')
      await expect(sceneSummary).toBeVisible()
    })

    test('devrait fermer le sommaire au clic sur l\'overlay', async ({ page }) => {
      const sceneBadge = page.getByTestId('scene-badge')
      await sceneBadge.click()
      await page.waitForTimeout(300)

      const summaryOverlay = page.getByTestId('summary-overlay')
      await expect(summaryOverlay).toBeVisible()

      // Cliquer sur l'overlay (pas sur le contenu du sommaire)
      await summaryOverlay.click({ position: { x: 10, y: 10 } })
      await page.waitForTimeout(300)

      const sceneSummary = page.getByTestId('scene-summary')
      await expect(sceneSummary).not.toBeVisible()
    })
  })

  test.describe('Cohérence Navigation', () => {
    test('devrait maintenir la cohérence entre store et affichage', async ({ page }) => {
      // Ouvrir le sommaire et sélectionner une scène
      const sceneBadge = page.getByTestId('scene-badge')
      await sceneBadge.click()
      await page.waitForTimeout(300)

      const sceneButtons = page.locator('[data-testid^="scene-button-"]')
      if ((await sceneButtons.count()) > 1) {
        await sceneButtons.nth(1).click()
        await page.waitForTimeout(1500)

        // Vérifier la cohérence entre badge et store
        const badgeText = await sceneBadge.textContent()
        const storeData = await page.evaluate(() => {
          const state = localStorage.getItem('repet-play-storage')
          if (state) {
            const parsed = JSON.parse(state)
            return {
              actIndex: parsed?.state?.currentActIndex || 0,
              sceneIndex: parsed?.state?.currentSceneIndex || 0,
            }
          }
          return { actIndex: 0, sceneIndex: 0 }
        })

        // Construire le texte attendu du badge
        const expectedBadgeText = `Acte ${storeData.actIndex + 1} - Scène ${storeData.sceneIndex + 1}`
        expect(badgeText).toBe(expectedBadgeText)
      }
    })

    test('ne devrait pas avoir de conflit entre scroll programmatique et manuel', async ({ page }) => {
      // Naviguer via le sommaire
      const sceneBadge = page.getByTestId('scene-badge')
      await sceneBadge.click()
      await page.waitForTimeout(300)

      const sceneButtons = page.locator('[data-testid^="scene-button-"]')
      if ((await sceneButtons.count()) > 1) {
        await sceneButtons.nth(1).click()

        // Pendant l'animation de scroll, scroller manuellement
        await page.waitForTimeout(200)
        const playbackDisplay = page.getByTestId('playback-display')
        await playbackDisplay.evaluate((element) => {
          element.scrollTop += 100
        })

        // Attendre la fin de l'animation
        await page.waitForTimeout(1500)

        // Vérifier qu'il n'y a pas d'erreurs dans la console
        const errors = await page.evaluate(() => {
          return (window as unknown as { __errors?: string[] }).__errors || []
        })

        // Pas d'erreurs majeures attendues
        expect(errors.length).toBe(0)

        // Le badge devrait toujours afficher quelque chose de cohérent
        const badgeText = await sceneBadge.textContent()
        expect(badgeText).toMatch(/Acte \d+ - Scène \d+/)
      }
    })
  })
})
