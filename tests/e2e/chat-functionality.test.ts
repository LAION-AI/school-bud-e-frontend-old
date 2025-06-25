import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test('should allow sending messages and show error with test credentials', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:8001');
    
    // Click on "Jetzt starten" to go to chat
    await page.getByRole('navigation').getByRole('link', { name: 'Jetzt starten' }).click();
    
    // Verify we're on the chat page
    await expect(page).toHaveURL(/\/chat\/0/);
    
    // Should see the welcome message and API key setup prompt
    await expect(page.getByText('Hallo! Ich bin School Bud-E, dein persönlicher Assistent')).toBeVisible();
    await expect(page.getByText('Um zu beginnen, musst du einen API-Schlüssel einrichten')).toBeVisible();
    
    // Click on "API-Schlüssel einrichten" to go to settings
    await page.getByRole('button', { name: 'API-Schlüssel einrichten' }).click();
    
    // Verify we're on the settings page
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible();
    
    // Click "Aktivieren" for Text-Chat capability
    await page.locator('div').filter({ hasText: /^Text-Chat$/ }).getByLabel('Aktivieren').click();
    
    // Fill in the model configuration form
    await page.getByRole('textbox', { name: 'Name*' }).fill('Test Model');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('test-api-key-123');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('https://api.openai.com/v1');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('gpt-3.5-turbo');
    
    // Verify Text-Chat capability is checked
    await expect(page.getByRole('checkbox', { name: '💬 Text-Chat' })).toBeChecked();
    
    // Click "Hinzufügen" to add the model
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    
    // Verify the model was added successfully
    await expect(page.getByRole('button', { name: '💬 Test Model' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Model', level: 4 })).toBeVisible();
    
    // Navigate back to chat
    await page.getByRole('link', { name: 'Chat 1 Chat herunterladen' }).click();
    
    // Verify we're back on the chat page
    await expect(page).toHaveURL(/\/chat\/0/);
    
    // Verify the chat input is now enabled
    const chatInput = page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' });
    await expect(chatInput).toBeEnabled();
    
    // Type a test message
    const testMessage = 'Hello, can you help me with a test message?';
    await chatInput.fill(testMessage);
    
    // Verify send button is enabled when text is entered
    const sendButton = page.getByRole('button', { name: 'Send message' });
    await expect(sendButton).toBeEnabled();
    
    // Send the message by pressing Enter
    await page.keyboard.press('Enter');
    
    // Verify the message appears in the chat
    await expect(page.getByText(testMessage)).toBeVisible();
    
    // Verify an error is shown (expected with test credentials)
    await expect(page.getByText('❌')).toBeVisible();
    await expect(page.getByText('Error')).toBeVisible();
    
    // Verify the input field is cleared and send button is disabled after sending
    await expect(chatInput).toHaveValue('');
    await expect(sendButton).toBeDisabled();
  });
  
  test('should have proper UI elements and accessibility', async ({ page }) => {
    // Navigate to chat
    await page.goto('http://localhost:8001/chat/0');
    
    // Check for proper ARIA labels and accessibility
    await expect(page.getByRole('textbox', { name: 'Schreibe mit dem School Bud-E' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload image or PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
    
    // Check navigation elements
    await expect(page.getByRole('button', { name: 'Chats' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aufgaben' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Graphs' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Presentation Generator' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Video Roman' })).toBeVisible();
  });
}); 