# E2E Tests

This directory contains end-to-end tests for the GenFit frontend application using Playwright.

## Quick Start

```bash
# Install dependencies (first time only)
npm install
npx playwright install

# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug
```

## Test Files

- `example.spec.ts` - Basic homepage and navigation tests
- `auth.spec.ts` - User authentication flows (login, registration)
- `navigation.spec.ts` - Application routing and navigation
- `accessibility.spec.ts` - Basic accessibility checks
- `helpers/test-helpers.ts` - Reusable utility functions

## Writing New Tests

1. Create a new `.spec.ts` file in this directory
2. Import test utilities:

```typescript
import { test, expect } from '@playwright/test';
```

3. Write your test:

```typescript
test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/my-feature');
    await page.click('button');
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

## Best Practices

✅ **DO**:
- Use meaningful test names that describe the user action
- Use `data-testid` attributes for reliable element selection
- Make tests independent (don't rely on other tests)
- Use helper functions from `helpers/test-helpers.ts`
- Wait for network idle or specific elements

❌ **DON'T**:
- Use hard-coded waits (`setTimeout`)
- Depend on test execution order
- Test implementation details (test user behavior instead)
- Create overly complex tests (break them down)

## Useful Commands

```bash
# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "login"

# Run in headed mode (see browser)
npx playwright test --headed

# Run in specific browser
npx playwright test --project=firefox

# Show test report
npm run test:e2e:report

# Generate tests by recording actions
npx playwright codegen http://localhost:5173
```

## Debugging

If a test fails:

1. Check the test output in terminal
2. Look at screenshots in `test-results/`
3. View HTML report: `npm run test:e2e:report`
4. Run in debug mode: `npm run test:e2e:debug`
5. Add `await page.pause()` to stop at a specific point

## CI/CD

E2E tests run automatically on GitHub Actions for every pull request. Check the "Actions" tab to see results.

## Need Help?

See the comprehensive guide: [E2E_TESTING_GUIDE.md](../E2E_TESTING_GUIDE.md)

