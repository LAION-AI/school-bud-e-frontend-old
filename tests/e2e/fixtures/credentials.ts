import { Page, expect } from '@playwright/test';

export interface ModelConfig {
  name: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  modalities: Modality[];
}

export interface Modality {
  type: 'text' | 'vision' | 'tts' | 'stt';
  enabled: boolean;
}

export interface TestCredentials {
  openai: ModelConfig;
  gemini: ModelConfig;
  test: ModelConfig;
}

// Load environment variables
const loadEnvVar = (key: string, fallback?: string): string => {
  const value = Deno.env.get(key) || fallback;
  if (!value) {
    throw new Error(`Environment variable ${key} is required for tests. Please set it in your .env file.`);
  }
  return value;
};

export const TEST_CREDENTIALS: TestCredentials = {
  openai: {
    name: 'OpenAI GPT-4o',
    apiKey: loadEnvVar('TEST_OPENAI_API_KEY'),
    apiEndpoint: loadEnvVar('TEST_OPENAI_API_ENDPOINT', 'https://api.openai.com/v1/chat/completions'),
    model: loadEnvVar('TEST_OPENAI_MODEL_GPT4O', 'gpt-4o'),
    modalities: [
      { type: 'text', enabled: true },
      { type: 'vision', enabled: true }
    ]
  },
  gemini: {
    name: 'Google Gemini',
    apiKey: loadEnvVar('TEST_GEMINI_API_KEY', 'test-gemini-key'),
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-pro',
    modalities: [
      { type: 'text', enabled: true },
      { type: 'vision', enabled: true }
    ]
  },
  test: {
    name: 'Test Model',
    apiKey: loadEnvVar('TEST_INVALID_API_KEY', 'invalid-test-key'),
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: loadEnvVar('TEST_OPENAI_MODEL_GPT3_5', 'gpt-3.5-turbo'),
    modalities: [
      { type: 'text', enabled: true }
    ]
  }
};

export class CredentialsHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to settings page from any location
   */
  async navigateToSettings(): Promise<void> {
    await this.page.goto('/settings');
    await expect(this.page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible();
  }

  /**
   * Configure a model with specified credentials and modalities
   */
  async configureModel(config: ModelConfig): Promise<void> {
    await this.navigateToSettings();

    // Click "Neues Modell" to add a new model
    await this.page.getByRole('button', { name: 'Neues Modell' }).click();

    // Fill in model details
    await this.page.getByRole('textbox', { name: 'Name*' }).fill(config.name);
    await this.page.getByRole('textbox', { name: 'API-Schlüssel*' }).fill(config.apiKey);
    await this.page.getByRole('textbox', { name: 'API-Endpunkt*' }).fill(config.apiEndpoint);
    await this.page.getByRole('textbox', { name: 'Modell*' }).fill(config.model);

    // Configure modalities
    for (const modality of config.modalities) {
      await this.enableModality(modality);
    }

    // Add the model
    await this.page.getByRole('button', { name: 'Hinzufügen' }).click();

    // Verify model was added
    await expect(this.page.getByRole('heading', { name: config.name, level: 4 })).toBeVisible();
  }

  /**
   * Enable or disable a specific modality
   */
  private async enableModality(modality: Modality): Promise<void> {
    const modalityMap = {
      text: '💬 Text-Chat',
      vision: '👁️ Bild-Verständnis',
      tts: '🔊 Sprachausgabe',
      stt: '🎤 Spracherkennung'
    };

    const checkboxName = modalityMap[modality.type];
    const checkbox = this.page.getByRole('checkbox', { name: checkboxName });

    if (modality.enabled) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    } else {
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
    }
  }

  /**
   * Set a specific model for a capability
   */
  async setModelForCapability(capability: 'text' | 'vision', modelName: string): Promise<void> {
    const capabilityMap = {
      text: '💬',
      vision: '👁️'
    };

    const buttonSelector = `button:has-text("${capabilityMap[capability]}")`;
    await this.page.locator(buttonSelector).first().click();
    await this.page.getByRole('button', { name: modelName, exact: true }).click();

    // Verify the model was set
    await expect(this.page.getByRole('button', { name: `${capabilityMap[capability]} ${modelName}` })).toBeVisible();
  }

  /**
   * Quick setup for OpenAI credentials
   */
  async setupOpenAI(): Promise<void> {
    await this.configureModel(TEST_CREDENTIALS.openai);
    await this.setModelForCapability('text', TEST_CREDENTIALS.openai.name);
    await this.setModelForCapability('vision', TEST_CREDENTIALS.openai.name);
  }

  /**
   * Quick setup for test credentials (for error testing)
   */
  async setupTestCredentials(): Promise<void> {
    await this.configureModel(TEST_CREDENTIALS.test);
    await this.setModelForCapability('text', TEST_CREDENTIALS.test.name);
  }

  /**
   * Reset all models (cleanup)
   */
  async resetModels(): Promise<void> {
    await this.navigateToSettings();
    
    // Look for delete buttons and click them
    const deleteButtons = this.page.locator('button:has(img[alt="Delete"])');
    const count = await deleteButtons.count();
    
    for (let i = count - 1; i >= 0; i--) {
      await deleteButtons.nth(i).click();
      // Wait for confirmation dialog if it exists
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Verify a model is configured correctly
   */
  async verifyModelConfiguration(modelName: string, capabilities: string[]): Promise<void> {
    await this.navigateToSettings();
    
    // Verify model exists
    await expect(this.page.getByRole('heading', { name: modelName, level: 4 })).toBeVisible();
    
    // Verify capabilities are shown
    for (const capability of capabilities) {
      const capabilityElement = this.page.locator(`text=${capability}`);
      await expect(capabilityElement).toBeVisible();
    }
  }
}

/**
 * Setup helper for common test scenarios
 */
export async function setupCredentials(page: Page, scenario: 'openai' | 'test' | 'gemini' = 'openai'): Promise<CredentialsHelper> {
  const helper = new CredentialsHelper(page);
  
  switch (scenario) {
    case 'openai':
      await helper.setupOpenAI();
      break;
    case 'test':
      await helper.setupTestCredentials();
      break;
    case 'gemini':
      await helper.configureModel(TEST_CREDENTIALS.gemini);
      break;
  }
  
  return helper;
} 