interface Capability {
  title: string;
  description: string;
}

interface Capabilities {
  chat: Capability;
  vision: Capability;
  speak: Capability;
  listen: Capability;
}

interface TranslationContent {
  general: string;
  tokenUsage: string;
  configureAiModels: string;
  configureAiModelsDescription: string;
  availableCapabilities: string;
  systemPrompt: string;
  systemPromptOptional: string;
  systemPromptPlaceholder: string;
  systemPromptDescription: string;
  selectModel: string;
  capabilities: Capabilities;
}

export interface Translations {
  en: TranslationContent;
  de: TranslationContent;
}

declare const translations: Translations;
export default translations;
