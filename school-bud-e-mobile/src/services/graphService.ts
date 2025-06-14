import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GraphNode {
  item: string;
  childItems?: string[];
  connections?: { from: string; to: string }[];
  position?: { x: number; y: number };
}

export interface StoredGraph {
  id: string;
  name: string;
  items: GraphNode[];
  createdAt: string;
  updatedAt: string;
}

class GraphService {
  private readonly STORAGE_KEY = 'storedGraphs';

  async saveGraph(name: string, items: GraphNode[]): Promise<string> {
    try {
      const existingGraphs = await this.getGraphs();
      const graphId = Date.now().toString();
      
      const newGraph: StoredGraph = {
        id: graphId,
        name: name || `Graph ${existingGraphs.length + 1}`,
        items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedGraphs = [newGraph, ...existingGraphs];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedGraphs));
      
      return graphId;
    } catch (error) {
      console.error('Error saving graph:', error);
      throw error;
    }
  }

  async getGraphs(): Promise<StoredGraph[]> {
    try {
      const graphsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (graphsData) {
        return JSON.parse(graphsData) as StoredGraph[];
      }
      return [];
    } catch (error) {
      console.error('Error loading graphs:', error);
      return [];
    }
  }

  async deleteGraph(graphId: string): Promise<void> {
    try {
      const existingGraphs = await this.getGraphs();
      const updatedGraphs = existingGraphs.filter(graph => graph.id !== graphId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedGraphs));
    } catch (error) {
      console.error('Error deleting graph:', error);
      throw error;
    }
  }

  async updateGraph(graphId: string, updates: Partial<StoredGraph>): Promise<void> {
    try {
      const existingGraphs = await this.getGraphs();
      const graphIndex = existingGraphs.findIndex(graph => graph.id === graphId);
      
      if (graphIndex !== -1) {
        existingGraphs[graphIndex] = {
          ...existingGraphs[graphIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingGraphs));
      }
    } catch (error) {
      console.error('Error updating graph:', error);
      throw error;
    }
  }

  // This method can be called when the AI generates a graph in chat
  async saveGraphFromChat(graphData: any, chatContext?: string): Promise<string> {
    try {
      // Parse the graph data from AI response
      let items: GraphNode[] = [];
      let name = 'AI Generated Graph';

      if (graphData && graphData.items) {
        items = graphData.items;
        name = graphData.name || name;
      } else if (Array.isArray(graphData)) {
        items = graphData;
      }

      // Add context from chat if available
      if (chatContext) {
        name = `Graph: ${chatContext.substring(0, 50)}...`;
      }

      return await this.saveGraph(name, items);
    } catch (error) {
      console.error('Error saving graph from chat:', error);
      throw error;
    }
  }
}

export const graphService = new GraphService(); 