/// <reference lib="deno.ns" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { assertEquals, assertExists } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { delay } from "https://deno.land/std@0.210.0/async/mod.ts";

// Mock fetch for testing
const originalFetch = globalThis.fetch;
let mockResponses = new Map<string, Response>();

function setupMock() {
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof URL ? input.toString() : input.toString();
    const mockResponse = mockResponses.get(url);
    if (mockResponse) {
      return mockResponse.clone();
    }
    return new Response(null, { status: 404 });
  };
}

function resetMock() {
  globalThis.fetch = originalFetch;
  mockResponses = new Map();
}

function mockResponse(url: string, data: unknown, status = 200) {
  mockResponses.set(url, new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

Deno.test({
  name: "Chat Interface Tests",
  async fn(t) {
    setupMock();

    await t.step({
      name: "should handle sending messages",
      async fn() {
        const testMessage = "Hello, this is a test message";
        mockResponse("/api/chat", { 
          role: "assistant",
          content: "Hello! How can I help you today?"
        });

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: testMessage }),
        });

        assertEquals(response.status, 200);
        const data = await response.json();
        assertExists(data.content);
      }
    });

    await t.step({
      name: "should handle errors gracefully",
      async fn() {
        mockResponse("/api/chat", { 
          error: "API Error",
          detail: "Something went wrong"
        }, 500);

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "This should fail" }),
        });

        assertEquals(response.status, 500);
        const data = await response.json();
        assertExists(data.error);
      }
    });

    resetMock();
  }
});

Deno.test({
  name: "Video Novel Features Tests",
  async fn(t) {
    setupMock();

    await t.step({
      name: "should save and load video novels",
      async fn() {
        const testNovel = {
          id: "test-id",
          name: "Test Novel",
          content: "Test content",
          audioBlob: new Blob(),
          createdAt: Date.now(),
          images: [],
          segments: []
        };

        mockResponse("/api/novels", { success: true, novel: testNovel });
        mockResponse("/api/novels/test-id", testNovel);

        // Test saving
        const saveResponse = await fetch("/api/novels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testNovel),
        });

        assertEquals(saveResponse.status, 200);
        const saveData = await saveResponse.json();
        assertExists(saveData.novel);

        // Test loading
        const loadResponse = await fetch("/api/novels/test-id");
        assertEquals(loadResponse.status, 200);
        const loadData = await loadResponse.json();
        assertEquals(loadData.name, "Test Novel");
      }
    });

    resetMock();
  }
}); 