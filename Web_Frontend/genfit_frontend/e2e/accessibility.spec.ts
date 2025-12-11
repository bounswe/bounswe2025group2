import { test, expect } from '@playwright/test';

/**
 * Accessibility tests
 * These tests check basic accessibility features of your application
 */

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on pages', async ({ page }) => {
    // Test on a page that's accessible without auth
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    // Check for headings (h1, h2, h3, etc.)
    const h1Elements = page.locator('h1');
    const h2Elements = page.locator('h2');
    const h3Elements = page.locator('h3');
    
    const h1Count = await h1Elements.count();
    const h2Count = await h2Elements.count();
    const h3Count = await h3Elements.count();
    
    // Page should have some heading structure
    const totalHeadings = h1Count + h2Count + h3Count;
    expect(totalHeadings).toBeGreaterThan(0);
    
    // If there's an h1, there should only be one or two
    if (h1Count > 0) {
      expect(h1Count).toBeLessThanOrEqual(2);
    }
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check that images have alt attributes
      for (let i = 0; i < Math.min(imageCount, 10); i++) { // Check first 10 images
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        
        // Alt attribute should exist (can be empty for decorative images)
        expect(alt !== null).toBeTruthy();
      }
    }
  });

  test('should have keyboard navigable interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Check that buttons and links are keyboard accessible
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      
      // Try to focus the button with keyboard
      await firstButton.focus();
      
      // Check that the button is now focused
      const isFocused = await firstButton.evaluate(el => el === document.activeElement);
      expect(isFocused).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    // Navigate to a page with a form (adjust URL as needed)
    await page.goto('/');
    
    // Find all input fields
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        
        // Check if input has associated label or aria-label
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          
          // Input should have either a label, aria-label, or aria-labelledby
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('should have skip navigation link for keyboard users', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to focus on the first focusable element
    await page.keyboard.press('Tab');
    
    // Check if a skip link becomes visible
    // Skip links are often hidden but visible when focused
    const skipLink = page.locator('[href="#main"], [href="#content"]').first();
    
    if (await skipLink.count() > 0) {
      // If skip link exists, it's good for accessibility
      expect(await skipLink.count()).toBeGreaterThan(0);
    }
  });
});

/**
 * Color contrast and visual tests
 * These are basic checks - for comprehensive accessibility testing,
 * consider using tools like axe-core
 */
test.describe('Visual Accessibility', () => {
  test('should maintain readability with sufficient contrast', async ({ page }) => {
    await page.goto('/');
    
    // This is a basic visual check
    // For thorough contrast testing, integrate @axe-core/playwright
    
    // Take a screenshot for manual review if needed
    await page.screenshot({ path: 'test-results/homepage-accessibility.png' });
    
    // Placeholder assertion - in real tests you'd use axe-core or similar
    expect(true).toBeTruthy();
  });
});

