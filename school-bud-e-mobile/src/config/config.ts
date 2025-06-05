export const config = {
  defaultServerUrl: 'https://next.bud-e.ai',
  defaultApiKey: '',
  appName: 'School Bud-E',
  appVersion: '1.0.0',
  supportedLanguages: ['en', 'de'] as const,
  defaultLanguage: 'en' as const,
  
  // API endpoints
  endpoints: {
    chat: '/api/chat',
    game: '/api/game',
    tts: '/api/tts',
    stt: '/api/stt',
    bildungsplan: '/api/bildungsplan',
    wikipedia: '/api/wikipedia',
    transcribePdf: '/api/transcribe-pdf',
    papers: '/api/papers',
  },
  
  // UI configuration
  ui: {
    primaryColor: '#3B82F6',
    maxMessageLength: 1000,
    chatScrollDelay: 100,
  },
  
  // Storage keys
  storageKeys: {
    appSettings: 'appSettings',
    chatHistory: 'chatHistory',
    gameData: 'gameData',
  },
} as const;

export type Language = typeof config.supportedLanguages[number];
export type Config = typeof config; 