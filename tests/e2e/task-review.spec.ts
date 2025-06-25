import { test, expect } from '@playwright/test';

test.describe('Task Review Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/check');
  });

  test('should display task review interface', async ({ page }) => {
    // Check that the main heading is present
    await expect(page.getByRole('heading', { name: 'Aufgaben prüfen' })).toBeVisible();
    
    // Check that upload section is present
    await expect(page.getByText('Aufgaben hochladen')).toBeVisible();
    
    // Check that file input is present
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should show upload form elements', async ({ page }) => {
    // Check for file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', '.pdf');
    
    // Check for helper text
    await expect(page.getByText('Die PDF sollte die Arbeiten mehrerer Schüler enthalten')).toBeVisible();
  });

  test('should show sessions section', async ({ page }) => {
    await expect(page.getByText('Bewertungssitzungen')).toBeVisible();
    
    // Initially should show no sessions message
    await expect(page.getByText('Noch keine Sitzungen vorhanden')).toBeVisible();
  });

  test('should handle navigation back to tests', async ({ page }) => {
    const backLink = page.getByRole('link', { name: 'Zurück zu Tests' });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/tests');
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: 'Aufgaben prüfen' })).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByRole('heading', { name: 'Aufgaben prüfen' })).toBeVisible();
  });
}); 