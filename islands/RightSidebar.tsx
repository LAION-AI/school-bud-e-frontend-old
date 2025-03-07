import { useEffect, useState } from "preact/hooks";
import { Game } from "../islands/Game.tsx";
import { Graph } from "../components/Graph.tsx";
import { createGraph, saveCurrentGraph, saveGraph } from "../components/graph/store.ts";

interface WebResult {
  title: string;
  url: string;
  description?: string;
}

interface Connection {
  from: string;
  to: string;
}

export interface GraphNode {
  item: string;
  childItems?: string[];
  connections?: Connection[];
  position?: { x: number; y: number };
  image?: string;
}

type SidebarData =
  | { type: "webResults"; results?: WebResult[] }
  | { type: "graph"; items?: GraphNode[] }
  | { type: "game"; gameUrl: string }
  | { type: string; };

interface RightSidebarProps {
  data?: SidebarData[];
}

/**
 * Converts the full graph data into Cytoscape elements.
 */
function convertGraphData(items: GraphNode[]): cytoscape.ElementDefinition[] {
  const elements: cytoscape.ElementDefinition[] = [];
  const nodeSet = new Set<string>();

  items.forEach((node) => {
    if (!nodeSet.has(node.item)) {
      elements.push({ data: { id: node.item, label: node.item } });
      nodeSet.add(node.item);
    }
    node.childItems?.forEach((child) => {
      if (!nodeSet.has(child)) {
        elements.push({ data: { id: child, label: child } });
        nodeSet.add(child);
      }
      elements.push({ data: { source: node.item, target: child } });
    });
    node.connections?.forEach((connection) => {
      if (!nodeSet.has(connection.from)) {
        elements.push({ data: { id: connection.from, label: connection.from } });
        nodeSet.add(connection.from);
      }
      if (!nodeSet.has(connection.to)) {
        elements.push({ data: { id: connection.to, label: connection.to } });
        nodeSet.add(connection.to);
      }
      elements.push({
        data: { source: connection.from, target: connection.to },
      });
    });
  });
  return elements;
}

/**
 * Builds a drilldown graph from the selected node.
 * The new graph will contain the selected node (marked as "root") and its child items.
 */
function buildDrilldownGraph(
  selectedNode: GraphNode
): cytoscape.ElementDefinition[] {
  const elements: cytoscape.ElementDefinition[] = [];
  // Add the selected node and mark it with an extra data attribute.
  elements.push({
    data: { id: selectedNode.item, label: selectedNode.item, type: "root" },
  });
  selectedNode.childItems?.forEach((child) => {
    elements.push({ data: { id: child, label: child } });
    elements.push({ data: { source: selectedNode.item, target: child } });
  });
  return elements;
}

export default function RightSidebar({ data }: RightSidebarProps) {

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const collapsed = urlParams.get("rcollapsed");
      return collapsed === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(location.search);
      urlParams.set("rcollapsed", "" + isCollapsed)
      const newUrl = `${location.origin}${location.pathname}?${urlParams.toString()}`;
      history.replaceState(null, "", newUrl);
    }
  }, [isCollapsed]);

  // Graph state: current graph elements, drilldown stack, and currently selected node ID.
  const [graphElements, setGraphElements] = useState<
    cytoscape.ElementDefinition[] | null
  >(null);
  const [graphStack, setGraphStack] = useState<
    cytoscape.ElementDefinition[][] // each element in the stack is a previous graph elements array
  >([]);
  const [currentDrilldown, setCurrentDrilldown] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // When new full graph data is received, initialize graphElements.
  useEffect(() => {
    const lastItem = data?.[data.length - 1];
    if (lastItem?.type === "graph" && lastItem.items) {
      const elements = convertGraphData(lastItem.items);
      setGraphElements(elements);
      setGraphStack([]);
      setCurrentDrilldown(null);
      setSelectedNodeId(null);
    }
  }, [data]);



  // Placeholder: simulate an AI call to generate more detailed items.
  const generateMoreDetails = async (nodeId: string) => {
    // Replace with your actual API call.
    console.log("Generating more details for", nodeId);
    // Simulate by returning additional child items.
    return [];
    //return ["Detail 1", "Detail 2", "Detail 3"];
  };

  // Option 1: Open Detailed – drill down into the selected node.
  const openDetailed = async () => {
    const lastItem = data?.[data.length - 1];
    if (!selectedNodeId || !lastItem || lastItem.type !== "graph" || !lastItem.items) return;

    // Find the selected node in the original data.
    const nodeData = lastItem.items.find((n) => n.item === selectedNodeId);
    if (!nodeData) return;

    // Optionally, generate more items with AI.
    const aiChildItems = await generateMoreDetails(selectedNodeId);
    // Combine existing child items (if any) with AI-generated ones.
    const combinedChildItems = [
      ...(nodeData.childItems || []),
      ...aiChildItems.filter((item) => !(nodeData.childItems || []).includes(item)),
    ];
    const detailedNodeData: GraphNode = {
      ...nodeData,
      childItems: combinedChildItems,
    };

    // Build drilldown elements – note that we keep the selected node as "root".
    const newElements = buildDrilldownGraph(detailedNodeData);
    // Push the current graph onto the stack for "back" functionality.
    if (graphElements) {
      setGraphStack((prev) => [...prev, graphElements]);
    }
    setGraphElements(newElements);
    setCurrentDrilldown(selectedNodeId);
    // Clear the selected node (since we drilled down).
    setSelectedNodeId(null);
  };

  // Option 2: Ask Question – pass the selected node's information to the chat.
  const askQuestion = () => {
    if (!selectedNodeId) return;
    // Replace this with your chat integration.
    console.log("Ask question about", selectedNodeId);
    alert(`Ask question about ${selectedNodeId}`);
  };

  // Option 3: Show Tasks / Generate Task – send a GET request to /tasks with a summary.
  const showTasks = async () => {
    if (!selectedNodeId) return;
    // For example, use the selected node's label as a summary.
    const summary = selectedNodeId;
    try {
      const response = await fetch(`/tasks?summary=${encodeURIComponent(summary)}`);
      const tasks = await response.json();
      console.log("Tasks:", tasks);
      alert(`Tasks: ${JSON.stringify(tasks)}`);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("Error fetching tasks");
    }
  };

  // Handle "Back" button: restore the previous graph.
  const goBack = () => {
    if (graphStack.length > 0) {
      const newStack = [...graphStack];
      const previousElements = newStack.pop();
      setGraphStack(newStack);
      if (previousElements) {
        setGraphElements(previousElements);
      }
      // Clear any drilldown state.
      if (newStack.length === 0) {
        setCurrentDrilldown(null);
      }
    }
  };

  // Most significant node. Use for saving
  const mostSignificantNode = graphElements?.[0]?.data?.label;
  const lastGraph = data?.[data.length - 1];

  return (
    <>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        class="absolute right-4 top-16 z-10 p-2 rounded-full transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div class={`bg-surface border-l h-full flex flex-col  transition-all ${isCollapsed  ? 'w-0 overflow-hidden': 'w-[40vw]'}`}>
        <h3 class={"p-4 font-semibold border-b"}>Ergebnisse</h3>
        {/* Display all data elements */}
        {data?.map((item, dataIndex) => {
          // Skip rendering if the item has no results/items
          if (item.type === "webResults" && (!(item as { results?: WebResult[] }).results?.length)) {
            return null;
          }
          if (item.type === "graph" && (!(item as { items?: GraphNode[] }).items?.length)) {
            return null;
          }

          if (item.type === "graph") {
            const graphItem = item as { type: "graph"; items?: GraphNode[] };
            if (!graphItem.items || graphItem.items.length === 0) {
              return null;
            }
          }


          return (
            <div key={dataIndex} class={"p-4"}>
              {/* Display web results if applicable */}
              {item.type === "webResults" && (item as { results?: WebResult[] }).results?.length > 0 && (
                <div class="p-4 overflow-y-auto">
                  <div class="space-y-4">
                    {(item as { results?: WebResult[] }).results?.map((result, index) => (
                      <div
                        key={index}
                        class="sidebar-item bg-white/50 p-4 rounded-lg border"
                      >
                        <h3 class="font-medium mb-2">{result.title}</h3>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-blue-500 hover:text-blue-600 block mb-2 text-sm break-all"
                        >
                          {result.url}
                        </a>
                        {result.description && (
                          <p class="text-gray-600 text-sm">{result.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Display game */}
              {item.type === "game" && (item as { gameUrl: string }).gameUrl && (
                <div class="">
                  <Game gameUrl={(item as { gameUrl: string }).gameUrl} />
                </div>
              )}

              {/* Display graph results */}
              {item.type === "graph" && (item as { items?: GraphNode[] }).items && (
                <>
                  <Graph
                    graphData={(item as { items?: GraphNode[] }).items ?? []}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={setSelectedNodeId}
                    isRoot={!!currentDrilldown}
                  />
                  <div class="p-2 border-t flex justify-between items-center">
                    {/* Show Back button if there is drilldown history */}
                    {graphStack.length > 0 && (
                      <button
                        onClick={goBack}
                        class="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                      >
                        Back
                      </button>
                    )}
                    {/* If a node is selected (but not drilled down yet), show option buttons */}
                    {selectedNodeId && (
                      <div class="space-x-2">
                        <button
                          onClick={openDetailed}
                          class="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                        >
                          Open Detailed
                        </button>
                        <button
                          onClick={askQuestion}
                          class="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded"
                        >
                          Ask Question
                        </button>
                        <button
                          onClick={showTasks}
                          class="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded"
                        >
                          Explore Quests
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            saveGraph(mostSignificantNode, lastGraph.items)
                          }}
                          class="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded"
                        >
                          Save Graph
                        </button>
                        
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
