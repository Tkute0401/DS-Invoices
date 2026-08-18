import { test, expect } from '@playwright/test';

// Use a single timestamp to keep names consistent across the journey
const timestamp = Date.now();
const clientName = `Journey Client ${timestamp}`;
const itemWithGstName = `Journey Item (GST) ${timestamp}`;
const itemNoGstName = `Journey Item (No GST) ${timestamp}`;

test.describe.serial('End-to-End User Journey', () => {
  
  test('Step 1: Create a Client', async ({ page }) => {
    await page.goto('/clients');
    const newClientButton = page.getByRole('button', { name: /Add Client/i });
    const nameInput = page.getByPlaceholder('e.g. Acme Corp');
    
    // Use expect.toPass to handle Next.js hydration race conditions
    await expect(async () => {
      await newClientButton.click();
      await expect(nameInput).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await nameInput.fill(clientName);
    
    // The optional inputs are GSTIN, PAN, Billing Address. Let's just fill address.
    const addressInput = page.locator('textarea[placeholder="Optional"]');
    if (await addressInput.isVisible()) await addressInput.fill('123 Journey Lane');
    
    const saveButton = page.getByRole('button', { name: /Save Client/i });
    
    // Wait for the API response to ensure it's saved
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/clients') && response.request().method() === 'POST');
    await saveButton.click();
    await responsePromise;
    
    // Wait for modal to close if it was a modal
    await expect(saveButton).toBeHidden({ timeout: 10000 });
  });

  test('Step 2: Create an Item', async ({ page }) => {
    await page.goto('/items');
    const newItemButton = page.getByRole('button', { name: /Add Item/i });
    const nameInput = page.getByPlaceholder('e.g. Web Development');
    
    // Handle React hydration
    await expect(async () => {
      await newItemButton.click();
      await expect(nameInput).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await nameInput.fill(itemWithGstName);
    
    // Fill SKU ID to prevent unique constraint violation in Prisma if left empty
    const skuInput = page.getByPlaceholder('Optional');
    await expect(skuInput).toBeVisible();
    await skuInput.fill(`SKU-${timestamp}`);
    
    // Price input is required, so we MUST wait for it and fill it
    const priceInput = page.getByPlaceholder('0.00').first();
    await expect(priceInput).toBeVisible({ timeout: 10000 });
    await priceInput.fill('1000');
    
    const saveButton = page.getByRole('button', { name: /Save Item/i });
    
    const responsePromise = page.waitForResponse(response => {
      if (response.url().includes('/api/items') && response.request().method() === 'POST') {
        console.log('Items POST response status:', response.status());
        return true;
      }
      return false;
    });
    await saveButton.click();
    await responsePromise;
    
    await expect(saveButton).toBeHidden({ timeout: 10000 });
  });

  test('Step 3: Create an Invoice with GST', async ({ page }) => {
    await page.goto('/invoices/new');
    
    await expect(page.getByRole('heading', { level: 1, name: /INVOICE/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Fill unique Invoice No to prevent Prisma unique constraint violation
    const invoiceNoInput = page.locator('span:text-is("Invoice No") + input');
    if (await invoiceNoInput.isVisible()) {
      await invoiceNoInput.fill(`INV-A-${timestamp}`);
    }
    
    // Fill Client details
    await page.getByPlaceholder('Client Name').fill(clientName);
    
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('textarea[placeholder="Item Name"]').fill(itemWithGstName);
    
    const inputs = firstRow.locator('input[type="number"]');
    // Ensure the inputs are available
    await expect(inputs.nth(0)).toBeVisible({ timeout: 10000 });
    
    await inputs.nth(0).fill('18'); // GST Rate
    await inputs.nth(1).fill('2');  // Qty
    await inputs.nth(2).fill('1000'); // Rate
    
    const saveButton = page.getByRole('button', { name: /Save to Database/i });
    
    const dialogPromise = page.waitForEvent('dialog');
    await saveButton.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/successfully/i);
    await dialog.accept();
  });

  test('Step 4: Create an Invoice without GST', async ({ page }) => {
    await page.goto('/invoices/new');
    
    await expect(page.getByRole('heading', { level: 1, name: /INVOICE/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Fill unique Invoice No
    const invoiceNoInput = page.locator('span:text-is("Invoice No") + input');
    if (await invoiceNoInput.isVisible()) {
      await invoiceNoInput.fill(`INV-B-${timestamp}`);
    }
    
    await page.getByPlaceholder('Client Name').fill(clientName);
    
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('textarea[placeholder="Item Name"]').fill(itemWithGstName);
    
    const inputs = firstRow.locator('input[type="number"]');
    await expect(inputs.nth(0)).toBeVisible({ timeout: 10000 });
    
    await inputs.nth(0).fill('0'); // GST Rate
    await inputs.nth(1).fill('5');  // Qty
    await inputs.nth(2).fill('500'); // Rate
    
    const saveButton = page.getByRole('button', { name: /Save to Database/i });
    
    const dialogPromise = page.waitForEvent('dialog');
    await saveButton.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/successfully/i);
    await dialog.accept();
  });

  test('Step 5: Record Payment and Create Receipt', async ({ page }) => {
    // Navigation directly to /receipts/new is usually safest if no intermediate button is reliable
    await page.goto('/receipts/new');
    
    await expect(page.getByRole('heading', { level: 1, name: /RECEIPT/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Fill unique Receipt No if applicable
    const receiptNoInput = page.locator('span:text-is("Receipt No") + input');
    if (await receiptNoInput.isVisible()) {
      await receiptNoInput.fill(`REC-${timestamp}`);
    }
    
    const clientNameInput = page.getByPlaceholder('Client Name').first();
    await expect(clientNameInput).toBeVisible({ timeout: 10000 });
    await clientNameInput.fill(clientName);
    
    const amountInput = page.getByPlaceholder('0.00').first();
    await expect(amountInput).toBeVisible({ timeout: 10000 });
    await amountInput.fill('2000');
    
    const saveButton = page.getByRole('button', { name: /Save to Database/i });
    
    // Listen for the dialog, check it, and dismiss it
    let dialogHandled = false;
    page.once('dialog', async dialog => {
      expect(dialog.message()).toMatch(/successfully/i);
      await dialog.accept();
      dialogHandled = true;
    });
    
    // Wait for the successful API response instead of just the click/dialog
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/receipts') && response.request().method() === 'POST' && response.status() === 200);
    await saveButton.click();
    await responsePromise;
    
    // Ensure dialog was handled
    await expect(async () => {
      expect(dialogHandled).toBe(true);
    }).toPass({ timeout: 10000 });
  });

});
