import { test, expect } from '@playwright/test';

test.describe('Mode Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display mode selector', async ({ page }) => {
    const modeSelector = page.locator('text=Analysis Mode');
    await expect(modeSelector).toBeVisible();
  });

  test('should show AI mode option', async ({ page }) => {
    const aiMode = page.locator('text=AI Analysis (Premium)');
    await expect(aiMode).toBeVisible();
  });

  test('should show Free mode option', async ({ page }) => {
    const freeMode = page.locator('text=Free Analysis (100% Free)');
    await expect(freeMode).toBeVisible();
  });

  test('should select AI mode by default', async ({ page }) => {
    const aiRadio = page.locator('input[value="ai"]');
    await expect(aiRadio).toBeChecked();
  });

  test('should allow switching to Free mode', async ({ page }) => {
    const freeRadio = page.locator('input[value="free"]');
    await freeRadio.click();
    await expect(freeRadio).toBeChecked();
  });

  test('should show mode descriptions', async ({ page }) => {
    // AI mode description
    const aiDescription = page.locator('text=Uses AssemblyAI, Deepgram, and Gemini');
    await expect(aiDescription).toBeVisible();
    
    // Free mode description
    const freeDescription = page.locator('text=Uses local Whisper.cpp and free algorithms');
    await expect(freeDescription).toBeVisible();
  });

  test('should show cost information', async ({ page }) => {
    // AI mode cost
    const aiCost = page.locator('text=~$0.50 per meeting');
    await expect(aiCost).toBeVisible();
    
    // Free mode cost
    const freeCost = page.locator('text=$0.00');
    await expect(freeCost).toBeVisible();
  });

  test('should persist mode selection', async ({ page }) => {
    // Select Free mode
    const freeRadio = page.locator('input[value="free"]');
    await freeRadio.click();
    
    // Verify it stays selected
    await page.waitForTimeout(500);
    await expect(freeRadio).toBeChecked();
  });
});
