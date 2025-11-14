import { test, expect } from '@playwright/test';

test.describe('Video Upload Flow', () => {
  test('should show upload interface', async ({ page }) => {
    await page.goto('/');
    
    // Verify upload card is visible
    const uploadCard = page.locator('text=Smart Meeting Analysis');
    await expect(uploadCard).toBeVisible();
    
    // Verify file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('should display recent analyses section', async ({ page }) => {
    await page.goto('/');
    
    // Check if recent analyses section exists (may be empty)
    const recentSection = page.locator('text=Recent Analyses').or(page.locator('text=No analyses yet'));
    await expect(recentSection.first()).toBeVisible({ timeout: 5000 });
  });
});
