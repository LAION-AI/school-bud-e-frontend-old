import { signal, effect } from "@preact/signals";
import { lang, messages, settings, chatSuffix } from "./store.ts";
import { getStreamingTTS, stopStreamingTTS, isStreamingTTSActive } from "./streaming-tts.ts";
import { experimental_generateSpeech as generateSpeech } from "ai"
import { createOpenAI } from "@ai-sdk/openai";

// Chat-aware audio cache: chatId -> messageIndex -> audioIndex -> AudioItem
export const audioFileDict = signal<
  Record<string, Record<number, Record<number, { audio: HTMLAudioElement; played: boolean }>>>
>({});

// Get initial value from session storage or default to false
const getInitialReadAlways = (): boolean => {
  if (typeof window === "undefined") return false;
  const stored = sessionStorage.getItem("ai-speech-enabled");
  return stored === "true";
};

export const readAlways = signal(getInitialReadAlways());
export const stopList = signal<number[]>([]);
export const resetTranscript = signal(0);

export const toggleReadAlways = (value: boolean) => {
  readAlways.value = value;
  // Save to session storage
  if (typeof window !== "undefined") {
    sessionStorage.setItem("ai-speech-enabled", value.toString());
  }
  if (!value) {
    stopAndResetAudio();
    stopList.value = Object.keys(getCurrentChatAudioDict()).map(Number);
  }
};

// Helper function to get current chat's audio dictionary
const getCurrentChatAudioDict = () => {
  const currentChatId = `bude-chat-${chatSuffix.value}`;
  return audioFileDict.value[currentChatId] || {};
};

// Helper function to ensure current chat audio dict exists
const ensureCurrentChatAudioDict = () => {
  const currentChatId = `bude-chat-${chatSuffix.value}`;
  if (!audioFileDict.value[currentChatId]) {
    audioFileDict.value = {
      ...audioFileDict.value,
      [currentChatId]: {}
    };
  }
  return currentChatId;
};

// Invalidate audio cache for specific messages in current chat
export const invalidateAudioCache = (messageIndices: number[]) => {
  const currentChatId = ensureCurrentChatAudioDict();
  const currentChatAudio = audioFileDict.value[currentChatId];
  
  messageIndices.forEach(index => {
    if (currentChatAudio[index]) {
      // Clean up audio objects and blob URLs
      Object.values(currentChatAudio[index]).forEach(audioItem => {
        audioItem.audio.pause();
        audioItem.audio.currentTime = 0;
        // Clean up blob URL to prevent memory leaks
        if (audioItem.audio.src && audioItem.audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioItem.audio.src);
        }
      });
      delete currentChatAudio[index];
    }
  });
  
  audioFileDict.value = { ...audioFileDict.value };
  console.log(`Invalidated audio cache for messages: ${messageIndices.join(', ')}`);
};

// Clear all audio cache for current chat
export const clearCurrentChatAudioCache = () => {
  const currentChatId = `bude-chat-${chatSuffix.value}`;
  const currentChatAudio = audioFileDict.value[currentChatId];
  
  if (currentChatAudio) {
    // Clean up all audio objects and blob URLs
    Object.values(currentChatAudio).forEach(messageAudio => {
      Object.values(messageAudio).forEach(audioItem => {
        audioItem.audio.pause();
        audioItem.audio.currentTime = 0;
        if (audioItem.audio.src && audioItem.audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioItem.audio.src);
        }
      });
    });
    
    audioFileDict.value = {
      ...audioFileDict.value,
      [currentChatId]: {}
    };
    console.log(`Cleared all audio cache for chat: ${currentChatId}`);
  }
};

// Clear audio cache for all chats (useful for cleanup)
export const clearAllAudioCache = () => {
  Object.values(audioFileDict.value).forEach(chatAudio => {
    Object.values(chatAudio).forEach(messageAudio => {
      Object.values(messageAudio).forEach(audioItem => {
        audioItem.audio.pause();
        audioItem.audio.currentTime = 0;
        if (audioItem.audio.src && audioItem.audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioItem.audio.src);
        }
      });
    });
  });
  
  audioFileDict.value = {};
  console.log('Cleared all audio cache');
};

export const getTTS = async (
  text: string,
  groupIndex: number,
  sourceFunction: string,
) => {
  console.log(
    `getTTS called for group ${groupIndex}, source: ${sourceFunction}`,
  );

  // Don't process if it's a user message
  if (messages.value[groupIndex]?.role === "user") {
    console.log("Skipping user message");
    return;
  }

  // Don't process if readAlways is false and this is a stream request
  if (!readAlways.value && sourceFunction.startsWith("stream")) {
    console.log("Skipping due to readAlways false");
    return;
  }

  // Clean the text for speech
  const cleanedText = text;
  if (!cleanedText) return;

  // Use streaming TTS for long texts (>500 characters)
  /*if (cleanedText.length > 500) {
    console.log(`Text is long (${cleanedText.length} chars), using streaming TTS`);
    await getStreamingTTS(cleanedText, groupIndex, sourceFunction);
    return;
  }*/

  const currentChatId = ensureCurrentChatAudioDict();
  const currentChatAudio = audioFileDict.value[currentChatId];

  // Don't process if we already have audio for this message
  if (currentChatAudio[groupIndex]?.[0]?.audio) {
    console.log("Audio already exists for this message");
    if (readAlways.value) {
      currentChatAudio[groupIndex][0].audio.play().catch(console.error);
    }
    return;
  }

  try {
    const openai = createOpenAI({
      apiKey: settings.value.apiKey,
      baseURL: "https://server.budecredits.de",
    });
    const result = await generateSpeech({
      model: openai.speech("openai/tts-1"),
      text: cleanedText,
    });
    console.log(result);
    /*const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: cleanedText,
        textPosition: sourceFunction,
        voice: lang.value === "en" ? "Stefanie" : "Florian",
        ttsKey: settings.value.ttsKey,
        ttsUrl: settings.value.ttsUrl,
        ttsModel: settings.value.ttsModel,
        shopApiKey: settings.value.universalApiKey,
      }),
    });*/

    /*if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }*/

    //const audioData = await response.arrayBuffer();
    const audioBlob = new Blob([result.audio.uint8Array], { type: result.audio.mimeType });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Add event listener to update UI when audio ends
    audio.addEventListener('ended', () => {
      console.log(`Audio ended for message ${groupIndex}`);
      // Trigger a re-render by updating the audioFileDict signal
      audioFileDict.value = { ...audioFileDict.value };
    });

    if (!currentChatAudio[groupIndex]) {
      currentChatAudio[groupIndex] = {};
    }

    currentChatAudio[groupIndex][0] = {
      audio,
      played: false,
    };

    audioFileDict.value = { ...audioFileDict.value };
    console.log("Created new audio for message");

    // Play audio if readAlways is true OR if this was manually triggered
    const isManuallyTriggered = sourceFunction === "handleOnSpeakAtGroupIndexAction";
    if (readAlways.value || isManuallyTriggered) {
      audio.play().catch(console.error);
    }
  } catch (error) {
    console.error("Error fetching TTS:", error);
  }
};

export const handleOnSpeakAtGroupIndexAction = (groupIndex: number) => {
  // Don't process if it's a user message
  if (messages.value[groupIndex]?.role === "user") return;

  const currentChatAudio = getCurrentChatAudioDict();

  if (!currentChatAudio[groupIndex]) {
    const message = messages.value[groupIndex];
    if (!message || !message.content) return;

    const content = Array.isArray(message.content)
      ? message.content.join("")
      : message.content;

    getTTS(content, groupIndex, "handleOnSpeakAtGroupIndexAction");
    return;
  }

  const audio = currentChatAudio[groupIndex][0]?.audio;
  if (!audio) return;

  if (!audio.paused) {
    stopAndResetAudio();
    stopList.value = [...stopList.value, groupIndex];
  } else {
    stopAndResetAudio();
    stopList.value = stopList.value.filter((item) => item !== groupIndex);
    audio.play().catch(console.error);
  }

  audioFileDict.value = { ...audioFileDict.value };
};

export const stopAndResetAudio = () => {
  // Stop streaming TTS if active
  if (isStreamingTTSActive()) {
    stopStreamingTTS();
  }

  const currentChatAudio = getCurrentChatAudioDict();
  Object.values(currentChatAudio).forEach((group) => {
    Object.values(group).forEach((item) => {
      if (!item.audio.paused) {
        item.audio.pause();
        item.audio.currentTime = 0;
      }
    });
  });
};

// Effect to handle chat switching - stop audio when switching chats
if (typeof window !== "undefined") {
  let previousChatSuffix = chatSuffix?.value;
  
  effect(() => {
    const currentSuffix = chatSuffix?.value;
    
    if (previousChatSuffix !== currentSuffix) {
      console.log(`Chat switched from ${previousChatSuffix} to ${currentSuffix}`);
      
      // Stop all audio in the previous chat
      if (previousChatSuffix && audioFileDict.value[`bude-chat-${previousChatSuffix}`]) {
        const previousChatAudio = audioFileDict.value[`bude-chat-${previousChatSuffix}`];
        Object.values(previousChatAudio).forEach((group) => {
          Object.values(group).forEach((item) => {
            if (!item.audio.paused) {
              item.audio.pause();
              item.audio.currentTime = 0;
            }
          });
        });
      }
      
      // Clear stop list for the new chat
      stopList.value = [];
      
      previousChatSuffix = currentSuffix;
    }
  });
}
