// Test script for graph validation
import { validateGraphWithSelectedNode } from "../utils/graphValidation.ts";
import type { AIFormatResult } from "../utils/aiFormatClient.ts";
import type { GraphJson } from "../types/formats.ts";

// Mock sample graph result
const createMockGraphResult = (
  selectedNode: string, 
  includeNode = true,
  includeConnections = true
): AIFormatResult<GraphJson> => {
  // Base graph items
  const items = [
    {
      item: "Node A",
      childItems: includeConnections ? ["Node B", "Node C"] : [],
      position: { x: 100, y: 100 }
    },
    {
      item: "Node B",
      position: { x: 200, y: 100 }
    },
    {
      item: "Node C",
      position: { x: 300, y: 100 },
      connections: includeConnections ? [{ from: "Node C", to: "Node D" }] : []
    }
  ];
  
  // Add the selected node if required
  if (includeNode && !items.some(item => item.item === selectedNode)) {
    items.push({
      item: selectedNode,
      position: { x: 400, y: 100 },
      connections: includeConnections ? [{ from: selectedNode, to: "Node A" }] : []
    });
  }
  
  // Add Node D if connections are included
  if (includeConnections) {
    items.push({
      item: "Node D",
      position: { x: 400, y: 200 }
    });
  }
  
  return {
    state: "success",
    fullResponse: "Sample response",
    format: {
      type: "graph",
      items,
      name: "Test Graph"
    }
  };
};

// Run tests
const runTests = () => {
  console.log("Running graph validation tests...");
  
  // Test 1: Graph contains node and connections
  const test1 = validateGraphWithSelectedNode(
    createMockGraphResult("Selected Node", true, true),
    "Selected Node"
  );
  console.log("Test 1 - Node and connections:", test1.valid ? "✅ PASS" : "❌ FAIL", test1.error || "");
  
  // Test 2: Graph contains node but no connections
  const test2 = validateGraphWithSelectedNode(
    createMockGraphResult("Selected Node", true, false),
    "Selected Node"
  );
  console.log("Test 2 - Node without connections:", test2.valid ? "✅ PASS" : "❌ FAIL", test2.error || "");
  
  // Test 3: Graph doesn't contain the node
  const test3 = validateGraphWithSelectedNode(
    createMockGraphResult("Missing Node", false, true),
    "Selected Node"
  );
  console.log("Test 3 - Missing node:", !test3.valid ? "✅ PASS" : "❌ FAIL", test3.error || "");
  
  // Test 4: Graph with invalid structure
  const invalidGraph: AIFormatResult<GraphJson> = {
    state: "success",
    fullResponse: "Invalid response",
    format: {
      type: "graph",
      items: [], // Empty items array
      name: "Invalid Graph"
    }
  };
  const test4 = validateGraphWithSelectedNode(invalidGraph, "Selected Node");
  console.log("Test 4 - Invalid structure:", !test4.valid ? "✅ PASS" : "❌ FAIL", test4.error || "");
};

// Run the tests if this is executed directly
if (import.meta.main) {
  runTests();
}

export { runTests }; 