import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

test.describe('Assignment/Test Generation - Simple', () => {
  // Configuration helper function
  async function setupOpenAICredentials(page: any) {
    // Navigate to settings
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible();

    // Click "Neues Modell" to add new model
    await page.getByRole('button', { name: 'Neues Modell' }).click();

    // Fill in OpenAI model details
    const openaiApiKey = process.env.TEST_OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('TEST_OPENAI_API_KEY environment variable is required for tests');
    }

    await page.getByRole('textbox', { name: 'Name*' }).fill('OpenAI GPT-4o');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill(openaiApiKey);
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('https://api.openai.com/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('gpt-4o');

    // Enable Text-Chat capability
    await page.getByRole('checkbox', { name: '💬 Text-Chat' }).check();
    await expect(page.getByRole('checkbox', { name: '💬 Text-Chat' })).toBeChecked();

    // Enable Image Understanding capability
    await page.getByRole('checkbox', { name: '👁️ Bild-Verständnis' }).check();
    await expect(page.getByRole('checkbox', { name: '👁️ Bild-Verständnis' })).toBeChecked();

    // Add the model
    await page.getByRole('button', { name: 'Hinzufügen' }).click();

    // Verify model was added
    await expect(page.getByRole('heading', { name: 'OpenAI GPT-4o', level: 4 })).toBeVisible();

    // Set OpenAI for Text-Chat capability
    await page.locator('button').filter({ hasText: '💬' }).first().click();
    await page.getByRole('button', { name: 'OpenAI GPT-4o', exact: true }).click();

    // Set OpenAI for Image Understanding capability  
    await page.locator('button').filter({ hasText: '👁️' }).first().click();
    await page.getByRole('button', { name: 'OpenAI GPT-4o', exact: true }).click();

    // Verify both capabilities are set
    await expect(page.getByRole('button', { name: '💬 OpenAI GPT-4o' })).toBeVisible();
    await expect(page.getByRole('button', { name: '👁️ OpenAI GPT-4o' })).toBeVisible();
  }

  // Helper to navigate to teacher dashboard
  async function signInAsTeacher(page: any) {
    await page.goto('/signin?lang=en');
    await page.getByRole('button', { name: 'I am a Teacher' }).click();
    await page.waitForLoadState('networkidle');
  }

  test('should configure OpenAI credentials successfully', async ({ page }) => {
    await signInAsTeacher(page);
    await setupOpenAICredentials(page);

    // Verify configuration is complete
    await expect(page.getByRole('button', { name: '💬 OpenAI GPT-4o' })).toBeVisible();
    await expect(page.getByRole('button', { name: '👁️ OpenAI GPT-4o' })).toBeVisible();
  });

  test('should navigate to test creation page', async ({ page }) => {
    await signInAsTeacher(page);
    await setupOpenAICredentials(page);

    // Navigate to tests via sidebar
    await page.getByRole('button', { name: 'Aufgaben' }).click();
    
    // Wait for dropdown and click "Alle Aufgaben"
    await expect(page.getByRole('link', { name: 'Alle Aufgaben' })).toBeVisible();
    await page.getByRole('link', { name: 'Alle Aufgaben' }).click();

    // Verify we're on tests page - should show German since default is German
    await expect(page).toHaveURL(/\/tests/);
    await expect(page.getByRole('heading', { name: 'Deine Aufgaben' })).toBeVisible();

    // Click Create Test - should be in German
    await page.getByRole('button', { name: 'Aufgabe erstellen' }).click();

    // Verify we're on compose page
    await expect(page).toHaveURL(/\/tests\/compose/);
    await expect(page.getByRole('textbox', { name: 'Test Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Test Description' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Questions' })).toBeVisible();
  });

  test('should generate test questions with AI successfully', async ({ page }) => {
    await signInAsTeacher(page);
    await setupOpenAICredentials(page);

    // Navigate to test creation
    await page.getByRole('button', { name: 'Aufgaben' }).click();
    await page.getByRole('link', { name: 'Alle Aufgaben' }).click();
    await page.getByRole('button', { name: 'Aufgabe erstellen' }).click();

    // Fill in test details
    await page.getByRole('textbox', { name: 'Test Name' }).fill('Mathematics Quiz - Basic Algebra');
    await page.getByRole('textbox', { name: 'Test Description' }).fill('This test covers fundamental algebra concepts including solving linear equations, working with variables, and basic algebraic operations.');

    // Generate questions with AI
    await page.getByRole('button', { name: 'Generate Questions' }).click();

    // Verify success
    await expect(page.getByText('AI has generated questions!')).toBeVisible();
    
    // Verify test assistant chat opened (look for the floating chat panel)
    await expect(page.getByText('Test Assistant')).toBeVisible();
    
    // Or check for the chat panel structure
    await expect(page.locator('div').filter({ hasText: 'Test Assistant' }).first()).toBeVisible();

    // Wait a bit for AI response
    await page.waitForTimeout(3000);
  });

  test('should handle test credentials with error gracefully', async ({ page }) => {
    await signInAsTeacher(page);

    // Setup test credentials (invalid)
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Neues Modell' }).click();
    await page.getByRole('textbox', { name: 'Name*' }).fill('Test Model Invalid');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill('invalid-test-key');
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('https://api.openai.com/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('gpt-3.5-turbo');
    await page.getByRole('checkbox', { name: '💬 Text-Chat' }).check();
    await page.getByRole('button', { name: 'Hinzufügen' }).click();

    // Set invalid model for text chat
    await page.locator('button').filter({ hasText: '💬' }).first().click();
    await page.getByRole('button', { name: 'Test Model Invalid', exact: true }).click();

    // Try to create test with AI generation
    await page.getByRole('button', { name: 'Aufgaben' }).click();
    await page.getByRole('link', { name: 'Alle Aufgaben' }).click();
    await page.getByRole('button', { name: 'Aufgabe erstellen' }).click();

    await page.getByRole('textbox', { name: 'Test Name' }).fill('Error Test');
    await page.getByRole('textbox', { name: 'Test Description' }).fill('This should show an error');
    await page.getByRole('button', { name: 'Generate Questions' }).click();

    // Should show error (look for the error pattern used in chat)
    await expect(page.getByText('❌', { exact: false })).toBeVisible();
    await expect(page.getByText('Error', { exact: false })).toBeVisible();
  });

  test('should support multiple modalities (text and vision)', async ({ page }) => {
    await signInAsTeacher(page);
    await setupOpenAICredentials(page);

    // Verify both text and vision capabilities are available
    await expect(page.getByRole('button', { name: '💬 OpenAI GPT-4o' })).toBeVisible();
    await expect(page.getByRole('button', { name: '👁️ OpenAI GPT-4o' })).toBeVisible();

    // Create a test that could use vision
    await page.getByRole('button', { name: 'Aufgaben' }).click();
    await page.getByRole('link', { name: 'Alle Aufgaben' }).click();
    await page.getByRole('button', { name: 'Aufgabe erstellen' }).click();

    await page.getByRole('textbox', { name: 'Test Name' }).fill('Science Test - Visual Analysis');
    await page.getByRole('textbox', { name: 'Test Description' }).fill('This test includes both text-based questions and visual analysis with diagrams and images.');

    await page.getByRole('button', { name: 'Generate Questions' }).click();
    await expect(page.getByText('AI has generated questions!')).toBeVisible();
  });

  test('should handle German language interface', async ({ page }) => {
    // Navigate to German interface
    await page.goto('/signin?lang=de');
    await page.getByRole('button', { name: 'Ich bin Lehrer' }).click();

    // Quick setup of model
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Neues Modell' }).click();
    const openaiApiKey = process.env.TEST_OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('TEST_OPENAI_API_KEY environment variable is required for tests');
    }

    await page.getByRole('textbox', { name: 'Name*' }).fill('OpenAI Test DE');
    await page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill(openaiApiKey);
    await page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill('https://api.openai.com/v1/chat/completions');
    await page.getByRole('textbox', { name: 'Modell*' }).fill('gpt-4o');
    await page.getByRole('checkbox', { name: '💬 Text-Chat' }).check();
    await page.getByRole('button', { name: 'Hinzufügen' }).click();

    // Set the model
    await page.locator('button').filter({ hasText: '💬' }).first().click();
    await page.getByRole('button', { name: 'OpenAI Test DE', exact: true }).click();

    // Navigate to tests in German
    await page.getByRole('button', { name: 'Aufgaben' }).click();
    await page.getByRole('link', { name: 'Alle Aufgaben' }).click();

    // Verify German interface
    await expect(page.getByText('Deine Aufgaben')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aufgabe erstellen' })).toBeVisible();
  });

  // Cleanup after each test
  test.afterEach(async ({ page }) => {
    try {
      // Go to settings and clean up any models created during testing
      await page.goto('/settings');
      
      // Look for delete buttons and click them (if any exist)
      const deleteButtons = page.locator('button:has(img[alt="Delete"])');
      const count = await deleteButtons.count();
      
      for (let i = count - 1; i >= 0; i--) {
        try {
          await deleteButtons.nth(i).click();
          await page.waitForTimeout(500);
        } catch (error) {
          console.log('Cleanup warning: Could not delete model', error);
        }
      }
    } catch (error) {
      console.log('Cleanup warning: Could not perform cleanup', error);
    }
  });
}); 