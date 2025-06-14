// Settings interfaces and types
export interface Settings {
  universalApiKey: string;
  apiUrl: string;
  apiKey: string;
  apiModel: string;
  ttsUrl: string;
  ttsKey: string;
  ttsModel: string;
  sttUrl: string;
  sttKey: string;
  sttModel: string;
  systemPrompt: string;
  vlmUrl: string;
  vlmKey: string;
  vlmModel: string;
  vlmCorrectionModel: string;
}

export interface ProviderConfig {
  keyCharacteristics: {
    startsWith?: string;
    length?: number;
  };
  config: {
    [key: string]: {
      url: string;
      model: string;
    };
  };
}

export interface ProviderConfigs {
  [key: string]: ProviderConfig;
}
