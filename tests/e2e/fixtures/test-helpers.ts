import { Page, expect } from '@playwright/test';

export interface TestConfig {
  name: string;
  description: string;
  topic?: string;
  generateWithAI?: boolean;
  questions?: ManualQuestion[];
}

export interface ManualQuestion {
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points?: number;
}

export class TestHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to the tests page
   */
  async navigateToTests(): Promise<void> {
    await this.page.goto('/tests');
    await expect(this.page.getByRole('heading', { name: 'Your Tests' })).toBeVisible();
  }

  /**
   * Navigate to test creation page
   */
  async navigateToCreateTest(): Promise<void> {
    await this.navigateToTests();
    await this.page.getByRole('button', { name: 'Create Test' }).click();
    await expect(this.page).toHaveURL(/\/tests\/compose/);
  }

  /**
   * Navigate to tests via sidebar
   */
  async navigateToTestsViaSidebar(): Promise<void> {
    // Click on Aufgaben (Tasks) in sidebar
    await this.page.getByRole('button', { name: 'Aufgaben' }).click();
    
    // Wait for dropdown to appear
    await expect(this.page.getByRole('link', { name: 'Alle Aufgaben' })).toBeVisible();
    
    // Click on "Alle Aufgaben" (All Tasks)
    await this.page.getByRole('link', { name: 'Alle Aufgaben' }).click();
    
    await expect(this.page).toHaveURL(/\/tests/);
    await expect(this.page.getByRole('heading', { name: 'Your Tests' })).toBeVisible();
  }

  /**
   * Create a test with specified configuration
   */
  async createTest(config: TestConfig): Promise<void> {
    await this.navigateToCreateTest();

    // Fill in test name
    await this.page.getByRole('textbox', { name: 'Test Name' }).fill(config.name);

    // Fill in test description
    if (config.description) {
      await this.page.getByRole('textbox', { name: 'Test Description' }).fill(config.description);
    }

    // Select topic if provided
    if (config.topic) {
      await this.page.getByRole('combobox', { name: 'Associated Topic/Node' }).click();
      await this.page.getByRole('option', { name: config.topic }).click();
    }

    // Generate questions with AI if requested
    if (config.generateWithAI) {
      await this.generateQuestionsWithAI();
    }

    // Add manual questions if provided
    if (config.questions && config.questions.length > 0) {
      for (const question of config.questions) {
        await this.addManualQuestion(question);
      }
    }
  }

  /**
   * Generate questions using AI
   */
  async generateQuestionsWithAI(): Promise<void> {
    // Click the Generate Questions button
    await this.page.getByRole('button', { name: 'Generate Questions' }).click();

    // Wait for success message
    await expect(this.page.getByText('AI has generated questions!')).toBeVisible();

    // Verify test assistant chat is opened
    await expect(this.page.locator('.test-assistant-chat')).toBeVisible();

    // Wait for AI response (with a reasonable timeout)
    await this.page.waitForTimeout(5000);
  }

  /**
   * Add a manual question to the test
   */
  async addManualQuestion(question: ManualQuestion): Promise<void> {
    // Click "Add Question" button
    await this.page.getByRole('button', { name: 'Add Question' }).click();

    // Select question type
    await this.page.getByRole('combobox', { name: 'Question Type' }).click();
    await this.page.getByRole('option', { name: question.type }).click();

    // Fill in question text
    await this.page.getByRole('textbox', { name: 'Question' }).fill(question.question);

    // Handle different question types
    switch (question.type) {
      case 'multiple-choice':
        await this.addMultipleChoiceOptions(question.options || [], question.correctAnswer as string);
        break;
      case 'true-false':
        await this.setTrueFalseAnswer(question.correctAnswer as string);
        break;
      case 'short-answer':
      case 'essay':
        if (question.correctAnswer) {
          await this.page.getByRole('textbox', { name: 'Sample Answer' }).fill(question.correctAnswer as string);
        }
        break;
    }

    // Set points if provided
    if (question.points) {
      await this.page.getByRole('spinbutton', { name: 'Points' }).fill(question.points.toString());
    }

    // Save the question
    await this.page.getByRole('button', { name: 'Save Question' }).click();
  }

  /**
   * Add multiple choice options
   */
  private async addMultipleChoiceOptions(options: string[], correctAnswer: string): Promise<void> {
    for (let i = 0; i < options.length; i++) {
      const optionInput = this.page.getByRole('textbox', { name: `Option ${i + 1}` });
      await optionInput.fill(options[i]);

      // Mark correct answer
      if (options[i] === correctAnswer) {
        await this.page.getByRole('radio', { name: `Option ${i + 1} is correct` }).check();
      }
    }
  }

  /**
   * Set true/false answer
   */
  private async setTrueFalseAnswer(answer: string): Promise<void> {
    const radioButton = this.page.getByRole('radio', { name: answer.toLowerCase() === 'true' ? 'True' : 'False' });
    await radioButton.check();
  }

  /**
   * Save the test
   */
  async saveTest(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save Test' }).click();
    
    // Wait for success message or redirect
    await expect(this.page.getByText('Test saved successfully')).toBeVisible();
  }

  /**
   * Verify test was created successfully
   */
  async verifyTestCreated(testName: string): Promise<void> {
    await this.navigateToTests();
    await expect(this.page.getByText(testName)).toBeVisible();
  }

  /**
   * Delete a test by name
   */
  async deleteTest(testName: string): Promise<void> {
    await this.navigateToTests();
    
    // Find the test and click delete button
    const testRow = this.page.locator(`tr:has-text("${testName}")`);
    await testRow.getByRole('button', { name: 'Delete' }).click();
    
    // Confirm deletion if there's a confirmation dialog
    await this.page.getByRole('button', { name: 'Confirm' }).click();
    
    // Verify test was deleted
    await expect(this.page.getByText(testName)).not.toBeVisible();
  }

  /**
   * Check if AI generation is working by verifying chat response
   */
  async verifyAIGenerationWorking(): Promise<boolean> {
    try {
      // Look for AI response indicators
      const chatMessages = this.page.locator('.chat-message');
      const messageCount = await chatMessages.count();
      
      if (messageCount > 0) {
        // Check if there's a response from the assistant
        const assistantMessage = this.page.locator('.chat-message[data-role="assistant"]');
        return await assistantMessage.count() > 0;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Wait for AI response with timeout
   */
  async waitForAIResponse(timeoutMs: number = 10000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('.chat-message[data-role="assistant"]');
        return messages.length > 0;
      },
      { timeout: timeoutMs }
    );
  }

  /**
   * Get generated questions from AI chat
   */
  async getGeneratedQuestions(): Promise<string[]> {
    const questions: string[] = [];
    
    // Look for question patterns in the chat
    const chatContent = await this.page.locator('.chat-content').textContent();
    
    if (chatContent) {
      // Simple regex to find questions (lines ending with ?)
      const questionMatches = chatContent.match(/^.*\?$/gm);
      if (questionMatches) {
        questions.push(...questionMatches);
      }
    }
    
    return questions;
  }

  /**
   * Navigate from sign-in as teacher to test creation
   */
  async signInAsTeacherAndNavigateToTests(): Promise<void> {
    // Navigate to signin
    await this.page.goto('/signin?lang=en');
    
    // Select "I am a Teacher"
    await this.page.getByRole('button', { name: 'I am a Teacher' }).click();
    
    // Wait for dashboard or settings page
    await this.page.waitForLoadState('networkidle');
    
    // Navigate to tests
    await this.navigateToTestsViaSidebar();
  }
}

/**
 * Quick test creation helper
 */
export async function createQuickTest(
  page: Page, 
  testName: string, 
  description: string = 'Auto-generated test for testing purposes'
): Promise<TestHelper> {
  const helper = new TestHelper(page);
  
  await helper.createTest({
    name: testName,
    description,
    generateWithAI: true
  });
  
  return helper;
}

/**
 * Setup test environment helper
 */
export async function setupTestEnvironment(page: Page): Promise<{ testHelper: TestHelper }> {
  const testHelper = new TestHelper(page);
  
  // Sign in as teacher and navigate to tests
  await testHelper.signInAsTeacherAndNavigateToTests();
  
  return { testHelper };
} 