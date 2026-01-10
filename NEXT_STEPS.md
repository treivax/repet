# Répét - Next Steps

**Date:** January 2025  
**Current Status:** Phase 7 - 85% Complete  
**Ready for:** Final test fixes and Phase 8 planning

---

## Immediate Actions (Next 1-2 Days)

### 1. Fix Italian Mode UI Timing (Priority: HIGH)
**Time estimate:** 2-3 hours  
**Impact:** 5 tests (Suite 02)

The `user-character-select` and related Italian mode UI elements don't appear immediately after clicking the Italian mode button due to React state updates.

**Options to fix:**

**Option A: Increase waits and scroll (Quick fix)**
```typescript
// In tests
await italianModeButton.click()
await pageWithTTS.waitForTimeout(2000) // Increase from 1000
await pageWithTTS.locator('body').evaluate(el => {
  const select = document.querySelector('[data-testid="user-character-select"]')
  select?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
```

**Option B: Add loading state to ItalianSettings (Better fix)**
```typescript
// In ItalianSettings.tsx
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  setIsLoading(false)
}, [])

// Add data-testid when ready
<div data-testid={isLoading ? undefined : "italian-settings-ready"}>
```

**Option C: Use Playwright's auto-wait (Best fix)**
```typescript
// Already implemented, but increase timeout
await expect(userCharacterSelect).toBeVisible({ timeout: 20000 })
```

**Recommended approach:** Use Option C with 20s timeout + scroll-into-view helper.

---

### 2. Fix Silent Mode Navigation Test (Priority: MEDIUM)
**Time estimate:** 30 minutes  
**Impact:** 1 test

The test expects `next-button` but PlayScreen might use different navigation controls.

**Fix:**
```typescript
// Verify we're on PlayScreen, not ReaderScreen
const playScreen = pageWithTTS.getByTestId('play-screen')
await expect(playScreen).toBeVisible()

// PlayScreen has NavigationControls component
// Check the actual component structure or use a more general selector
```

---

### 3. Update Suite 03 - Navigation (Priority: HIGH)
**Time estimate:** 2-3 hours  
**Impact:** Enable ~10 more tests

Update `tests/e2e/03-navigation.spec.ts`:

```typescript
// Replace old selectors
- page.getByRole('button', { name: /suivant/i })
+ page.getByTestId('next-button')

- page.locator('.scene-summary')
+ page.getByTestId('scene-summary')
```

**Tests to implement:**
- Keyboard shortcuts (←, →, Space, Esc)
- Scene navigation (prev/next scene buttons)
- Line navigation (prev/next line)
- Summary panel open/close
- Direct scene selection

---

### 4. Update Suite 04 - PWA & Offline (Priority: HIGH)
**Time estimate:** 3-4 hours  
**Impact:** Enable ~10 more tests

Update `tests/e2e/04-pwa-offline.spec.ts`:

**Key challenges:**
- Service worker registration timing
- Offline mode simulation
- Cache validation
- IndexedDB persistence across reloads

**Example test:**
```typescript
test('should work offline', async ({ page }) => {
  // Import a play first
  await importPlay(page)
  
  // Go offline
  await page.context().setOffline(true)
  
  // Verify app still works
  await page.reload()
  const playCard = page.getByTestId('play-card-')
  await expect(playCard.first()).toBeVisible()
})
```

---

## Short-term Actions (Next Week)

### 5. GitHub Actions CI/CD Setup
**Time estimate:** 2-3 hours  
**Priority:** MEDIUM

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e:chromium
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

### 6. Cross-Browser Validation
**Time estimate:** 1-2 hours  
**Priority:** LOW

Run full suite on Firefox:
```bash
npm run test:e2e:firefox
```

Document any browser-specific issues.

---

### 7. Add Missing Data-TestIds (If Needed)
**Time estimate:** 1 hour  
**Priority:** LOW

Check if LibraryScreen and SettingsScreen need testids:
- LibraryScreen: search, filters, sort options
- SettingsScreen: theme toggle, language selector

---

## Medium-term Actions (Next 2 Weeks)

### 8. Component-Level Tests (Optional)
**Time estimate:** 4-6 hours  
**Priority:** LOW

Add React Testing Library tests for complex components:

```typescript
// src/components/play/__tests__/CharacterSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CharacterSelector } from '../CharacterSelector'

test('selects character on click', () => {
  const onSelect = vi.fn()
  const characters = [{ id: '1', name: 'Hamlet' }]
  
  render(
    <CharacterSelector
      characters={characters}
      selectedCharacter={null}
      onSelectCharacter={onSelect}
    />
  )
  
  fireEvent.click(screen.getByText('Hamlet'))
  expect(onSelect).toHaveBeenCalledWith(characters[0])
})
```

---

### 9. Performance Benchmarks
**Time estimate:** 2-3 hours  
**Priority:** LOW

Add performance tests for:
- Large play import (>10,000 lines)
- Scene navigation speed
- TTS initialization time
- IndexedDB query performance

---

### 10. Accessibility (a11y) Tests
**Time estimate:** 3-4 hours  
**Priority:** MEDIUM

Add axe-core integration:

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('should have no a11y violations', async ({ page }) => {
  await page.goto('/')
  await injectAxe(page)
  await checkA11y(page)
})
```

---

## Phase 8 Planning

### Recommended Focus Areas

1. **Polish & UX Improvements**
   - Loading states
   - Error messages
   - Success notifications
   - Smooth transitions

2. **Advanced Features**
   - Multi-character selection
   - Custom speed per character
   - Scene bookmarks
   - Practice statistics

3. **Performance Optimization**
   - Code splitting
   - Lazy loading
   - Service worker caching strategy
   - IndexedDB query optimization

4. **Production Readiness**
   - Error tracking (Sentry)
   - Analytics (privacy-friendly)
   - Performance monitoring
   - User feedback mechanism

---

## Decision Points

### Question 1: Complete Phase 7 or Move to Phase 8?

**Option A: Complete Phase 7 (Recommended)**
- Fix 5 remaining E2E tests
- Update suites 03 & 04
- Add CI/CD
- **Time:** 8-12 hours
- **Benefit:** 100% test coverage, production-ready

**Option B: Move to Phase 8 with current tests**
- Accept 75% E2E pass rate
- Focus on new features
- **Risk:** Regression detection gaps
- **Benefit:** Faster feature delivery

**Recommendation:** Complete Phase 7 for stability.

---

### Question 2: Add WebKit/Safari Testing?

**Current:** Chromium + Firefox  
**Add:** WebKit (Safari emulation)

**Pros:**
- iOS compatibility validation
- Broader browser coverage
- Catches Safari-specific bugs

**Cons:**
- Requires system dependencies (libicu, libxml2)
- Slower test execution
- More maintenance

**Recommendation:** Add if targeting iOS users, skip otherwise.

---

### Question 3: Component Tests vs More E2E Tests?

**Component tests (React Testing Library):**
- Faster execution
- Easier to debug
- Better for logic testing
- Lower maintenance

**E2E tests (Playwright):**
- Full integration validation
- Catches integration bugs
- Better for user flows
- Higher confidence

**Recommendation:** 
- Use component tests for complex logic
- Use E2E tests for critical user paths
- Current balance is good (24 unit + 20 E2E)

---

## Quick Wins Checklist

Easy improvements that can be done quickly:

- [ ] Add `data-testid` to LibraryScreen search
- [ ] Add `data-testid` to SettingsScreen toggles
- [ ] Increase Italian mode test timeouts to 20s
- [ ] Add scroll-into-view helper function
- [ ] Document test execution in README
- [ ] Create test data fixtures for common scenarios
- [ ] Add test:watch script to package.json
- [ ] Set up Prettier for test files
- [ ] Add ESLint rules for test files
- [ ] Create test coverage badge

---

## Resources & References

### Documentation
- Playwright: https://playwright.dev/docs/intro
- Vitest: https://vitest.dev/guide/
- React Testing Library: https://testing-library.com/react

### Test Files
- Unit tests: `src/core/parser/__tests__/parser.test.ts`
- E2E Suite 01: `tests/e2e/01-import-parsing.spec.ts`
- E2E Suite 02: `tests/e2e/02-reading-modes.spec.ts`
- E2E Suite 03: `tests/e2e/03-navigation.spec.ts`
- E2E Suite 04: `tests/e2e/04-pwa-offline.spec.ts`

### Configuration
- Playwright: `playwright.config.ts`
- Vitest: `vitest.config.ts`
- Fixtures: `tests/e2e/fixtures.ts`

---

## Contact & Support

If you need help:
1. Check `PHASE_7_FINAL_SUMMARY.md` for detailed status
2. Review `E2E_TESTS_IMPLEMENTATION.md` for implementation details
3. Examine test videos in `test-results/` for failure analysis
4. Check Playwright traces for detailed debugging

---

## Success Criteria

Phase 7 will be 100% complete when:

- [ ] All 20 E2E tests passing (currently 15/20)
- [ ] All 24 unit tests passing (currently 24/24) ✅
- [ ] CI/CD pipeline configured
- [ ] Cross-browser validation complete
- [ ] All documentation updated
- [ ] Zero flaky tests ✅

**Current Progress: 85%**  
**Estimated time to 100%: 8-12 hours**

---

*Last updated: January 2025*  
*Phase 7 Status: SUBSTANTIALLY COMPLETE*