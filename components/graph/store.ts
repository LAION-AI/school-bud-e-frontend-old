// store.ts
import { signal } from "@preact/signals";
import { GraphJson } from "../../types/formats.ts";

// Graph management signals
export const graphs = signal<Map<string, GraphJson>>(new Map());
export const currentGraphId = signal<string | null>(null);
export const graphData = signal<GraphJson | null>(null);
export const recentGraphs = signal<GraphJson[]>([]);

// Node selection signals
export const selectedNode = signal<string | null>(null);
export const secondarySelectedNode = signal<string | null>(null);
export const isConnectingNodes = signal<boolean>(false);

// Graph operation states
export const isAddingNode = signal<boolean>(false);
export const isRenamingNode = signal<boolean>(false);
export const newNodeName = signal<string>("");

// Load saved graphs from localStorage
export function loadSavedGraphs() {
  if (typeof window === "undefined") return;
  
  const savedGraphsJson = localStorage.getItem("savedGraphs");
  if (savedGraphsJson) {
    try {
      const savedGraphs = JSON.parse(savedGraphsJson) as Record<string, GraphJson>;
      const entries = Object.entries(savedGraphs);
      graphs.value = new Map(entries);
      
      // If we have any graphs but no current graph is selected, load the first one
      if (entries.length > 0 && !currentGraphId.value) {
        loadGraph(entries[0][0]);
      }
    } catch (e) {
      console.error("Error loading saved graphs:", e);
    }
  } else {
    // If no saved graphs, create a default one
    createDefaultGraph();
  }
}

// Create a default graph if none exists
function createDefaultGraph() {
  // Create a default graph with a sample node
  const sampleItems = [
    {
      item: "Welcome to Your Graph",
      childItems: ["Add more nodes", "Connect nodes"],
      position: { x: 200, y: 200 }
    },
    {
      item: "Add more nodes",
      position: { x: 100, y: 300 }
    },
    {
      item: "Connect nodes",
      position: { x: 300, y: 300 }
    }
  ];
  
  const defaultGraphId = saveGraph("My Graph", sampleItems);
  loadGraph(defaultGraphId);
}

// Save graphs to localStorage
export function saveGraphs() {
  if (typeof window === "undefined") return;
  
  // Convert Map to a plain object for JSON serialization
  const graphsObj = Array.from(graphs.value.entries()).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {} as Record<string, GraphJson>);
  
  localStorage.setItem("savedGraphs", JSON.stringify(graphsObj));
}

export function saveGraph(name: string, items = []) {
  if (!name || typeof name !== 'string') {
    throw new Error('Graph name must be a non-empty string');
  }

  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  const newGraph: GraphJson = {
    type: "graph",
    items: JSON.parse(JSON.stringify(items)), // Deep copy the items
    name,
  };

  const id = crypto.randomUUID();
  const updatedGraphs = new Map(graphs.value);
  updatedGraphs.set(id, newGraph);
  graphs.value = updatedGraphs;
  saveGraphs();
  return id;
}

// Create a new graph
export function createGraph(name: string) {
    return saveGraph(name, [])
}

// Delete a graph
export function deleteGraph(id: string) {
  // Get the graph before deleting it
  const graphToDelete = graphs.value.get(id);

  // Clear current graph if it's the one being deleted
  if (currentGraphId.value === id) {
    currentGraphId.value = null;
    graphData.value = null;
  }

  // Delete from main graphs map
  const updatedGraphs = new Map(graphs.value);
  updatedGraphs.delete(id);
  graphs.value = updatedGraphs;

  // Remove from recent graphs if present
  if (graphToDelete) {
    recentGraphs.value = recentGraphs.value.filter(g => g !== graphToDelete);
  }

  // Save changes to localStorage
  saveGraphs();
}

// Load a specific graph
export function loadGraph(id: string) {
  console.log("Loading graph:", id);
  const graph = graphs.value.get(id);
  if (graph) {
    currentGraphId.value = id;
    
    // Create a deep copy of the graph to prevent shared references
    const graphCopy = JSON.parse(JSON.stringify(graph)) as GraphJson;
    
    // Ensure items array exists and has the correct structure
    if (!graphCopy.items) {
      graphCopy.items = [];
    }
    
    // Ensure all items have a position
    for (let i = 0; i < graphCopy.items.length; i++) {
      const item = graphCopy.items[i];
      if (!item.position) {
        console.log(`Assigning position to item: ${item.item}`);
        // Create a grid-like layout for nodes without positions
        const row = Math.floor(i / 5);
        const col = i % 5;
        item.position = {
          x: 100 + col * 150,
          y: 100 + row * 150
        };
      }
    }
    
    console.log(`Graph loaded with ${graphCopy.items.length} items:`, graphCopy);
    
    // Update the graphData signal with the properly structured data
    graphData.value = graphCopy;
  } else {
    console.error("Graph not found:", id);
    
    // If trying to load a non-existent graph, load the first available or create default
    if (graphs.value.size > 0) {
      const firstGraphId = Array.from(graphs.value.keys())[0];
      console.log("Loading first available graph instead:", firstGraphId);
      loadGraph(firstGraphId);
    } else {
      console.log("No graphs available, creating default graph");
      createDefaultGraph();
    }
  }
}

// Save current graph (update the graphs Map and persist it)
export function saveCurrentGraph() {
  if (currentGraphId.value && graphData.value) {
    const updatedGraphs = new Map(graphs.value);
    // Create a deep copy of the graph data before saving
    const graphToSave = JSON.parse(JSON.stringify(graphData.value));
    updatedGraphs.set(currentGraphId.value, graphToSave);
    graphs.value = updatedGraphs;
    saveGraphs();
  }
}

// Graph collapse state
export const isGraphCollapsed = signal<boolean>(() => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(location.search);
    const collapsed = urlParams.get("rcollapsed");
    return collapsed === "true";
});

// Graph operations
export function handleNodeSelect(nodeId: string, isAltPressed: boolean = false) {
    if (isAltPressed && nodeId !== selectedNode.value) {
        secondarySelectedNode.value = nodeId;
        isConnectingNodes.value = true;
    } else {
        if (nodeId !== selectedNode.value) {
            selectedNode.value = nodeId;
            secondarySelectedNode.value = null;
            isConnectingNodes.value = false;
        }
    }
}

export function handleConnectNodes() {
    console.log('Connect');
    if (!selectedNode.value || !secondarySelectedNode.value || !isConnectingNodes.value) return;

    const updatedGraph = { ...graphData.value || { type: "graph", items: [] } };
    const sourceNode = updatedGraph.items.find(item => item.item === selectedNode.value);
    const targetNode = updatedGraph.items.find(item => item.item === secondarySelectedNode.value);
    
    if (sourceNode && targetNode) {
        // Initialize connections arrays if they don't exist
        if (!sourceNode.connections) sourceNode.connections = [];
        if (!targetNode.connections) targetNode.connections = [];
        
        // Check if connection already exists in either direction
        const connectionExists = sourceNode.connections.some(
            conn => (conn.from === selectedNode.value && conn.to === secondarySelectedNode.value) ||
                   (conn.from === secondarySelectedNode.value && conn.to === selectedNode.value)
        ) || targetNode.connections.some(
            conn => (conn.from === selectedNode.value && conn.to === secondarySelectedNode.value) ||
                   (conn.from === secondarySelectedNode.value && conn.to === selectedNode.value)
        );
        
        if (!connectionExists) {
            const newConnection = {
                from: selectedNode.value,
                to: secondarySelectedNode.value
            };
            sourceNode.connections.push(newConnection);
            
            graphData.value = updatedGraph;
            saveCurrentGraph();
            
            // Award points for creating a connection
            gameScore(2);
        }
    }
    
    // Reset connection state
    secondarySelectedNode.value = null;
    isConnectingNodes.value = false;
}

// Function to initiate renaming with the current node's name prefilled
export function initiateRenameNode() {
    if (selectedNode.value) {
        newNodeName.value = selectedNode.value;
        isRenamingNode.value = true;
    }
}

// Game score functionality
export function gameScore(points: number) {
    fetch("/api/game", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: "df30d10a-48bb-4f56-a32f-b60954bfaf04",
            points,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Score updated:", data);
            // Emit a custom event with the updated score data
            const scoreUpdateEvent = new CustomEvent("gameScoreUpdate", {
                detail: { id: "df30d10a-48bb-4f56-a32f-b60954bfaf04", points },
            });
            window.dispatchEvent(scoreUpdateEvent);
            return data.totalPoints;
        });
}

// Update graph operations to include scoring
export function handleAddNode() {
    if (!selectedNode.value || !newNodeName.value.trim()) return;

    const updatedGraph = { ...graphData.value || { type: "graph", items: [] } };
    const newNode = {
        item: newNodeName.value.trim(),
        childItems: [],
        notes: "", // Initialize notes property as an empty string
    };

    // Add the new node and connect it to the selected node.
    updatedGraph.items = [...(updatedGraph.items || []), newNode];
    const selectedNodeData = updatedGraph.items.find((item) =>
        item.item === selectedNode.value
    );
    if (selectedNodeData) {
        selectedNodeData.childItems = [
            ...(selectedNodeData.childItems || []),
            newNode.item,
        ];
    }

    graphData.value = updatedGraph;
    saveCurrentGraph();
    newNodeName.value = "";
    isAddingNode.value = false;

    // Award points for adding a node
    gameScore(3);
}

export function handleRenameNode() {
    if (!selectedNode.value || !newNodeName.value.trim()) return;

    const updatedGraph = { ...graphData.value || { type: "graph", items: [] } };
    const newName = newNodeName.value.trim();
    const oldName = selectedNode.value;

    updatedGraph.items = updatedGraph.items.map((item) => {
        const updatedItem = { ...item };

        if (item.item === oldName) {
            updatedItem.item = newName;
        }

        if (item.childItems) {
            updatedItem.childItems = item.childItems.map((child) =>
                child === oldName ? newName : child
            );
        }

        if (item.connections) {
            updatedItem.connections = item.connections.map((conn) => ({
                from: conn.from === oldName ? newName : conn.from,
                to: conn.to === oldName ? newName : conn.to,
            }));
        }

        return updatedItem;
    });

    graphData.value = updatedGraph;
    saveCurrentGraph();
    newNodeName.value = "";
    isRenamingNode.value = false;
    selectedNode.value = newName;

    // Award points for renaming a node
    gameScore(5);
}

export function handleDeleteNode() {
    if (!selectedNode.value) return;

    const updatedGraph = { ...graphData.value || { type: "graph", items: [] } };
    const nodeToDelete = selectedNode.value;

    updatedGraph.items = updatedGraph.items.filter((item) =>
        item.item !== nodeToDelete
    );

    updatedGraph.items = updatedGraph.items.map((item) => {
        const updatedItem = { ...item };

        if (item.childItems) {
            updatedItem.childItems = item.childItems.filter((child) =>
                child !== nodeToDelete
            );
        }

        if (item.connections) {
            updatedItem.connections = item.connections.filter(
                (conn) =>
                    conn.from !== nodeToDelete && conn.to !== nodeToDelete,
            );
        }

        return updatedItem;
    });

    graphData.value = updatedGraph;
    saveCurrentGraph();
    selectedNode.value = null;

    // Award points for deleting a node
    gameScore(5);
}

// Load initial graphs data
if (typeof window !== "undefined") {
    loadSavedGraphs();
    if (graphs.value.size === 0) {
        // Create a default graph if none exist.
        const defaultGraphId = createGraph("Untitled Graph");
        loadGraph(defaultGraphId);
    } else if (!currentGraphId.value) {
        // Optionally load the first graph from the Map.
        const [firstGraphId] = graphs.value.keys();
        loadGraph(firstGraphId);
    }
}
