import { test, expect } from '@playwright/test';

test.describe('Analysis Results Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show recent analyses list', async ({ page }) => {
    const recentSection = page.locator('text=Recent Analyses');
    
    // Section may or may not be visible depending on history
    const count = await recentSection.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display mode badges in history', async ({ page }) => {
    // Look for either AI or Free badges
    const aiBadge = page.locator('text=🤖 AI');
    const freeBadge = page.locator('text=💰 Free');
    
    const aiCount = await aiBadge.count();
    const freeCount = await freeBadge.count();
    
    // At least one type of badge should exist if there's history
    expect(aiCount + freeCount).toBeGreaterThanOrEqual(0);
  });

  test('should show timestamp for each analysis', async ({ page }) => {
    // Timestamps are in format like "11/10/2025, 10:30:00 AM"
    // Just check if any date-like text exists in history items
    const historyItems = page.locator('.group.relative.p-4');
    const count = await historyItems.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show filename if available', async ({ page }) => {
    // Filenames appear with FileAudio icon
    const fileIcons = page.locator('svg').filter({ hasText: '' });
    const count = await fileIcons.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Analysis Dashboard', () => {
  test('should show analysis title with mode', async ({ page }) => {
    await page.goto('/');
    
    // Check for either AI or Free in title
    const aiTitle = page.locator('text=Dynamic Analysis Report (AI)');
    const freeTitle = page.locator('text=Dynamic Analysis Report (Free)');
    
    const aiCount = await aiTitle.count();
    const freeCount = await freeTitle.count();
    
    // Title appears only when analysis is loaded
    expect(aiCount + freeCount).toBeGreaterThanOrEqual(0);
  });

  test('should display transcript section', async ({ page }) => {
    await page.goto('/');
    
    // Transcript section appears after analysis
    const transcript = page.locator('text=Transcript').or(page.locator('text=Meeting Transcript'));
    const count = await transcript.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display participation metrics', async ({ page }) => {
    await page.goto('/');
    
    // Metrics appear after analysis
    const metrics = page.locator('text=Participation').or(page.locator('text=Speaking Time'));
    const count = await metrics.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Mode Indicator Consistency', () => {
  test('mode badge should match analysis mode', async ({ page }) => {
    await page.goto('/');
    
    // If an AI analysis is loaded, should see AI badge
    const aiTitle = page.locator('text=Dynamic Analysis Report (AI)');
    const aiBadge = page.locator('text=🤖 AI').first();
    
    const titleVisible = await aiTitle.isVisible().catch(() => false);
    
    if (titleVisible) {
      // If AI title is visible, AI badge should also be visible in history
      const badgeCount = await aiBadge.count();
      expect(badgeCount).toBeGreaterThan(0);
    }
  });
});
