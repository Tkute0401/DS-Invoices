import { test, expect } from '@playwright/test';

test.describe('Receipts Management', () => {
  test('should navigate to new receipt page and see the form', async ({ page }) => {
    await page.goto('/receipts');
    
    const newReceiptBtn = page.getByRole('button', { name: /New|Create/i }).or(page.getByRole('link', { name: /New|Create/i }));
    if (await newReceiptBtn.count() > 0) {
      await newReceiptBtn.first().click();
    } else {
      await page.goto('/receipts/new');
    }

    // Verify the receipt form is visible
    const saveBtn = page.getByRole('button', { name: /Save|Submit|Create/i });
    await expect(saveBtn.first()).toBeVisible({ timeout: 10000 });
  });
});
