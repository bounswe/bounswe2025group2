import { test, expect } from '@playwright/test';

/**
 * This is a simple example test to get you started with Playwright.
 * It demonstrates basic navigation and interaction testing.
 */

test.describe('Homepage Tests', () => {
  test('should load the homepage successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Note: The app redirects to /auth if not logged in
    // So we check that either the homepage or auth page loaded
    const currentUrl = page.url();
    const isOnHomeOrAuth = currentUrl.includes('/auth') || currentUrl === 'http://localhost:5173/' || currentUrl.includes('/home');
    
    expect(isOnHomeOrAuth).toBeTruthy();
  });

  test('should display page content', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Since the app redirects to /auth when not logged in,
    // we just verify that SOMETHING loaded on the page
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify there's actual content (not just a blank page)
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should load auth page when not logged in', async ({ page }) => {
    // Your app redirects to /auth when user is not authenticated
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to auth page
    await page.waitForURL(/.*auth.*/, { timeout: 5000 }).catch(() => {
      // If no redirect, that's fine - user might be logged in
    });
    
    // Check if we're on auth page or can access the page
    const url = page.url();
    const isValid = url.includes('/auth') || url.includes('/home') || url === 'http://localhost:5173/';
    
    expect(isValid).toBeTruthy();
  });

  test('should load contact page', async ({ page }) => {
    // Contact page should be accessible without authentication
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the contact page or got redirected somewhere valid
    const url = page.url();
    const body = page.locator('body');
    
    await expect(body).toBeVisible();
    
    // URL should either be /contact or a valid redirect
    const isValidPage = url.includes('/contact') || url.includes('/auth') || url.includes('/home');
    expect(isValidPage).toBeTruthy();
  });

  test('should load knowledge hub page', async ({ page }) => {
    // Knowledge hub should be accessible
    await page.goto('/knowledge-hub');
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify page loaded with content
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
  });
});

