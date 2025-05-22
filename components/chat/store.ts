import { computed, effect, signal } from "@preact/signals";
import { chatIslandContent } from "../../internalization/content.ts";
import { stopAndResetAudio, stopList } from "./speech.ts";
import { startStream } from "./stream.ts";
import * as chatDB from "./chatDB.ts";

// ---------- Initialization ----------

// Determine the initial chat suffix from the URL (default "0")
let initialSuffix = "0";
if (typeof window !== "undefined") {
  // First check for route parameter in the path
  const pathMatch = window.location.pathname.match(/\/chat\/(\d+)/);
  if (pathMatch) {
    initialSuffix = pathMatch[1];
  } else {
    // Fall back to search params for backward compatibility
    initialSuffix = new URL(window.location.href).searchParams.get("chat") ||
      "0";
  }
}

// Initialize chats from IndexedDB (with fallback to localStorage for migration)
export const chats = signal<{ [key: string]: Message[] }>({});
export const isLoadingChats = signal(true);

// The current chat is tracked by its numeric suffix (as a string)
export const chatSuffix = signal(initialSuffix);

// Other signals remain the same
export const lang = signal<"de" | "en">("de");
export const autoScroll = signal(true);
export const query = signal("");
export const currentEditIndex = signal(-1); // -1 = no edit, otherwise index of message to edit

export const settings = signal({
  universalApiKey: localStorage.getItem("bud-e-universal-api-key") || "",
  apiUrl: localStorage.getItem("bud-e-api-url") || "",
  apiKey: localStorage.getItem("bud-e-api-key") || "",
  apiModel: localStorage.getItem("bud-e-model") || "",
  ttsUrl: localStorage.getItem("bud-e-tts-url") || "",
  ttsKey: localStorage.getItem("bud-e-tts-key") || "",
  ttsModel: localStorage.getItem("bud-e-tts-model") || "",
  sttUrl: localStorage.getItem("bud-e-stt-url") || "",
  sttKey: localStorage.getItem("bud-e-stt-key") || "",
  sttModel: localStorage.getItem("bud-e-stt-model") || "",
  systemPrompt: localStorage.getItem("bud-e-system-prompt") || "",
  vlmUrl: localStorage.getItem("bud-e-vlm-url") || "",
  vlmKey: localStorage.getItem("bud-e-vlm-key") || "",
  vlmModel: localStorage.getItem("bud-e-vlm-model") || "",
  vlmCorrectionModel: localStorage.getItem("bud-e-vlm-correction-model") || "",
});

// Init database and load chats
if (typeof window !== "undefined") {
  (async () => {
    try {
      await chatDB.initDB();
      const storedChats = await chatDB.getAllChats();

      // If no chats in IndexedDB, check localStorage for migration
      if (Object.keys(storedChats).length === 0) {
        const localChatKeys = Object.keys(localStorage).filter((key) =>
          key.startsWith("bude-chat-")
        );

        // Migrate from localStorage if needed
        if (localChatKeys.length > 0) {
          const migratedChats: { [key: string]: Message[] } = {};
          for (const key of localChatKeys) {
            const json = localStorage.getItem(key);
            if (json) {
              migratedChats[key] = JSON.parse(json);
              // Save to IndexedDB
              await chatDB.saveChat(key, JSON.parse(json));
            }
          }

          // Update chats signal with migrated data
          chats.value = migratedChats;
        } else {
          // No chats in localStorage either, create default
          const defaultKey = "bude-chat-0";
          chats.value = { [defaultKey]: [] };
          await chatDB.saveChat(defaultKey, []);
        }
      } else {
        // Use chats from IndexedDB
        chats.value = storedChats;
      }
    } catch (error) {
      console.error("Error initializing IndexedDB:", error);

      // Fallback to localStorage if IndexedDB fails
      const storedChats: { [key: string]: Message[] } = {};
      const localChatKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("bude-chat-")
      );

      for (const key of localChatKeys) {
        const json = localStorage.getItem(key);
        if (json) {
          storedChats[key] = JSON.parse(json);
        }
      }

      // If no chats found, initialize with default
      if (Object.keys(storedChats).length === 0) {
        storedChats["bude-chat-0"] = [];
      }

      chats.value = storedChats;
    } finally {
      isLoadingChats.value = false;
    }
  })();
}

// ---------- Computed Signals ----------

// This computed signal returns the messages of the current chat.
// If no messages exist (or the array is empty), it returns a default welcome message.
export const messages = computed<Message[]>(() => {
  const key = `bude-chat-${chatSuffix.value}`;
  const msgs = chats.value[key];
  if (!msgs || msgs.length < 1) {
    return [
      {
        role: "assistant",
        content: [chatIslandContent[lang.peek()]?.welcomeMessage],
      },
    ];
  }
  return msgs;
});

// This computed signal determines the current chat language based on the last message.
export const currentChatLang = computed<"de" | "en">(() => {
  const msgs = messages.value;
  const lastMessage = msgs[msgs.length - 1];

  if (lastMessage.role === "assistant") {
    return "de";
  }

  return "en";
});

export const isApiConfigured = computed(() => {
  return settings.value.universalApiKey ||
    (settings.value.apiKey && settings.value.apiModel && settings.value.apiUrl);
});

// Remove this if it exists or set it to always return null
export const apiWarningMessage = computed(() => null);

// ---------- Signal Effects ----------

// Update the URL when the chat suffix changes and reset the audio.
effect(() => {
  const suffix = chatSuffix.value;
  if (typeof window !== "undefined" && location.pathname.startsWith("/chat")) {
    const newUrl = `/chat/${suffix}`;
    if (location.pathname !== newUrl) {
      if (suffix === "new") {
        // Don't update URL here, let startNewChat handle it
        startNewChat();
        return;
      }
      history.pushState(null, "", newUrl);
      // Dispatch navigation event for Fresh's client-side routing
      globalThis.dispatchEvent(
        new CustomEvent("navigation", { detail: { url: newUrl } }),
      );
    }
  }
  //stopAndResetAudio?.();
});

// Sync all chats to IndexedDB whenever the chats signal changes.
effect(() => {
  if (isLoadingChats.value) return;

  // Save each chat to IndexedDB
  for (const [key, messages] of Object.entries(chats.value)) {
    chatDB.saveChat(key, messages).catch((error) => {
      console.error(`Error saving chat ${key} to IndexedDB:`, error);

      // Fallback to localStorage if IndexedDB fails
      localStorage.setItem(key, JSON.stringify(messages));
    });
  }
});

// Sync settings to localStorage.
const disposeEffect = effect(() => {
  localStorage.setItem(
    "bud-e-universal-api-key",
    settings.value.universalApiKey,
  );
  localStorage.setItem("bud-e-api-url", settings.value.apiUrl);
  localStorage.setItem("bud-e-api-key", settings.value.apiKey);
  localStorage.setItem("bud-e-model", settings.value.apiModel);
  localStorage.setItem("bud-e-tts-url", settings.value.ttsUrl);
  localStorage.setItem("bud-e-tts-key", settings.value.ttsKey);
  localStorage.setItem("bud-e-tts-model", settings.value.ttsModel);
  localStorage.setItem("bud-e-stt-url", settings.value.sttUrl);
  localStorage.setItem("bud-e-stt-key", settings.value.sttKey);
  localStorage.setItem("bud-e-stt-model", settings.value.sttModel);
  localStorage.setItem("bud-e-system-prompt", settings.value.systemPrompt);
  localStorage.setItem("bud-e-vlm-url", settings.value.vlmUrl);
  localStorage.setItem("bud-e-vlm-key", settings.value.vlmKey);
  localStorage.setItem("bud-e-vlm-model", settings.value.vlmModel);
  localStorage.setItem(
    "bud-e-vlm-correction-model",
    settings.value.vlmCorrectionModel,
  );
});

// Export dispose function to be called when needed
export const disposeSettingsEffect = () => {
  disposeEffect();
};

// ---------- Signal Mutations ----------

// Create a new chat by finding the maximum current suffix and incrementing it.
export const startNewChat = () => {
  // Get valid numeric suffixes only
  const currentChatNumbers = Object.keys(chats.value)
    .filter((key) => key.startsWith("bude-chat-"))
    .map((key) => {
      const num = Number.parseInt(key.replace("bude-chat-", ""));
      return Number.isNaN(num) ? 0 : num;
    });

  // Find max value, defaulting to 0 if no valid numbers exist
  const maxValue = currentChatNumbers.length > 0
    ? Math.max(...currentChatNumbers)
    : 0;
  const newChatSuffix = String(maxValue + 1);
  const newKey = `bude-chat-${newChatSuffix}`;

  // Create the new chat first
  chats.value = { ...chats.value, [newKey]: [] };

  // Update URL and trigger client-side routing
  if (typeof window !== "undefined") {
    const newUrl = `/chat/${newChatSuffix}`;
    history.pushState(null, "", newUrl);
    globalThis.dispatchEvent(
      new CustomEvent("navigation", { detail: { url: newUrl } }),
    );
  }

  // Update the suffix last to prevent double-triggering the effect
  chatSuffix.value = newChatSuffix;
};

// Delete the current chat.
// If more than one chat exists, delete the current chat and switch to another.
// Otherwise, clear the current chat.
export const deleteChat = (suffix: string) => {
  console.log("Trying to delete", { suffix });
  const currentKey = `bude-chat-${suffix}`;
  const chatKeys = Object.keys(chats.value);

  if (chatKeys.length > 1) {
    // Create a new object without the current chat
    const { [currentKey]: _removed, ...remainingChats } = chats.value;
    chats.value = remainingChats;

    // Choose a new chat (for example, the first one in sorted order)
    const newKey = Object.keys(remainingChats).sort()[0];
    chatSuffix.value = newKey.slice("bude-chat-".length);

    // Delete from IndexedDB
    chatDB.deleteChat(currentKey).catch((error) => {
      console.error(`Error deleting chat ${currentKey} from IndexedDB:`, error);

      // Fallback: remove from localStorage
      localStorage.removeItem(currentKey);
    });
  } else {
    // Clear the current chat but keep the key
    chats.value = { "bude-chat-0": [] };
    chatSuffix.value = "0";

    // Save empty chat to IndexedDB
    chatDB.saveChat("bude-chat-0", []).catch((error) => {
      console.error("Error saving empty chat to IndexedDB:", error);

      // Fallback: save to localStorage
      localStorage.setItem("bude-chat-0", JSON.stringify([]));
    });
  }
};

// Delete all chats.
export const deleteAllChats = () => {
  chatDB.deleteAllChats().catch((error) => {
    console.error("Error deleting all chats from IndexedDB:", error);

    // Fallback: clear localStorage
    for (
      const key of Object.keys(localStorage).filter((key) =>
        key.startsWith("bude-chat-")
      )
    ) {
      localStorage.removeItem(key);
    }
  });

  chats.value = { "bude-chat-0": [] };
  chatSuffix.value = "0";
};

// Save all chats to a local JSON file.
export const saveChatsToLocalFile = () => {
  const chatsString = chatDB.exportChats(chats.value);
  const blob = new Blob([chatsString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const currentDate = new Date();
  a.download = `chats-${currentDate.toISOString()}.json`;
  a.click();
};

// Restore chats from a local JSON file.
export const restoreChatsFromLocalFile = (e: InputEvent) => {
  const file = (e.target as HTMLInputElement)?.files?.[0];
  if (!file) {
    console.error("No file selected");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const jsonData = event.target?.result as string;
      const importedChats = await chatDB.importChats(jsonData);

      // Replace the entire chats object with the imported chats
      chats.value = importedChats;

      // Set the current chat suffix to the first chat (sorted by key)
      const chatKeys = Object.keys(importedChats);
      const newChatSuffix = chatKeys.length > 0
        ? chatKeys.sort()[0].slice("bude-chat-".length)
        : "0";
      chatSuffix.value = newChatSuffix;
    } catch (error) {
      console.error("Error parsing JSON file:", error);
    }
  };

  reader.onerror = (error) => {
    console.error("Error reading file:", error);
  };

  reader.readAsText(file);
};

// ---------- Chat Template Handlers ----------

// 1. Refresh: repeats the query at the given groupIndex.
export const handleRefreshAction = (groupIndex: number) => {
  const currentMessages = messages.value;
  if (!groupIndex || groupIndex > currentMessages.length) return;

  const slicedMessages = currentMessages.slice(0, groupIndex - 1);
  const key = `bude-chat-${chatSuffix.value}`;
  chats.value = { ...chats.value, [key]: slicedMessages };

  const refreshMessage = currentMessages[groupIndex - 1].content;
  stopList.value = [];
  startStream(refreshMessage as string, slicedMessages);
};

// 2. Edit: loads the content of the message at the given groupIndex into the query for editing.
export const handleEditAction = (groupIndex: number) => {
  const currentMessages = messages.value;
  const message = currentMessages[groupIndex];
  let contentToEdit = "";

  if (typeof message.content === "string") {
    contentToEdit = message.content;
  } else if (Array.isArray(message.content)) {
    if (typeof message.content[0] === "string") {
      contentToEdit = message.content.join("");
    } else {
      // Handle content arrays of objects (e.g., with text and image_url)
      contentToEdit = message.content
        .filter((item) => "type" in item && item.type === "text")
        .map((item) => "text" in item ? item.text : "")
        .join("");
    }
  }

  query.value = contentToEdit;
  stopList.value = [];
  currentEditIndex.value = groupIndex;

  const textarea = document.querySelector("textarea");
  textarea?.focus();
};

// ---------- Additional Chat Functions ----------

/**
 * Updates an existing message in the current chat.
 *
 * @param messageIndex - The index of the message to update.
 * @param updatedMessage - The new message object to replace the old one.
 */
export const editMessage = (messageIndex: number, updatedMessage: Message) => {
  const key = `bude-chat-${chatSuffix.value}`;
  const msgs = chats.value[key];
  if (!msgs || messageIndex < 0 || messageIndex >= msgs.length) {
    console.error("Invalid message index");
    return;
  }
  // Create a new messages array with the updated message.
  const newMsgs = msgs.slice();
  newMsgs[messageIndex] = updatedMessage;
  chats.value = { ...chats.value, [key]: newMsgs };
};

export const addMessage = (newMessage: Message) => {
  // Make a deep copy to ensure objects (like PDFs) are properly preserved
  const messageCopy = JSON.parse(JSON.stringify(newMessage));

  const key = `bude-chat-${chatSuffix.value}`;
  const msgs = chats.value[key] || [];
  const newMsgs = [...msgs, messageCopy];
  chats.value = { ...chats.value, [key]: newMsgs };
};

export const appendToMessage = (
  messageIndex: number,
  content: string | string[] | Image,
) => {
  const key = `bude-chat-${chatSuffix.value}`;
  const msgs = chats.value[key];
  if (!msgs || messageIndex < 0 || messageIndex >= msgs.length) {
    console.error("Invalid message index");
    return;
  }
  const message = msgs[messageIndex];
  if (typeof message.content === "string") {
    if (typeof content === "string") {
      message.content += content;
    } else if (Array.isArray(content)) {
      message.content = [message.content, ...content];
    } else {
      message.content = [message.content, content];
    }
  } else if (Array.isArray(message.content)) {
    if (Array.isArray(content)) {
      message.content.push(...content);
    } else {
      message.content.push(content);
    }
  }
};
