import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const HomeScreen: React.FC = () => {
  const { language } = useAppContext();

  const getText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      title: {
        en: 'School Bud-E',
        de: 'School Bud-E',
      },
      subtitle: {
        en: 'Your AI Learning Companion',
        de: 'Dein KI-Lernbegleiter',
      },
      description: {
        en: 'Discover a new way of learning with School Bud-E, your personal AI learning companion.',
        de: 'Entdecke eine neue Art des Lernens mit School Bud-E, deinem persönlichen KI-Lernbegleiter.',
      },
      features: {
        en: 'Features',
        de: 'Funktionen',
      },
      betterWayToLearn: {
        en: 'A better way to learn',
        de: 'Eine bessere Art zu lernen',
      },
      getStarted: {
        en: 'Get Started',
        de: 'Jetzt starten',
      },
    };
    return texts[key]?.[language] || texts[key]?.en || key;
  };

  const features = [
    {
      icon: 'bulb-outline',
      title: language === 'en' ? 'Personalized Learning' : 'Personalisiertes Lernen',
      description: language === 'en' 
        ? 'Tailored learning experiences that adapt to your individual needs.'
        : 'Maßgeschneiderte Lernerfahrungen, die sich an deine individuellen Bedürfnisse anpassen.',
    },
    {
      icon: 'chatbubbles-outline',
      title: language === 'en' ? 'AI-powered Support' : 'KI-gestützte Unterstützung',
      description: language === 'en'
        ? 'Get immediate help and feedback through advanced AI technology.'
        : 'Erhalte sofortige Hilfe und Feedback durch fortschrittliche KI-Technologie.',
    },
    {
      icon: 'game-controller-outline',
      title: language === 'en' ? 'Interactive Exercises' : 'Interaktive Übungen',
      description: language === 'en'
        ? 'Engage with interactive exercises that make learning exciting and effective.'
        : 'Engagiere dich mit interaktiven Übungen, die das Lernen spannend und effektiv machen.',
    },
    {
      icon: 'trophy-outline',
      title: language === 'en' ? 'Progress Tracking' : 'Fortschrittsverfolgung',
      description: language === 'en'
        ? 'Track your learning progress and identify areas for improvement.'
        : 'Verfolge deinen Lernfortschritt und identifiziere Bereiche für Verbesserungen.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#EBF4FF', '#FFFFFF']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.title}>{getText('title')}</Text>
            <Text style={styles.subtitle}>{getText('subtitle')}</Text>
            <Text style={styles.description}>{getText('description')}</Text>
            
            <TouchableOpacity style={styles.getStartedButton}>
              <Text style={styles.getStartedText}>{getText('getStarted')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>{getText('features')}</Text>
          <Text style={styles.featuresSubtitle}>{getText('betterWayToLearn')}</Text>
          
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons 
                    name={feature.icon as any} 
                    size={24} 
                    color="#3B82F6" 
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    padding: 20,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  featuresSubtitle: {
    fontSize: 18,
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresList: {
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default HomeScreen; 