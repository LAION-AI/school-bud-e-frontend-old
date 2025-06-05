import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppContextType {
  language: 'en' | 'de';
  setLanguage: (lang: 'en' | 'de') => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  apiKey: string; // This is the shop API key (universalApiKey)
  setApiKey: (key: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  isLoading: boolean;
  saveSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'de'>('en');
  const [serverUrl, setServerUrl] = useState('https://next.bud-e.ai');
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI learning companion.');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setLanguageState(settings.language || 'en');
        setServerUrl(settings.serverUrl || 'https://next.bud-e.ai');
        setApiKey(settings.apiKey || '');
        setSystemPrompt(settings.systemPrompt || 'You are a helpful AI learning companion.');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        language,
        serverUrl,
        apiKey,
        systemPrompt,
      };
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const setLanguage = (lang: 'en' | 'de') => {
    setLanguageState(lang);
    // Auto-save when language changes
    setTimeout(() => saveSettings(), 100);
  };

  const value: AppContextType = {
    language,
    setLanguage,
    serverUrl,
    setServerUrl,
    apiKey,
    setApiKey,
    systemPrompt,
    setSystemPrompt,
    isLoading,
    saveSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 