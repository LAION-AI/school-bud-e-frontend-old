import { useEffect, useRef, useState } from "preact/hooks";
import cytoscape from "cytoscape";
import type { GraphNode } from "../../islands/RightSidebar.tsx";
import * as graphStore from "./store.ts";
import {
	requestGraphFormat,
	createFormatPrompt,
} from "../../utils/aiFormatClient.ts";
import { validateGraphFormat } from "../../utils/graphValidation.ts";
import type { GraphJson } from "../../types/formats.ts";
import type { ChatMessage } from "../../utils/aiFormatClient.ts";
import { settings as chatSettings } from "../../components/chat/store.ts";
import { addMessage, messages as storeMessages } from "../chat/store.ts";
import { startStream } from "../chat/stream.ts";
import { MessageCircle, X, Clipboard, FileText } from "lucide-preact";
import type { LucideProps } from "lucide-preact";
import type { VNode } from "preact";
import { hasTestForNode, getTestForNode, setSelectedTest } from "../tests/store.ts";
import NodeTestGenerator from "../tests/NodeTestGenerator.tsx";

// Create safe wrappers for Lucide icons
// @ts-ignore: Suppressing linter error for MessageCircle not being a valid JSX component
const SafeMessageCircle = (props: LucideProps): VNode => <MessageCircle {...props} />;
// @ts-ignore: Suppressing linter error for X not being a valid JSX component
const SafeXIcon = (props: LucideProps): VNode => <X {...props} />;
// @ts-ignore: Suppressing linter error for FileText not being a valid JSX component
const SafeFileTextIcon = (props: LucideProps): VNode => <FileText {...props} />;
// @ts-ignore: Suppressing linter error for Clipboard not being a valid JSX component
const SafeClipboardIcon = (props: LucideProps): VNode => <Clipboard {...props} />;

// Add interface declaration for window global variables
declare global {
	interface Window {
		UNIVERSAL_API_KEY?: string;
		API_URL?: string;
		LLM_API_URL?: string;
		LLM_API_KEY?: string;
		LLM_API_MODEL?: string;
		UNIVERSAL_SHOP_API_KEY?: string;
		VLM_API_URL?: string;
		VLM_API_KEY?: string;
		VLM_API_MODEL?: string;
		VLM_CORRECTION_MODEL?: string;
	}
}

interface InteractiveGraphProps {
	height?: string;
	isRoot?: boolean;
}

export function InteractiveGraph({
	height = "100%",
	isRoot = false,
}: InteractiveGraphProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const cyRef = useRef<cytoscape.Core | null>(null);
	const nodeMap = useRef(new Map<string, GraphNode>());
	const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
	const [isGeneratingConnections, setIsGeneratingConnections] =
		useState<boolean>(false);
	const [aiResponse, setAiResponse] = useState<string>("");
	const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
	const chatInputRef = useRef<HTMLTextAreaElement>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	// Add state for test generator
	const [showTestGenerator, setShowTestGenerator] = useState(false);
	const [nodeWithTest, setNodeWithTest] = useState<string[]>([]);

	// Function to create API requests with AI credentials
	const createAIRequest = async (messages: ChatMessage[]) => {
		// Import settings from the store instead of window globals
		const settings = chatSettings.value;

		try {
			// Use the API URL from settings or fallback to default

			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				Accept: "text/event-stream",
			};

			// Only add Authorization header if API key exists and we're calling an external API
			if (settings.apiKey) {
				headers.Authorization = `Bearer ${settings.apiKey}`;
			}

			// Prepare the request payload
			const payload = {
				messages,
				model: settings.apiModel || "",
				universalApiKey: settings.universalApiKey || "",
				llmApiUrl: settings.apiUrl || "",
				llmApiKey: settings.apiKey || "",
				llmApiModel: settings.apiModel || "",
				systemPrompt: settings.systemPrompt || "",
				vlmApiUrl: settings.vlmUrl || "",
				vlmApiKey: settings.vlmKey || "",
				vlmApiModel: settings.vlmModel || "",
				vlmCorrectionModel: settings.vlmCorrectionModel || "",
				lang: "en",
				stream: true,
			};

			// Make the API request
			const response = await fetch("/api/chat", {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`API request failed: ${response.status} ${response.statusText}. Details: ${errorText}`,
				);
			}

			return response;
		} catch (error) {
			console.error("Error in createAIRequest:", error);
			throw error;
		}
	};

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
								"background-color": "#7AC70C", // Default color
								width: 65, // Larger nodes for visibility
								height: 65, // Larger nodes for visibility
								label: "data(label)",
								"text-valign": "center", // Center text for visibility
								"text-halign": "center",
								"text-margin-y": "0px", // Move text to center
								"text-wrap": "wrap",
								"text-max-width": "110px", // Wider text area
								"font-size": "14px", // Larger font
								"font-weight": "bold", // Bold text
								color: "#000000", // Black text
								"text-outline-width": "2px",
								"text-outline-color": "#ffffff", // White outline for visibility
								"font-family": "'Poppins', sans-serif",
								"background-image": (ele: { data: (id: string) => string }) => {
									const nodeData = nodeMap.current.get(ele.data("id"));
									return nodeData?.image ? `url(${nodeData.image})` : "none";
								},
								"background-fit": "cover",
								"border-width": "3px",
								"border-color": "#000", // Black border for visibility
								"border-style": "solid",
								"shadow-blur": "10px",
								"shadow-color": "rgba(0, 0, 0, 0.5)", // Darker shadow for visibility
								"shadow-offset-x": "0px",
								"shadow-offset-y": "2px",
								"z-index": "10", // Ensure nodes are above other elements
							},
						},
						{
							selector: "node:selected",
							style: {
								"border-width": "4px",
								"border-color": "#ffd700", // Gold border on selection
								"background-color": "#a0e81c", // Lighter green when selected
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
								"line-color": "#000", // Black edges for visibility
								"target-arrow-color": "#000",
								"target-arrow-shape": "triangle",
								"curve-style": "bezier",
								"z-index": "5", // Ensure edges are visible
								"opacity": 1, // Always fully opaque
								"visibility": "visible", // Always visible
							},
						},
						// Add a specific style for edges connected to selected nodes
						{
							selector: "node:selected + edge, edge:selected, node:selected node:selected + edge",
							style: {
								"line-color": "#000", // Keep the same color for consistency
								"width": 3, // Keep the same width
								"z-index": "6", // Slightly higher z-index to ensure they appear on top
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
						name: "preset", // Always use preset first to respect saved positions
						fit: true, // Fit all nodes in the view
						padding: 50, // Add padding around the layout
					},
				});

				// Run a secondary layout if nodes don't have positions or after initial render
				setTimeout(() => {
					if (cy && cy.nodes().length > 0) {
						cy.layout({
							name: "cose",
							animate: true,
							randomize: true, // Randomize positions to avoid overlaps
							nodeOverlap: 20,
							componentSpacing: 100,
							nodeRepulsion: 10000, // Stronger repulsion
							idealEdgeLength: 100,
							edgeElasticity: 100,
							animationDuration: 500,
						}).run();
					}
				}, 500);

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
					cy.edges().style('opacity', 1);
					
					// Highlight the edges connected to the selected node
					const connectedEdges = cy.$(`edge[source="${selectedNode}"], edge[target="${selectedNode}"]`);
					if (connectedEdges.length > 0) {
						// Make connected edges more prominent
						connectedEdges.style({
							'width': 4,
							'line-color': '#0a84ff',
							'target-arrow-color': '#0a84ff',
							'z-index': 10
						});
					}
				});

				cy.on("unselect", "node", (event: { target: { id: () => string } }) => {
					const unselectedNode = event.target.id();
					
					// Reset the style of edges connected to the unselected node
					const connectedEdges = cy.$(`edge[source="${unselectedNode}"], edge[target="${unselectedNode}"]`);
					if (connectedEdges.length > 0) {
						connectedEdges.style({
							'width': 3,
							'line-color': '#000',
							'target-arrow-color': '#000',
							'z-index': 5
						});
					}
					
					setSelectedNodes((prev) =>
						prev.filter((id) => id !== unselectedNode),
					);

					// If all nodes are unselected, clear the selected node in the store
					if (cy.nodes(":selected").length === 0) {
						graphStore.selectedNode.value = null;
					} else if (cy.nodes(":selected").length === 1) {
						// If only one node remains selected, make it the selected node in the store
						graphStore.selectedNode.value = cy.nodes(":selected")[0].id();
						
						// Highlight edges of the remaining selected node
						const remainingNode = cy.nodes(":selected")[0].id();
						const remainingConnectedEdges = cy.$(`edge[source="${remainingNode}"], edge[target="${remainingNode}"]`);
						if (remainingConnectedEdges.length > 0) {
							remainingConnectedEdges.style({
								'width': 4,
								'line-color': '#0a84ff',
								'target-arrow-color': '#0a84ff',
								'z-index': 10
							});
						}
					}
					
					// Ensure edges remain visible
					cy.edges().style('opacity', 1);
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
				};
			} catch (error) {
				console.error("Error initializing Cytoscape:", error);
			}
		}
	}, [graphStore.graphData.value]);

	// Load nodes with tests when component mounts
	useEffect(() => {
		if (graphStore.graphData.value?.items) {
			const nodesWithTests = graphStore.graphData.value.items
				.filter(item => hasTestForNode(item.item))
				.map(item => item.item);
			
			setNodeWithTest(nodesWithTests);
		}
	}, []);

	// Update cytoscape node style for nodes with tests
	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;

		// Reset all nodes to default style first
		cy.nodes().removeClass('has-test');

		// Mark nodes that have tests
		nodeWithTest.forEach(nodeId => {
			const node = cy.$(`node[id="${nodeId}"]`);
			if (node) {
				node.addClass('has-test');
			}
		});
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
						child === oldId ? newLabel : child,
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
			graphStore.graphData.value.items =
				graphStore.graphData.value.items.filter((item) => item.item !== nodeId);

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

		const newNode: GraphNode = {
			item: newName,
			childItems: [],
		};

		// Add the new node directly to Cytoscape.
		addNodeToCy(newNode);

		// Also add the edge connecting the selected node to the new node.
		const cy = cyRef.current;
		if (cy) {
			if (cy.$(`edge[source="${selected}"][target="${newName}"]`).empty()) {
				cy.add({ data: { source: selected, target: newName } });
			}
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
	const generateAIConnections = async () => {
		if (selectedNodes.length === 0) {
			alert("Please select at least one node to generate connections.");
			return;
		}

		setIsGeneratingConnections(true);
		setAiResponse("");

		try {
			// Create a custom prompt for generating connections between selected nodes
			const promptContent =
				selectedNodes.length > 1
					? `I have a knowledge graph with these selected nodes: ${selectedNodes.join(", ")}. 
           Please generate logical connections between these nodes, explaining how they relate to each other.
           Only include nodes that already exist in my selection. The connections should be based on meaningful relationships.
           
           Please format the response as a graph with appropriate connections.
           
           IMPORTANT: Make sure you only include existing nodes in your response. Do not create new nodes that don't exist in my selection.`
					: `I have a knowledge graph with this selected node: "${selectedNodes[0]}". 
           Please generate 3-5 new related nodes that could connect to this node, and explain their relationships.
           The new nodes should be logically related to the selected node in a meaningful way.
           
           Please format the response as a graph with the original node connected to the new nodes you suggest.
           
           IMPORTANT: Make sure the node "${selectedNodes[0]}" remains in your response as the main node.
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

			const apiKey = localStorage.getItem("UNIVERSAL_API_KEY") || "";

			const result = await requestGraphFormat(
				[{ role: "user", content: promptContent }],
				{
					universalApiKey: apiKey,
				},
			);

			console.log("=== RAW AI RESPONSE ===");
			console.log(result);

			try {
				// Validate that the graph includes the selected node
				const mainNode = selectedNodes.length === 1 ? selectedNodes[0] : selectedNodes[0];
				const validatedGraph = validateGraphFormat(result, mainNode);
				
				console.log("=== VALIDATED GRAPH ===");
				console.log(validatedGraph);
				
				// Apply the connections if validation passed
				applyAIConnections(validatedGraph);
			} catch (validationError) {
				console.error("Graph validation failed:", validationError);
				alert(`The AI response didn't maintain the selected node: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
				
				// If we have a format but validation failed, you can decide to use it anyway or not
				if (result.format) {
					const useAnyway = confirm("Do you still want to use the AI-generated graph?");
					if (useAnyway) {
						applyAIConnections(result.format);
					}
				}
			}
		} catch (error) {
			console.error("Error generating AI connections:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			alert(`Failed to generate connections: ${errorMessage}`);
		} finally {
			setIsGeneratingConnections(false);
		}
	};

	// Update the applyAIConnections function to use the typed GraphJson interface
	const applyAIConnections = (graphData: GraphJson) => {
		if (!graphStore.graphData.value?.items) return;

		console.log("=== APPLYING AI CONNECTIONS ===");
		console.log(`Graph data has ${graphData.items.length} items`);

		// Get current items - create a deep copy to avoid reference issues
		const currentItems = JSON.parse(
			JSON.stringify(graphStore.graphData.value.items),
		);
		// Create a set of existing node names for quick lookup
		const existingNodeNames = new Set(
			currentItems.map((item: GraphNode) => item.item),
		);

		// Track any new nodes we need to add
		const newNodes: GraphNode[] = [];
		
		// First pass: Collect all node names that need to be added
		const allNodeNames = new Set<string>();
		
		// Add all existing nodes to the set
		for (const name of existingNodeNames) {
			allNodeNames.add(name as string);
		}
		
		// Add all nodes from the graph data
		for (const aiItem of graphData.items) {
			allNodeNames.add(aiItem.item);
			
			// Add child items if they exist
			if (aiItem.childItems) {
				for (const childItem of aiItem.childItems) {
					allNodeNames.add(childItem);
				}
			}
			
			// Add nodes from connections
			if (aiItem.connections) {
				for (const connection of aiItem.connections) {
					allNodeNames.add(connection.from);
					allNodeNames.add(connection.to);
				}
			}
		}
		
		// Second pass: Create all nodes that don't exist yet
		for (const nodeName of allNodeNames) {
			if (!existingNodeNames.has(nodeName)) {
				// Create a new node object
				const newNode: GraphNode = {
					item: nodeName,
					childItems: [],
					connections: []
				};
				
				// Add to our list of new nodes
				newNodes.push(newNode);
				
				// Add to the current items array
				currentItems.push(newNode);
				
				// Add to existing node names set
				existingNodeNames.add(nodeName);
				
				// Add node to Cytoscape
				addNodeToCy(newNode);
			}
		}

		console.log(`Added ${newNodes.length} new nodes to the graph`);
		
		// Third pass: Process connections and additional data
		for (const aiItem of graphData.items) {
			// Find or get the node in our current items
			const existingItem = currentItems.find(
				(item: GraphNode) => item.item === aiItem.item
			);

			if (existingItem) {
				// Initialize connections array if it doesn't exist
				if (!existingItem.connections) {
					existingItem.connections = [];
				}

				// Process new connections
				if (aiItem.connections) {
					for (const connection of aiItem.connections) {
						// Check if connection already exists
						const connectionExists = existingItem.connections.some(
							(conn: { from: string; to: string }) =>
								(conn.from === connection.from &&
									conn.to === connection.to) ||
								(conn.from === connection.to && conn.to === connection.from),
						);

						if (!connectionExists) {
							existingItem.connections.push(connection);

							// Add connection to Cytoscape - now safe since all nodes exist
							const cy = cyRef.current;
							if (cy) {
								if (
									cy
										.$(
											`edge[source="${connection.from}"][target="${connection.to}"]`,
										)
										.empty()
								) {
									try {
										cy.add({
											data: { source: connection.from, target: connection.to },
										});
									} catch (error) {
										console.error(`Failed to create edge from ${connection.from} to ${connection.to}:`, error);
									}
								}
							}
						}
					}
				}

				// Process new child items
				if (aiItem.childItems) {
					if (!existingItem.childItems) {
						existingItem.childItems = [];
					}

					for (const childItem of aiItem.childItems) {
						if (!existingItem.childItems.includes(childItem)) {
							existingItem.childItems.push(childItem);
						}
					}
				}
			}
		}

		// Update the graph store with the updated data
		if (graphStore.graphData.value) {
			// Create a new graph data object with the updated items
			const updatedGraphData = {
				...graphStore.graphData.value,
				items: currentItems,
			};

			// Update the graphData signal
			graphStore.graphData.value = updatedGraphData;

			// Save the current graph
			graphStore.saveCurrentGraph();
		}

		// Position only the new nodes instead of relaying out the entire graph
		if (newNodes.length > 0) {
			const cy = cyRef.current;
			if (cy) {
				// Get the selected node as the reference point
				const selectedNodeId = selectedNodes[0];
				const selectedNodeElement = cy.$(`node[id="${selectedNodeId}"]`);
				
				if (selectedNodeElement.length > 0) {
					const referencePos = selectedNodeElement.position();
					
					// Calculate positions for new nodes in a circular arrangement around the selected node
					const radius = 200; // Distance from selected node
					const angleStep = (2 * Math.PI) / newNodes.length;
					
					// Position each new node
					for (let index = 0; index < newNodes.length; index++) {
						const node = newNodes[index];
						const angle = index * angleStep;
						const x = referencePos.x + radius * Math.cos(angle);
						const y = referencePos.y + radius * Math.sin(angle);
						
						const nodeElement = cy.$(`node[id="${node.item}"]`);
						if (nodeElement.length > 0) {
							nodeElement.position({ x, y });
							
							// Save position to the node data
							node.position = { x, y };
						}
					}
					
					// Fit the viewport to show all nodes
					cy.fit(cy.elements(), 50);
				} else {
					// Fallback if no selected node is found - use standard layout for new nodes only
					const newNodeElements = newNodes.map(node => cy.$(`node[id="${node.item}"]`));
					const newCyElements = cy.collection();
					for (const el of newNodeElements) {
						if (el.length > 0) newCyElements.merge(el);
					}
					
					if (newCyElements.length > 0) {
						// Run layout only on new nodes
						const layout = newCyElements.layout({
							name: 'circle',
							animate: true,
							animationDuration: 500,
							fit: false
						});
						layout.run();
						
						// Fit viewport after layout
						setTimeout(() => cy.fit(cy.elements(), 50), 600);
					}
				}
			}
		}

		console.log("=== AI CONNECTIONS APPLIED SUCCESSFULLY ===");
	};

	// Add chat-related functions
	const handleSendMessage = async () => {
		if (!chatInputRef.current?.value.trim() || isProcessing) return;

		const userMessage = chatInputRef.current.value.trim();
		const graphContext = selectedNodes.length > 0 
			? `I'm looking at a knowledge graph with the following selected nodes: ${selectedNodes.join(", ")}. `
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
			console.error("Chat error:", error);
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

	// --- Rendering ---
	return (
		<div class="relative w-full h-full flex flex-col" style={{ height: '100vh' }}>
			{/* Toolbar integrated in the content section, not absolutely positioned */}
			<div class="flex-grow flex relative">
				{/* Graph container */}
				<div 
					class={`relative ${isChatOpen ? 'w-2/3' : 'w-full'} h-full transition-all duration-300 ease-in-out`}
				>
					<div 
						ref={containerRef}
						style={{
							width: "100%",
							height: "100%",
							display: "block",
							position: "relative",
						}}
					/>
					
					{/* Node controls - Moved inside the graph container to stay centered within the graph area */}
					{selectedNodes.length > 0 && (
						<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-3 bg-white shadow-lg rounded-lg z-10 flex flex-col items-center">
							<p class="mb-2 text-sm text-gray-600">
								{selectedNodes.length}{" "}
								{selectedNodes.length === 1 ? "node" : "nodes"} selected
							</p>
							<div class="flex space-x-2">
								<button
									type="button"
									class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
									onClick={generateAIConnections}
									disabled={isGeneratingConnections}
								>
									{isGeneratingConnections ? "Generating..." : "Generate AI Connections"}
								</button>
								{selectedNodes.length === 1 && (
									<button
										type="button"
										onClick={() => handleOpenNodeTest(selectedNodes[0])}
										class={`px-2 py-1 ${checkNodeHasTest(selectedNodes[0]) ? 'bg-yellow-500' : 'bg-purple-500'} text-white rounded hover:bg-opacity-90 flex items-center gap-1`}
									>
										<SafeFileTextIcon size={16} />
										{checkNodeHasTest(selectedNodes[0]) ? 'View Test' : 'Create Test'}
									</button>
								)}
								<button
									type="button"
									class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
									onClick={deleteSelectedNodes}
								>
									Delete Selected
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Chat panel */}
				{isChatOpen && (
					<div class="w-1/3 border-l border-gray-300 flex flex-col h-full overflow-hidden">
						{/* Chat header */}
						<div class="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
							<h3 class="font-medium text-gray-800 flex items-center gap-2">
								<SafeMessageCircle size={18} className="text-blue-500" />
								Graph Chat Assistant
							</h3>
							<button
								type="button"
								onClick={() => setIsChatOpen(false)}
								class="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
								aria-label="Close chat"
							>
								<SafeXIcon size={16} />
							</button>
						</div>

						{/* Chat history */}
						<div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
							{storeMessages.value.map((message, index) => (
								<div key={`${index}-${message.content.toString().substring(0, 10)}`} 
									class={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
								>
									<div 
										class={`max-w-[80%] rounded-lg px-4 py-2 ${
											message.role === "user" 
												? "bg-blue-500 text-white" 
												: "bg-gray-100 text-gray-800"
										}`}
									>
										{typeof message.content === 'string' 
											? message.content 
											: Array.isArray(message.content) 
												? message.content.join('')
												: JSON.stringify(message.content)}
									</div>
								</div>
							))}
							{isProcessing && (
								<div class="flex justify-start">
									<div class="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
										<div class="flex space-x-1">
											<div class="h-2 w-2 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_.2s]" />
											<div class="h-2 w-2 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_.4s]" />
											<div class="h-2 w-2 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_.6s]" />
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Chat input */}
						<div class="p-3 bg-white border-t border-gray-200">
							<div class="flex rounded-lg border border-gray-300 overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
								<textarea
									ref={chatInputRef}
									placeholder="Ask about the graph..."
									class="flex-1 p-2 resize-none min-h-[40px] max-h-24 focus:outline-none"
									onKeyPress={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleSendMessage();
										}
									}}
									disabled={isProcessing}
								/>
								<button
									type="button"
									onClick={handleSendMessage}
									disabled={isProcessing}
									class={`px-3 flex items-center justify-center ${
										isProcessing
											? "bg-gray-200 text-gray-400 cursor-not-allowed"
											: "bg-blue-500 text-white hover:bg-blue-600"
									}`}
									aria-label="Send message"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
										<title>Send message</title>
										<path d="M5 12h14" />
										<path d="m12 5 7 7-7 7" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Test generator modal */}
			{showTestGenerator && selectedNodes.length === 1 && (
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<NodeTestGenerator 
						nodeId={selectedNodes[0]} 
						nodeName={selectedNodes[0]}
						onClose={() => setShowTestGenerator(false)} 
					/>
				</div>
			)}

			{/* Bottom toolbar with actions */}
			<div class="p-3 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
				<div class="flex gap-2">
					<button
						type="button"
						class="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300"
						onClick={resetView}
					>
						Reset View
					</button>
				</div>
				<div>
					<button
						type="button"
						onClick={() => setIsChatOpen(!isChatOpen)}
						class={`px-3 py-1.5 ${isChatOpen ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded hover:bg-blue-600 flex items-center gap-1`}
					>
						<SafeMessageCircle size={16} />
						{isChatOpen ? "Hide Chat" : "Show Chat"}
					</button>
				</div>
			</div>
		</div>
	);
}
