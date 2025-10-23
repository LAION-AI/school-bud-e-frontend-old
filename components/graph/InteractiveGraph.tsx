import { useEffect, useRef, useState } from "preact/hooks";
import cytoscape from "cytoscape";
import type { GraphNode } from "../../islands/RightSidebar.tsx";
import * as graphStore from "./store.ts";
import { requestGraphFormat } from "../../utils/aiFormatClient.ts";
import { validateGraphFormat } from "../../utils/graphValidation.ts";
import type { GraphJson } from "../../types/formats.ts";
import { addMessage } from "../chat/store.ts";
import { startStream } from "../chat/stream.ts";
import {
  getTestForNode,
  hasTestForNode,
  setSelectedTest,
} from "../tests/store.ts";
import NodeTestGenerator from "../tests/NodeTestGenerator.tsx";
import AIFloatingButton from "../../islands/AIFloatingButton.tsx";
import { FileText, LayoutGrid, Maximize, MessageCircle, X } from "lucide-preact";

interface InteractiveGraphProps {
  isRoot?: boolean;
}

// Extend the GraphNode type to include savedPosition
type ExtendedGraphNode = GraphNode & {
  savedPosition?: { x: number; y: number };
};

export function InteractiveGraph({
  isRoot = false,
}: InteractiveGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const nodeMap = useRef(new Map<string, GraphNode>());
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isGeneratingConnections, setIsGeneratingConnections] = useState<
    boolean
  >(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add state for test generator
  const [showTestGenerator, setShowTestGenerator] = useState(false);
  const [nodeWithTest, setNodeWithTest] = useState<string[]>([]);

  // Add state for loading indicator
  const [isGraphReady, setIsGraphReady] = useState(false);

  // Add state for edge selection
  const [selectedEdge, setSelectedEdge] = useState<
    { source: string; target: string } | null
  >(null);

  const [aiCustomPrompt, setAICustomPrompt] = useState("");

  // Add state for test generation
  const [showTestPrompt, setShowTestPrompt] = useState(false);
  const [testCustomPrompt, setTestCustomPrompt] = useState("");
  const [showInlinePrompt, setShowInlinePrompt] = useState(false);
  const [promptType, setPromptType] = useState<"connection" | "test">(
    "connection",
  );

  // Create Cytoscape elements from graph data (used only during the initial mount)
  const createGraphElements = (
    items: GraphNode[],
  ): cytoscape.ElementDefinition[] => {
    const elements: cytoscape.ElementDefinition[] = [];
    nodeMap.current.clear();

    // Build a map for quick lookup
    for (const node of items) {
      nodeMap.current.set(node.item, node);
    }

    const addNode = (id: string) => {
      // If the node is already added, skip it.
      if (elements.some((el) => el.data && el.data.id === id)) return;
      // Look up the saved position
      const saved = nodeMap.current.get(id);
      const position = saved?.position || {
        x: Math.random() * 500,
        y: Math.random() * 400,
      };

      const nodeDef: cytoscape.ElementDefinition = {
        data: {
          id: id,
          label: id,
        },
        position: position, // Always provide a position, randomly generate if not available
      };
      elements.push(nodeDef);
    };

    // If no items, add a default node
    if (items.length === 0) {
      addNode("Default Node");
      return elements;
    }

    for (const node of items) {
      // Add the main node
      addNode(node.item);

      // Process child items
      for (const child of node.childItems || []) {
        addNode(child);
        elements.push({ data: { source: node.item, target: child } });
      }

      // Process other connections
      for (const connection of node.connections || []) {
        addNode(connection.from);
        addNode(connection.to);
        elements.push({
          data: { source: connection.from, target: connection.to },
        });
      }
    }

    return elements;
  };

  // --- Cytoscape instance creation ---
  useEffect(() => {
    if (containerRef.current && graphStore.graphData.value?.items) {
      try {
        // Hide the container initially
        if (containerRef.current) {
          containerRef.current.style.opacity = "0";
          containerRef.current.style.transition = "opacity 0.3s ease-in-out";
        }

        // Set explicit z-index for the container to ensure it's visible
        containerRef.current.style.zIndex = "5";

        // Add type assertion to ensure items match GraphNode structure
        const items = graphStore.graphData.value
          .items as unknown as GraphNode[];
        const elements = createGraphElements(items);

        // Check if Cytoscape instance already exists
        if (cyRef.current) {
          cyRef.current.destroy();
          cyRef.current = null;
        }

        const cy = cytoscape({
          container: containerRef.current,
          maxZoom: 5, // Increased from 3 to 5 for better zoom capability
          minZoom: 0.5, // Decreased from 0.75 to 0.5 for better overview
          boxSelectionEnabled: true, // Allow box selection for multiple nodes
          elements,
          style: [
            {
              selector: "node",
              style: {
                shape: "ellipse",
                "background-color": "#2BBDE5", // Primary blue from Figma design
                width: 80, // Slightly larger for better visibility
                height: 80, // Slightly larger for better visibility
                label: "data(label)",
                "text-valign": "bottom", // Position text below the circle
                "text-halign": "center",
                "text-margin-y": 10, // Add space between circle and text
                "text-wrap": "wrap",
                "text-max-width": "80px", // Match node width
                "font-size": "14px", // Slightly larger font
                "font-weight": "semibold", // Bold text for visibility
                color: "#000000", // Black text
                "text-outline-width": "2px",
                "text-outline-color": "#ffffff", // White outline for visibility
                "font-family": "'Plus Jakarta Sans', 'Inter', sans-serif",
                "background-image": (ele: { data: (id: string) => string }) => {
                  const nodeData = nodeMap.current.get(ele.data("id"));
                  return nodeData?.image ? `url(${nodeData.image})` : "none";
                },
                "background-fit": "cover",
                "border-width": "0px", // Remove border for cleaner look
                "border-style": "solid",
                "box-shadow": "0 0 10px 0 rgba(43, 189, 229, 0.3)", // Blue shadow matching the node color
                "box-shadow-offset-x": "0px",
                "box-shadow-offset-y": "4px",
                "z-index": 10, // Ensure nodes are above other elements
              },
            },
            {
              selector: "node:selected",
              style: {
                "border-width": "4px",
                "border-color": "#ffd700", // Gold border on selection
                "background-color": "#33bfd7", // Darker blue when selected (primary-400)
              },
            },
            {
              selector: "node.secondary-selected",
              style: {
                "border-width": "3px",
                "border-color": "#00f",
              },
            },
            {
              selector: 'node[type="root"]',
              style: {
                "background-color": "#0a84ff",
                "border-width": "3px",
                "border-color": "#fff",
              },
            },
            {
              selector: "edge",
              style: {
                width: 3, // Thicker edges
                "line-color": "#B7D7E0", // Black edges for visibility
                "curve-style": "bezier",
                "z-index": 5, // Ensure edges are visible
                "opacity": 1, // Always fully opaque
                "visibility": "visible", // Always visible
                "min-zoomed-font-size": 0, // Ensure edges are visible at all zoom levels
                "overlay-opacity": 0, // Make overlay transparent for better edge interaction
                "text-opacity": 1, // Ensure text is always visible
                "text-outline-width": 2, // Add outline to text for better visibility
                "text-outline-color": "#ffffff", // White outline for text
                "text-outline-opacity": 1, // Full opacity for outline
                "line-style": "dashed",
                "line-dash-pattern": [7, 5],
                "line-cap": "round",
              },
            },
            // Add a specific style for edges connected to selected nodes
            {
              selector:
                "node:selected + edge, edge:selected, node:selected node:selected + edge",
              style: {
                "line-color": "#000", // Keep the same color for consistency
                "width": 3, // Keep the same width
                "z-index": 6, // Slightly higher z-index to ensure they appear on top
                "opacity": 1, // Ensure full opacity
              },
            },
            {
              selector: "node.has-test",
              style: {
                "border-color": "#ffc107", // Yellow border for nodes with tests
                "border-width": "4px",
                // Add a badge or indicator that this node has a test
                "background-image": (ele: { data: (id: string) => string }) => {
                  const nodeData = nodeMap.current.get(ele.data("id"));
                  return nodeData?.image ? `url(${nodeData.image})` : "none";
                },
              },
            },
          ],
          layout: {
            name: "preset", // Always use preset layout to respect saved positions
            fit: true, // Fit all nodes in the view
            padding: 50, // Add padding around the layout
          },
        });

        // Only run the secondary layout if no positions are defined
        const nodesWithoutPositions = cy.nodes().filter(
          (node: cytoscape.NodeSingular) => {
            const nodeId = node.id();
            const nodeData = items.find((item) => item.item === nodeId);
            return !nodeData?.position ||
              (nodeData.position.x === undefined &&
                nodeData.position.y === undefined);
          },
        );

        if (nodesWithoutPositions.length > 0) {
          // If we need to calculate positions, keep the container hidden
          setTimeout(() => {
            if (cy) {
              nodesWithoutPositions.layout({
                name: "cose",
                animate: false, // Don't animate to avoid flickering
                randomize: true,
                nodeOverlap: 20,
                componentSpacing: 100,
                nodeRepulsion: 10000,
                idealEdgeLength: 100,
                edgeElasticity: 100,
              }).run();

              // After layout is complete, show the graph
              setTimeout(() => {
                if (containerRef.current) {
                  containerRef.current.style.opacity = "1";
                }
                setIsGraphReady(true);
              }, 100);
            }
          }, 100);
        } else {
          // If all positions are already defined, show the graph immediately
          if (containerRef.current) {
            containerRef.current.style.opacity = "1";
          }
          setIsGraphReady(true);
        }

        // Add event listener for position changes to save node positions
        cy.on("position", "node", (event: cytoscape.EventObject) => {
          const nodeId = event.target.id();
          const position = event.target.position();

          // Update the position in the graph data
          if (graphStore.graphData.value?.items) {
            const nodeIndex = graphStore.graphData.value.items.findIndex(
              (item) => item.item === nodeId,
            );

            if (nodeIndex >= 0) {
              // Update position in the node data
              graphStore.graphData.value.items[nodeIndex].position = {
                x: position.x,
                y: position.y,
              };

              // Save changes to persist positions
              graphStore.saveCurrentGraph();
            }
          }
        });

        // Handle window resize to properly size the graph
        const handleResize = () => {
          if (cyRef.current && containerRef.current) {
            cyRef.current.resize();
            cyRef.current.fit();
          }
        };

        // Add resize event listener
        window.addEventListener("resize", handleResize);

        // Make sure to save positions after any layout completes
        cy.on("layoutstop", () => {
          ensureReferencedNodesExist();

          // Save all node positions after layout stops
          if (graphStore.graphData.value?.items) {
            let positionsChanged = false;

            // Update all node positions based on cytoscape positions
            for (const node of graphStore.graphData.value.items) {
              const cyNode = cy.$(`node[id="${node.item}"]`);
              if (cyNode.length > 0) {
                const pos = cyNode.position();
                // Only update if position has changed
                if (
                  !node.position ||
                  node.position.x !== pos.x ||
                  node.position.y !== pos.y
                ) {
                  node.position = { x: pos.x, y: pos.y };
                  positionsChanged = true;
                }
              }
            }

            // Only save if positions actually changed
            if (positionsChanged) {
              graphStore.saveCurrentGraph();
            }
          }
        });

        // Add event for edge selection
        cy.on("select", "edge", (event: cytoscape.EventObject) => {
          const source = event.target.source().id();
          const target = event.target.target().id();
          setSelectedEdge({ source, target });
        });

        // Add event for edge deselection
        cy.on("unselect", "edge", () => {
          setSelectedEdge(null);
        });

        // Add event to deselect edges when clicking on canvas
        cy.on("tap", (event: cytoscape.EventObject) => {
          if (event.target === cy) {
            // Clicked on background
            setSelectedEdge(null);
          }
        });

        // Add event listeners for node selection
        cy.on("select", "node", (event: { target: { id: () => string } }) => {
          const selectedNode = event.target.id();
          graphStore.selectedNode.value = selectedNode;
          setSelectedNodes((prev) => {
            if (!prev.includes(selectedNode)) {
              return [...prev, selectedNode];
            }
            return prev;
          });

          // Make sure all edges remain visible when a node is selected
          cy.edges().style("opacity", 1);

          // Highlight the edges connected to the selected node
          const connectedEdges = cy.$(
            `edge[source="${selectedNode}"], edge[target="${selectedNode}"]`,
          );
          if (connectedEdges.length > 0) {
            // Make connected edges more prominent
            connectedEdges.style({
              "width": 4,
              "line-color": "#0a84ff",
              "target-arrow-color": "#0a84ff",
              "z-index": 10,
            });
          }
        });

        cy.on("unselect", "node", (event: { target: { id: () => string } }) => {
          const unselectedNode = event.target.id();

          // Reset the style of edges connected to the unselected node
          const connectedEdges = cy.$(
            `edge[source="${unselectedNode}"], edge[target="${unselectedNode}"]`,
          );
          if (connectedEdges.length > 0) {
            connectedEdges.style({
              "width": 3,
              "line-color": "#000",
              "target-arrow-color": "#000",
              "z-index": 5,
            });
          }

          setSelectedNodes((prev) =>
            prev.filter((id) => id !== unselectedNode)
          );

          // If all nodes are unselected, clear the selected node in the store
          if (cy.nodes(":selected").length === 0) {
            graphStore.selectedNode.value = null;
          } else if (cy.nodes(":selected").length === 1) {
            // If only one node remains selected, make it the selected node in the store
            graphStore.selectedNode.value = cy.nodes(":selected")[0].id();

            // Highlight edges of the remaining selected node
            const remainingNode = cy.nodes(":selected")[0].id();
            const remainingConnectedEdges = cy.$(
              `edge[source="${remainingNode}"], edge[target="${remainingNode}"]`,
            );
            if (remainingConnectedEdges.length > 0) {
              remainingConnectedEdges.style({
                "width": 4,
                "line-color": "#0a84ff",
                "target-arrow-color": "#0a84ff",
                "z-index": 10,
              });
            }
          }

          // Ensure edges remain visible
          cy.edges().style("opacity", 1);
        });

        // Add event listeners
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.key.toLowerCase() === "c") {
            graphStore.handleConnectNodes();
          }

          // Handle delete key for multiple node deletion
          if (e.key === "Delete" && selectedNodes.length > 0) {
            deleteSelectedNodes();
          }
        };

        window.addEventListener("keydown", handleKeyDown);

        cyRef.current = cy;

        // Cleanup on component unmount
        return () => {
          if (cyRef.current) {
            cyRef.current.destroy();
            cyRef.current = null;
          }
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("resize", handleResize);
        };
      } catch (error) {
        // Display error in the UI instead
        setIsGraphReady(true); // Still set ready to avoid infinite loading
      }
    }
  }, [graphStore.graphData.value]);

  // Load nodes with tests when component mounts
  useEffect(() => {
    if (graphStore.graphData.value?.items) {
      const nodesWithTests = graphStore.graphData.value.items
        .filter((item) => hasTestForNode(item.item))
        .map((item) => item.item);

      setNodeWithTest(nodesWithTests);
    }
  }, []);

  // Update cytoscape node style for nodes with tests
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    for (const nodeId of nodeWithTest) {
      const node = cy.$(`node[id="${nodeId}"]`);
      if (node) {
        node.addClass("has-test");
      }
    }
  }, [nodeWithTest]);

  // --- Helper functions for direct Cytoscape updates ---

  // Update a node's label (rename) without reloading the whole graph.
  const updateNodeLabel = (oldId: string, newLabel: string) => {
    const cy = cyRef.current;
    if (cy) {
      const node = cy.$(`node[id="${oldId}"]`);
      if (node) {
        node.data({ id: newLabel, label: newLabel });
      }
    }
  };

  // Remove a node directly from Cytoscape.
  const removeNodeFromCy = (nodeId: string) => {
    const cy = cyRef.current;
    if (cy) {
      const node = cy.$(`node[id="${nodeId}"]`);
      if (node) {
        node.remove();
      }
    }
  };

  // Add a node directly to Cytoscape.
  const addNodeToCy = (node: GraphNode) => {
    const cy = cyRef.current;
    if (cy) {
      if (cy.$(`node[id="${node.item}"]`).empty()) {
        cy.add({
          data: {
            id: node.item,
            label: node.item,
            ...(isRoot && { type: "root" }),
          },
          position: node.position, // Use the provided position if available
        });
      }
    }
  };

  // --- Event Handlers ---

  const handleRename = () => {
    const oldId = graphStore.selectedNode.value;
    const newLabel = graphStore.newNodeName.value.trim();
    if (!oldId || !newLabel) return;

    // Update Cytoscape directly.
    updateNodeLabel(oldId, newLabel);

    // Update the store in place.
    if (graphStore.graphData.value?.items) {
      for (const item of graphStore.graphData.value.items) {
        if (item.item === oldId) {
          item.item = newLabel;
          item.childItems = item.childItems?.map((child) =>
            child === oldId ? newLabel : child
          );
          if (item.connections) {
            item.connections = item.connections.map((conn) => ({
              from: conn.from === oldId ? newLabel : conn.from,
              to: conn.to === oldId ? newLabel : conn.to,
            }));
          }
        }
      }
      graphStore.saveCurrentGraph();
      graphStore.newNodeName.value = "";
      graphStore.isRenamingNode.value = false;
      graphStore.selectedNode.value = newLabel;
    }
  };

  const handleDelete = () => {
    const nodeId = graphStore.selectedNode.value;
    if (!nodeId) return;

    // Remove the node from Cytoscape directly.
    removeNodeFromCy(nodeId);

    // Update the store in place.
    if (graphStore.graphData.value?.items) {
      graphStore.graphData.value.items = graphStore.graphData.value.items
        .filter((item) => item.item !== nodeId);

      for (const item of graphStore.graphData.value.items) {
        if (item.childItems) {
          item.childItems = item.childItems.filter((child) => child !== nodeId);
        }
        if (item.connections) {
          item.connections = item.connections.filter(
            (conn) => conn.from !== nodeId && conn.to !== nodeId,
          );
        }
      }

      graphStore.saveCurrentGraph();
      graphStore.selectedNode.value = null;
    }
  };

  const handleAdd = () => {
    const selected = graphStore.selectedNode.value;
    const newName = graphStore.newNodeName.value.trim();
    if (!selected || !newName) return;

    // Get the selected node's position
    const cy = cyRef.current;
    if (!cy) return;

    const selectedNode = cy.$(`node[id="${selected}"]`);
    if (selectedNode.empty()) return;

    const selectedPosition = selectedNode.position();

    // Create a position offset from the selected node
    // Place the new node at a slight offset from the selected node
    const offset = 100; // pixels
    const angle = Math.random() * 2 * Math.PI; // random angle
    const xOffset = Math.cos(angle) * offset;
    const yOffset = Math.sin(angle) * offset;

    const position = {
      x: selectedPosition.x + xOffset,
      y: selectedPosition.y + yOffset,
    };

    const newNode: GraphNode = {
      item: newName,
      childItems: [],
      position: position, // Set the position property
    };

    // Add the new node directly to Cytoscape with the calculated position
    addNodeToCy(newNode);

    // Also add the edge connecting the selected node to the new node.
    if (cy.$(`edge[source="${selected}"][target="${newName}"]`).empty()) {
      cy.add({ data: { source: selected, target: newName } });
    }

    // Position the new node explicitly
    const newNodeElement = cy.$(`node[id="${newName}"]`);
    if (!newNodeElement.empty()) {
      newNodeElement.position(position);
    }

    // Update the store in place.
    if (graphStore.graphData.value?.items) {
      graphStore.graphData.value.items.push(newNode);
      const selectedNodeData = graphStore.graphData.value.items.find(
        (item) => item.item === selected,
      );
      if (selectedNodeData) {
        selectedNodeData.childItems = [
          ...(selectedNodeData.childItems || []),
          newName,
        ];
      }
    }
    graphStore.saveCurrentGraph();
    graphStore.newNodeName.value = "";
    graphStore.isAddingNode.value = false;
  };

  // --- New Feature: Spread Nodes ---
  const handleSpreadNodes = () => {
    const cy = cyRef.current;
    if (cy) {
      const layout = cy.layout({
        name: "cose",
        animate: true,
        animationDuration: 500,
      });
      layout.run();
    }
  };

  // Delete multiple selected nodes
  const deleteSelectedNodes = () => {
    if (selectedNodes.length === 0) return;

    // Make a copy of the selected nodes to work with
    const nodesToDelete = [...selectedNodes];

    // Get the current graph data
    const graphData = graphStore.graphData.value;
    if (!graphData?.items) return;

    // Remove the nodes from Cytoscape directly
    for (const nodeId of nodesToDelete) {
      removeNodeFromCy(nodeId);
    }

    // Update the store in place
    graphData.items = graphData.items.filter(
      (item) => !nodesToDelete.includes(item.item),
    );

    // Update childItems and connections for the remaining nodes
    for (const item of graphData.items) {
      if (item.childItems) {
        item.childItems = item.childItems.filter(
          (child) => !nodesToDelete.includes(child),
        );
      }
      if (item.connections) {
        item.connections = item.connections.filter(
          (conn) =>
            !nodesToDelete.includes(conn.from) &&
            !nodesToDelete.includes(conn.to),
        );
      }
    }

    // Save changes and clear selection
    graphStore.saveCurrentGraph();
    graphStore.selectedNode.value = null;
    setSelectedNodes([]);
  };

  // Generate AI connections for the selected nodes
  const generateAIConnections = async (customPrompt?: string) => {
    if (selectedNodes.length === 0) {
      alert("Please select at least one node to generate connections.");
      return;
    }

    setIsGeneratingConnections(true);
    setAiResponse("");

    try {
      // Create a custom prompt for generating connections between selected nodes
      const basePromptContent = selectedNodes.length > 1
        ? `I have a knowledge graph with these selected nodes: ${
          selectedNodes.join(", ")
        }. 
            Please generate logical connections between these nodes, explaining how they relate to each other.
            Only include nodes that already exist in my selection. The connections should be based on meaningful relationships.
            
            Please format the response as a graph with appropriate connections.
            
            IMPORTANT: Make sure you only include existing nodes in your response. Do not create new nodes that don't exist in my selection.`
        : `I have a knowledge graph with this selected node: "${
          selectedNodes[0]
        }". 
            Please generate 3-5 new related nodes that could connect to this node, and explain their relationships.
            The new nodes should be logically related to the selected node in a meaningful way.
            
            Please format the response as a graph with the original node connected to the new nodes you suggest.
            
            IMPORTANT: Make sure the node "${
          selectedNodes[0]
        }" remains in your response as the main node.
            Your response should follow this structure exactly:
            {
              "type": "graph",
              "items": [
				{
                  "item": "${selectedNodes[0]}",
                  "connections": [
                    {"from": "${selectedNodes[0]}", "to": "New Node 1"},
                    {"from": "${selectedNodes[0]}", "to": "New Node 2"}
                  ]
				},
				{
                  "item": "New Node 1"
                },
                {
                  "item": "New Node 2"
                }
              ]
            }
            Replace "New Node 1" and "New Node 2" with meaningful related concepts.`;

      // Add the custom prompt as additional instructions if provided
      const promptContent = customPrompt
        ? `${basePromptContent}\n\nAdditional context/instructions: ${customPrompt}`
        : basePromptContent;

      const apiKey = localStorage.getItem("UNIVERSAL_API_KEY") || "";

      const result = await requestGraphFormat(
        [{ role: "user", content: promptContent }],
        {
          universalApiKey: apiKey,
        },
      );

      // Check if the result is a valid graph
      const validatedGraph = validateGraphFormat(result, selectedNodes[0]);

      if (validatedGraph) {
        applyAIConnections(validatedGraph);
      }
      setIsGeneratingConnections(false);
    } catch (error) {
      setIsGeneratingConnections(false);
    }
  };

  // Apply the AI-generated connections to the graph
  const applyAIConnections = (graphData: GraphJson) => {
    try {
      const cy = cyRef.current;
      if (!cy) return;

      // Keep track of all nodes that need to be added
      const existingNodes = graphStore.graphData.value?.items || [];
      const newNodes: GraphNode[] = [];

      // Process each item from the AI response
      for (const item of graphData.items) {
        // Check if the node already exists
        const nodeExists = existingNodes.some((node) =>
          node.item === item.item
        );

        if (!nodeExists) {
          // This is a new node, add it
          newNodes.push({
            item: item.item,
            connections: item.connections || [],
            childItems: item.childItems || [],
          });
          addNodeToCy({
            item: item.item,
            connections: item.connections || [],
            childItems: item.childItems || [],
          });
        }

        // Process connections for this item
        if (item.connections && item.connections.length > 0) {
          for (const connection of item.connections) {
            try {
              // Add edge to Cytoscape
              if (
                cy.$(`node[id="${connection.from}"]`).length > 0 &&
                cy.$(`node[id="${connection.to}"]`).length > 0
              ) {
                // Only add the edge if both nodes exist
                if (
                  cy.$(
                    `edge[source="${connection.from}"][target="${connection.to}"]`,
                  ).length === 0
                ) {
                  cy.add({
                    group: "edges",
                    data: {
                      id: `${connection.from}-${connection.to}`,
                      source: connection.from,
                      target: connection.to,
                    },
                  });
                }

                // Update the graph data to include this connection
                const sourceNode = existingNodes.find((node) =>
                  node.item === connection.from
                );
                if (sourceNode) {
                  // Check if connection already exists
                  const hasConnection = sourceNode.connections?.some(
                    (conn) =>
                      conn.from === connection.from &&
                      conn.to === connection.to,
                  );

                  if (!hasConnection) {
                    if (!sourceNode.connections) sourceNode.connections = [];
                    sourceNode.connections.push({
                      from: connection.from,
                      to: connection.to,
                    });
                  }
                }

                // Update childItems on the target node
                const targetNode = existingNodes.find((node) =>
                  node.item === connection.to
                );
                if (targetNode) {
                  if (!targetNode.childItems) targetNode.childItems = [];
                  if (!targetNode.childItems.includes(connection.from)) {
                    targetNode.childItems.push(connection.from);
                  }
                }
              }
            } catch (error) {
              // Error handled silently
            }
          }
        }
      }

      // Save the updates to the graph data
      const hasUpdates = newNodes.length > 0 ||
        graphData.items.some((item) =>
          item.connections && item.connections.length > 0
        );

      if (hasUpdates) {
        for (const newNode of newNodes) {
          existingNodes.push(newNode);
        }

        // Update store
        if (graphStore.graphData.value) {
          graphStore.graphData.value.items = existingNodes;
          graphStore.saveCurrentGraph();
        }

        // Try to position the new nodes around the selected node
        if (selectedNodes.length === 1 && newNodes.length > 0) {
          // Find the reference node (the selected one)
          const referenceNode = cy.$(`node[id="${selectedNodes[0]}"]`);
          if (referenceNode.length > 0) {
            const referencePos = referenceNode.position();

            // Calculate positions for new nodes in a circular arrangement around the selected node
            const newNodesCount = newNodes.length;
            const radius = 150; // Distance from selected node

            // Position each new node
            for (let i = 0; i < newNodesCount; i++) {
              const angle = (i * 2 * Math.PI) / newNodesCount;
              const x = referencePos.x + radius * Math.cos(angle);
              const y = referencePos.y + radius * Math.sin(angle);

              const nodeElement = cy.$(`node[id="${newNodes[i].item}"]`);
              if (nodeElement.length > 0) {
                nodeElement.position({ x, y });

                // Save position to the node data
                newNodes[i].position = { x, y };
              }
            }
          }
        }
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // Add chat-related functions
  const handleSendMessage = async () => {
    if (!chatInputRef.current?.value.trim() || isProcessing) return;

    const userMessage = chatInputRef.current.value.trim();
    const graphContext = selectedNodes.length > 0
      ? `I'm looking at a knowledge graph with the following selected nodes: ${
        selectedNodes.join(", ")
      }. `
      : "I'm looking at a knowledge graph. ";

    const messageWithContext = graphContext + userMessage;

    chatInputRef.current.value = "";

    // Add user message to chat history
    addMessage({ role: "user", content: userMessage });
    setIsProcessing(true);

    try {
      // Use the existing stream functionality from chat components
      await startStream(messageWithContext);
    } catch (error) {
      addMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      // Focus the input field again after sending
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 0);
    }
  };

  // Function to reset the graph view
  const resetView = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
    }
  };

  // Function to handle opening a test for a node
  const handleOpenNodeTest = (nodeId: string) => {
    const test = getTestForNode(nodeId);
    if (test) {
      // If test exists, set it as selected and navigate to view it
      setSelectedTest(test.id);
      window.location.href = `/tests/view/${test.id}`;
    } else {
      // If test doesn't exist, show the test generator
      setShowTestGenerator(true);
    }
  };

  // Function to check if a node has a test
  const checkNodeHasTest = (nodeId: string) => {
    return nodeWithTest.includes(nodeId);
  };

  // Function to ensure that any node referenced in connections exists in the graph data
  const ensureReferencedNodesExist = () => {
    if (!graphStore.graphData.value?.items) return;

    const cy = cyRef.current;
    if (!cy) return;

    // Get all existing node IDs
    const existingNodeIds = new Set(
      graphStore.graphData.value.items.map((node) => node.item),
    );

    // Collect all node IDs referenced in connections
    const referencedNodeIds = new Set<string>();

    // Check all connections for nodes that don't exist
    for (const node of graphStore.graphData.value.items) {
      if (node.connections) {
        for (const connection of node.connections) {
          referencedNodeIds.add(connection.from);
          referencedNodeIds.add(connection.to);
        }
      }
    }

    let nodesAdded = false;

    // Find nodes that are referenced but don't exist
    for (const nodeId of referencedNodeIds) {
      if (!existingNodeIds.has(nodeId)) {
        // This node is referenced but doesn't exist - add it
        const newNode: GraphNode = {
          item: nodeId,
          connections: [],
          childItems: [],
        };

        // Add to graph data
        graphStore.graphData.value.items.push(newNode);

        // Add to Cytoscape if it doesn't already exist
        if (cy.$(`node[id="${nodeId}"]`).empty()) {
          // Position it near the center of the viewport
          const extent = cy.extent();
          const x = (extent.x1 + extent.x2) / 2;
          const y = (extent.y1 + extent.y2) / 2;

          // Add some randomness to avoid overlap
          const randomOffset = 100;
          const randomX = x + (Math.random() * randomOffset * 2 - randomOffset);
          const randomY = y + (Math.random() * randomOffset * 2 - randomOffset);

          // Add the node to Cytoscape
          cy.add({
            data: {
              id: nodeId,
              label: nodeId,
            },
            position: { x: randomX, y: randomY },
          });

          // Update the position in the graph data
          newNode.position = { x: randomX, y: randomY };
        } else {
          // Node exists in Cytoscape but not in graph data
          // Get its position from Cytoscape
          const pos = cy.$(`node[id="${nodeId}"]`).position();
          newNode.position = { x: pos.x, y: pos.y };
        }

        nodesAdded = true;
      }
    }

    // If any nodes were added, save the graph
    if (nodesAdded) {
      graphStore.saveCurrentGraph();
    }
  };

  // Function to spread all nodes using the cose layout
  const spreadAllNodes = () => {
    const cy = cyRef.current;
    if (!cy) return;

    // First ensure all referenced nodes exist
    ensureReferencedNodesExist();

    // Save original positions before applying layout
    const nodes = cy.nodes();
    for (const node of nodes) {
      const nodeId = node.id();
      const originalPosition = node.position();
      const nodeData = graphStore.graphData.value?.items.find(
        (item) => item.item === nodeId,
      ) as ExtendedGraphNode | undefined;

      if (nodeData) {
        // Store the current position as savedPosition
        nodeData.savedPosition = {
          x: originalPosition.x,
          y: originalPosition.y,
        };
      }
    }

    // Apply cose layout to all nodes
    cy.layout({
      name: "cose",
      animate: true,
      animationDuration: 500,
      randomize: true,
      nodeOverlap: 20,
      componentSpacing: 100,
      nodeRepulsion: 10000,
      idealEdgeLength: 100,
      edgeElasticity: 100,
      fit: false, // Don't fit to viewport to maintain zoom level
    }).run();

    // Force save positions after layout - a safety measure in case the layoutstop event doesn't fire
    setTimeout(() => {
      ensureReferencedNodesExist();

      if (graphStore.graphData.value?.items) {
        // Update all node positions based on cytoscape positions
        let positionsChanged = false;
        for (const node of graphStore.graphData.value.items) {
          const cyNode = cy.$(`node[id="${node.item}"]`);
          if (cyNode.length > 0) {
            const pos = cyNode.position();
            if (
              !node.position ||
              node.position.x !== pos.x ||
              node.position.y !== pos.y
            ) {
              node.position = { x: pos.x, y: pos.y };
              positionsChanged = true;
            }
          }
        }

        // Save if any positions changed
        if (positionsChanged) {
          graphStore.saveCurrentGraph();
        }
      }
    }, 1000); // Wait for layout animation to complete
  };

  // Add a call to ensure referenced nodes exist before saving in other key functions
  const restoreFixedLayout = () => {
    const cy = cyRef.current;
    if (!cy) return;

    ensureReferencedNodesExist();

    // Get all nodes in the graph data
    if (graphStore.graphData.value?.items) {
      for (const item of graphStore.graphData.value.items) {
        // Try to get the extended node with saved position
        const nodeData = item as ExtendedGraphNode;
        if (nodeData.savedPosition) {
          // Get the corresponding node in Cytoscape
          const node = cy.$(`node[id="${item.item}"]`);
          if (node.length > 0) {
            // Restore the saved position
            node.position(nodeData.savedPosition);
          }
        }
      }

      // Save the current graph after restoring positions
      graphStore.saveCurrentGraph();
    }
  };

  // Add function to remove selected edge
  const removeSelectedEdge = () => {
    if (!selectedEdge) return;

    const cy = cyRef.current;
    if (!cy) return;

    // Remove from Cytoscape
    const edge = cy.edges(
      `[source="${selectedEdge.source}"][target="${selectedEdge.target}"]`,
    );
    if (edge) {
      edge.remove();
    }

    // Remove from the graph data
    if (graphStore.graphData.value?.items) {
      const sourceNode = graphStore.graphData.value.items.find(
        (item) => item.item === selectedEdge.source,
      );

      sourceNode?.connections?.forEach((conn, index, connections) => {
        if (
          conn.from === selectedEdge.source && conn.to === selectedEdge.target
        ) {
          connections.splice(index, 1);
        }
      });

      const targetNode = graphStore.graphData.value.items.find(
        (item) => item.item === selectedEdge.target,
      );

      targetNode?.childItems?.forEach((child, index, children) => {
        if (child === selectedEdge.source) {
          children.splice(index, 1);
        }
      });

      graphStore.saveCurrentGraph();
    }

    // Clear selection
    setSelectedEdge(null);
  };

  // Add function to check for phantom nodes before saving
  const handleSaveGraph = () => {
    ensureReferencedNodesExist();
    graphStore.saveCurrentGraph();
  };

  // Handle opening test prompt
  const handleShowTestPrompt = (nodeId: string) => {
    setSelectedNodes([nodeId]);
    setPromptType("test");
    setShowTestPrompt(true);
    setTestCustomPrompt("");
  };

  // Handle generating test with custom prompt
  const handleGenerateTestWithPrompt = async (
    nodeId: string,
    customPrompt: string,
  ) => {
    setShowTestPrompt(false);
    setTestCustomPrompt("");
    setIsProcessing(true);

    try {
      // Pass the custom prompt to the test generator via sessionStorage
      // so the NodeTestGenerator component can access it
      if (customPrompt) {
        sessionStorage.setItem(`test_prompt_${nodeId}`, customPrompt);
      } else {
        sessionStorage.removeItem(`test_prompt_${nodeId}`);
      }

      // If we already have a test generator showing, just update it
      if (showTestGenerator) {
        // Reset to trigger a re-render with the new prompt
        setShowTestGenerator(false);
        setTimeout(() => {
          setShowTestGenerator(true);
          setIsProcessing(false);
        }, 50);
      } else {
        // Otherwise open the test generator
        setShowTestGenerator(true);
        setIsProcessing(false);
      }
    } catch (error) {
      setIsProcessing(false);
    }
  };

  // --- Rendering ---
  return (
    <div
      class="relative w-full h-full flex flex-col"
      style={{ height: "100dvh" }}
    >
      {/* Rest of the component */}
      <div class="flex-grow flex relative">
        {/* Graph container */}
        <div class="relative w-full h-full transition-all duration-300 ease-in-out">
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              position: "relative",
            }}
          />

          {!isGraphReady && (
            <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
              <p class="text-lg text-gray-600">Loading graph...</p>
            </div>
          )}

          {/* Move the toolbar to the bottom center with a rounded-full style */}
          <div class="absolute bottom-20 md:bottom-4 md:left-1/2 transform left-4 md:-translate-x-1/2 z-20 flex flex-col items-center space-y-3">
            {/* Inline Prompt for AI Connections */}
            {showInlinePrompt && promptType === "connection" && (
              <div class="inline-flex items-center justify-center p-2 bg-white border border-primary-200 shadow-lg rounded-full backdrop-blur-sm bg-opacity-90 mb-2 max-w-lg transition-all duration-200 ease-in-out">
                <input
                  type="text"
                  class="bg-transparent border-none outline-none p-1 w-60 text-sm placeholder-gray-400 text-gray-700 rounded-l-full"
                  placeholder="Additional context for AI connections..."
                  value={aiCustomPrompt}
                  onInput={(e) =>
                    setAICustomPrompt((e.target as HTMLInputElement).value)}
                />
                <div class="flex items-center">
                  <button
                    type="button"
                    disabled={isGeneratingConnections}
                    onClick={() => {
                      setShowInlinePrompt(false);
                      generateAIConnections(aiCustomPrompt);
                      setAICustomPrompt("");
                    }}
                    class="p-2 rounded-full bg-primary-500 hover:bg-primary-600 transition-colors flex items-center space-x-1 text-white"
                    title="Generate connections"
                  >
                    <MessageCircle size={16} />
                    <span class="text-xs font-medium mr-1">Generate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlinePrompt(false);
                      setAICustomPrompt("");
                    }}
                    class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 ml-1"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Inline Prompt for Test Generation */}
            {showTestPrompt && promptType === "test" &&
              selectedNodes.length === 1 && (
              <div class="inline-flex items-center justify-center p-2 bg-white border border-green-200 shadow-lg rounded-full backdrop-blur-sm bg-opacity-90 mb-2 max-w-lg transition-all duration-200 ease-in-out">
                <input
                  type="text"
                  class="bg-transparent border-none outline-none p-1 w-60 text-sm placeholder-gray-400 text-gray-700 rounded-l-full"
                  placeholder="Focus areas for the test (e.g. 'basic concepts', 'advanced theory')..."
                  value={testCustomPrompt}
                  onInput={(e) =>
                    setTestCustomPrompt((e.target as HTMLInputElement).value)}
                />
                <div class="flex items-center">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() =>
                      handleGenerateTestWithPrompt(
                        selectedNodes[0],
                        testCustomPrompt,
                      )}
                    class="p-2 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center space-x-1 text-white"
                    title="Generate test"
                  >
                    <FileText size={16} />
                    <span class="text-xs font-medium mr-1">Generate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTestPrompt(false);
                      setTestCustomPrompt("");
                    }}
                    class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 ml-1"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Main Toolbar */}
            <div class="inline-flex items-center justify-center p-2 bg-white border border-gray-200 shadow-lg rounded-full backdrop-blur-sm bg-opacity-90">
              <div class="flex items-center space-x-1 max-w-[300px] flex-wrap">
                {/* Button to spread all nodes */}
                <button
                  type="button"
                  onClick={spreadAllNodes}
                  class="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center space-x-1 text-gray-700 border border-transparent hover:border-gray-200"
                  title="Spread all nodes for better visibility"
                >
                  <LayoutGrid size={16} />
                  <span class="text-xs font-medium">Spread</span>
                </button>

                {/* Button to restore fixed layout */}
                <button
                  type="button"
                  onClick={restoreFixedLayout}
                  class="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center space-x-1 text-gray-700 border border-transparent hover:border-gray-200"
                  title="Restore fixed node positions"
                >
                  <Maximize size={16} />
                  <span class="text-xs font-medium">Fix</span>
                </button>

                {/* Button to center and reset view */}
                <button
                  type="button"
                  onClick={resetView}
                  class="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center space-x-1 text-gray-700 border border-transparent hover:border-gray-200"
                  title="Reset view"
                >
                  <X size={16} />
                  <span class="text-xs font-medium">Reset</span>
                </button>

                {/* Button to toggle chat panel */}
                <button
                  type="button"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  class={`p-2 rounded-full transition-colors flex items-center space-x-1 border ${
                    isChatOpen
                      ? "bg-primary-100 text-primary-700 border-primary-200"
                      : "hover:bg-gray-100 text-gray-700 border-transparent hover:border-gray-200"
                  }`}
                  title={isChatOpen ? "Close chat" : "Open chat"}
                >
                  <MessageCircle size={16} />
                  <span class="text-xs font-medium">Chat</span>
                </button>

                {/* Add AI connection button if nodes are selected */}
                {selectedNodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPromptType("connection");
                      setShowInlinePrompt(true);
                      setAICustomPrompt("");
                    }}
                    disabled={isGeneratingConnections}
                    class="p-2 rounded-full bg-primary-50 hover:bg-primary-100 transition-colors flex items-center space-x-1 text-primary-700 border border-primary-200"
                    title="Generate AI connections between selected nodes"
                  >
                    <MessageCircle size={16} />
                    <span class="text-xs font-medium">
                      {isGeneratingConnections ? "Generating..." : "Connect AI"}
                    </span>
                  </button>
                )}

                {/* Delete selected edge button */}
                {selectedEdge && (
                  <button
                    type="button"
                    onClick={removeSelectedEdge}
                    class="p-2 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors flex items-center space-x-1 text-orange-700 border border-orange-200"
                    title="Remove selected connection"
                  >
                    <X size={16} />
                    <span class="text-xs font-medium">
                      Remove Edge
                    </span>
                  </button>
                )}

                {/* Generate test for selected node button */}
                {selectedNodes.length === 1 && (
                  <button
                    type="button"
                    onClick={() => handleShowTestPrompt(selectedNodes[0])}
                    class="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors flex items-center space-x-1 text-green-700 border border-green-200"
                    title="Generate test for this node"
                  >
                    <FileText size={16} />
                    <span class="text-xs font-medium">
                      Generate Test
                    </span>
                  </button>
                )}

                {/* Delete selected nodes button */}
                {selectedNodes.length > 0 && (
                  <button
                    type="button"
                    onClick={deleteSelectedNodes}
                    class="p-2 rounded-full bg-red-50 hover:bg-red-100 transition-colors flex items-center space-x-1 text-red-700 border border-red-200"
                    title="Delete selected nodes"
                  >
                    <X size={16} />
                    <span class="text-xs font-medium">
                      Delete {selectedNodes.length > 1
                        ? `(${selectedNodes.length})`
                        : ""}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test generator modal */}
      {showTestGenerator && selectedNodes.length === 1 && (
        <NodeTestGenerator
          nodeId={selectedNodes[0]}
          nodeName={cyRef.current?.getElementById(selectedNodes[0])?.data(
            "label",
          ) || selectedNodes[0]}
          onClose={() => {
            setShowTestGenerator(false);
            setIsProcessing(false);
          }}
        />
      )}
    </div>
  );
}
