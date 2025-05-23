import { signal } from "@preact/signals";
import { lang, messages, settings } from "./store.ts";

export const audioFileDict = signal<
  Record<number, Record<number, { audio: HTMLAudioElement; played: boolean }>>
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
    stopList.value = Object.keys(audioFileDict.value).map(Number);
  }
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

  // Don't process if we already have audio for this message
  if (audioFileDict.value[groupIndex]?.[0]?.audio) {
    console.log("Audio already exists for this message");
    if (readAlways.value) {
      audioFileDict.value[groupIndex][0].audio.play().catch(console.error);
    }
    return;
  }

  try {
    const response = await fetch("/api/tts", {
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
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const audioData = await response.arrayBuffer();
    const audioBlob = new Blob([audioData], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    if (!audioFileDict.value[groupIndex]) {
      audioFileDict.value[groupIndex] = {};
    }

    audioFileDict.value[groupIndex][0] = {
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
  debugger;
  // Don't process if it's a user message
  if (messages.value[groupIndex]?.role === "user") return;

  if (!audioFileDict.value[groupIndex]) {
    const message = messages.value[groupIndex];
    if (!message || !message.content) return;

    const content = Array.isArray(message.content)
      ? message.content.join("")
      : message.content;

    getTTS(content, groupIndex, "handleOnSpeakAtGroupIndexAction");
    return;
  }

  const audio = audioFileDict.value[groupIndex][0]?.audio;
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
  Object.values(audioFileDict.value).forEach((group) => {
    Object.values(group).forEach((item) => {
      if (!item.audio.paused) {
        item.audio.pause();
        item.audio.currentTime = 0;
      }
    });
  });
};
