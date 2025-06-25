import { test, expect } from '@playwright/test';

test.describe('Task Review File Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/check');
  });

  test('should handle PDF file upload via API', async ({ page }) => {
    // Create a simple PDF-like file for testing
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

    // Test the file upload through the UI
    const fileInput = page.locator('input[type="file"]');
    
    // Create a file to upload
    await fileInput.setInputFiles({
      name: 'test-assignment.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdfContent)
    });

    // Wait for any upload process to complete
    await page.waitForTimeout(2000);

    // Check if any error messages appear
    const errorElement = page.locator('.bg-red-100');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('Upload error:', errorText);
    }
  });

  test('should test API endpoint directly', async ({ request }) => {
    // Create test PDF content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
xref
0 2
0000000000 65535 f 
0000000009 00000 n 
trailer
<<
/Size 2
/Root 1 0 R
>>
startxref
74
%%EOF`;

    // Test the API endpoint directly using multipart
    const response = await request.post('/api/task-review', {
      multipart: {
        pdf: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from(pdfContent)
        }
      }
    });

    console.log('Response status:', response.status());
    const responseText = await response.text();
    console.log('Response body:', responseText);

    // Expect either success or a specific error (not a framework error)
    if (response.status() !== 200) {
      // Should get a proper error response, not a framework error
      expect(responseText).not.toContain('req.formData is not a function');
      expect(responseText).not.toContain('Body can not be decoded as form data');
    }
  });

  test('should handle file upload interaction', async ({ page }) => {
    // Monitor network requests
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/task-review')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    // Monitor responses
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/task-review')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    const fileInput = page.locator('input[type="file"]');
    
    // Upload a file
    await fileInput.setInputFiles({
      name: 'sample.pdf', 
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nSimple PDF content')
    });

    // Wait for potential upload
    await page.waitForTimeout(3000);

    // Log the network activity
    console.log('Requests made:', requests);
    console.log('Responses received:', responses);

    // Check for success or error messages
    const successMessage = page.locator('.bg-green-100');
    const errorMessage = page.locator('.bg-red-100');
    
    if (await successMessage.isVisible()) {
      console.log('Success message:', await successMessage.textContent());
    }
    
    if (await errorMessage.isVisible()) {
      console.log('Error message:', await errorMessage.textContent());
    }
  });
}); 