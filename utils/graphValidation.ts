import { z } from "zod";
import type { GraphJson } from "../types/formats.ts";
import type { AIFormatResult } from "./aiFormatClient.ts";

// Connection schema
const connectionSchema = z.object({
  from: z.string(),
  to: z.string(),
});

// Graph item schema
const graphItemSchema = z.object({
  item: z.string(),
  childItems: z.array(z.string()).optional(),
  connections: z.array(connectionSchema).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  image: z.string().optional(),
});

// Graph schema
const graphSchema = z.object({
  type: z.literal("graph"),
  items: z.array(graphItemSchema),
  name: z.string().optional(),
});

// Result schema
const graphResultSchema = z.object({
  state: z.enum(["idle", "loading", "success", "error"]),
  fullResponse: z.string(),
  format: graphSchema.optional(),
  error: z.string().optional(),
});

/**
 * Validates that a GraphJson result contains the selected node
 * @param result The result from requestGraphFormat
 * @param selectedNode The node that should be in the graph
 * @returns An object with validation result and error message if any
 */
export function validateGraphWithSelectedNode(
  result: AIFormatResult<GraphJson>,
  selectedNode: string
): { valid: boolean; error?: string } {
  try {
    // First validate the basic structure
    const validationResult = graphResultSchema.safeParse(result);
    
    if (!validationResult.success) {
      return { 
        valid: false, 
        error: `Graph validation failed: ${validationResult.error.message}` 
      };
    }
    
    // If there's no format or the request failed, return early
    if (result.state !== "success" || !result.format) {
      return { 
        valid: false,
        error: result.error || "No graph format returned" 
      };
    }
    
    // Check if the selected node exists in the graph
    const nodeExists = result.format.items.some(item => item.item === selectedNode);
    
    if (!nodeExists) {
      return {
        valid: false,
        error: `Selected node "${selectedNode}" not found in graph response`
      };
    }
    
    // Check connections related to the selected node
    let hasSelectedNodeConnections = false;
    
    // Look through all connections for the selected node
    for (const item of result.format.items) {
      // Check child items
      if (item.childItems?.includes(selectedNode)) {
        hasSelectedNodeConnections = true;
        break;
      }
      
      // Check connections
      if (item.connections?.some(conn => 
        conn.from === selectedNode || conn.to === selectedNode
      )) {
        hasSelectedNodeConnections = true;
        break;
      }
      
      // If this is the selected node, check if it has connections
      if (item.item === selectedNode && 
         (item.childItems?.length || item.connections?.length)) {
        hasSelectedNodeConnections = true;
        break;
      }
    }
    
    if (!hasSelectedNodeConnections) {
      return {
        valid: true, // Still valid, but with a warning
        error: `Warning: Selected node "${selectedNode}" has no connections in the graph`
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false,
      error: `Validation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Enhanced version of requestGraphFormat that validates the selected node is maintained
 * @param graphResult The result from requestGraphFormat
 * @param selectedNode The node that should be in the graph
 * @returns The validated graph or throws an error
 */
export function validateGraphFormat<T extends GraphJson>(
  graphResult: AIFormatResult<T>,
  selectedNode: string
): T {
  const validation = validateGraphWithSelectedNode(graphResult, selectedNode);
  
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  if (!graphResult.format) {
    throw new Error("No graph format returned");
  }
  
  return graphResult.format;
} 