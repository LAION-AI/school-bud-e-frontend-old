import { computed, effect, signal } from "@preact/signals";
import { chatIslandContent } from "../../internalization/content.ts";
import { stopList } from "./speech.ts";
import { stopAndResetAudio } from "./speech.ts";
import { startStream } from "./stream.ts";

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
    initialSuffix = new URL(window.location.href).searchParams.get("chat") || "0";
  }
}

// Load all chats from localStorage
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

// If no chats are found, initialize with a default chat "bude-chat-0"
if (Object.keys(storedChats).length === 0) {
  storedChats["bude-chat-0"] = [];
}

export const chats = signal(storedChats);

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
        content: [chatIslandContent[lang.peek()]["welcomeMessage"]],
      },
    ];
  }
  return msgs;
});

// This computed signal determines the current chat language based on the last message.
export const currentChatLang = computed<"de" | "en">(() => {
  const msgs = messages.value;
  const lastMessage = msgs[msgs.length - 1];
  // (Note: there was a typo ("welcomeMesage") in the original code.)
  if (lastMessage.role === "assistant") {
    return "de";
  } else {
    return "en";
  }
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
      globalThis.dispatchEvent(new CustomEvent('navigation', { detail: { url: newUrl } }));
    }
  }
  stopAndResetAudio?.();
});

// Sync all chats to localStorage whenever the chats signal changes.
effect(() => {
  const storedChatKeys = Object.keys(localStorage).filter((key) => key.startsWith("bude-chat-"))
  const savingChatKeys = Object.keys(chats.value)

  // If a key is not included in savingChatKeys, remove it from localStorage.
  for (const storedChatKey of storedChatKeys) {
    if (!savingChatKeys.includes(storedChatKey)) {
      localStorage.removeItem(storedChatKey)
    }
  }

  for (const key of savingChatKeys) {
    localStorage.setItem(key, JSON.stringify(chats.value[key]));
  }
});

// Sync settings to localStorage.
effect(() => {
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

// ---------- Signal Mutations ----------

// Create a new chat by finding the maximum current suffix and incrementing it.
export const startNewChat = () => {
  // Get valid numeric suffixes only
  const currentChatNumbers = Object.keys(chats.value)
    .filter(key => key.startsWith("bude-chat-"))
    .map(key => {
      const num = parseInt(key.replace("bude-chat-", ""));
      return isNaN(num) ? 0 : num;
    });
  
  // Find max value, defaulting to 0 if no valid numbers exist
  const maxValue = currentChatNumbers.length > 0 ? Math.max(...currentChatNumbers) : 0;
  const newChatSuffix = String(maxValue + 1);
  const newKey = `bude-chat-${newChatSuffix}`;
  
  // Create the new chat first
  chats.value = { ...chats.value, [newKey]: [] };
  
  // Update URL and trigger client-side routing
  if (typeof window !== "undefined") {
    const newUrl = `/chat/${newChatSuffix}`;
    history.pushState(null, "", newUrl);
    globalThis.dispatchEvent(new CustomEvent('navigation', { detail: { url: newUrl } }));
  }
  
  // Update the suffix last to prevent double-triggering the effect
  chatSuffix.value = newChatSuffix;
};

// Delete the current chat.
// If more than one chat exists, delete the current chat and switch to another.
// Otherwise, clear the current chat.
export const deleteChat = (suffix: string) => {
  console.log('Trying to delete', {suffix})
  const currentKey = "bude-chat-" + suffix;
  const chatKeys = Object.keys(chats.value);
  if (chatKeys.length > 1) {
    // Create a new object without the current chat.
    const { [currentKey]: _removed, ...remainingChats } = chats.value;
    chats.value = remainingChats;
    // Choose a new chat (for example, the first one in sorted order).
    const newKey = Object.keys(remainingChats).sort()[0];
    chatSuffix.value = newKey.slice("bude-chat-".length);
  } else {
    // Clear the current chat.
    chats.value = { "bude-chat-0": [] };
    chatSuffix.value = "0";
  }
};

// Delete all chats.
export const deleteAllChats = () => {
  localStorage.clear();
  chats.value = { "bude-chat-0": [] };
  chatSuffix.value = "0";
};

// Save all chats to a local JSON file.
export const saveChatsToLocalFile = () => {
  const chatsString = JSON.stringify(chats.value);
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
  reader.onload = (event) => {
    try {
      const importedChats = JSON.parse(event.target?.result as string);
      // Replace the entire chats object with the imported chats.
      chats.value = importedChats;
      // Set the current chat suffix to the first chat (sorted by key).
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
  const key = "bude-chat-" + chatSuffix.value;
  chats.value = { ...chats.value, [key]: slicedMessages };

  const refreshMessage = currentMessages[groupIndex - 1]["content"];
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
        // deno-lint-ignore no-explicit-any
        .filter((item: any) => item.type === "text")
        // deno-lint-ignore no-explicit-any
        .map((item: any) => item.text)
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
  const key = "bude-chat-" + chatSuffix.value;
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
  const key = "bude-chat-" + chatSuffix.value;
  const msgs = chats.value[key] || [];
  const newMsgs = [...msgs, newMessage];
  chats.value = { ...chats.value, [key]: newMsgs };
};

export const appendToMessage = (
  messageIndex: number,
  content: string | string[] | Image,
) => {
  const key = "bude-chat-" + chatSuffix.value;
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
