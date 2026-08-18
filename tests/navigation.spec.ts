import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to Dashboard', async ({ page }) => {
    await page.goto('/');
    // Check if the dashboard loads correctly
    await expect(page).toHaveTitle(/Invoice|Dashboard/i);
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
  });

  test('should navigate to Clients page', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { level: 1, name: /Clients/i })).toBeVisible();
  });

  test('should navigate to Items page', async ({ page }) => {
    await page.goto('/items');
    await expect(page.getByRole('heading', { level: 1, name: /Items|Products/i })).toBeVisible();
  });

  test('should navigate to Invoices page', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { level: 1, name: 'Invoices', exact: true })).toBeVisible();
  });

  test('should navigate to Receipts page', async ({ page }) => {
    await page.goto('/receipts');
    await expect(page.getByRole('heading', { level: 1, name: /Receipts/i })).toBeVisible();
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1, name: /Settings/i })).toBeVisible();
  });
});
