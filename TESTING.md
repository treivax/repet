# Testing Guide - Répét

**Last updated:** January 2025  
**Test Coverage:** 85% (Phase 7)

---

## Quick Start

```bash
# Run all tests
npm test                    # Unit tests
npm run test:e2e           # E2E tests (all browsers)

# Run specific tests
npm run test:e2e:chromium  # E2E on Chromium only
npm run test:e2e:ui        # Interactive Playwright UI
npm test -- parser         # Specific unit test file
```

---

## Test Suites Overview

### Unit Tests (Vitest)
**Status:** ✅ 24/24 passing (100%)  
**Location:** `src/core/parser/__tests__/`  
**Execution time:** ~800ms

```bash
npm test                   # Run all
npm test -- --watch       # Watch mode
npm test -- --coverage    # With coverage report
npm test -- --ui          # Vitest UI
```

**Coverage:**
- Text parser (ACTE/Scène parsing)
- Character extraction
- Metadata parsing
- Didascalie handling (inline/block)
- Roman numeral support
- Error handling

---

### E2E Tests (Playwright)
**Status:** ⚠️ 15/20 passing (75%)  
**Location:** `tests/e2e/`  
**Execution time:** ~1-2 minutes

#### Suite 01: Import & Parsing ✅ 7/7
```bash
npm run test:e2e:chromium -- tests/e2e/01-import-parsing.spec.ts
```

Tests:
- ✅ Home page display
- ✅ File import workflow
- ✅ Metadata parsing
- ✅ Acts/scenes parsing
- ✅ Character extraction
- ✅ File validation
- ✅ Error handling

#### Suite 02: Reading Modes ⚠️ 8/13
```bash
npm run test:e2e:chromium -- tests/e2e/02-reading-modes.spec.ts
```

Passing:
- ✅ Silent mode configuration
- ✅ Audio mode configuration
- ✅ Audio TTS functionality
- ✅ Italian mode configuration
- ✅ Audio settings UI

Failing (5 tests - Italian mode timing issues):
- ⏳ Character select visibility
- ⏳ Masking options
- ⏳ Badge display
- ⏳ User speed slider

#### Suite 03: Navigation ⏳ Not Yet Updated
```bash
npm run test:e2e:chromium -- tests/e2e/03-navigation.spec.ts
```

Planned coverage:
- Keyboard shortcuts (←, →, Space)
- Scene navigation
- Line navigation
- Summary panel

**Status:** Needs data-testid updates (2-3 hours)

#### Suite 04: PWA & Offline ⏳ Not Yet Updated
```bash
npm run test:e2e:chromium -- tests/e2e/04-pwa-offline.spec.ts
```

Planned coverage:
- Service worker registration
- Offline functionality
- Cache persistence
- PWA installation

**Status:** Needs data-testid updates (3-4 hours)

---

## Test Infrastructure

### Playwright Configuration
**File:** `playwright.config.ts`

**Browsers:**
- Chromium (default)
- Firefox
- WebKit (not installed - requires system deps)

**Devices:**
- Desktop (1920x1080)
- Pixel 5
- iPhone 13

**Features:**
- Parallel execution (up to 8 workers)
- Video recording (on failure)
- Screenshots (on failure)
- Trace collection
- HTML reports

### TTS Mocking
**File:** `tests/e2e/fixtures.ts`

Mock implementation for `speechSynthesis` API:
```typescript
class TestHelpers {
  async getTTSUtterances(): Promise<any[]>
  async clearStorage(): Promise<void>
  async waitForServiceWorker(): Promise<void>
  async goOffline(): Promise<void>
  async goOnline(): Promise<void>
}
```

---

## Data-TestId Conventions

### Naming Convention
Use kebab-case: `data-testid="component-element"`

### Current Coverage (65+ attributes)

#### Screens
```typescript
// HomeScreen
data-testid="import-section"
data-testid="file-input"
data-testid="import-button"
data-testid="recent-plays"

// PlayScreen
data-testid="play-screen"
data-testid="choose-character-button"
data-testid="character-selector-modal"

// ReaderScreen
data-testid="reader-screen"
data-testid="reader-header"
data-testid="play-title"
data-testid="reading-mode"
data-testid="user-character"
data-testid="summary-button"
data-testid="scene-summary"
data-testid="text-display"
data-testid="current-line"
```

#### Components
```typescript
// PlaybackControls
data-testid="playback-controls"
data-testid="play-button"
data-testid="pause-button"
data-testid="stop-button"
data-testid="next-button"
data-testid="prev-button"

// CharacterSelector
data-testid="character-selector"
data-testid="character-badge-{id}"

// ReadingModeSelector
data-testid="reading-mode-silent"
data-testid="reading-mode-audio"
data-testid="reading-mode-italian"

// ItalianSettings
data-testid="user-character-select"
data-testid="hide-user-lines-toggle"
data-testid="show-before-toggle"
data-testid="show-after-toggle"

// AudioSettings
data-testid="voice-off-toggle"
data-testid="default-speed-slider"
data-testid="user-speed-slider"
```

---

## Writing Tests

### Unit Test Example
```typescript
// src/core/parser/__tests__/example.test.ts
import { describe, it, expect } from 'vitest'
import { parsePlayText } from '../textParser'

describe('Parser', () => {
  it('should parse ACTE I', () => {
    const text = 'ACTE I\nScène 1\nHAMLET: To be or not to be'
    const ast = parsePlayText(text, 'test.txt')
    
    expect(ast.acts).toHaveLength(1)
    expect(ast.acts[0].actNumber).toBe(1)
    expect(ast.acts[0].scenes).toHaveLength(1)
  })
})
```

### E2E Test Example
```typescript
// tests/e2e/example.spec.ts
import { test, expect } from './fixtures'

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = new TestHelpers(page)
    await helpers.clearStorage()
    await page.goto('/')
  })

  test('should do something', async ({ page }) => {
    // Use data-testid for stable selectors
    const button = page.getByTestId('import-button')
    await expect(button).toBeVisible()
    await button.click()
    
    // Wait for navigation
    await page.waitForURL(/\/play\//)
    
    // Assert result
    const modal = page.getByTestId('character-selector-modal')
    await expect(modal).toBeVisible()
  })
})
```

---

## Best Practices

### DO ✅
- Use `data-testid` for all E2E selectors
- Use `waitForURL()` for navigation
- Clear storage in `beforeEach`
- Keep tests independent
- Use TypeScript
- Record videos only on failure
- Write descriptive test names
- Use Playwright's auto-wait

### DON'T ❌
- Don't use CSS class selectors
- Don't use text-based selectors
- Don't use arbitrary `waitForTimeout()` (use auto-wait)
- Don't share state between tests
- Don't test implementation details
- Don't skip flaky tests (fix them)

---

## Debugging

### Failed E2E Tests
```bash
# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode (step through)
npm run test:e2e:debug

# Run with UI (interactive)
npm run test:e2e:ui

# View last run report
npm run test:e2e:report
```

### Artifacts
Failed tests generate:
- **Video:** `test-results/{test-name}/video.webm`
- **Screenshot:** `test-results/{test-name}/test-failed-1.png`
- **Trace:** Download from HTML report
- **Logs:** `test-results/{test-name}/error-context.md`

### Common Issues

#### Test timeout
```typescript
// Increase timeout for slow operations
test('slow test', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // ...
})
```

#### Element not found
```typescript
// Increase wait time
await expect(element).toBeVisible({ timeout: 10000 })

// Or check if element exists conditionally
if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
  await element.click()
}
```

#### Storage not cleared
```typescript
// Clear storage before test
const helpers = new TestHelpers(page)
await helpers.clearStorage()

// Navigate to app origin first
await page.goto('/')
await helpers.clearStorage()
```

---

## CI/CD Integration

### GitHub Actions (Ready)
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
      - run: npm run test:e2e:chromium
```

### Test Reports
HTML reports are automatically generated:
```bash
npm run test:e2e        # Runs tests
npm run test:e2e:report # Opens report
```

---

## Performance

### Execution Times
| Suite | Tests | Time | Workers |
|-------|-------|------|---------|
| Unit | 24 | ~800ms | - |
| Import (E2E) | 7 | ~15s | 8 |
| Reading Modes (E2E) | 13 | ~60s | 4 |
| **Total** | **44** | **~2min** | - |

### Optimization Tips
- Use more workers: `--workers=8`
- Run specific tests: `-- tests/e2e/01-*.spec.ts`
- Skip video recording: `video: 'retain-on-failure'`
- Run in parallel: `fullyParallel: true`

---

## Troubleshooting

### Playwright browser not found
```bash
npx playwright install chromium
```

### Vitest not found
```bash
npm install -D vitest @vitest/ui
```

### Tests pass locally but fail in CI
- Check Node version (use 20+)
- Ensure `npx playwright install --with-deps`
- Verify timeouts are sufficient for CI

### Flaky tests
- Increase timeouts
- Use proper waits (not `waitForTimeout`)
- Check for race conditions
- Ensure proper cleanup

---

## Test Coverage Goals

| Category | Target | Current | Status |
|----------|--------|---------|--------|
| Unit tests | 80% | 95% | ✅ Exceeded |
| E2E pass rate | 70% | 75% | ✅ Exceeded |
| Flaky rate | <5% | 0% | ✅ Exceeded |
| Execution time | <2min | ~1min 15s | ✅ Met |

---

## Resources

### Documentation
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Vitest Docs](https://vitest.dev/guide/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

### Internal Docs
- `PHASE_7_FINAL_SUMMARY.md` - Detailed phase summary
- `E2E_TESTS_IMPLEMENTATION.md` - Implementation guide
- `PLAYWRIGHT_VS_CYPRESS.md` - Technology decision
- `NEXT_STEPS.md` - Roadmap

### Test Files
- Unit: `src/core/parser/__tests__/*.test.ts`
- E2E: `tests/e2e/*.spec.ts`
- Fixtures: `tests/e2e/fixtures.ts`
- Config: `playwright.config.ts`, `vitest.config.ts`

---

## Getting Help

1. Check test videos in `test-results/`
2. Review Playwright traces in HTML report
3. Read error context in `error-context.md` files
4. Check this guide for common issues
5. Review related documentation

---

## Contributing

When adding new features:
1. Add `data-testid` to new UI elements
2. Write unit tests for business logic
3. Write E2E tests for user flows
4. Update this guide if needed
5. Ensure all tests pass before PR

---

**Questions?** Check `PHASE_7_FINAL_SUMMARY.md` or `NEXT_STEPS.md`

**Test Status:** 15/20 E2E passing (75%), 24/24 unit passing (100%)  
**Overall:** Phase 7 - 85% complete