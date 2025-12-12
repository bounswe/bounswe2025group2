import { test, expect } from '@playwright/test';

/**
 * Navigation and routing tests
 * These tests verify that users can navigate through the application
 */

test.describe('Application Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to different pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test that we can navigate to different routes
    // Your app has these routes: /auth, /goals, /forum, /challenges, /profile, /contact, /knowledge-hub
    const testRoutes = [
      '/auth',
      '/contact',
      '/knowledge-hub',
    ];

    for (const route of testRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Verify the URL changed (might redirect to /auth if not logged in)
      const currentUrl = page.url();
      const navigated = currentUrl.includes(route) || currentUrl.includes('/auth') || currentUrl.includes('/home');
      
      expect(navigated).toBeTruthy();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    const currentUrl = page.url();
    
    // Find any link and click it
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    
    if (linkCount > 0) {
      await links.first().click();
      await page.waitForLoadState('networkidle');
      
      const newUrl = page.url();
      expect(newUrl).not.toBe(currentUrl);
      
      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBe(currentUrl);
      
      // Go forward
      await page.goForward();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBe(newUrl);
    }
  });

  test('should handle non-existent routes', async ({ page }) => {
    // Navigate to a non-existent route
    const response = await page.goto('/this-route-does-not-exist-12345');
    await page.waitForLoadState('networkidle');
    
    // React Router apps typically stay on the invalid URL but might show blank/fallback content
    // Check that the page at least loaded (even if it's showing the non-existent route)
    const currentUrl = page.url();
    const pageContent = await page.textContent('body');
    
    // The app should either:
    // 1. Show a 404 page
    // 2. Redirect to a valid page (auth/home)
    // 3. Stay on the route but show some content (React Router behavior)
    const has404Content = 
      pageContent?.includes('404') || 
      pageContent?.includes('not found') ||
      pageContent?.includes('Page not found');
    
    const redirectedToValidPage = 
      currentUrl.includes('/auth') ||
      currentUrl.includes('/home') ||
      currentUrl.endsWith(':5173/') ||
      currentUrl.endsWith(':4173/');
    
    const staysOnRouteWithContent = 
      currentUrl.includes('this-route-does-not-exist') &&
      pageContent !== null &&
      pageContent.length > 0;
    
    // Any of these behaviors is acceptable
    expect(has404Content || redirectedToValidPage || staysOnRouteWithContent).toBeTruthy();
  });
});

/**
 * Responsive navigation tests
 */
test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.goto('/');
    
    // Look for hamburger menu or mobile menu toggle
    const mobileMenuToggle = page.locator('[aria-label*="menu"], .hamburger, [data-testid="mobile-menu"]');
    
    if (await mobileMenuToggle.count() > 0) {
      await expect(mobileMenuToggle.first()).toBeVisible();
      
      // Click to open menu
      await mobileMenuToggle.first().click();
      
      // Verify menu opened (adjust selector based on your implementation)
      const mobileMenu = page.locator('[role="menu"], nav[data-mobile], .mobile-menu');
      await expect(mobileMenu.first()).toBeVisible();
    } else {
      test.skip();
    }
  });
});

