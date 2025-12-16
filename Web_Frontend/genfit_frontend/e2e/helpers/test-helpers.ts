import { Page, expect } from '@playwright/test';

/**
 * Helper functions for E2E tests
 * These utilities make common test operations easier and more maintainable
 */

/**
 * Wait for API calls to complete
 * Useful when you need to ensure all network requests are finished
 */
export async function waitForApiCalls(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Login helper function
 * Use this to authenticate users in tests that require login
 * 
 * @example
 * await login(page, 'user@example.com', 'password123');
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForLoadState('networkidle');
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Adjust this selector based on your logout button
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Take a screenshot with a meaningful name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * Check if an element exists without throwing an error
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Fill out a form with multiple fields
 * 
 * @example
 * await fillForm(page, {
 *   'input[name="firstName"]': 'John',
 *   'input[name="lastName"]': 'Doe',
 *   'input[name="email"]': 'john@example.com'
 * });
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
}

/**
 * Wait for an element to be visible and enabled
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000) {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
  await expect(element).toBeEnabled({ timeout });
  return element;
}

/**
 * Scroll to an element and bring it into view
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Check if user is authenticated by looking for common auth indicators
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Adjust these selectors based on your app
  const authIndicators = [
    '[data-testid="user-menu"]',
    'button:has-text("Logout")',
    '[data-authenticated="true"]',
  ];
  
  for (const selector of authIndicators) {
    if (await elementExists(page, selector)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Mock API responses for testing
 * 
 * @example
 * await mockApiResponse(page, '** /api/users', { users: [] });
 */
export async function mockApiResponse(
  page: Page, 
  urlPattern: string, 
  response: any,
  status = 200
) {
  await page.route(urlPattern, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Wait for a specific API call to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string | RegExp, timeout = 10000) {
  return page.waitForResponse(urlPattern, { timeout });
}

/**
 * Generate random test data
 */
export function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `test.user.${timestamp}@example.com`,
    password: 'TestPassword123!',
    username: `testuser${timestamp}`,
    firstName: 'Test',
    lastName: 'User',
  };
}

/**
 * Handle dialogs (alerts, confirms, prompts)
 */
export async function handleDialog(page: Page, accept = true, promptText?: string) {
  page.on('dialog', async dialog => {
    if (promptText && dialog.type() === 'prompt') {
      await dialog.accept(promptText);
    } else if (accept) {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });
}

/**
 * Check console for errors
 * Useful for catching JavaScript errors during tests
 */
export function setupConsoleErrorTracking(page: Page) {
  const consoleErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });
  
  return {
    getErrors: () => consoleErrors,
    hasErrors: () => consoleErrors.length > 0,
  };
}

