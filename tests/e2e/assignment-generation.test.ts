import { test, expect } from '@playwright/test';
import { setupCredentials, CredentialsHelper } from './fixtures/credentials.ts';
import { TestHelper, setupTestEnvironment, createQuickTest } from './fixtures/test-helpers.ts';

test.describe('Assignment/Test Generation', () => {
  let credentialsHelper: CredentialsHelper;
  let testHelper: TestHelper;

  test.beforeEach(async ({ page }) => {
    // Set up the environment
    const environment = await setupTestEnvironment(page);
    testHelper = environment.testHelper;
  });

  test('should successfully configure OpenAI credentials and generate test questions', async ({ page }) => {
    // Configure OpenAI credentials
    credentialsHelper = await setupCredentials(page, 'openai');

    // Verify model configuration
    await credentialsHelper.verifyModelConfiguration('OpenAI GPT-4o', ['Text-Chat', 'Bild-Verständnis']);

    // Navigate to test creation
    await testHelper.navigateToCreateTest();

    // Create a test with AI generation
    await testHelper.createTest({
      name: 'Mathematics Quiz - Basic Algebra',
      description: 'This test covers fundamental algebra concepts including solving linear equations, working with variables, and basic algebraic operations. Students should demonstrate understanding of equation solving, variable manipulation, and algebraic reasoning.',
      generateWithAI: true
    });

    // Verify AI generation success
    await expect(page.getByText('AI has generated questions!')).toBeVisible();
    
    // Verify test assistant chat is working
    await expect(page.locator('.test-assistant-chat')).toBeVisible();

    // Wait for AI response and verify it's working
    const isWorking = await testHelper.verifyAIGenerationWorking();
    expect(isWorking).toBeTruthy();
  });

  test('should handle different modalities (text and vision)', async ({ page }) => {
    // Configure OpenAI with both text and vision capabilities
    credentialsHelper = await setupCredentials(page, 'openai');

    // Verify both capabilities are configured
    await credentialsHelper.verifyModelConfiguration('OpenAI GPT-4o', ['Text-Chat', 'Bild-Verständnis']);

    // Create a test that could use both modalities
    await testHelper.createTest({
      name: 'Science Test - Visual Analysis',
      description: 'This test includes both text-based questions and visual analysis questions with images and diagrams.',
      generateWithAI: true
    });

    // Verify generation works
    await expect(page.getByText('AI has generated questions!')).toBeVisible();
  });

  test('should allow manual question creation alongside AI generation', async ({ page }) => {
    // Setup credentials
    credentialsHelper = await setupCredentials(page, 'openai');

    // Navigate to test creation
    await testHelper.navigateToCreateTest();

    // Fill in basic test info
    await page.getByRole('textbox', { name: 'Test Name' }).fill('Mixed Question Types Test');
    await page.getByRole('textbox', { name: 'Test Description' }).fill('Test with both AI-generated and manual questions');

    // Generate questions with AI first
    await testHelper.generateQuestionsWithAI();

    // Add manual multiple choice question
    await testHelper.addManualQuestion({
      type: 'multiple-choice',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      points: 5
    });

    // Add manual true/false question
    await testHelper.addManualQuestion({
      type: 'true-false',
      question: 'The Earth is flat.',
      correctAnswer: 'false',
      points: 3
    });

    // Add manual short answer question
    await testHelper.addManualQuestion({
      type: 'short-answer',
      question: 'Explain the concept of photosynthesis.',
      correctAnswer: 'Photosynthesis is the process by which plants convert sunlight into energy.',
      points: 10
    });

    // Save the test
    await testHelper.saveTest();

    // Verify test was created
    await testHelper.verifyTestCreated('Mixed Question Types Test');
  });

  test('should handle test credentials and show appropriate error for AI generation', async ({ page }) => {
    // Setup test credentials (will cause API errors)
    credentialsHelper = await setupCredentials(page, 'test');

    // Try to create a test with AI generation
    await testHelper.createTest({
      name: 'Test with Invalid Credentials',
      description: 'This should fail due to invalid API credentials',
      generateWithAI: true
    });

    // Should see an error instead of success
    await expect(page.getByText('❌')).toBeVisible();
    await expect(page.getByText('Error')).toBeVisible();
  });

  test('should navigate through test workflow correctly', async ({ page }) => {
    // Setup credentials
    credentialsHelper = await setupCredentials(page, 'openai');

    // Test navigation through sidebar
    await testHelper.navigateToTestsViaSidebar();

    // Verify we're on tests page
    await expect(page).toHaveURL(/\/tests/);
    await expect(page.getByRole('heading', { name: 'Your Tests' })).toBeVisible();

    // Should see "No tests found" initially
    await expect(page.getByText('No tests found')).toBeVisible();

    // Click Create Test
    await page.getByRole('button', { name: 'Create Test' }).click();

    // Verify we're on compose page
    await expect(page).toHaveURL(/\/tests\/compose/);

    // Should see all necessary form elements
    await expect(page.getByRole('textbox', { name: 'Test Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Test Description' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Questions' })).toBeVisible();
  });

  test('should handle German language interface', async ({ page }) => {
    // Navigate to German interface
    await page.goto('/signin?lang=de');

    // Select teacher in German
    await page.getByRole('button', { name: 'Ich bin Lehrer' }).click();

    // Setup credentials
    credentialsHelper = new CredentialsHelper(page);
    await credentialsHelper.setupOpenAI();

    // Navigate to tests in German
    await page.getByRole('button', { name: 'Aufgaben' }).click();
    await page.getByRole('link', { name: 'Alle Aufgaben' }).click();

    // Verify German interface
    await expect(page.getByText('DeineAufgaben')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aufgabe erstellen' })).toBeVisible();
  });

  test('should verify complete end-to-end test creation flow', async ({ page }) => {
    // Setup credentials
    credentialsHelper = await setupCredentials(page, 'openai');

    // Create and verify a complete test
    const testName = `E2E Test ${Date.now()}`;
    
    await testHelper.createTest({
      name: testName,
      description: 'Complete end-to-end test creation flow verification',
      generateWithAI: true
    });

    // Verify AI generation worked
    await expect(page.getByText('AI has generated questions!')).toBeVisible();

    // Try to get generated questions
    const questions = await testHelper.getGeneratedQuestions();
    expect(questions.length).toBeGreaterThan(0);

    // Save the test
    await testHelper.saveTest();

    // Verify test appears in the list
    await testHelper.verifyTestCreated(testName);

    // Clean up - delete the test
    await testHelper.deleteTest(testName);
  });

  test.afterEach(async ({ page }) => {
    // Clean up any models that were created during testing
    if (credentialsHelper) {
      try {
        await credentialsHelper.resetModels();
      } catch (error) {
        console.log('Cleanup warning: Could not reset models', error);
      }
    }
  });
});

test.describe('Assignment Generation Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Setup test credentials that will fail
    const credentialsHelper = await setupCredentials(page, 'test');
    const testHelper = new TestHelper(page);

    await testHelper.navigateToCreateTest();

    // Try to generate questions with bad credentials
    await page.getByRole('textbox', { name: 'Test Name' }).fill('Network Error Test');
    await page.getByRole('textbox', { name: 'Test Description' }).fill('Testing network error handling');

    await page.getByRole('button', { name: 'Generate Questions' }).click();

    // Should show error message
    await expect(page.getByText('❌')).toBeVisible();
    await expect(page.getByText('Error')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const testHelper = new TestHelper(page);
    await testHelper.navigateToCreateTest();

    // Try to generate questions without filling required fields
    await page.getByRole('button', { name: 'Generate Questions' }).click();

    // Should show validation error or prevent submission
    // This depends on the actual validation implementation
    const hasValidation = await page.getByText('Please fill in required fields').count() > 0;
    
    if (!hasValidation) {
      // If no validation message, at least verify no AI chat opened
      const chatVisible = await page.locator('.test-assistant-chat').isVisible();
      expect(chatVisible).toBeFalsy();
    }
  });
});

test.describe('Multiple Model Support', () => {
  test('should support switching between different AI models', async ({ page }) => {
    const credentialsHelper = new CredentialsHelper(page);
    
    // Configure multiple models
    const openaiApiKey = Deno.env.get('TEST_OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('TEST_OPENAI_API_KEY environment variable is required for tests');
    }

    await credentialsHelper.configureModel({
      name: 'OpenAI GPT-4o',
      apiKey: openaiApiKey,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o',
      modalities: [{ type: 'text', enabled: true }]
    });

    await credentialsHelper.configureModel({
      name: 'OpenAI GPT-3.5',
      apiKey: openaiApiKey,
      apiEndpoint: 'https://api.openai.com/v1/chat/completions', 
      model: 'gpt-3.5-turbo',
      modalities: [{ type: 'text', enabled: true }]
    });

    // Set GPT-4o for text chat
    await credentialsHelper.setModelForCapability('text', 'OpenAI GPT-4o');

    // Verify model is set
    await expect(page.getByRole('button', { name: '💬 OpenAI GPT-4o' })).toBeVisible();

    // Switch to GPT-3.5
    await credentialsHelper.setModelForCapability('text', 'OpenAI GPT-3.5');

    // Verify model switch
    await expect(page.getByRole('button', { name: '💬 OpenAI GPT-3.5' })).toBeVisible();
  });
}); 