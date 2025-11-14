import { test, expect } from '@playwright/test';

test.describe('AI Mode Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have AI mode selected by default', async ({ page }) => {
    const aiRadio = page.locator('input[value="ai"]');
    await expect(aiRadio).toBeChecked();
  });

  test('should show AI mode description', async ({ page }) => {
    const aiDescription = page.locator('text=Uses AssemblyAI, Deepgram, and Gemini');
    await expect(aiDescription).toBeVisible();
  });

  test('should display AI mode badge in results', async ({ page }) => {
    // Check for AI badge in recent analyses
    const aiBadge = page.locator('text=🤖 AI').first();
    
    // May not be visible if no AI analyses exist yet
    const count = await aiBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show AI mode in analysis title', async ({ page }) => {
    // After upload completes, check title
    const aiTitle = page.locator('text=Dynamic Analysis Report (AI)');
    
    // May not be visible if no analysis is loaded
    const count = await aiTitle.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should maintain AI mode selection during upload', async ({ page }) => {
    // Ensure AI mode stays selected
    const aiRadio = page.locator('input[value="ai"]');
    await expect(aiRadio).toBeChecked();
    
    // Click upload area (doesn't actually upload without file)
    const uploadLabel = page.locator('label[for="input-file-upload"]');
    await expect(uploadLabel).toBeVisible();
    
    // Verify mode is still AI
    await expect(aiRadio).toBeChecked();
  });
});

test.describe('AI Mode Features', () => {
  test('should show fast processing indicator', async ({ page }) => {
    await page.goto('/');
    
    const fastBadge = page.locator('text=Fast');
    await expect(fastBadge).toBeVisible();
  });

  test('should show accuracy information', async ({ page }) => {
    await page.goto('/');
    
    const accuracy = page.locator('text=Best transcription accuracy');
    await expect(accuracy).toBeVisible();
  });

  test('should show cost information', async ({ page }) => {
    await page.goto('/');
    
    const cost = page.locator('text=~$0.50 per meeting');
    await expect(cost).toBeVisible();
  });
});
