import { useState, useEffect } from "preact/hooks";
import FloatingChat from "./chat/FloatingChat.tsx";
import { apiWarningMessage, settings } from "../components/chat/store.ts";

interface SlideData {
  title: string;
  content: string[];
  imageUrl?: string;
  notes?: string;
}

interface PartialPresentationData {
  type?: string;
  title?: string;
  slides?: SlideData[];
}

export default function PresentationGeneratorIsland() {
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<PartialPresentationData | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [totalSlides, setTotalSlides] = useState<number>(0);

  // Function to parse partial JSON from a string
  const parsePartialJson = (text: string): PartialPresentationData | null => {
    try {
      // Look for JSON-like structure in the text
      const jsonMatch = text.match(/\{[\s\S]*"type"[\s\S]*"presentation"[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const jsonStr = jsonMatch[0];
      
      // Try to parse the JSON
      try {
        const data = JSON.parse(jsonStr);
        return data as PartialPresentationData;
      } catch (e) {
        // If we can't parse the complete JSON, try to extract what we can
        const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]+)"/);
        const slidesMatch = jsonStr.match(/"slides"\s*:\s*\[([\s\S]*?)\]/);
        
        const partialData: PartialPresentationData = {};
        
        if (titleMatch?.[1]) {
          partialData.title = titleMatch[1];
        }
        
        if (slidesMatch?.[1]) {
          // Count how many slide objects we have
          const slideCount = (slidesMatch[1].match(/\{\s*"title"/g) || []).length;
          if (slideCount > 0) {
            setTotalSlides(slideCount);
            setCurrentSlide(slideCount);
          }
        }
        
        return partialData;
      }
    } catch (e) {
      console.error("Error parsing partial JSON:", e);
      return null;
    }
  };

  const generatePresentation = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic for your presentation");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedId(null);
    setGenerationProgress(null);
    setCurrentSlide(0);
    setTotalSlides(0);

    try {
      const response = await fetch("/api/presentations/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          universalApiKey: settings.value.universalApiKey,
          apiKey: settings.value.apiKey,
          apiUrl: settings.value.apiUrl,
          apiModel: settings.value.apiModel,
          vlmUrl: settings.value.vlmUrl,
          vlmKey: settings.value.vlmKey,
          vlmModel: settings.value.vlmModel,
          vlmCorrectionModel: settings.value.vlmCorrectionModel,
          ttsUrl: settings.value.ttsUrl,
          ttsKey: settings.value.ttsKey,
          ttsModel: settings.value.ttsModel,
          sttUrl: settings.value.sttUrl,
          sttKey: settings.value.sttKey,
          sttModel: settings.value.sttModel,
        }),
      });

      // Read the response as a stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let partialResponse = "";
      
      // Process the stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the chunk to text and append to our partial response
        const chunk = new TextDecoder().decode(value);
        partialResponse += chunk;
        
        // Try to parse the partial response
        const partialData = parsePartialJson(partialResponse);
        if (partialData) {
          setGenerationProgress(partialData);
        }
      }

      // Process the complete response
      const data = JSON.parse(partialResponse);

      if (!data.success) {
        throw new Error(data.error || "Failed to generate presentation");
      }

      // Extract the ID from the previewUrl
      const urlParts = data.previewUrl.split("?id=");
      const id = urlParts[1];
      
      setGeneratedId(id);
      setSuccess(`Presentation "${data.presentationData.title}" generated successfully!`);
      
      // Store the presentation data in localStorage for the preview page to access
      localStorage.setItem(`presentation-${id}`, JSON.stringify(data.presentationData));
      
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if API is configured
  const isApiConfigured = settings.value.universalApiKey || 
    (settings.value.apiKey && settings.value.apiUrl && settings.value.apiModel);
  
  const apiWarning = apiWarningMessage.value;

  return (
    <div class="flex h-full gap-4 p-4">
      <div class="flex-1 bg-white rounded-lg shadow-lg p-6">
        <div class="h-full flex flex-col">
          <h2 class="text-2xl font-bold mb-4">PowerPoint Presentation Generator</h2>
          
          {!isApiConfigured && (
            <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-yellow-800">
                API configuration is missing. Please configure your API settings in the chat settings.
              </p>
            </div>
          )}
          
          {apiWarning && (
            <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-yellow-800">{apiWarning}</p>
            </div>
          )}
          
          <div class="mb-4">
            <label for="topic" class="block text-sm font-medium text-gray-700 mb-1">
              Presentation Topic
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                id="topic"
                value={topic}
                onInput={(e) => setTopic((e.target as HTMLInputElement).value)}
                placeholder="Enter a topic for your presentation"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                disabled={isLoading || !isApiConfigured}
              />
              <button
                type="button"
                onClick={generatePresentation}
                disabled={isLoading || !isApiConfigured}
                class={`px-4 py-2 rounded-lg text-white transition-colors ${
                  isLoading || !isApiConfigured
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {isLoading ? "Generating..." : "Generate Presentation"}
              </button>
            </div>
            {error && <p class="mt-2 text-sm text-red-600">{error}</p>}
            {success && <p class="mt-2 text-sm text-green-600">{success}</p>}
          </div>
          
          <div class="flex-1 overflow-hidden">
            {generatedId ? (
              <div class="h-full flex flex-col items-center justify-center">
                <div class="text-center max-w-md">
                  <div class="mb-6 bg-green-50 p-4 rounded-lg border border-green-100">
                    <p class="text-green-800">
                      Your presentation has been generated successfully!
                    </p>
                  </div>
                  
                  <a 
                    href={`/presentations/preview?id=${generatedId}`}
                    class="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    View Presentation
                  </a>
                  
                  <p class="mt-4 text-gray-600">
                    You can generate another presentation by entering a new topic above.
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div class="flex-1 flex flex-col items-center justify-center">
                <div class="text-center max-w-md">
                  <div class="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p class="text-blue-800 font-medium mb-2">
                      Generating your presentation...
                    </p>
                    
                    {generationProgress?.title && (
                      <p class="text-blue-700 mb-2">
                        Title: {generationProgress.title}
                      </p>
                    )}
                    
                    {currentSlide > 0 && (
                      <div class="mt-3">
                        <div class="flex justify-between text-sm text-blue-700 mb-1">
                          <span>Creating slides</span>
                          <span>{currentSlide} {totalSlides > 0 ? `/ ${totalSlides}` : ''}</span>
                        </div>
                        <div class="w-full bg-blue-200 rounded-full h-2.5">
                          <div 
                            class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={`width: ${totalSlides > 0 ? (currentSlide / totalSlides) * 100 : currentSlide * 10}%`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p class="text-gray-600">
                    This may take a minute or two depending on the complexity of the topic.
                  </p>
                </div>
              </div>
            ) : (
              <div class="flex-1 flex items-center justify-center text-gray-500">
                <div class="text-center max-w-md">
                  <p class="mb-4">
                    Enter a topic above and click "Generate Presentation" to create a PowerPoint presentation.
                  </p>
                  <p class="text-sm text-gray-400">
                    The AI will create a well-structured presentation with multiple slides and bullet points.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
