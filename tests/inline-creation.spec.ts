import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const inlineClientName = `Inline Client ${timestamp}`;
const inlineItemName = `Inline Item ${timestamp}`;

test.describe('Inline Creation in Invoice Editor', () => {
  
  test('should create a new client and item from the invoice editor', async ({ page }) => {
    // 1. Go to New Invoice page
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('>>', request.method(), request.url());
        if (request.url().includes('/api/invoices') && request.method() === 'POST') {
          console.log('INVOICE PAYLOAD:', request.postData());
        }
      }
    });
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        console.log('<<', response.status(), response.url());
        if (response.status() >= 400) {
          console.log('Error Body:', await response.text());
        }
      }
    });

    await page.goto('/invoices/new');
    
    // Fill unique Invoice No to prevent Prisma unique constraint violation
    const invoiceNoInput = page.locator('span:text-is("Invoice No") + input');
    await expect(invoiceNoInput).toBeVisible({ timeout: 15000 });
    await invoiceNoInput.fill(`INV-INLINE-${timestamp}`);
    
    // 2. Create Inline Client using CreatableSelect
    // The CreatableSelect is visible on hover over the "Invoice To" box
    const invoiceToBox = page.locator('h2:text("Invoice To")').locator('..');
    await invoiceToBox.hover();
    
    const clientSelectInput = page.locator('#react-select-invoice-client-select-input');
    await expect(clientSelectInput).toBeAttached();
    // Force click in case the opacity transition isn't completely finished
    await clientSelectInput.click({ force: true });
    await clientSelectInput.fill(inlineClientName);
    await clientSelectInput.press('Enter');
    
    // Verify it populated the text input for client name
    const clientNamePlaceholder = page.getByPlaceholder('Client Name');
    await expect(clientNamePlaceholder).toHaveValue(inlineClientName);
    
    // 3. Create Inline Item using CreatableSelect
    // Hover over the first row to reveal the item select
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    
    const itemSelectInput = page.locator('#react-select-item-select-0-input');
    await expect(itemSelectInput).toBeAttached();
    await itemSelectInput.click({ force: true });
    await itemSelectInput.fill(inlineItemName);
    await itemSelectInput.press('Enter');
    
    // Verify it populated the textarea for item name
    const itemNameTextarea = firstRow.locator('textarea[placeholder="Item Name"]');
    await expect(itemNameTextarea).toHaveValue(inlineItemName);
    
    // Fill in required fields for the item
    const inputs = firstRow.locator('input[type="number"]');
    await inputs.nth(0).fill('18'); // GST Rate
    await inputs.nth(1).fill('1');  // Qty
    await inputs.nth(2).fill('1500'); // Rate
    
    // 4. Save Invoice
    const saveButton = page.getByRole('button', { name: /Save to Database/i });
    
    let dialogHandled = false;
    page.once('dialog', async dialog => {
      expect(dialog.message()).toMatch(/successfully/i);
      await dialog.accept();
      dialogHandled = true;
    });
    
    // We expect 3 POST requests: clients, items, invoices
    const clientResponsePromise = page.waitForResponse(r => r.url().includes('/api/clients') && r.request().method() === 'POST' && r.status() === 200);
    const itemResponsePromise = page.waitForResponse(r => r.url().includes('/api/items') && r.request().method() === 'POST' && r.status() === 200);
    const invoiceResponsePromise = page.waitForResponse(r => r.url().includes('/api/invoices') && r.request().method() === 'POST' && r.status() === 200);
    
    await saveButton.click();
    
    // Wait for all three requests to successfully complete
    await Promise.all([clientResponsePromise, itemResponsePromise, invoiceResponsePromise]);
    
    await expect(async () => {
      expect(dialogHandled).toBe(true);
    }).toPass({ timeout: 10000 });
    
    // 5. Verify the Client actually exists in the Clients page
    await page.goto('/clients');
    await expect(page.getByText(inlineClientName).first()).toBeVisible({ timeout: 15000 });
    
    // 6. Verify the Item actually exists in the Items page
    await page.goto('/items');
    await expect(page.getByText(inlineItemName).first()).toBeVisible({ timeout: 15000 });
  });

});
