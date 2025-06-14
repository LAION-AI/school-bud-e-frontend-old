import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { apiService, GameState } from '../services/apiService';

const GamesScreen: React.FC = () => {
  const { language, serverUrl, apiKey } = useAppContext();
  const [games, setGames] = useState<GameState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameCode, setNewGameCode] = useState('');

  useEffect(() => {
    apiService.updateConfig(serverUrl, apiKey);
    loadGames();
  }, [serverUrl, apiKey]);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      const gamesData = await apiService.getGames();
      setGames(gamesData);
    } catch (error) {
      console.error('Error loading games:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' 
          ? 'Failed to load games' 
          : 'Spiele konnten nicht geladen werden'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = async () => {
    if (!newGameName.trim() || !newGameCode.trim()) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' 
          ? 'Please fill in all fields' 
          : 'Bitte füllen Sie alle Felder aus'
      );
      return;
    }

    try {
      await apiService.createGame(newGameCode.trim(), newGameName.trim());
      setNewGameName('');
      setNewGameCode('');
      setShowCreateModal(false);
      loadGames();
      Alert.alert(
        language === 'en' ? 'Success' : 'Erfolg',
        language === 'en' ? 'Game created successfully' : 'Spiel erfolgreich erstellt'
      );
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' 
          ? 'Failed to create game' 
          : 'Spiel konnte nicht erstellt werden'
      );
    }
  };

  const deleteGame = (game: GameState) => {
    Alert.alert(
      language === 'en' ? 'Delete Game' : 'Spiel löschen',
      language === 'en' 
        ? `Are you sure you want to delete "${game.name}"?`
        : `Sind Sie sicher, dass Sie "${game.name}" löschen möchten?`,
      [
        { text: language === 'en' ? 'Cancel' : 'Abbrechen', style: 'cancel' },
        { 
          text: language === 'en' ? 'Delete' : 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteGame(game.id);
              loadGames();
            } catch (error) {
              console.error('Error deleting game:', error);
              Alert.alert(
                language === 'en' ? 'Error' : 'Fehler',
                language === 'en' 
                  ? 'Failed to delete game' 
                  : 'Spiel konnte nicht gelöscht werden'
              );
            }
          }
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'en' ? 'Learning Games' : 'Lernspiele'}
        </Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {language === 'en' ? 'Loading games...' : 'Lade Spiele...'}
            </Text>
          </View>
        ) : games.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              {language === 'en' 
                ? 'No games yet. Create your first learning game!'
                : 'Noch keine Spiele. Erstellen Sie Ihr erstes Lernspiel!'
              }
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.createFirstButton}
            >
              <Text style={styles.createFirstButtonText}>
                {language === 'en' ? 'Create Game' : 'Spiel erstellen'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gamesList}>
            {games.map((game) => (
              <View key={game.id} style={styles.gameCard}>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameCode}>
                    {language === 'en' ? 'Code:' : 'Code:'} {game.code}
                  </Text>
                  <View style={styles.gameStats}>
                    <Text style={styles.gamePoints}>
                      {language === 'en' ? 'Points:' : 'Punkte:'} {game.points}
                    </Text>
                    <Text style={styles.gameDate}>
                      {formatDate(game.createdAt)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => deleteGame(game)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>
                {language === 'en' ? 'Cancel' : 'Abbrechen'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {language === 'en' ? 'Create New Game' : 'Neues Spiel erstellen'}
            </Text>
            <TouchableOpacity
              onPress={createGame}
              style={styles.modalSaveButton}
            >
              <Text style={styles.modalSaveText}>
                {language === 'en' ? 'Create' : 'Erstellen'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? 'Game Name' : 'Spielname'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newGameName}
                onChangeText={setNewGameName}
                placeholder={
                  language === 'en' 
                    ? 'Enter game name'
                    : 'Spielname eingeben'
                }
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? 'Game Code' : 'Spielcode'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newGameCode}
                onChangeText={setNewGameCode}
                placeholder={
                  language === 'en' 
                    ? 'Enter game code'
                    : 'Spielcode eingeben'
                }
                maxLength={20}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  gamesList: {
    gap: 16,
  },
  gameCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  gameCode: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gamePoints: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  gameDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#6B7280',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
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
  },
});

export default GamesScreen; 