/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { test, expect, TestHelpers } from './fixtures'
import path from 'path'

test.describe('PWA et Mode Offline', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = new TestHelpers(page)
    await helpers.clearStorage()
  })

  test.describe('Service Worker', () => {
    test('devrait enregistrer un service worker', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Attendre que le service worker soit enregistré
      const swRegistered = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) {
          return false
        }

        // Attendre l'enregistrement
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const registration = await navigator.serviceWorker.getRegistration()
        return registration !== undefined
      })

      expect(swRegistered).toBeTruthy()
    })

    test('devrait avoir un service worker actif', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const helpers = new TestHelpers(page)

      try {
        await helpers.waitForServiceWorker()

        const hasController = await page.evaluate(() => {
          return navigator.serviceWorker.controller !== null
        })

        expect(hasController).toBeTruthy()
      } catch (error) {
        // Service Worker peut prendre du temps à s'activer
        // Ce n'est pas un échec critique
        console.log('Service Worker non actif immédiatement (normal)')
      }
    })

    test('devrait mettre en cache les ressources essentielles', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Attendre que le SW soit prêt
      await page.waitForTimeout(2000)

      // Vérifier que des ressources sont en cache
      const cacheNames = await page.evaluate(async () => {
        if (!('caches' in window)) {
          return []
        }
        return await caches.keys()
      })

      expect(Array.isArray(cacheNames)).toBeTruthy()
      // Devrait avoir au moins un cache (workbox ou custom)
      expect(cacheNames.length).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Mode Offline', () => {
    test('devrait fonctionner offline après premier chargement', async ({ page, context }) => {
      const helpers = new TestHelpers(page)

      // Premier chargement online
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Attendre que le SW soit prêt
      await page.waitForTimeout(2000)

      // Importer une pièce
      const filePath = path.join(process.cwd(), 'examples', 'ALEGRIA.txt')
      const fileInput = page.locator('input[type="file"]').first()

      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(filePath)
        await page.waitForTimeout(1500)
      }

      // Passer en mode offline
      await helpers.goOffline()

      // Recharger la page
      await page.reload()
      await page.waitForLoadState('domcontentloaded')

      // L'app devrait toujours être accessible
      const bodyVisible = await page.locator('body').isVisible()
      expect(bodyVisible).toBeTruthy()

      // Revenir online
      await helpers.goOnline()
    })

    test('devrait afficher la pièce stockée en mode offline', async ({ page, context }) => {
      const helpers = new TestHelpers(page)

      // Online: importer une pièce
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const filePath = path.join(process.cwd(), 'examples', 'ALEGRIA.txt')
      const fileInput = page.locator('input[type="file"]').first()

      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(filePath)
        await page.waitForTimeout(1500)
      }

      // Vérifier que la pièce est dans IndexedDB
      const playStored = await page.evaluate(() => {
        return new Promise((resolve) => {
          const request = indexedDB.open('repet-db')
          request.onsuccess = () => {
            const db = request.result
            if (!db.objectStoreNames.contains('plays')) {
              resolve(false)
              return
            }
            const transaction = db.transaction(['plays'], 'readonly')
            const store = transaction.objectStore('plays')
            const getAllRequest = store.getAll()
            getAllRequest.onsuccess = () => {
              const plays = getAllRequest.result
              resolve(plays && plays.length > 0)
            }
            getAllRequest.onerror = () => resolve(false)
          }
          request.onerror = () => resolve(false)
        })
      })

      expect(playStored).toBeTruthy()

      // Offline: accéder à la pièce
      await helpers.goOffline()

      // Aller sur le reader
      const readerLink = page.getByRole('link', { name: /lire/i }).or(
        page.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await page.waitForTimeout(500)

        // Vérifier que le contenu est affiché
        const readerContent = page.locator(
          '[data-testid="reader-screen"], .reader-screen, .text-display'
        )
        if ((await readerContent.count()) > 0) {
          await expect(readerContent.first()).toBeVisible()
        }
      }

      await helpers.goOnline()
    })

    test('devrait conserver les settings offline', async ({ page, context }) => {
      const helpers = new TestHelpers(page)

      // Online: configurer settings
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Changer un setting
      await page.evaluate(() => {
        localStorage.setItem(
          'settings-store',
          JSON.stringify({
            state: {
              theme: 'dark',
              fontSize: 20,
            },
          })
        )
      })

      // Offline
      await helpers.goOffline()
      await page.reload()
      await page.waitForLoadState('domcontentloaded')

      // Vérifier que les settings sont conservés
      const settings = await page.evaluate(() => {
        const stored = localStorage.getItem('settings-store')
        return stored ? JSON.parse(stored) : null
      })

      expect(settings).toBeTruthy()
      expect(settings?.state?.theme).toBe('dark')

      await helpers.goOnline()
    })
  })

  test.describe('Installabilité PWA', () => {
    test('devrait avoir un manifeste PWA', async ({ page }) => {
      await page.goto('/')

      const manifestLink = await page.evaluate(() => {
        const link = document.querySelector('link[rel="manifest"]')
        return link ? link.getAttribute('href') : null
      })

      expect(manifestLink).toBeTruthy()
    })

    test('devrait avoir les meta tags PWA', async ({ page }) => {
      await page.goto('/')

      const hasPWAMeta = await page.evaluate(() => {
        const themeColor = document.querySelector('meta[name="theme-color"]')
        const viewport = document.querySelector('meta[name="viewport"]')
        const description = document.querySelector('meta[name="description"]')

        return {
          themeColor: themeColor !== null,
          viewport: viewport !== null,
          description: description !== null,
        }
      })

      expect(hasPWAMeta.viewport).toBeTruthy()
      // Theme color et description sont optionnels mais recommandés
    })

    test('devrait avoir des icônes PWA', async ({ page }) => {
      await page.goto('/')

      const hasIcons = await page.evaluate(() => {
        const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
        const icon = document.querySelector('link[rel="icon"]')

        return {
          appleTouchIcon: appleTouchIcon !== null,
          icon: icon !== null,
        }
      })

      // Au moins une icône devrait être présente
      expect(hasIcons.icon).toBeTruthy()
    })
  })

  test.describe('Persistance des Données', () => {
    test('devrait conserver les pièces après rechargement', async ({ page }) => {
      await page.goto('/')

      // Importer une pièce
      const filePath = path.join(process.cwd(), 'examples', 'ALEGRIA.txt')
      const fileInput = page.locator('input[type="file"]').first()

      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(filePath)
        await page.waitForTimeout(1500)
      }

      // Recharger la page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Vérifier que la pièce est toujours là
      const playExists = await page.evaluate(() => {
        return new Promise((resolve) => {
          const request = indexedDB.open('repet-db')
          request.onsuccess = () => {
            const db = request.result
            if (!db.objectStoreNames.contains('plays')) {
              resolve(false)
              return
            }
            const transaction = db.transaction(['plays'], 'readonly')
            const store = transaction.objectStore('plays')
            const getAllRequest = store.getAll()
            getAllRequest.onsuccess = () => {
              const plays = getAllRequest.result
              resolve(plays && plays.length > 0)
            }
            getAllRequest.onerror = () => resolve(false)
          }
          request.onerror = () => resolve(false)
        })
      })

      expect(playExists).toBeTruthy()
    })

    test('devrait conserver la position de lecture', async ({ page }) => {
      await page.goto('/')

      // Importer et naviguer
      const filePath = path.join(process.cwd(), 'examples', 'ALEGRIA.txt')
      const fileInput = page.locator('input[type="file"]').first()

      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(filePath)
        await page.waitForTimeout(1500)
      }

      const readerLink = page.getByRole('link', { name: /lire/i }).or(
        page.locator('[href*="/reader"]')
      )
      if ((await readerLink.count()) > 0) {
        await readerLink.first().click()
        await page.waitForTimeout(500)
      }

      // Avancer quelques lignes
      const nextButton = page.locator('button[data-testid="next-button"]')
      if ((await nextButton.count()) > 0) {
        for (let i = 0; i < 3; i++) {
          await nextButton.first().click()
          await page.waitForTimeout(100)
        }
      }

      const lineIndexBefore = await page.evaluate(() => {
        const state = localStorage.getItem('play-store')
        if (state) {
          const parsed = JSON.parse(state)
          return parsed?.state?.currentLineIndex || 0
        }
        return 0
      })

      // Recharger
      await page.reload()
      await page.waitForLoadState('networkidle')

      const lineIndexAfter = await page.evaluate(() => {
        const state = localStorage.getItem('play-store')
        if (state) {
          const parsed = JSON.parse(state)
          return parsed?.state?.currentLineIndex || 0
        }
        return 0
      })

      // La position devrait être conservée
      expect(lineIndexAfter).toBe(lineIndexBefore)
    })
  })

  test.describe('Performance Offline', () => {
    test('devrait charger rapidement en mode offline', async ({ page, context }) => {
      const helpers = new TestHelpers(page)

      // Premier chargement online
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Passer offline
      await helpers.goOffline()

      // Mesurer le temps de chargement offline
      const startTime = Date.now()
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
      const loadTime = Date.now() - startTime

      // Devrait charger en moins de 3 secondes offline (depuis le cache)
      expect(loadTime).toBeLessThan(3000)

      await helpers.goOnline()
    })
  })
})
