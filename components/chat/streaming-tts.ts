import { signal } from "@preact/signals";
import { lang, settings } from "./store.ts";

// Interface for streaming TTS state
interface StreamingTTSState {
  isStreaming: boolean;
  currentChunk: number;
  totalChunks: number;
  audioQueue: HTMLAudioElement[];
  currentlyPlaying: HTMLAudioElement | null;
}

// Global state for streaming TTS
export const streamingTTSState = signal<StreamingTTSState>({
  isStreaming: false,
  currentChunk: 0,
  totalChunks: 0,
  audioQueue: [],
  currentlyPlaying: null,
});

// Audio queue management
class AudioQueue {
  private queue: HTMLAudioElement[] = [];
  private currentlyPlaying: HTMLAudioElement | null = null;
  private isPlaying = false;

  add(audio: HTMLAudioElement) {
    this.queue.push(audio);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.currentlyPlaying = null;
      return;
    }

    this.isPlaying = true;
    this.currentlyPlaying = this.queue.shift()!;
    
    return new Promise<void>((resolve) => {
      this.currentlyPlaying!.addEventListener('ended', () => {
        resolve();
        this.playNext();
      });
      
      this.currentlyPlaying!.addEventListener('error', (error) => {
        console.error('Audio playback error:', error);
        resolve();
        this.playNext();
      });
      
      this.currentlyPlaying!.play().catch((error) => {
        console.error('Failed to play audio:', error);
        resolve();
        this.playNext();
      });
    });
  }

  stop() {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause();
      this.currentlyPlaying = null;
    }
    this.queue.forEach(audio => {
      audio.pause();
    });
    this.queue = [];
    this.isPlaying = false;
  }

  clear() {
    this.stop();
  }
}

// Global audio queue instance
const audioQueue = new AudioQueue();

// Convert array buffer to audio blob and create audio element
function createAudioFromData(audioData: number[]): HTMLAudioElement {
  const uint8Array = new Uint8Array(audioData);
  const audioBlob = new Blob([uint8Array], { type: "audio/mp3" });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  // Clean up the object URL when the audio is done
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(audioUrl);
  });
  
  return audio;
}

// Main streaming TTS function
export const getStreamingTTS = async (
  text: string,
  groupIndex: number,
  sourceFunction: string,
) => {
  console.log(`Starting streaming TTS for group ${groupIndex}, source: ${sourceFunction}`);

  // Clear any existing stream
  stopStreamingTTS();

  // Update state
  streamingTTSState.value = {
    isStreaming: true,
    currentChunk: 0,
    totalChunks: 0,
    audioQueue: [],
    currentlyPlaying: null,
  };

  try {
    const response = await fetch("/api/tts-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get response reader");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log("Streaming TTS completed");
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ""; // Keep the incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            await handleStreamEvent(data);
          } catch (error) {
            console.error("Failed to parse streaming data:", error);
          }
        }
      }
    }

  } catch (error) {
    console.error("Streaming TTS error:", error);
    streamingTTSState.value = {
      ...streamingTTSState.value,
      isStreaming: false,
    };
  }
};

// Handle individual stream events
async function handleStreamEvent(data: any) {
  switch (data.type) {
    case "metadata":
      console.log(`Processing chunk ${data.chunkIndex + 1}/${data.totalChunks}: ${data.text.substring(0, 50)}...`);
      streamingTTSState.value = {
        ...streamingTTSState.value,
        currentChunk: data.chunkIndex,
        totalChunks: data.totalChunks,
      };
      break;

    case "audio":
      console.log(`Received audio for chunk ${data.chunkIndex}`);
      const audio = createAudioFromData(data.audioData);
      audioQueue.add(audio);
      break;

    case "error":
      console.error(`Error in chunk ${data.chunkIndex}:`, data.message);
      break;

    case "complete":
      console.log("Streaming TTS completed successfully");
      streamingTTSState.value = {
        ...streamingTTSState.value,
        isStreaming: false,
      };
      break;

    default:
      console.warn("Unknown stream event type:", data.type);
  }
}

// Stop streaming TTS
export const stopStreamingTTS = () => {
  audioQueue.stop();
  streamingTTSState.value = {
    isStreaming: false,
    currentChunk: 0,
    totalChunks: 0,
    audioQueue: [],
    currentlyPlaying: null,
  };
  console.log("Streaming TTS stopped");
};

// Check if streaming TTS is active
export const isStreamingTTSActive = () => {
  return streamingTTSState.value.isStreaming;
}; 