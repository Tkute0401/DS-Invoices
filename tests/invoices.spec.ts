import { test, expect } from '@playwright/test';

test.describe('Invoices Management', () => {
  test('should navigate to new invoice page and see the form', async ({ page }) => {
    await page.goto('/invoices');
    
    const newInvoiceBtn = page.getByRole('button', { name: /New|Create/i }).or(page.getByRole('link', { name: /New|Create/i }));
    if (await newInvoiceBtn.count() > 0) {
      await newInvoiceBtn.first().click();
    } else {
      await page.goto('/invoices/new');
    }

    // Verify we reached the new invoice page
    await expect(page).toHaveURL(/.*\/invoices\/new/);
    await expect(page.getByRole('heading', { level: 1, name: /INVOICE/i }).first()).toBeVisible({ timeout: 10000 });
  });
});
