import { useEffect, useRef, useState } from "preact/hooks";
import cytoscape from "cytoscape";
import { GraphNode } from "../islands/RightSidebar.tsx";

interface GraphProps {
  graphData: GraphNode[];
  onNodeSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  isRoot?: boolean;
  height?: string;
  zoomingEnabled?: boolean;
}

export function Graph(
  {
    graphData,
    onNodeSelect,
    selectedNodeId,
    isRoot = false,
    height = "400px",
    zoomingEnabled = true,
  }: GraphProps,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isPositioning, setIsPositioning] = useState(true);

  // Convert graph data to Cytoscape format
  const convertGraphData = (
    items: GraphNode[],
  ): cytoscape.ElementDefinition[] => {
    const elements: cytoscape.ElementDefinition[] = [];
    const nodeSet = new Set<string>();

    items.forEach((node) => {
      if (!nodeSet.has(node.item)) {
        // If position is saved, use it, otherwise let the layout algorithm position it
        const nodeData: Record<string, unknown> = {
          id: node.item,
          label: node.item,
          ...(isRoot && { type: "root" }),
        };

        // If node has position data, use it
        if (
          node.position && node.position.x !== undefined &&
          node.position.y !== undefined
        ) {
          nodeData.position = { x: node.position.x, y: node.position.y };
        }

        elements.push({ data: nodeData });
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
          elements.push({
            data: { id: connection.from, label: connection.from },
          });
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
  };

  // Function to save node positions back to the graph data
  const saveNodePositions = (cy: cytoscape.Core) => {
    cy.nodes().forEach((node: cytoscape.NodeSingular) => {
      const nodeId = node.id();
      const position = node.position();

      // Find the node in graphData and update its position
      const graphNode = graphData.find((n) => n.item === nodeId);
      if (graphNode) {
        if (!graphNode.position) {
          graphNode.position = { x: 0, y: 0 };
        }
        graphNode.position.x = position.x;
        graphNode.position.y = position.y;
      }
    });
  };

  useEffect(() => {
    if (containerRef.current) {
      setIsPositioning(true);
      const elements = convertGraphData(graphData);

      // Create Cytoscape instance
      const cy = cytoscape({
        zoomingEnabled,
        container: containerRef.current,
        elements,
        style: [
          {
            selector: "node",
            style: {
              "background-color": "#aaa",
              label: "data(label)",
              color: "#000",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "10px",
              "text-wrap": "wrap",
              "text-max-width": "80px",
              "border-width": "1px",
              "border-color": "#555",
            },
          },
          {
            selector: "node.selected",
            style: {
              "border-width": "2px",
              "border-color": "#f00",
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
              width: 2,
              "line-color": "#ccc",
              "target-arrow-color": "#ccc",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
            },
          },
        ],
        layout: {
          name: "cose",
          animate: true,
          // Listen for layout events
          ready: function () {
            // Layout is initialized but not started
          },
          stop: function () {
            // Layout is complete
            saveNodePositions(cy);
            setIsPositioning(false);
          },
        },
      });

      // Save instance for cleanup
      cyRef.current = cy;

      // Handle node selection
      cy.on("tap", "node", (event: cytoscape.EventObject) => {
        const node = event.target;
        const nodeId = node.data("id");

        cy.$("node").removeClass("selected");
        node.addClass("selected");
        onNodeSelect?.(nodeId);
      });

      // Update selected node if provided externally
      if (selectedNodeId) {
        cy.$(`node[id="${selectedNodeId}"]`).addClass("selected");
      }

      return () => {
        cy.destroy();
        cyRef.current = null;
      };
    }
  }, [graphData, selectedNodeId, isRoot]);

  return (
    <div
      class="relative border border-gray-200 rounded-2xl mb-4 bg-gray-50"
      style={{ width: "100%", height }}
    >
      {isPositioning && (
        <div class="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 z-10">
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mb-2">
            </div>
            <p class="text-gray-700">Calculating optimal node positions...</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        class="w-full h-full"
        style={{
          opacity: isPositioning ? "0.3" : "1",
          transition: "opacity 0.3s ease-in-out",
        }}
      />
    </div>
  );
}
