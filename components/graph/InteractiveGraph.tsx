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
import { MessageCircle, X, Clipboard, FileText, LayoutGrid, Maximize2 } from "lucide-preact";
import type { LucideProps } from "lucide-preact";
import type { VNode } from "preact";
import { hasTestForNode, getTestForNode, setSelectedTest } from "../tests/store.ts";
import NodeTestGenerator from "../tests/NodeTestGenerator.tsx";

// @ts-ignore: Suppressing linter error for MessageCircle not being a valid JSX component
const SafeMessageCircle = (props: LucideProps): VNode => <MessageCircle {...props} />;

// @ts-ignore: Suppressing linter error for X not being a valid JSX component
const SafeXIcon = (props: LucideProps): VNode => <X {...props} />;

// @ts-ignore: Suppressing linter error for FileText not being a valid JSX component
const SafeFileTextIcon = (props: LucideProps): VNode => <FileText {...props} />;

// @ts-ignore: Suppressing linter error for Clipboard not being a valid JSX component
const SafeClipboardIcon = (props: LucideProps): VNode => <Clipboard {...props} />;

// Add more safe icon components
// @ts-ignore: Suppressing linter error for LayoutGrid not being a valid JSX component
const SafeLayoutGrid = (props: LucideProps): VNode => <LayoutGrid {...props} />;

// @ts-ignore: Suppressing linter error for Maximize2 not being a valid JSX component
const SafeMaximize2 = (props: LucideProps): VNode => <Maximize2 {...props} />;

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

// Extend the GraphNode type to include savedPosition
type ExtendedGraphNode = GraphNode & {
	savedPosition?: { x: number; y: number };
};

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

	// Add state for loading indicator
	const [isGraphReady, setIsGraphReady] = useState(false);

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
								"min-zoomed-font-size": 0, // Ensure edges are visible at all zoom levels
								"overlay-opacity": 0, // Make overlay transparent for better edge interaction
								"text-opacity": 1, // Ensure text is always visible
								"text-outline-width": 2, // Add outline to text for better visibility
								"text-outline-color": "#ffffff", // White outline for text
								"text-outline-opacity": 1, // Full opacity for outline
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
						name: "preset", // Always use preset layout to respect saved positions
						fit: true, // Fit all nodes in the view
						padding: 50, // Add padding around the layout
					},
				});

				// Only run the secondary layout if no positions are defined
				const nodesWithoutPositions = cy.nodes().filter((node: cytoscape.NodeSingular) => {
					const nodeId = node.id();
					const nodeData = items.find(item => item.item === nodeId);
					return !nodeData?.position || 
					       (nodeData.position.x === undefined && nodeData.position.y === undefined);
				});
				
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
				
				// Add event for position changes to save node positions
				cy.on("position", "node", (event: cytoscape.EventObject) => {
					const nodeId = event.target.id();
					const position = event.target.position();
					
					// Update the position in the graph data
					if (graphStore.graphData.value?.items) {
						const nodeData = graphStore.graphData.value.items.find(
							item => item.item === nodeId
						);
						if (nodeData) {
							nodeData.position = { x: position.x, y: position.y };
							// Save the updated positions
							graphStore.saveCurrentGraph();
						}
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
				// Show the container even if there was an error
				if (containerRef.current) {
					containerRef.current.style.opacity = "1";
				}
				setIsGraphReady(true);
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
		
		for (const nodeId of nodeWithTest) {
			const node = cy.$(`node[id="${nodeId}"]`);
			if (node) {
				node.addClass('has-test');
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
			y: selectedPosition.y + yOffset
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

	// Add a function to apply a cose layout to all nodes
	const spreadAllNodes = () => {
		const cy = cyRef.current;
		if (cy) {
			// Store current positions before spreading
			const savedPositions = new Map<string, {x: number, y: number}>();
			for (const node of cy.nodes()) {
				const id = node.id();
				const pos = node.position();
				savedPositions.set(id, { x: pos.x, y: pos.y });
			}
			
			// Save these positions as a backup to the node data
			if (graphStore.graphData.value?.items) {
				for (const item of graphStore.graphData.value.items) {
					const pos = savedPositions.get(item.item);
					if (pos) {
						// Use type assertion to apply savedPosition
						(item as ExtendedGraphNode).savedPosition = { ...pos };
					}
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
			}).run();
		}
	};
	
	// Add a function to restore the fixed layout
	const restoreFixedLayout = () => {
		const cy = cyRef.current;
		if (cy && graphStore.graphData.value?.items) {
			// First check if we have saved positions
			const hasRestorable = graphStore.graphData.value.items.some(
				item => {
					const extendedNode = item as ExtendedGraphNode;
					return extendedNode.savedPosition && 
						   typeof extendedNode.savedPosition.x === 'number';
				}
			);
			
			if (hasRestorable) {
				// Restore positions from the saved ones
				for (const node of cy.nodes()) {
					const id = node.id();
					const nodeData = graphStore.graphData.value?.items.find(item => item.item === id);
					const extendedNode = nodeData as ExtendedGraphNode;
					if (extendedNode?.savedPosition) {
						node.position(extendedNode.savedPosition);
						// Update the normal position too
						extendedNode.position = { ...extendedNode.savedPosition };
					}
				}
				
				// Clear saved positions after restoration
				for (const item of graphStore.graphData.value.items) {
					// Using undefined instead of delete for better performance
					(item as ExtendedGraphNode).savedPosition = undefined;
				}
				
				// Save the restored positions
				graphStore.saveCurrentGraph();
			} else {
				// Just use preset layout without animation if no saved positions
				cy.layout({
					name: "preset",
					animate: false,
					fit: true,
					padding: 50,
				}).run();
			}
		}
	};

	// --- Rendering ---
	return (
		<div class="relative w-full h-full flex flex-col" style={{ height: '100vh' }}>
			{/* Rest of the component */}
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
					
					{!isGraphReady && (
						<div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
							<p class="text-lg text-gray-600">Loading graph...</p>
						</div>
					)}
					
					{/* Move the toolbar to the bottom center with a luxurious style */}
					<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
						<div class="flex items-center justify-center p-2 bg-white border border-t-gray-100 border-l-gray-100 border-r-gray-300 border-b-gray-300 shadow-lg rounded-lg backdrop-blur-sm bg-opacity-90">
							<div class="flex items-center space-x-1 mr-2">
								{/* Button to spread all nodes */}
								<button
									type="button"
									onClick={spreadAllNodes}
									class="p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1 text-gray-700 border border-transparent hover:border-gray-200"
									title="Spread all nodes for better visibility"
								>
									<SafeLayoutGrid size={16} />
									<span class="text-xs font-medium">Spread</span>
								</button>
								
								{/* Button to restore fixed layout */}
								<button
									type="button"
									onClick={restoreFixedLayout}
									class="p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1 text-gray-700 border border-transparent hover:border-gray-200"
									title="Restore fixed node positions"
								>
									<SafeMaximize2 size={16} />
									<span class="text-xs font-medium">Fix</span>
								</button>
								
								{/* Button to center and reset view */}
								<button
									type="button"
									onClick={resetView}
									class="p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-1 text-gray-700 border border-transparent hover:border-gray-200"
									title="Reset view"
								>
									<SafeXIcon size={16} />
									<span class="text-xs font-medium">Reset</span>
								</button>
							</div>
							
							<div class="flex items-center space-x-1 ml-2">
								{/* Add AI connection button if nodes are selected */}
								{selectedNodes.length > 0 && (
									<button
										type="button"
										onClick={generateAIConnections}
										disabled={isGeneratingConnections}
										class="p-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors flex items-center space-x-1 text-blue-700 border border-blue-200"
										title="Generate AI connections between selected nodes"
									>
										<SafeMessageCircle size={16} />
										<span class="text-xs font-medium">
											{isGeneratingConnections ? "Generating..." : "Connect AI"}
										</span>
									</button>
								)}
								
								{/* Delete selected nodes button */}
								{selectedNodes.length > 0 && (
									<button
										type="button"
										onClick={deleteSelectedNodes}
										class="p-2 rounded-md bg-red-50 hover:bg-red-100 transition-colors flex items-center space-x-1 text-red-700 border border-red-200"
										title="Delete selected nodes"
									>
										<SafeXIcon size={16} />
										<span class="text-xs font-medium">
											Delete {selectedNodes.length > 1 ? `(${selectedNodes.length})` : ""}
										</span>
									</button>
								)}
							</div>
						</div>
					</div>
					
					{/* Node controls - existing code */}
					{/* ... existing controls ... */}
				</div>

				{/* Chat panel - existing code */}
				{/* ... existing chat panel ... */}
			</div>

			{/* Test generator modal - existing code */}
			{/* ... existing test generator ... */}

			{/* Bottom toolbar with actions - existing code */}
			{/* ... existing bottom toolbar ... */}
		</div>
	);
}
