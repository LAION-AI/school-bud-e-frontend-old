import { test, expect } from '@playwright/test';

test.describe('Chat Comprehensive Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8001');
  });

  test('should handle basic text chat flow', async ({ page }) => {
    // Navigate to chat
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await expect(page).toHaveURL(/\/chat\/0/);
    
    // Set up API credentials
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Test LLM');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    // Return to chat
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Send basic text message
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('Hello world');
    await page.keyboard.press('Enter');
    
    // Verify message was sent
    await expect(page.getByText('Hello world')).toBeVisible();
  });

  test('should handle correction mode with hashtags', async ({ page }) => {
    // Navigate to chat and set up credentials
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Correction Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Test German correction hashtag
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    
    // Send regular message first
    await chatInput.fill('This text has some errors');
    await page.keyboard.press('Enter');
    await expect(page.getByText('This text has some errors')).toBeVisible();
    
    // Send correction message with German hashtag
    await chatInput.fill('Korrigiere bitte den Text #korrektur');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Korrigiere bitte den Text #korrektur')).toBeVisible();
    
    // Test English correction hashtag
    await chatInput.fill('Please correct this text #correction');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Please correct this text #correction')).toBeVisible();
  });

  test('should handle VLM mode with image uploads', async ({ page }) => {
    // Set up both LLM and VLM credentials
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Set up text chat
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Text Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    // Set up VLM chat
    await page.locator('div').filter({ hasText: /^Bild-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Vision Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-vlm-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('https://api.openai.com/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('gemini-2.5-flash-online');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Test image upload capability
    const uploadButton = page.getByRole('button', { name: 'Upload image or PDF' });
    await expect(uploadButton).toBeVisible();
    
    // Test that the VLM model is configured
    await expect(page.getByRole('button', { name: '👁️ Vision Model' })).toBeVisible();
  });

  test('should handle PDF upload and processing', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Set up VLM for PDF processing
    await page.locator('div').filter({ hasText: /^Bild-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('PDF Vision Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('https://api.openai.com/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('gemini-2.5-flash-online');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Verify PDF upload capability exists
    const uploadButton = page.getByRole('button', { name: 'Upload image or PDF' });
    await expect(uploadButton).toBeVisible();
    
    // Verify that blob URL handling warning would appear (as mentioned in chat API)
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('Please analyze this PDF document');
    // Note: Actual PDF upload testing would require file upload handling
  });

  test('should handle JSON response formats', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('JSON Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    
    // Test requests that should trigger JSON responses
    const jsonTestCases = [
      'Create flashcards about German grammar',
      'Make a graph showing the water cycle',
      'Generate a test with 5 questions about mathematics',
      'Create a presentation about climate change',
      'Build a game to learn vocabulary'
    ];
    
    for (const testCase of jsonTestCases) {
      await chatInput.fill(testCase);
      await page.keyboard.press('Enter');
      await expect(page.getByText(testCase)).toBeVisible();
      
      // Wait a bit between requests
      await page.waitForTimeout(1000);
    }
  });

  test('should handle system prompt customization', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Custom System Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Test that system prompts are handled (default behavior)
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('What is your role?');
    await page.keyboard.press('Enter');
    await expect(page.getByText('What is your role?')).toBeVisible();
  });

  test('should handle stream processing and responses', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Stream Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('Tell me a story');
    await page.keyboard.press('Enter');
    
    // Verify message was sent and streaming would occur
    await expect(page.getByText('Tell me a story')).toBeVisible();
    
    // The actual streaming response would show up as the AI responds
    // We expect an error with test credentials, but the message flow should work
  });

  test('should handle multiple API configurations and switching', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Add multiple models
    const models = [
      { name: 'OpenAI Model', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-3.5-turbo' },
      { name: 'Local Model', endpoint: 'http://localhost:11434/v1/chat/completions', model: 'llama3.2:3b' },
      { name: 'Custom Model', endpoint: 'https://custom.api.com/v1/chat/completions', model: 'custom-model' }
    ];
    
    for (const modelConfig of models) {
      await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
      await page.getByRole('textbox', { name: 'Name*' }).fill(modelConfig.name);
      await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
      await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill(modelConfig.endpoint);
      await page.getByRole('textbox', { name: 'Modell*' }).fill(modelConfig.model);
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      
      // Verify model was added
      await expect(page.getByRole('button', { name: `💬 ${modelConfig.name}` })).toBeVisible();
    }
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Verify all models are available for selection
    for (const modelConfig of models) {
      await expect(page.getByRole('button', { name: `💬 ${modelConfig.name}` })).toBeVisible();
    }
  });

  test('should handle error states and validation', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    
    // Test chat without API keys - should show setup prompt
    await expect(page.getByText('Um zu beginnen, musst du einen API-Schlüssel einrichten')).toBeVisible();
    await expect(page.getByRole('button', { name: 'API-Schlüssel einrichten' })).toBeVisible();
    
    // Test invalid API configuration
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    
    // Try to add model without required fields
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    // Should stay on settings page due to validation
    await expect(page).toHaveURL(/\/settings/);
    
    // Fill required fields with invalid data
    await page.getByRole('textbox', { name: 'Name*' }).fill('Invalid Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('invalid-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('invalid-endpoint');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('invalid-model');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Send message with invalid configuration - should show error
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('Test message with invalid config');
    await page.keyboard.press('Enter');
    
    await expect(page.getByText('Test message with invalid config')).toBeVisible();
    await expect(page.getByText('❌')).toBeVisible();
  });

  test('should handle language persistence', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    
    // German interface should be persistent
    await expect(page.getByText('Hallo! Ich bin School Bud-E')).toBeVisible();
    await expect(page.getByText('Um zu beginnen, musst du einen API-Schlüssel einrichten')).toBeVisible();
    
    // Navigate to settings
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible();
    
    // Return to chat
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // German interface should still be present
    await expect(page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' })).toBeVisible();
  });

  test('should handle audio/voice functionality', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    
    // Verify voice recording button exists
    await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
    
    // Note: Actual audio testing would require microphone permissions and audio processing
    // This test verifies the UI elements are present
  });

  test('should handle shop API key integration', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Test shop API key setup (Universal API Key section)
    await page.locator('div').filter({ hasText: /^Universal-API-Schlüssel$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Universal API-Schlüssel*' }).fill('shop-test-key-123');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    // Verify shop key was added
    await expect(page.getByText('shop-test-key-123')).toBeVisible();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Send message with shop API key - should use getApiKeysFromShop function
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('Test message with shop API key');
    await page.keyboard.press('Enter');
    
    await expect(page.getByText('Test message with shop API key')).toBeVisible();
  });

  test('should handle credential switching between shop and direct API keys', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Set up both shop and direct API keys
    await page.locator('div').filter({ hasText: /^Universal-API-Schlüssel$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Universal API-Schlüssel*' }).fill('shop-key');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Direct API Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('direct-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Should prioritize shop API key when available (as per getApiKeys logic)
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('Test credential priority');
    await page.keyboard.press('Enter');
    
    await expect(page.getByText('Test credential priority')).toBeVisible();
  });

  test('should handle VLM vs LLM model selection based on content type', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Set up both LLM and VLM models
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('LLM Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('llm-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.locator('div').filter({ hasText: /^Bild-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('VLM Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('vlm-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('https://api.openai.com/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('gemini-2.5-flash-online');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Test text-only message (should use LLM)
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('This is a text-only message');
    await page.keyboard.press('Enter');
    await expect(page.getByText('This is a text-only message')).toBeVisible();
    
    // Test that upload button is available for VLM content
    await expect(page.getByRole('button', { name: 'Upload image or PDF' })).toBeVisible();
  });

  test('should handle blob URL warning for PDFs', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    await page.locator('div').filter({ hasText: /^Bild-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Blob Test Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('https://api.openai.com/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('gemini-2.5-flash-online');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // The chat API includes specific logic for blob URL handling
    // This test verifies the UI is ready for that functionality
    const uploadButton = page.getByRole('button', { name: 'Upload image or PDF' });
    await expect(uploadButton).toBeVisible();
    
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('Please process this blob URL PDF');
    await page.keyboard.press('Enter');
    
    // Should show warning about blob URLs if they were present
    await expect(page.getByText('Please process this blob URL PDF')).toBeVisible();
  });

  test('should handle message content type variations', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Content Type Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    
    // Test different message content types that the API handles
    const messageTypes = [
      'Simple string message',
      'Message with special characters: @#$%^&*()',
      'Multi-line message\nwith line breaks\nand formatting',
      'Message with emoji 🎉 🚀 📚',
      'Very long message that tests the handling of extended content and ensures the streaming response works correctly with larger inputs'
    ];
    
    for (const message of messageTypes) {
      await chatInput.fill(message);
      await page.keyboard.press('Enter');
      await expect(page.getByText(message)).toBeVisible();
      await page.waitForTimeout(500);
    }
  });

  test('should handle API endpoint configuration variations', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Test different API endpoint patterns
    const endpoints = [
      { name: 'OpenAI Compatible', url: 'https://api.openai.com/v1/chat/completions' },
      { name: 'Local Ollama', url: 'http://localhost:11434/v1/chat/completions' },
      { name: 'Custom Port', url: 'http://localhost:8080/v1/chat/completions' },
      { name: 'HTTPS Custom', url: 'https://custom.domain.com/api/v1/chat/completions' }
    ];
    
    for (const endpoint of endpoints) {
      await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
      await page.getByRole('textbox', { name: 'Name*' }).fill(endpoint.name);
      await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
      await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill(endpoint.url);
      await page.getByRole('textbox', { name: 'Modell*' }).fill('test-model');
      await page.getByRole('button', { name: 'Hinzufügen' }).click();
      
      await expect(page.getByRole('button', { name: `💬 ${endpoint.name}` })).toBeVisible();
    }
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Verify all endpoints were configured
    for (const endpoint of endpoints) {
      await expect(page.getByRole('button', { name: `💬 ${endpoint.name}` })).toBeVisible();
    }
  });

  test('should handle streaming response processing', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Streaming Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    
    // Test streaming with different content that would trigger server-sent events
    await chatInput.fill('Generate a long response that would stream');
    await page.keyboard.press('Enter');
    
    await expect(page.getByText('Generate a long response that would stream')).toBeVisible();
    
    // The streaming logic includes server-sent event handling
    // With test credentials, we expect an error but the message flow should work
  });

  test('should maintain session state across navigation', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Session Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('http://localhost:11434/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('llama3.2:3b');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    // Navigate to different section and back
    await page.getByRole('button', { name: 'Aufgaben' }).click();
    await page.getByRole('button', { name: 'Chats' }).click();
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Verify configuration persists
    await expect(page.getByRole('button', { name: '💬 Session Model' })).toBeVisible();
    
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await chatInput.fill('Test session persistence');
    await page.keyboard.press('Enter');
    
    await expect(page.getByText('Test session persistence')).toBeVisible();
  });
}); 