import { assertEquals, assertExists, assert } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { delay } from "https://deno.land/std@0.210.0/async/mod.ts";
import type { EditSession, VideoNovelSegment } from "../types/formats.ts";

// Mock fetch for testing
const originalFetch = globalThis.fetch;
let mockResponses: Map<string, Response> = new Map();

function setupMockFetch() {
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof URL ? input.toString() : input.toString();
    const mockResponse = getMockResponse(url);
    if (mockResponse) {
      return mockResponse;
    }
    return new Response(null, { status: 404 });
  };
}

function resetMockFetch() {
  globalThis.fetch = originalFetch;
  mockResponses = new Map();
}

function mockResponse(url: string, data: unknown, status = 200) {
  const responseBody = JSON.stringify(data);
  mockResponses.set(url, new Response(responseBody, {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

function getMockResponse(url: string): Response | undefined {
  const response = mockResponses.get(url);
  if (!response) return undefined;
  return response.clone();
}

interface EditResponseData {
  edit_hash: string;
}

interface EditStatusData {
  status: EditSession["status"];
  error?: string;
}

const BASE_URL = "http://localhost:8000";

Deno.test("Story Edit Feature", async (t) => {
  setupMockFetch();

  await t.step("should allow editing a story segment", async () => {
    const editHash = "test-edit-hash";
    const originalSegment: VideoNovelSegment = {
      id: "1",
      type: "text",
      content: "Original content",
      speaker: "STORYTELLER",
      order: 1,
    };

    const editedContent = "Once upon a time in a magical forest";
    
    // Mock API responses
    mockResponse(new URL("/edit_story/original-hash", BASE_URL).toString(), { edit_hash: editHash });
    mockResponse(new URL(`/edit_status/${editHash}`, BASE_URL).toString(), { 
      status: "completed",
      originalHash: "original-hash",
      editHash,
      createdAt: new Date().toISOString(),
    });

    // Simulate edit request
    const editResponse = await fetch(new URL("/edit_story/original-hash", BASE_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segment_id: "1",
        edit_content: editedContent,
      }),
    });

    assertEquals(editResponse.status, 200);
    const editData = await editResponse.json() as EditResponseData;
    assertExists(editData.edit_hash);

    // Poll for edit status
    let attempts = 0;
    const maxAttempts = 5;
    let finalStatus = 0;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(new URL(`/edit_status/${editData.edit_hash}`, BASE_URL));
      finalStatus = statusResponse.status;
      const status = await statusResponse.json() as EditStatusData;
      
      if (status.status === "completed") {
        break;
      }
      
      if (status.status === "failed") {
        throw new Error(`Edit failed: ${status.error}`);
      }
      
      await delay(1000);
      attempts++;
    }

    assertEquals(finalStatus, 200);
  });

  await t.step("should validate edit continuity", async () => {
    const invalidEdit = {
      segment_id: "1",
      edit_content: '<segment id="1" type="text" speaker="INVALID">Breaking continuity</segment>',
    };

    mockResponse(new URL("/edit_story/original-hash", BASE_URL).toString(), 
      { detail: "Invalid edit - breaks story continuity" },
      400
    );
  });

  await t.step("should handle concurrent edits", async () => {
    // Mock responses for concurrent edits
    const editHashes = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const editHash = `edit-hash-${i}`;
      mockResponse(
        new URL("/edit_story/original-hash", BASE_URL).toString(),
        { edit_hash: editHash }
      );
      editHashes.add(editHash);
    }

    // Make concurrent requests
    const editRequests: Promise<Response>[] = Array(3).fill(null).map((_, index) =>
      fetch(new URL("/edit_story/original-hash", BASE_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment_id: "1",
          edit_content: `Edit session ${index + 1}`,
        }),
      })
    );

    const responses = await Promise.all(editRequests);

    // Verify each response was successful
    for (const response of responses) {
      assertEquals(response.status, 200);
      const data = await response.json() as EditResponseData;
      assert(editHashes.has(data.edit_hash), `Edit hash ${data.edit_hash} not found in expected hashes`);
    }

    assertEquals(editHashes.size, 3);
  });

  resetMockFetch();
});
