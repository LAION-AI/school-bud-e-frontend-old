import { useState } from "preact/hooks";
import { signal } from "@preact/signals";
import { getStreamingTTS, stopStreamingTTS, streamingTTSState } from "../components/chat/streaming-tts.ts";
import { getTTS } from "../components/chat/speech.ts";
import { Button } from "../components/Button.tsx";

const demoText = signal(`
Artificial Intelligence has transformed the way we interact with technology and process information. In recent years, we have witnessed remarkable advances in machine learning algorithms, natural language processing, and computer vision. These developments have enabled AI systems to perform tasks that were once thought to be exclusively human, such as understanding complex texts, generating creative content, and making sophisticated decisions based on large datasets. The implications of these technological breakthroughs extend far beyond the realm of computer science, influencing fields such as healthcare, finance, education, and entertainment. As we continue to push the boundaries of what AI can achieve, it becomes increasingly important to consider the ethical implications and ensure that these powerful tools are developed and deployed responsibly for the benefit of humanity.
`);

export default function StreamingTTSDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);

  const handlePlay = async () => {
    if (isPlaying) {
      stopStreamingTTS();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      if (useStreaming) {
        await getStreamingTTS(demoText.value.trim(), 0, "demo-streaming");
      } else {
        await getTTS(demoText.value.trim(), 0, "demo-regular");
      }
    } catch (error) {
      console.error("Error playing TTS:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    stopStreamingTTS();
    setIsPlaying(false);
  };

  return (
    <div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold mb-4 text-gray-800">Streaming TTS Demo</h2>
      
      <div class="mb-6">
        <label class="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            checked={useStreaming}
            onChange={(e) => setUseStreaming((e.target as HTMLInputElement).checked)}
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="text-sm font-medium text-gray-700">
            Use Streaming TTS (recommended for long texts)
          </span>
        </label>
        
        <div class="mb-4">
          <label for="demo-text" class="block text-sm font-medium text-gray-700 mb-2">
            Text to speak ({demoText.value.trim().length} characters):
          </label>
          <textarea
            id="demo-text"
            value={demoText.value}
            onChange={(e) => demoText.value = (e.target as HTMLTextAreaElement).value}
            rows={8}
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter text to convert to speech..."
          />
        </div>
      </div>

      <div class="flex space-x-4 mb-6">
        <Button
          onClick={handlePlay}
          disabled={!demoText.value.trim()}
          variant={isPlaying ? "danger" : "primary"}
        >
          {isPlaying ? "Stop" : "Play"} {useStreaming ? "Streaming" : "Regular"} TTS
        </Button>
        
        {isPlaying && (
          <Button
            onClick={handleStop}
            class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
          >
            Force Stop
          </Button>
        )}
      </div>

      {streamingTTSState.value.isStreaming && (
        <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 class="text-lg font-medium text-blue-800 mb-2">Streaming Status</h3>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span class="text-blue-700">
                Processing chunk {streamingTTSState.value.currentChunk + 1} of {streamingTTSState.value.totalChunks || "..."}
              </span>
            </div>
            {streamingTTSState.value.totalChunks > 0 && (
              <div class="w-full bg-blue-200 rounded-full h-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((streamingTTSState.value.currentChunk + 1) / streamingTTSState.value.totalChunks) * 100}%`
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}

      <div class="bg-gray-50 p-4 rounded-md">
        <h3 class="text-lg font-medium text-gray-800 mb-2">How it works:</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li><strong>Regular TTS:</strong> Generates the complete audio file before playback begins. Good for short texts.</li>
          <li><strong>Streaming TTS:</strong> Breaks text into chunks and starts playing audio as soon as the first chunk is ready. Perfect for long texts!</li>
          <li>Streaming TTS automatically activates for texts longer than 500 characters.</li>
          <li>The streaming approach significantly reduces perceived latency for long content.</li>
        </ul>
      </div>
    </div>
  );
} 