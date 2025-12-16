# End-to-End (E2E) Testing Guide with Playwright

## What are E2E Tests?

End-to-End (E2E) tests are automated tests that simulate real user interactions with your entire application, from the user interface all the way through to the backend and database. Unlike unit tests that test individual functions or components in isolation, E2E tests verify that your complete application works correctly as a whole.

### Key Differences: Unit Tests vs E2E Tests

| Aspect | Unit Tests | E2E Tests |
|--------|-----------|-----------|
| **Scope** | Test individual functions/components | Test complete user workflows |
| **Speed** | Very fast (milliseconds) | Slower (seconds to minutes) |
| **Isolation** | Run in isolation with mocks | Run against real application |
| **Complexity** | Simple, focused tests | Complex, full-feature tests |
| **Purpose** | Verify code correctness | Verify user experience |
| **Example** | Test a button component renders | Test user can complete checkout |

### Real-World Example

**Unit Test**: "Does the login button component render correctly?"
```typescript
test('LoginButton renders with correct text', () => {
  render(<LoginButton />);
  expect(screen.getByText('Login')).toBeInTheDocument();
});
```

**E2E Test**: "Can a user actually log in to the application?"
```typescript
test('user can log in successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome back')).toBeVisible();
});
```

## Why Playwright?

Playwright is a modern E2E testing framework that offers:

- ✅ **Cross-browser testing** - Test in Chrome, Firefox, and Safari
- ✅ **Auto-wait** - Automatically waits for elements to be ready
- ✅ **Network interception** - Mock API calls when needed
- ✅ **Screenshots & videos** - Visual debugging of failures
- ✅ **Fast execution** - Faster than older tools like Selenium
- ✅ **Great developer experience** - Excellent debugging tools

## Project Structure

```
Web_Frontend/genfit_frontend/
├── e2e/                          # E2E test directory
│   ├── example.spec.ts          # Basic example tests
│   ├── auth.spec.ts             # Authentication flow tests
│   ├── navigation.spec.ts       # Navigation and routing tests
│   ├── accessibility.spec.ts    # Accessibility tests
│   └── helpers/
│       └── test-helpers.ts      # Reusable test utilities
├── playwright.config.ts         # Playwright configuration
└── package.json                 # Updated with E2E scripts
```

## Running E2E Tests

### Installation

First, install the dependencies:

```bash
cd Web_Frontend/genfit_frontend
npm install
npx playwright install  # Install browser binaries
```

### Running Tests Locally

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run with UI mode (see tests run visually)
npm run test:e2e:ui

# Debug a specific test
npm run test:e2e:debug

# Run tests in a specific file
npx playwright test e2e/auth.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=firefox
npx playwright test --project=chromium
npx playwright test --project=webkit
```

### Viewing Test Reports

After running tests:

```bash
npm run test:e2e:report
```

This opens an interactive HTML report showing:
- Which tests passed/failed
- Screenshots of failures
- Videos of test runs
- Detailed step-by-step traces

## Writing Your First E2E Test

### Basic Structure

Every Playwright test follows this structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  // Runs before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // 1. Arrange: Set up test conditions
    await page.goto('/some-page');
    
    // 2. Act: Perform user actions
    await page.click('button');
    await page.fill('input', 'value');
    
    // 3. Assert: Verify expected outcomes
    await expect(page.locator('.result')).toHaveText('Expected');
  });
});
```

### Common Actions

```typescript
// Navigation
await page.goto('/login');
await page.goBack();
await page.goForward();
await page.reload();

// Finding elements
const button = page.locator('button');
const byText = page.getByText('Login');
const byRole = page.getByRole('button', { name: 'Submit' });
const byTestId = page.getByTestId('submit-btn');

// Interactions
await page.click('button');
await page.fill('input[name="email"]', 'test@example.com');
await page.check('input[type="checkbox"]');
await page.selectOption('select', 'option-value');
await page.press('input', 'Enter');

// Waiting
await page.waitForLoadState('networkidle');
await page.waitForSelector('.loading', { state: 'hidden' });
await page.waitForURL(/\/dashboard/);

// Assertions
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveTitle(/Dashboard/);
await expect(page.locator('.message')).toBeVisible();
await expect(page.locator('.count')).toHaveText('5');
await expect(page.locator('button')).toBeEnabled();
```

## Example Test Scenarios

### 1. Testing User Registration

```typescript
test('new user can register successfully', async ({ page }) => {
  // Go to registration page
  await page.goto('/register');
  
  // Fill out registration form
  await page.fill('input[name="email"]', 'newuser@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
  await page.fill('input[name="username"]', 'newuser');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Verify successful registration
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('.welcome-message')).toContainText('Welcome');
});
```

### 2. Testing Form Validation

```typescript
test('shows error when submitting empty form', async ({ page }) => {
  await page.goto('/contact');
  
  // Try to submit empty form
  await page.click('button[type="submit"]');
  
  // Check for validation errors
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
});
```

### 3. Testing Navigation

```typescript
test('user can navigate through main pages', async ({ page }) => {
  await page.goto('/');
  
  // Click navigation link
  await page.click('a[href="/about"]');
  await expect(page).toHaveURL(/\/about/);
  
  // Verify page content loaded
  await expect(page.locator('h1')).toContainText('About Us');
});
```

### 4. Testing API Integration

```typescript
test('displays data from API', async ({ page }) => {
  // Intercept API call
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify([
        { id: 1, name: 'Test User' }
      ])
    });
  });
  
  await page.goto('/users');
  
  // Verify data is displayed
  await expect(page.locator('.user-list')).toContainText('Test User');
});
```

## Best Practices

### 1. Use Meaningful Test Names

```typescript
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('user can login with valid credentials', async ({ page }) => { ... });
```

### 2. Use Data Test IDs

Add `data-testid` attributes to your components for reliable selection:

```tsx
// In your React component
<button data-testid="submit-button">Submit</button>

// In your test
await page.getByTestId('submit-button').click();
```

### 3. Don't Depend on Other Tests

Each test should be independent and not rely on the state from previous tests.

```typescript
// ❌ Bad - depends on previous test
test('login', async ({ page }) => { ... });
test('view profile', async ({ page }) => { 
  // Assumes user is already logged in
});

// ✅ Good - each test is independent
test('view profile when logged in', async ({ page }) => {
  await login(page, 'user@example.com', 'password');
  // Now test profile viewing
});
```

### 4. Use Helper Functions

Create reusable functions for common operations:

```typescript
// e2e/helpers/auth-helpers.ts
export async function loginAsUser(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

// In your test
test('user can view profile', async ({ page }) => {
  await loginAsUser(page, 'test@example.com');
  // Continue with test...
});
```

### 5. Handle Waits Properly

Playwright auto-waits, but sometimes you need explicit waits:

```typescript
// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for specific element
await page.waitForSelector('.data-loaded');

// Wait for URL change
await page.waitForURL(/\/dashboard/);
```

## Debugging Tests

### 1. Run in Debug Mode

```bash
npm run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through tests line by line
- See what the browser sees
- Inspect locators
- View console logs

### 2. Add Breakpoints

```typescript
test('my test', async ({ page }) => {
  await page.goto('/');
  
  // Pause execution here
  await page.pause();
  
  // Continue with test...
});
```

### 3. Take Screenshots

```typescript
test('screenshot example', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'screenshot.png' });
});
```

### 4. View Console Logs

```typescript
test('check console', async ({ page }) => {
  page.on('console', msg => console.log('Browser log:', msg.text()));
  await page.goto('/');
});
```

## CI/CD Integration

E2E tests are automatically run in GitHub Actions when you create a pull request. The workflow:

1. Builds and starts the backend (Django)
2. Builds and serves the frontend (Vite)
3. Runs all Playwright E2E tests
4. Uploads test reports and screenshots as artifacts

You can download these artifacts from the GitHub Actions run to see:
- HTML report with test results
- Screenshots of any failures
- Videos of test runs

## Common Issues and Solutions

### Issue: Test times out

**Solution**: Increase timeout or check if element selector is correct

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

### Issue: Element not found

**Solution**: Use better selectors or add waits

```typescript
// ❌ Bad - element might not be loaded yet
await page.click('button');

// ✅ Good - wait for element to be visible
await page.waitForSelector('button');
await page.click('button');

// ✅ Better - Playwright auto-waits with locators
await page.locator('button').click();
```

### Issue: Flaky tests (sometimes pass, sometimes fail)

**Solution**: 
- Avoid hard-coded waits (`sleep`)
- Use proper wait conditions
- Don't depend on animation timing

```typescript
// ❌ Bad - flaky
await page.click('button');
await new Promise(r => setTimeout(r, 1000)); // Wait 1 second

// ✅ Good - reliable
await page.click('button');
await page.waitForSelector('.result');
```

## Next Steps

1. **Customize the example tests** in the `e2e/` directory to match your actual application
2. **Add more test scenarios** for your key user flows:
   - User registration and login
   - Creating/editing content
   - Payment flows (if applicable)
   - Search functionality
   - Profile management
3. **Review test results** in CI/CD to catch issues before deployment
4. **Gradually increase coverage** by adding tests for new features

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test Generator](https://playwright.dev/docs/codegen) - Record your actions to generate tests
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer) - Debug failed tests visually

## Need Help?

- Run tests with `--debug` flag to step through them
- Use `page.pause()` to stop execution and inspect the page
- Check the Playwright Discord community
- Review the example tests in this project

Happy testing! 🎭

