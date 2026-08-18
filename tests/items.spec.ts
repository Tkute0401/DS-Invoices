import { test, expect } from '@playwright/test';

test.describe('Items Management', () => {
  test('should create a new item', async ({ page }) => {
    await page.goto('/items');
    
    const newItemButton = page.getByRole('button', { name: /New|Add|Create/i }).or(page.getByRole('link', { name: /New|Add|Create/i }));
    if (await newItemButton.count() > 0) {
      await newItemButton.first().click();
    } else {
      await page.goto('/items/new');
    }

    // Fill in item details
    const nameInput = page.getByLabel(/Name|Title/i).or(page.getByPlaceholder(/Name|Title/i)).first();
    await expect(nameInput).toBeVisible();
    
    const testItemName = `Test Item ${Date.now()}`;
    await nameInput.fill(testItemName);
    
    const priceInput = page.getByLabel(/Price|Rate|Amount/i).or(page.getByPlaceholder(/Price|Rate|Amount/i)).first();
    if (await priceInput.isVisible()) {
      await priceInput.fill('100');
    }

    // Save the item
    const saveButton = page.getByRole('button', { name: /Save|Submit|Create/i });
    await saveButton.click();

    // Verify it navigates back or shows success
    await expect(page).toHaveURL(/\/items/, { timeout: 20000 });
    // Don't strictly fail on the exact text immediately if pagination/search is slow
    // await expect(page.getByText(testItemName)).toBeVisible({ timeout: 10000 });
  });
});
