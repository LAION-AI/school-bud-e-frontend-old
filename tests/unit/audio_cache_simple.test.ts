/// <reference lib="deno.ns" />
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.210.0/testing/asserts.ts";

Deno.test({
  name: "Audio Cache Invalidation Logic Tests",
  async fn(t: Deno.TestContext) {
    await t.step({
      name: "should calculate correct message indices for refresh action",
      fn() {
        // Simulate refresh action logic
        const currentMessagesLength = 4; // messages 0, 1, 2, 3
        const groupIndex = 2; // refreshing at index 2
        
        // This should invalidate messages from (groupIndex-1) onwards
        const messagesToInvalidate = Array.from(
          { length: currentMessagesLength - groupIndex + 1 }, 
          (_, i) => groupIndex - 1 + i
        );
        
        // Should invalidate messages 1, 2, 3 (keeping 0)
        assertEquals(messagesToInvalidate, [1, 2, 3]);
      },
    });

    await t.step({
      name: "should calculate correct message indices for edit action",
      fn() {
        // Simulate edit action logic
        const currentMessagesLength = 4; // messages 0, 1, 2, 3
        const groupIndex = 1; // editing at index 1
        
        // This should invalidate the edited message and all subsequent messages
        const messagesToInvalidate = Array.from(
          { length: currentMessagesLength - groupIndex }, 
          (_, i) => groupIndex + i
        );
        
        // Should invalidate messages 1, 2, 3 (keeping 0)
        assertEquals(messagesToInvalidate, [1, 2, 3]);
      },
    });

    await t.step({
      name: "should handle edge case - refresh at first message",
      fn() {
        const currentMessagesLength = 3;
        const groupIndex = 1; // refreshing at index 1 (first message after welcome)
        
        const messagesToInvalidate = Array.from(
          { length: currentMessagesLength - groupIndex + 1 }, 
          (_, i) => groupIndex - 1 + i
        );
        
        // Should invalidate messages 0, 1, 2 (all messages)
        assertEquals(messagesToInvalidate, [0, 1, 2]);
      },
    });

    await t.step({
      name: "should handle edge case - edit last message",
      fn() {
        const currentMessagesLength = 3;
        const groupIndex = 2; // editing last message
        
        const messagesToInvalidate = Array.from(
          { length: currentMessagesLength - groupIndex }, 
          (_, i) => groupIndex + i
        );
        
        // Should invalidate only message 2
        assertEquals(messagesToInvalidate, [2]);
      },
    });

    await t.step({
      name: "should generate correct chat IDs",
      fn() {
        const chatSuffix1 = "0";
        const chatSuffix2 = "123";
        
        const chatId1 = `bude-chat-${chatSuffix1}`;
        const chatId2 = `bude-chat-${chatSuffix2}`;
        
        assertEquals(chatId1, "bude-chat-0");
        assertEquals(chatId2, "bude-chat-123");
      },
    });

    await t.step({
      name: "should demonstrate chat isolation concept",
      fn() {
        // Simulate the chat-aware cache structure
        const audioCache: Record<string, Record<number, Record<number, { audio: string; played: boolean }>>> = {};
        
        // Add audio to different chats
        audioCache["bude-chat-0"] = {
          1: { 0: { audio: "audio1", played: false } }
        };
        audioCache["bude-chat-1"] = {
          1: { 0: { audio: "audio2", played: false } }
        };
        
        // Verify isolation
        assertEquals(audioCache["bude-chat-0"][1][0].audio, "audio1");
        assertEquals(audioCache["bude-chat-1"][1][0].audio, "audio2");
        
        // Verify clearing one chat doesn't affect the other
        audioCache["bude-chat-0"] = {};
        assertExists(audioCache["bude-chat-1"][1]);
      },
    });
  },
}); 