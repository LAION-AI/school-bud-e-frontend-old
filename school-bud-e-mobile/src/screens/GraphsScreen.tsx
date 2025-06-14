import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext.tsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

interface GraphNode {
  item: string;
  childItems?: string[];
  connections?: { from: string; to: string }[];
  position?: { x: number; y: number };
}

interface StoredGraph {
  id: string;
  name: string;
  items: GraphNode[];
  createdAt: string;
  updatedAt: string;
}

const GraphsScreen: React.FC = () => {
  const { language } = useAppContext();
  const [graphs, setGraphs] = useState<StoredGraph[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGraph, setSelectedGraph] = useState<StoredGraph | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);

  useEffect(() => {
    loadGraphs();
  }, []);

  const loadGraphs = async () => {
    try {
      setIsLoading(true);
      const graphsData = await AsyncStorage.getItem('storedGraphs');
      if (graphsData) {
        const parsedGraphs = JSON.parse(graphsData) as StoredGraph[];
        setGraphs(parsedGraphs.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading graphs:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' 
          ? 'Failed to load graphs' 
          : 'Graphen konnten nicht geladen werden'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGraph = (graph: StoredGraph) => {
    Alert.alert(
      language === 'en' ? 'Delete Graph' : 'Graph löschen',
      language === 'en' 
        ? `Are you sure you want to delete "${graph.name}"?`
        : `Sind Sie sicher, dass Sie "${graph.name}" löschen möchten?`,
      [
        { text: language === 'en' ? 'Cancel' : 'Abbrechen', style: 'cancel' },
        { 
          text: language === 'en' ? 'Delete' : 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedGraphs = graphs.filter(g => g.id !== graph.id);
              setGraphs(updatedGraphs);
              await AsyncStorage.setItem('storedGraphs', JSON.stringify(updatedGraphs));
            } catch (error) {
              console.error('Error deleting graph:', error);
              Alert.alert(
                language === 'en' ? 'Error' : 'Fehler',
                language === 'en' 
                  ? 'Failed to delete graph' 
                  : 'Graph konnte nicht gelöscht werden'
              );
            }
          }
        },
      ]
    );
  };

  const viewGraph = (graph: StoredGraph) => {
    setSelectedGraph(graph);
    setShowGraphModal(true);
  };

  const generateGraphHTML = (graph: StoredGraph) => {
    const nodes = graph.items.map(item => ({
      data: { 
        id: item.item, 
        label: item.item,
        ...(item.position && { position: item.position })
      }
    }));

    const edges: any[] = [];
    graph.items.forEach(item => {
      item.childItems?.forEach(child => {
        edges.push({ data: { source: item.item, target: child } });
      });
      item.connections?.forEach(conn => {
        edges.push({ data: { source: conn.from, target: conn.to } });
      });
    });

    const elements = [...nodes, ...edges];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://unpkg.com/cytoscape@3.21.0/dist/cytoscape.min.js"></script>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          }
          #cy { 
            width: 100%; 
            height: 100vh; 
            background: #f8f9fa;
          }
        </style>
      </head>
      <body>
        <div id="cy"></div>
        <script>
          const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: ${JSON.stringify(elements)},
            style: [
              {
                selector: 'node',
                style: {
                  'background-color': '#3B82F6',
                  'label': 'data(label)',
                  'color': '#000',
                  'text-valign': 'center',
                  'text-halign': 'center',
                  'font-size': '12px',
                  'text-wrap': 'wrap',
                  'text-max-width': '80px',
                  'border-width': '2px',
                  'border-color': '#1E40AF',
                  'width': '60px',
                  'height': '60px'
                }
              },
              {
                selector: 'edge',
                style: {
                  'width': 2,
                  'line-color': '#6B7280',
                  'target-arrow-color': '#6B7280',
                  'target-arrow-shape': 'triangle',
                  'curve-style': 'bezier'
                }
              }
            ],
            layout: {
              name: 'cose',
              animate: true,
              animationDuration: 1000
            }
          });

          // Make graph responsive
          window.addEventListener('resize', () => {
            cy.resize();
          });
        </script>
      </body>
      </html>
    `;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE');
  };

  const refreshFromChat = async () => {
    // This function would be called to check for new graphs from AI chat
    // For now, we'll show a message about how to get graphs
    Alert.alert(
      language === 'en' ? 'Get Graphs from AI' : 'Graphen von KI erhalten',
      language === 'en' 
        ? 'Graphs are automatically saved when Bud-E generates them in chat. Ask Bud-E to create a knowledge graph or diagram to see them here!'
        : 'Graphen werden automatisch gespeichert, wenn Bud-E sie im Chat erstellt. Bitten Sie Bud-E, ein Wissensgraph oder Diagramm zu erstellen, um sie hier zu sehen!',
      [
        { text: language === 'en' ? 'OK' : 'OK', style: 'cancel' },
        { 
          text: language === 'en' ? 'Create Demo Graph' : 'Demo-Graph erstellen', 
          onPress: createDemoGraph
        },
      ]
    );
  };

  const createDemoGraph = async () => {
    try {
      const demoGraphData: GraphNode[] = [
        {
          item: 'Mathematics',
          childItems: ['Algebra', 'Geometry', 'Calculus'],
        },
        {
          item: 'Algebra',
          childItems: ['Linear Equations', 'Quadratic Equations'],
        },
        {
          item: 'Geometry',
          childItems: ['Triangles', 'Circles'],
        },
        {
          item: 'Calculus',
          childItems: ['Derivatives', 'Integrals'],
        },
      ];

      const existingGraphs = await AsyncStorage.getItem('storedGraphs');
      const graphs = existingGraphs ? JSON.parse(existingGraphs) : [];
      
      const newGraph: StoredGraph = {
        id: Date.now().toString(),
        name: language === 'en' ? 'Demo: Mathematics Concepts' : 'Demo: Mathematik-Konzepte',
        items: demoGraphData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedGraphs = [newGraph, ...graphs];
      await AsyncStorage.setItem('storedGraphs', JSON.stringify(updatedGraphs));
      
      loadGraphs();
      
      Alert.alert(
        language === 'en' ? 'Success' : 'Erfolg',
        language === 'en' ? 'Demo graph created!' : 'Demo-Graph erstellt!'
      );
    } catch (error) {
      console.error('Error creating demo graph:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'Fehler',
        language === 'en' ? 'Failed to create demo graph' : 'Demo-Graph konnte nicht erstellt werden'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'en' ? 'Knowledge Graphs' : 'Wissensgraphen'}
        </Text>
        <TouchableOpacity
          onPress={refreshFromChat}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {language === 'en' ? 'Loading graphs...' : 'Lade Graphen...'}
            </Text>
          </View>
        ) : graphs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="git-network-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              {language === 'en' 
                ? 'No graphs yet. Ask Bud-E to create a knowledge graph or diagram in chat!'
                : 'Noch keine Graphen. Bitten Sie Bud-E, einen Wissensgraph oder ein Diagramm im Chat zu erstellen!'
              }
            </Text>
            <TouchableOpacity
              onPress={refreshFromChat}
              style={styles.createFirstButton}
            >
              <Text style={styles.createFirstButtonText}>
                {language === 'en' ? 'How to Get Graphs' : 'Wie man Graphen erhält'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.graphsList}>
            {graphs.map((graph) => (
              <View key={graph.id} style={styles.graphCard}>
                <TouchableOpacity
                  style={styles.graphInfo}
                  onPress={() => viewGraph(graph)}
                >
                  <Text style={styles.graphName}>{graph.name}</Text>
                  <View style={styles.graphStats}>
                    <Text style={styles.graphNodes}>
                      {language === 'en' ? 'Nodes:' : 'Knoten:'} {graph.items.length}
                    </Text>
                    <Text style={styles.graphConnections}>
                      {language === 'en' ? 'Connections:' : 'Verbindungen:'} {
                        graph.items.reduce((count, item) => {
                          return count + (item.childItems?.length || 0) + (item.connections?.length || 0);
                        }, 0)
                      }
                    </Text>
                  </View>
                  <Text style={styles.graphDate}>
                    {formatDate(graph.updatedAt)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteGraph(graph)}
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
        visible={showGraphModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowGraphModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedGraph?.name || (language === 'en' ? 'Graph' : 'Graph')}
            </Text>
            <View style={styles.modalSpacer} />
          </View>
          
          {selectedGraph && (
            <WebView
              source={{ html: generateGraphHTML(selectedGraph) }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          )}
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
  refreshButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  createFirstButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  graphsList: {
    padding: 20,
  },
  graphCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  graphInfo: {
    flex: 1,
  },
  graphName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  graphStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  graphNodes: {
    fontSize: 14,
    color: '#6B7280',
  },
  graphConnections: {
    fontSize: 14,
    color: '#6B7280',
  },
  graphDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
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
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  modalSpacer: {
    width: 32,
  },
  webView: {
    flex: 1,
  },
});

export default GraphsScreen; 