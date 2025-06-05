import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useAppContext } from '../context/AppContext.tsx';
import { apiService, ChatMessage } from '../services/apiService.ts';
import { graphService } from '../services/graphService.ts';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

const ChatScreen: React.FC = () => {
  const { language, serverUrl, apiKey, systemPrompt } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Update API service configuration when context changes
    apiService.updateConfig(serverUrl, apiKey);
  }, [serverUrl, apiKey]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addMessage = (content: string, role: ChatMessage['role']) => {
    const newMessage: Message = {
      id: generateId(),
      content,
      role,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = addMessage(inputText.trim(), 'user');
    setInputText('');
    setIsLoading(true);

    try {
      const chatMessages: ChatMessage[] = messages
        .concat([userMessage])
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await apiService.sendChatMessage(chatMessages, language, systemPrompt);
      
      if (!response || !response.chunks) {
        throw new Error('No response received');
      }

      // Create assistant message and simulate streaming by updating it progressively
      let assistantMessage = addMessage('', 'assistant');
      let content = '';

      // Simulate streaming by adding chunks with delays
      for (let i = 0; i < response.chunks.length; i++) {
        content += response.chunks[i];
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content }
              : msg
          )
        );
        
        // Add a small delay to simulate streaming
        if (i < response.chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Check if the response contains graph data and save it
      try {
        if (response.graphData && response.graphData.items && response.graphData.items.length > 0) {
          await graphService.saveGraphFromChat(response.graphData, userMessage.content);
          console.log('Graph saved from AI response');
        }
      } catch (graphError) {
        console.error('Error saving graph:', graphError);
        // Don't show error to user as this is a background operation
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' 
          ? 'Failed to send message. Please check your settings.' 
          : 'Nachricht konnte nicht gesendet werden. Bitte überprüfen Sie Ihre Einstellungen.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const playTextToSpeech = async (text: string) => {
    try {
      console.log('🔊 Starting TTS for text:', text.substring(0, 50) + '...');
      
      const audioBlob = await apiService.textToSpeech(text, language);
      console.log('🔊 Got audio blob, size:', audioBlob.size);
      
      // Convert blob to base64 using a simple approach
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
      const base64 = btoa(binaryString);
      const dataUri = `data:${audioBlob.type || 'audio/wav'};base64,${base64}`;
      
      console.log('🔊 Created base64 data URI, length:', dataUri.length);
      
      // Create and play audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: dataUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      console.log('🔊 Audio playback started successfully');
      
    } catch (error) {
      console.error('❌ Error with text-to-speech:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' 
          ? `Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}` 
          : `Sprachausgabe fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      );
    }
  };

  const clearChat = () => {
    Alert.alert(
      language === 'en' ? 'Clear Chat' : 'Chat leeren',
      language === 'en' 
        ? 'Are you sure you want to clear all messages?' 
        : 'Sind Sie sicher, dass Sie alle Nachrichten löschen möchten?',
      [
        { text: language === 'en' ? 'Cancel' : 'Abbrechen', style: 'cancel' },
        { text: language === 'en' ? 'Clear' : 'Löschen', onPress: () => setMessages([]) },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'de-DE', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'en' ? 'AI Chat' : 'KI-Chat'}
        </Text>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {language === 'en' 
                  ? 'Start a conversation with your AI learning companion'
                  : 'Beginnen Sie ein Gespräch mit Ihrem KI-Lernbegleiter'
                }
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <Text style={styles.messageContent}>{message.content}</Text>
                <View style={styles.messageFooter}>
                  <Text style={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </Text>
                  {message.role === 'assistant' && message.content && (
                    <TouchableOpacity
                      onPress={() => playTextToSpeech(message.content)}
                      style={styles.speakButton}
                    >
                      <Ionicons name="volume-high-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
          {isLoading && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <Text style={styles.loadingText}>
                {language === 'en' ? 'AI is thinking...' : 'KI denkt nach...'}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              language === 'en' 
                ? 'Type your message...'
                : 'Geben Sie Ihre Nachricht ein...'
            }
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!inputText.trim() || isLoading) ? '#9CA3AF' : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  clearButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  speakButton: {
    padding: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});

export default ChatScreen; 