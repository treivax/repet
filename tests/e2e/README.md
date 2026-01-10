# Tests End-to-End (E2E) - Répét

Ce répertoire contient les tests end-to-end de l'application Répét, réalisés avec [Playwright](https://playwright.dev/).

## 📊 Vue d'ensemble

**Statut** : ✅ 44/44 tests passent (100%)

Les tests E2E valident le fonctionnement complet de l'application du point de vue de l'utilisateur, en simulant des interactions réelles avec l'interface.

### Suites de Tests

| Suite | Tests | Description |
|-------|-------|-------------|
| `01-import-parsing.spec.ts` | 7 | Import de fichiers et parsing |
| `02-reading-modes.spec.ts` | 13 | Modes de lecture (silencieux, audio, italiennes) |
| `03-navigation.spec.ts` | 12 | Navigation dans la pièce |
| `04-pwa-offline.spec.ts` | 12 | PWA, offline, persistance |
| **TOTAL** | **44** | - |

## 🚀 Exécution des Tests

### Installation

```bash
# Installer les dépendances
npm install

# Installer les navigateurs Playwright
npx playwright install
```

### Commandes Principales

```bash
# Exécuter tous les tests
npm run test:e2e

# Mode UI (développement - recommandé)
npm run test:e2e:ui

# Mode headed (voir le navigateur)
npm run test:e2e:headed

# Mode debug
npm run test:e2e:debug

# Tests sur navigateur spécifique
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Filtrer les Tests

```bash
# Exécuter une suite spécifique
npx playwright test tests/e2e/02-reading-modes.spec.ts

# Exécuter un test spécifique
npx playwright test -g "devrait permettre de sélectionner le personnage utilisateur"

# Exécuter en mode interactif
npx playwright test --ui
```

### Rapports et Debug

```bash
# Afficher le dernier rapport HTML
npx playwright show-report

# Afficher les traces (après échec)
npx playwright show-trace test-results/[nom-du-test]/trace.zip
```

## 🏗️ Architecture

### Structure des Fichiers

```
tests/e2e/
├── README.md                      # Ce fichier
├── fixtures.ts                    # Fixtures et helpers partagés
├── 01-import-parsing.spec.ts      # Tests d'import et parsing
├── 02-reading-modes.spec.ts       # Tests des modes de lecture
├── 03-navigation.spec.ts          # Tests de navigation
└── 04-pwa-offline.spec.ts         # Tests PWA et offline
```

### Fixtures Personnalisés

#### `pageWithTTS`
Page avec mock TTS (Text-to-Speech) intégré.

```typescript
test('mon test', async ({ pageWithTTS }) => {
  await pageWithTTS.goto('/')
  // Le TTS est mocké automatiquement
})
```

#### `TestHelpers`
Classe utilitaire avec méthodes helper :

```typescript
const helpers = new TestHelpers(page)

// Nettoyer le stockage local
await helpers.clearStorage()

// Attendre le service worker
await helpers.waitForServiceWorker()

// Passer en mode offline/online
await helpers.goOffline()
await helpers.goOnline()

// Récupérer les utterances TTS
const utterances = await helpers.getTTSUtterances()
```

## 🎯 Bonnes Pratiques

### 1. Utiliser les data-testid

**✅ Bon**
```typescript
const button = page.getByTestId('next-button')
await button.click()
```

**❌ Mauvais**
```typescript
const button = page.locator('button:has-text("Suivant")')
await button.click()
```

### 2. Attendre les éléments

**✅ Bon**
```typescript
await expect(element).toBeVisible()
await element.click()
```

**❌ Mauvais**
```typescript
await page.waitForTimeout(1000) // Timing fragile
await element.click()
```

### 3. Isoler les Tests

Chaque test doit être indépendant :

```typescript
test.beforeEach(async ({ page }) => {
  const helpers = new TestHelpers(page)
  await helpers.clearStorage()
  await page.goto('/')
})
```

### 4. Assertions Explicites

**✅ Bon**
```typescript
await expect(element).toBeVisible()
await expect(element).toHaveText('Texte attendu')
```

**❌ Mauvais**
```typescript
const isVisible = await element.isVisible()
expect(isVisible).toBe(true)
```

## 🔍 data-testid Disponibles

### Screens
- `home-screen` - Écran d'accueil
- `play-screen` - Écran de lecture (PlayScreen)
- `reader-screen` - Écran de lecture (ReaderScreen)

### Navigation
- `next-button` - Bouton suivant
- `prev-button` - Bouton précédent
- `play-pause-button` - Bouton lecture/pause
- `previous-button` - Bouton ligne précédente (NavigationControls)
- `next-scene-button` - Bouton scène suivante
- `previous-scene-button` - Bouton scène précédente
- `summary-button` - Bouton sommaire

### Import & Configuration
- `file-input` - Input de fichier
- `reading-mode-silent` - Mode silencieux
- `reading-mode-audio` - Mode audio
- `reading-mode-italian` - Mode italiennes

### Mode Italiennes
- `italian-settings-section` - Section réglages italiennes
- `user-character-select` - Sélecteur personnage utilisateur
- `hide-user-lines-toggle` - Toggle masquage répliques
- `show-before-toggle` - Toggle affichage avant
- `show-after-toggle` - Toggle affichage après

### Audio
- `voice-off-toggle` - Toggle voix off
- `default-speed-slider` - Slider vitesse par défaut
- `user-speed-slider` - Slider vitesse utilisateur

### Scènes
- `scene-navigation` - Navigation de scènes
- `current-scene` - Scène courante
- `scene-summary` - Sommaire des scènes
- `scene-button-{actIndex}-{sceneIndex}` - Bouton de scène spécifique

### Autres
- `text-display` - Affichage du texte
- `text-display-container` - Conteneur du texte
- `character-selector-modal` - Modal sélection personnage
- `character-badge-{name}` - Badge personnage
- `play-card-{id}` - Carte de pièce

## 🐛 Debug des Tests

### Activer les Logs

```bash
DEBUG=pw:api npx playwright test
```

### Mode Debug Interactif

```bash
npm run test:e2e:debug -- tests/e2e/02-reading-modes.spec.ts
```

### Inspecter les Échecs

Après un échec :
1. Vérifier le screenshot : `test-results/[nom-test]/test-failed-1.png`
2. Regarder la vidéo : `test-results/[nom-test]/video.webm`
3. Analyser la trace : `npx playwright show-trace test-results/[nom-test]/trace.zip`
4. Lire le contexte : `test-results/[nom-test]/error-context.md`

### Mode Headed (voir le navigateur)

```bash
npm run test:e2e:headed
```

## 📝 Écrire de Nouveaux Tests

### Template de Base

```typescript
import { test, expect } from './fixtures'

test.describe('Ma Fonctionnalité', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = new TestHelpers(page)
    await helpers.clearStorage()
    await page.goto('/')
  })

  test('devrait faire quelque chose', async ({ page }) => {
    // Arrange
    const button = page.getByTestId('mon-bouton')
    
    // Act
    await button.click()
    
    // Assert
    await expect(page.getByTestId('resultat')).toBeVisible()
  })
})
```

### Avec Mock TTS

```typescript
test('devrait lire le texte', async ({ pageWithTTS }) => {
  await pageWithTTS.goto('/play/123')
  
  const playButton = pageWithTTS.getByTestId('play-button')
  await playButton.click()
  
  const helpers = new TestHelpers(pageWithTTS)
  const utterances = await helpers.getTTSUtterances()
  
  expect(utterances.length).toBeGreaterThan(0)
})
```

## 🔧 Configuration

La configuration Playwright se trouve dans `playwright.config.ts` :

- **Projets** : chromium, firefox, webkit
- **Timeout** : 30s par test
- **Retries** : 2 en CI, 0 en local
- **Workers** : 8 en parallèle
- **WebServer** : Vite dev server sur port 5173
- **Reporters** : HTML, JSON, list

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev/)
- [Meilleures Pratiques](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)

## 🎉 Résultats Actuels

```
Running 44 tests using 8 workers

  44 passed (35.6s)
```

**Taux de réussite** : 100% ✅  
**Temps moyen** : ~35 secondes  
**Flakiness** : 0%

---

**Dernière mise à jour** : 10 janvier 2025