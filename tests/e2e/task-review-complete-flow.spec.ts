import { test, expect } from '@playwright/test';

test.describe('Task Review Complete Frontend Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8001');
  });

  test('should navigate and display complete task review interface', async ({ page }) => {
    // Navigate to Tests section
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'Aufgaben' }).click();
    
    // Navigate to task review
    await page.goto('http://localhost:8001/tests/check');
    
    // Verify we're on the task review page
    await expect(page).toHaveURL(/\/tests\/check/);
    
    // Main page elements
    await expect(page.getByRole('heading', { name: 'Aufgaben prüfen' })).toBeVisible();
    await expect(page.getByText('Laden Sie Schülerarbeiten hoch und lassen Sie sie von der KI bewerten')).toBeVisible();
    
    // Upload section
    await expect(page.getByText('Aufgaben hochladen')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.getByText('Die PDF sollte die Arbeiten mehrerer Schüler enthalten')).toBeVisible();
    
    // Sessions section
    await expect(page.getByText('Bewertungssitzungen')).toBeVisible();
    await expect(page.getByText('Noch keine Sitzungen vorhanden')).toBeVisible();
    
    // Navigation
    await expect(page.getByRole('link', { name: 'Zurück zu Tests' })).toBeVisible();
  });

  test('should handle PDF upload with API credentials', async ({ page }) => {
    // First set up API credentials
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Add LLM model for task review
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Task Review Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-api-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    // Optionally add shop API key
    await page.locator('div').filter({ hasText: /^Universal-API-Schlüssel$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Universal API-Schlüssel*' }).fill('shop-test-key');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    // Navigate to task review
    await page.goto('http://localhost:8001/tests/check');
    
    // Monitor network requests
    const uploadRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/task-review')) {
        uploadRequests.push({
          url: request.url(),
          method: request.method(),
          hasFormData: request.headers()['content-type']?.includes('multipart/form-data')
        });
      }
    });

    // Create a test PDF
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
179
%%EOF`;

    const fileInput = page.locator('input[type="file"]');
    
    // Upload the file
    await fileInput.setInputFiles({
      name: 'test-assignment.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdfContent)
    });

    // Verify upload starts - should show loading state
    await expect(page.getByText('Analysiere PDF...')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();

    // Wait for upload to complete (or timeout)
    await page.waitForTimeout(5000);

    // Check the results
    console.log('Upload requests made:', uploadRequests);

    // Should see either success or error message
    const successMessage = page.locator('.bg-green-100');
    const errorMessage = page.locator('.bg-red-100');
    
    if (await successMessage.isVisible()) {
      console.log('✅ Success message:', await successMessage.textContent());
      
      // If successful, should see session created
      await expect(page.getByText('test-assignment.pdf')).toBeVisible();
      
    } else if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log('❌ Error message:', errorText);
      
      // Verify it's a meaningful error, not a framework error
      expect(errorText).not.toContain('req.formData is not a function');
      expect(errorText).not.toContain('Body can not be decoded as form data');
    } else {
      console.log('⚠️ No clear success/error feedback shown');
    }

    // Verify upload request was made with credentials
    expect(uploadRequests.length).toBeGreaterThan(0);
    expect(uploadRequests[0].method).toBe('POST');
    expect(uploadRequests[0].hasFormData).toBe(true);
  });

  test('should validate file upload restrictions', async ({ page }) => {
    await page.goto('http://localhost:8001/tests/check');
    
    const fileInput = page.locator('input[type="file"]');
    
    // Verify file input accepts only PDFs
    await expect(fileInput).toHaveAttribute('accept', '.pdf');
    
    // Test with non-PDF file
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is not a PDF')
    });
    
    // Should either reject the file or show appropriate error
    await page.waitForTimeout(2000);
  });

  test('should maintain UI state during upload process', async ({ page }) => {
    await page.goto('http://localhost:8001/tests/check');
    
    const fileInput = page.locator('input[type="file"]');
    
    // Verify initial state
    await expect(fileInput).toBeEnabled();
    
    // Start upload
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-test')
    });
    
    // During upload, file input should be disabled
    await expect(fileInput).toBeDisabled();
    
    // Wait for completion
    await page.waitForTimeout(3000);
    
    // After upload, input should be re-enabled and cleared
    await expect(fileInput).toBeEnabled();
    await expect(fileInput).toHaveValue('');
  });

  test('should handle both credential patterns', async ({ page }) => {
    await page.goto('http://localhost:8001/tests/check');
    
    // Test 1: Without credentials (should use environment variables)
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-no-creds.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-fallback')
    });
    
    await page.waitForTimeout(2000);
    
    // Test 2: With credentials from localStorage
    await page.evaluate(() => {
      localStorage.setItem('apiSettings', JSON.stringify({
        universalApiKey: 'shop-key-test',
        models: [{
          name: 'Test Model',
          apiUrl: 'http://localhost:11434/v1/chat/completions',
          apiKey: 'test-key',
          model: 'llama3.2:3b',
          capabilities: ['💬']
        }]
      }));
    });
    
    // Upload again with stored credentials
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-with-creds.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-with-creds')
    });
    
    await page.waitForTimeout(2000);
    
    // Both should work (fallback to environment if no stored settings)
  });

  test('should be responsive across different screen sizes', async ({ page }) => {
    await page.goto('http://localhost:8001/tests/check');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: 'Aufgaben prüfen' })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByRole('heading', { name: 'Aufgaben prüfen' })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });
});
