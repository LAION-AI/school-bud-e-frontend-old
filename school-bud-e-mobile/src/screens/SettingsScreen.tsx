import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext.tsx';

const SettingsScreen: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    serverUrl, 
    setServerUrl, 
    apiKey, 
    setApiKey,
    systemPrompt,
    setSystemPrompt,
    saveSettings 
  } = useAppContext();

  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt);
  const [hasChanges, setHasChanges] = useState(false);

  const handleServerUrlChange = (url: string) => {
    setLocalServerUrl(url);
    setHasChanges(true);
  };

  const handleApiKeyChange = (key: string) => {
    setLocalApiKey(key);
    setHasChanges(true);
  };

  const handleSystemPromptChange = (prompt: string) => {
    setLocalSystemPrompt(prompt);
    setHasChanges(true);
  };

  // Auto-save when user stops typing for 2 seconds
  React.useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [localServerUrl, localApiKey, localSystemPrompt, hasChanges]);

  const handleLanguageToggle = (value: boolean) => {
    const newLanguage = value ? 'de' : 'en';
    setLanguage(newLanguage);
    saveSettings();
  };

  const handleSave = async () => {
    try {
      setServerUrl(localServerUrl);
      setApiKey(localApiKey);
      setSystemPrompt(localSystemPrompt);
      await saveSettings();
      setHasChanges(false);
      Alert.alert(
        language === 'en' ? 'Success' : 'Erfolg',
        language === 'en' 
          ? 'Settings saved successfully' 
          : 'Einstellungen erfolgreich gespeichert'
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' 
          ? 'Failed to save settings' 
          : 'Einstellungen konnten nicht gespeichert werden'
      );
    }
  };

  const handleReset = () => {
    Alert.alert(
      language === 'en' ? 'Reset Settings' : 'Einstellungen zurücksetzen',
      language === 'en' 
        ? 'Are you sure you want to reset all settings to default?'
        : 'Sind Sie sicher, dass Sie alle Einstellungen auf Standard zurücksetzen möchten?',
      [
        { text: language === 'en' ? 'Cancel' : 'Abbrechen', style: 'cancel' },
        { 
          text: language === 'en' ? 'Reset' : 'Zurücksetzen', 
          style: 'destructive',
          onPress: () => {
            setLocalServerUrl('https://next.bud-e.ai');
            setLocalApiKey('');
            setLanguage('en');
            setHasChanges(true);
          }
        },
      ]
    );
  };

  const testConnection = async () => {
    try {
      const testUrl = localServerUrl.replace(/\/$/, '');
      const response = await fetch(`${testUrl}/api/game`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert(
          language === 'en' ? 'Success' : 'Erfolg',
          language === 'en' 
            ? 'Connection successful!' 
            : 'Verbindung erfolgreich!'
        );
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert(
        language === 'en' ? 'Connection Failed' : 'Verbindung fehlgeschlagen',
        language === 'en' 
          ? 'Could not connect to the server. Please check your URL and try again.'
          : 'Verbindung zum Server nicht möglich. Bitte überprüfen Sie Ihre URL und versuchen Sie es erneut.'
      );
    }
  };

  const testMessage = async () => {
    try {
      const testUrl = localServerUrl.replace(/\/$/, '');
      const response = await fetch(`${testUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lang: language,
          messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
          universalApiKey: localApiKey,
          universalShopApiKey: "",
          llmApiUrl: '',
          llmApiKey: '',
          llmApiModel: '',
          vlmApiUrl: '',
          vlmApiKey: '',
          vlmApiModel: '',
          vlmCorrectionModel: '',
          systemPrompt: localSystemPrompt,
        }),
      });

      if (response.ok) {
        Alert.alert(
          language === 'en' ? 'Success' : 'Erfolg',
          language === 'en' 
            ? 'Test message sent successfully!' 
            : 'Test-Nachricht erfolgreich gesendet!'
        );
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Test message failed:', error);
      Alert.alert(
        language === 'en' ? 'Test Failed' : 'Test fehlgeschlagen',
        language === 'en' 
          ? `Failed to send test message: ${error instanceof Error ? error.message : 'Unknown error'}`
          : `Test-Nachricht fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'en' ? 'Settings' : 'Einstellungen'}
        </Text>
        {hasChanges && (
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>
              {language === 'en' ? 'Save' : 'Speichern'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Language' : 'Sprache'}
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {language === 'en' ? 'German Language' : 'Deutsche Sprache'}
              </Text>
              <Text style={styles.settingDescription}>
                {language === 'en' 
                  ? 'Use German as the primary language'
                  : 'Deutsch als Hauptsprache verwenden'
                }
              </Text>
            </View>
            <Switch
              value={language === 'de'}
              onValueChange={handleLanguageToggle}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={language === 'de' ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Server Configuration' : 'Server-Konfiguration'}
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Server URL' : 'Server-URL'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={localServerUrl}
              onChangeText={handleServerUrlChange}
              placeholder="https://next.bud-e.ai"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              textContentType="URL"
              autoComplete="url"
            />
            <Text style={styles.inputDescription}>
              {language === 'en' 
                ? 'The base URL of your School Bud-E server'
                : 'Die Basis-URL Ihres School Bud-E Servers'
              }
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Shop API Key' : 'Shop-API-Schlüssel'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={localApiKey}
              onChangeText={handleApiKeyChange}
              placeholder={
                language === 'en' 
                  ? 'Enter your shop API key'
                  : 'Shop-API-Schlüssel eingeben'
              }
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
            />
            <Text style={styles.inputDescription}>
              {language === 'en' 
                ? 'Your shop API key for accessing School Bud-E services (universalApiKey)'
                : 'Ihr Shop-API-Schlüssel für den Zugriff auf School Bud-E Dienste (universalApiKey)'
              }
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'System Prompt' : 'System-Eingabeaufforderung'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={localSystemPrompt}
              onChangeText={handleSystemPromptChange}
              placeholder={
                language === 'en' 
                  ? 'You are a helpful AI learning companion.'
                  : 'Du bist ein hilfreicher KI-Lernbegleiter.'
              }
              multiline
              numberOfLines={3}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputDescription}>
              {language === 'en' 
                ? 'Custom instructions for the AI assistant behavior'
                : 'Benutzerdefinierte Anweisungen für das Verhalten des KI-Assistenten'
              }
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={testConnection} style={[styles.testButton, styles.buttonHalf]}>
              <Ionicons name="wifi-outline" size={20} color="#3B82F6" />
              <Text style={styles.testButtonText}>
                {language === 'en' ? 'Test Connection' : 'Verbindung testen'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={testMessage} style={[styles.testButton, styles.buttonHalf]}>
              <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
              <Text style={styles.testButtonText}>
                {language === 'en' ? 'Test Message' : 'Test-Nachricht'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'About' : 'Über'}
          </Text>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>
              {language === 'en' ? 'App Version' : 'App-Version'}
            </Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>
              {language === 'en' ? 'Platform' : 'Plattform'}
            </Text>
            <Text style={styles.aboutValue}>React Native</Text>
          </View>

          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="refresh-outline" size={20} color="#FF4444" />
            <Text style={styles.resetButtonText}>
              {language === 'en' ? 'Reset to Defaults' : 'Auf Standard zurücksetzen'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF4FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonHalf: {
    flex: 1,
  },
  testButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  aboutValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  resetButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsScreen; 