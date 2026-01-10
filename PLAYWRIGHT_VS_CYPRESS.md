# Playwright vs Cypress - Comparaison pour Répét

**Date**: 2025-01-XX  
**Contexte**: Tests E2E pour application Répét v0.3.0  
**Stack**: React 18 + TypeScript + Vite + PWA

---

## 📋 Résumé Exécutif

**Recommandation**: ✅ **Playwright**

**Score Global**:
- Playwright: **85/100** ⭐⭐⭐⭐⭐
- Cypress: **70/100** ⭐⭐⭐⭐

**Raisons principales**:
1. Support multi-navigateurs natif (Chrome, Firefox, Safari, Edge)
2. Tests mobiles (iOS/Android) avec même API
3. Meilleure gestion PWA et Service Workers
4. Plus rapide et moins de flakiness
5. API moderne (async/await natif)

---

## 🔍 Analyse Détaillée par Critère

### 1. Support Multi-Navigateurs

#### Playwright ✅ **10/10**
```typescript
// Un seul test, tous les navigateurs
test('import pièce', async ({ page }) => {
  // Fonctionne sur Chromium, Firefox, WebKit
})

// Configuration
projects: [
  { name: 'chromium' },
  { name: 'firefox' },
  { name: 'webkit' }, // Safari
  { name: 'edge' }
]
```

**Avantages**:
- Support natif Chromium, Firefox, WebKit (Safari)
- Tests parallèles multi-navigateurs
- Même API pour tous
- Edge supporté

#### Cypress ⚠️ **6/10**
```javascript
// Chrome/Edge natif, Firefox beta, Safari non supporté
// Nécessite configuration séparée pour chaque browser
```

**Limitations**:
- WebKit (Safari) **NON supporté**
- Firefox en beta (instable)
- Principalement Chrome/Edge
- Tests Safari nécessitent BrowserStack/Sauce Labs (payant)

**Verdict**: **Playwright gagne** - Critique pour Répét (besoin de tester Safari)

---

### 2. Tests Mobile

#### Playwright ✅ **9/10**
```typescript
// Émulation mobile native
test('mode italien mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  // Tests iPhone/Android avec même API
})

// Émulation complète
devices: {
  'iPhone 13': ...,
  'Pixel 5': ...,
  'iPad Pro': ...
}
```

**Avantages**:
- Émulation mobile native (user agent, viewport, touch events)
- Devices prédéfinis (iPhone, Android, iPad)
- Tests gestures tactiles
- Même API que desktop

#### Cypress ⚠️ **5/10**
```javascript
// Émulation viewport uniquement
cy.viewport('iphone-x')
// Pas de vrai user agent mobile, gestures limités
```

**Limitations**:
- Émulation viewport basique
- Pas de vrais tests mobile natifs
- Touch events limités
- Nécessite outils tiers pour tests réels

**Verdict**: **Playwright gagne** - Important pour Répét (PWA mobile)

---

### 3. PWA & Service Workers

#### Playwright ✅ **9/10**
```typescript
// Gestion native Service Workers
test('offline mode', async ({ page, context }) => {
  await page.goto('/reader')
  
  // Intercepter Service Worker
  await context.route('**/*', route => route.abort())
  
  // Tester mode offline
  await page.evaluate(() => navigator.serviceWorker.ready)
})
```

**Avantages**:
- Contrôle total Service Workers
- Tests offline réels
- Cache API accessible
- Installation PWA testable

#### Cypress ⚠️ **6/10**
```javascript
// Support limité Service Workers
// Nécessite plugins et workarounds
cy.visit('/', {
  onBeforeLoad(win) {
    delete win.navigator.serviceWorker
  }
})
```

**Limitations**:
- Service Workers difficiles à tester
- Pas de support natif offline
- Nécessite plugins communautaires
- Cache API limitée

**Verdict**: **Playwright gagne** - Critique pour Répét (PWA offline)

---

### 4. IndexedDB & Storage

#### Playwright ✅ **8/10**
```typescript
// Accès direct IndexedDB
test('stockage pièce', async ({ page }) => {
  const plays = await page.evaluate(async () => {
    const db = await window.indexedDB.open('repet-db')
    return db.objectStore('plays').getAll()
  })
  
  expect(plays).toHaveLength(1)
})
```

**Avantages**:
- Accès direct IndexedDB via evaluate
- localStorage, sessionStorage natifs
- Cookies gérés
- État persisté entre tests

#### Cypress ✅ **8/10**
```javascript
// Accès IndexedDB via cy.window()
cy.window().then(async (win) => {
  const db = await win.indexedDB.open('repet-db')
  // ...
})
```

**Avantages**:
- Support IndexedDB correct
- localStorage/sessionStorage faciles
- Commandes dédiées

**Verdict**: **Égalité** - Les deux gèrent bien

---

### 5. Web Speech API (TTS)

#### Playwright ✅ **7/10**
```typescript
// Mock Web Speech API
test('lecture TTS', async ({ page }) => {
  await page.addInitScript(() => {
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [/* mock voices */]
    }
  })
  
  // Tester comportement TTS
})
```

**Avantages**:
- Mock facile via addInitScript
- Contrôle total API
- Tests événements (onend, onerror)

**Limitations**:
- TTS réel non testable (mock requis)

#### Cypress ⚠️ **6/10**
```javascript
// Mock via cy.stub()
cy.visit('/', {
  onBeforeLoad(win) {
    cy.stub(win.speechSynthesis, 'speak')
  }
})
```

**Avantages**:
- Mock possible

**Limitations**:
- Plus verbeux
- Gestion événements complexe

**Verdict**: **Playwright gagne** - Plus simple à mocker

---

### 6. Performance & Vitesse

#### Playwright ✅ **9/10**
```typescript
// Parallélisation native
// 10 tests en 15 secondes (3 workers)
test.describe.configure({ mode: 'parallel' })
```

**Avantages**:
- Parallélisation native multi-workers
- Tests multi-navigateurs simultanés
- Très rapide (headless)
- Moins de flakiness

**Metrics**:
- Démarrage: ~2s
- Test moyen: ~1-3s
- 50 tests: ~30s (parallèle)

#### Cypress ⚠️ **6/10**
```javascript
// Parallélisation payante (Cypress Cloud)
// 10 tests en 45 secondes (séquentiel)
```

**Limitations**:
- Parallélisation nécessite Cypress Cloud (payant)
- Plus lent (électron overhead)
- Plus de flakiness historique
- Tests séquentiels par défaut

**Metrics**:
- Démarrage: ~5s
- Test moyen: ~3-5s
- 50 tests: ~2-3min (séquentiel)

**Verdict**: **Playwright gagne** - 2-3x plus rapide

---

### 7. API & Developer Experience

#### Playwright ✅ **9/10**
```typescript
// API moderne async/await
test('navigation scènes', async ({ page }) => {
  await page.goto('/reader')
  await page.click('[data-testid="scene-2"]')
  await expect(page.locator('.scene-title')).toHaveText('Scène 2')
})

// Auto-wait natif
await page.click('button') // Attend automatiquement que le bouton soit cliquable
```

**Avantages**:
- TypeScript first-class
- Auto-wait intelligent
- API intuitive
- Très bonne documentation
- Fixtures puissantes

#### Cypress ⚠️ **7/10**
```javascript
// API chaînée (style jQuery)
cy.visit('/reader')
cy.get('[data-testid="scene-2"]').click()
cy.get('.scene-title').should('have.text', 'Scène 2')

// Gestion async particulière
cy.get('button').then(($btn) => {
  // Code synchrone uniquement
})
```

**Avantages**:
- API simple pour débutants
- Très bonne documentation
- Time-travel debugging excellent

**Limitations**:
- Pas de vrai async/await
- TypeScript support limité
- Courbe apprentissage chaînage

**Verdict**: **Playwright gagne** - API plus moderne

---

### 8. Debugging & DX

#### Cypress ✅ **9/10**
```javascript
// Time-travel debugging incroyable
cy.get('button').click()
// Dans l'interface, retour en arrière pour voir chaque étape
```

**Avantages**:
- Time-travel debugging unique
- Interface visuelle excellente
- Snapshots automatiques
- Vidéos des échecs
- Très facile à débugger

#### Playwright ✅ **8/10**
```typescript
// Trace viewer excellent
test('debug', async ({ page }) => {
  await page.pause() // Debugger intégré
})

// npx playwright show-trace trace.zip
// Interface visuelle avec timeline
```

**Avantages**:
- Trace viewer puissant
- Debugger intégré (page.pause())
- Screenshots/vidéos automatiques
- Codegen (génération tests auto)

**Verdict**: **Cypress gagne légèrement** - Debugging plus fluide

---

### 9. CI/CD & Intégration

#### Playwright ✅ **9/10**
```yaml
# GitHub Actions
- name: Run Playwright tests
  run: npx playwright test
  
# Natif Docker, parallelization gratuite
# Reports HTML automatiques
```

**Avantages**:
- Docker images officielles
- GitHub Actions intégration native
- Parallélisation gratuite
- Reports intégrés
- Sharding natif

#### Cypress ⚠️ **6/10**
```yaml
# GitHub Actions (plus verbeux)
- name: Cypress run
  uses: cypress-io/github-action@v5
  
# Parallélisation nécessite Cypress Cloud (payant)
```

**Limitations**:
- Parallélisation CI payante (Cypress Cloud)
- Configuration plus complexe
- Docker moins optimisé

**Verdict**: **Playwright gagne** - CI/CD gratuit et simple

---

### 10. Coût & Licensing

#### Playwright ✅ **10/10**
- **Gratuit et Open Source** (Apache 2.0)
- Toutes fonctionnalités incluses
- Pas de limitations
- Maintenu par Microsoft

#### Cypress ⚠️ **7/10**
- **Open Source** (core gratuit)
- **Cypress Cloud payant** pour:
  - Parallélisation CI
  - Analytics
  - Flake detection
  - Pricing: $75/mois (small team)

**Verdict**: **Playwright gagne** - 100% gratuit

---

## 📊 Tableau Comparatif Global

| Critère | Playwright | Cypress | Gagnant |
|---------|-----------|---------|---------|
| Multi-navigateurs | 10/10 | 6/10 | 🏆 Playwright |
| Tests Mobile | 9/10 | 5/10 | 🏆 Playwright |
| PWA/Service Workers | 9/10 | 6/10 | 🏆 Playwright |
| IndexedDB | 8/10 | 8/10 | 🤝 Égalité |
| Web Speech API | 7/10 | 6/10 | 🏆 Playwright |
| Performance | 9/10 | 6/10 | 🏆 Playwright |
| API/DX | 9/10 | 7/10 | 🏆 Playwright |
| Debugging | 8/10 | 9/10 | 🏆 Cypress |
| CI/CD | 9/10 | 6/10 | 🏆 Playwright |
| Coût | 10/10 | 7/10 | 🏆 Playwright |
| **TOTAL** | **88/100** | **66/100** | **🏆 Playwright** |

---

## 🎯 Cas d'Usage Répét

### Scénarios Critiques à Tester

#### 1. Import & Parsing
```typescript
// Playwright - Simple et rapide
test('import ALEGRIA.txt', async ({ page }) => {
  await page.goto('/')
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.click('[data-testid="import-button"]')
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles('./examples/ALEGRIA.txt')
  
  await expect(page.locator('.play-title')).toHaveText('Alégria')
  await expect(page.locator('.character-list')).toContainText('XAVIER')
})
```

#### 2. Mode Italien + TTS
```typescript
// Playwright - Mock TTS facile
test('mode italien masque répliques utilisateur', async ({ page }) => {
  await page.addInitScript(() => {
    window.speechSynthesis = {
      speak: (utterance) => {
        // Mock avec événements
        setTimeout(() => utterance.onend(), 100)
      }
    }
  })
  
  await page.goto('/reader?playId=test')
  await page.selectOption('[data-testid="reading-mode"]', 'italian')
  await page.selectOption('[data-testid="user-character"]', 'XAVIER')
  
  // Vérifier masquage
  const userLine = page.locator('.line[data-character="XAVIER"]')
  await expect(userLine).toHaveClass(/hidden/)
  
  // Démarrer lecture
  await page.click('[data-testid="play-button"]')
  
  // Vérifier révélation après
  await expect(userLine).not.toHaveClass(/hidden/)
})
```

#### 3. Navigation Scènes
```typescript
test('jump to scene fonctionne', async ({ page }) => {
  await page.goto('/reader?playId=test')
  
  // Ouvrir sommaire
  await page.click('[data-testid="summary-button"]')
  
  // Cliquer Acte 2, Scène 3
  await page.click('[data-testid="act-2-scene-3"]')
  
  // Vérifier navigation
  await expect(page.locator('.current-scene')).toHaveText('Acte II - Scène 3')
  await expect(page.locator('.current-line-index')).toHaveText('45')
})
```

#### 4. PWA Offline
```typescript
test('fonctionne offline', async ({ page, context }) => {
  await page.goto('/')
  
  // Attendre Service Worker
  await page.waitForFunction(() => 
    navigator.serviceWorker.controller !== null
  )
  
  // Simuler offline
  await context.setOffline(true)
  
  // App fonctionne toujours
  await page.goto('/reader?playId=test')
  await expect(page.locator('.reader-screen')).toBeVisible()
})
```

#### 5. Tests Multi-Navigateurs
```typescript
// Playwright - Même test, tous navigateurs
test('assignation voix @cross-browser', async ({ page, browserName }) => {
  await page.goto('/settings')
  
  // Vérifier voix disponibles (différentes par navigateur)
  const voices = await page.evaluate(() => 
    speechSynthesis.getVoices().map(v => v.name)
  )
  
  expect(voices.length).toBeGreaterThan(0)
  
  // Log pour debug
  console.log(`${browserName}: ${voices.length} voix`)
})
```

---

## ✅ Recommandation Finale

### Pour Répét: **Playwright** 🏆

#### Raisons Décisives

1. **Multi-navigateurs critique**
   - Répét doit fonctionner sur Safari (iOS)
   - Cypress ne supporte pas WebKit
   - Playwright couvre 100% des navigateurs cibles

2. **PWA & Offline**
   - Service Workers essentiels
   - Playwright gère mieux le mode offline
   - Tests cache/storage plus fiables

3. **Tests Mobile Futurs**
   - PWA destinée au mobile
   - Émulation mobile native Playwright
   - Tests gestures tactiles

4. **Performance**
   - Suite de tests grandira (50+ tests)
   - Parallélisation gratuite critique
   - Playwright 2-3x plus rapide

5. **Coût Zéro**
   - Projet open source
   - Pas de budget Cypress Cloud
   - Toutes fonctionnalités gratuites

6. **API Moderne**
   - Équipe TypeScript
   - Async/await natif préféré
   - Meilleure intégration stack

#### Quand Choisir Cypress ?

Cypress serait meilleur si:
- ❌ Safari non critique (web app desktop only)
- ❌ Pas de PWA/Service Workers
- ❌ Budget pour Cypress Cloud
- ❌ Équipe débutante en tests E2E
- ❌ Debugging time-travel essentiel

**Aucun de ces cas ne s'applique à Répét.**

---

## 🚀 Plan d'Implémentation Recommandé

### Phase 1 - Setup Playwright (1 jour)

```bash
# Installation
npm install -D @playwright/test
npx playwright install

# Configuration
npx playwright init
```

**Fichiers**:
- `playwright.config.ts` - Config multi-navigateurs
- `tests/e2e/` - Dossier tests
- `.github/workflows/playwright.yml` - CI/CD

### Phase 2 - Tests Critiques (2-3 jours)

**5 workflows prioritaires**:
1. Import fichier .txt → Parsing → Affichage
2. Mode silencieux → Navigation scènes
3. Mode audio → TTS (mocké) → Lecture
4. Mode italien → Sélection utilisateur → Masquage
5. PWA offline → Reload → Persistance

**Estimation**: 15-20 tests

### Phase 3 - Couverture Complète (3-5 jours)

**Tests supplémentaires**:
- Settings (voix, thème, police)
- Assignation voix par personnage
- Navigation contexte (avant/après)
- Edge cases (fichiers invalides, etc.)

**Estimation**: 30-40 tests additionnels

### Phase 4 - CI/CD (1 jour)

**GitHub Actions**:
- Tests sur push/PR
- Multi-navigateurs parallèles
- Upload artifacts (traces, vidéos)
- Badge status README

---

## 📝 Exemple Configuration Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 🎉 Conclusion

**Playwright est le choix optimal pour Répét** avec un avantage net de **22 points** (88/100 vs 66/100).

### Décision: ✅ **Playwright**

**Investissement**:
- Setup: 1 jour
- Tests critiques: 2-3 jours
- **Total Phase 1**: ~1 semaine

**ROI**:
- Couverture multi-navigateurs (Safari inclus)
- Tests mobile natifs
- Suite rapide et fiable
- Coût $0
- Scalable (50+ tests)

**Action**: Commencer setup Playwright pour v0.3.0 🚀

---

**Auteur**: Répét Contributors  
**Date**: 2025-01-XX  
**Décision**: Playwright pour tests E2E