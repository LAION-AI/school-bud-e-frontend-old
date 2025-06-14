import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../context/AppContext';

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatListScreenProps {
  onSelectChat: (chatId: string) => void;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ onSelectChat }) => {
  const { language } = useAppContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const chatsData = await AsyncStorage.getItem('chatList');
      if (chatsData) {
        const parsedChats = JSON.parse(chatsData).map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
        }));
        setChats(parsedChats.sort((a: Chat, b: Chat) => b.timestamp.getTime() - a.timestamp.getTime()));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: language === 'en' ? 'New Chat' : 'Neuer Chat',
      lastMessage: '',
      timestamp: new Date(),
      messageCount: 0,
    };

    try {
      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      await AsyncStorage.setItem('chatList', JSON.stringify(updatedChats));
      onSelectChat(newChat.id);
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' 
          ? 'Failed to create new chat' 
          : 'Neuer Chat konnte nicht erstellt werden'
      );
    }
  };

  const deleteChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    Alert.alert(
      language === 'en' ? 'Delete Chat' : 'Chat löschen',
      language === 'en' 
        ? `Are you sure you want to delete "${chat.title}"?`
        : `Sind Sie sicher, dass Sie "${chat.title}" löschen möchten?`,
      [
        { text: language === 'en' ? 'Cancel' : 'Abbrechen', style: 'cancel' },
        { 
          text: language === 'en' ? 'Delete' : 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedChats = chats.filter(c => c.id !== chatId);
              setChats(updatedChats);
              await AsyncStorage.setItem('chatList', JSON.stringify(updatedChats));
              await AsyncStorage.removeItem(`chat_${chatId}`);
            } catch (error) {
              console.error('Error deleting chat:', error);
            }
          }
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return timestamp.toLocaleTimeString(language === 'en' ? 'en-US' : 'de-DE', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return language === 'en' ? 'Yesterday' : 'Gestern';
    } else if (days < 7) {
      return timestamp.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE', {
        weekday: 'long',
      });
    } else {
      return timestamp.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'en' ? 'Chats' : 'Chats'}
        </Text>
        <TouchableOpacity onPress={createNewChat} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {language === 'en' ? 'Loading chats...' : 'Lade Chats...'}
            </Text>
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              {language === 'en' 
                ? 'No chats yet. Start a new conversation!'
                : 'Noch keine Chats. Beginnen Sie ein neues Gespräch!'
              }
            </Text>
            <TouchableOpacity onPress={createNewChat} style={styles.createFirstButton}>
              <Text style={styles.createFirstButtonText}>
                {language === 'en' ? 'Start Chat' : 'Chat beginnen'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.chatsList}>
            {chats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => onSelectChat(chat.id)}
              >
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle}>{chat.title}</Text>
                    <Text style={styles.chatTimestamp}>
                      {formatTimestamp(chat.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.chatLastMessage} numberOfLines={2}>
                    {chat.lastMessage || 
                      (language === 'en' ? 'No messages yet' : 'Noch keine Nachrichten')
                    }
                  </Text>
                  <Text style={styles.messageCount}>
                    {language === 'en' ? `${chat.messageCount} messages` : `${chat.messageCount} Nachrichten`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
    marginBottom: 24,
    lineHeight: 24,
  },
  createFirstButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chatsList: {
    gap: 12,
  },
  chatItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  chatTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chatLastMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  messageCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
  },
});

export default ChatListScreen; 