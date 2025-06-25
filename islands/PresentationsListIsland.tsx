import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "fresh/runtime";
import { IconEye, IconTrash, IconPlus } from "@tabler/icons-preact";
import { Button } from "../components/Button.tsx";
import Modal from "./Modal.tsx";
import { apiWarningMessage, settings } from "../components/chat/store.ts";

interface PresentationItem {
  id: string;
  title: string;
  slideCount: number;
  createdAt: string;
}

export default function PresentationsListIsland() {
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Load presentations from localStorage
  useEffect(() => {
    if (IS_BROWSER) {
      setIsLoading(true);

      // Get all keys from localStorage that start with "presentation-"
      const presentationKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("presentation-")
      );

      // Extract presentation data
      const presentationsList: PresentationItem[] = [];

      for (const key of presentationKeys) {
        try {
          const id = key.replace("presentation-", "");
          const storedData = localStorage.getItem(key);
          const data = storedData ? JSON.parse(storedData) : null;

          if (data?.title && Array.isArray(data.slides)) {
            presentationsList.push({
              id,
              title: data.title,
              slideCount: data.slides.length,
              createdAt: new Date(Number.parseInt(id)).toLocaleString(),
            });
          }
        } catch (e) {
          console.error("Failed to parse presentation data:", e);
        }
      }

      // Sort by creation date (newest first)
      presentationsList.sort((a, b) =>
        Number.parseInt(b.id) - Number.parseInt(a.id)
      );

      setPresentations(presentationsList);
      setIsLoading(false);
    }
  }, []);

  const deletePresentation = (id: string) => {
    if (confirm("Are you sure you want to delete this presentation?")) {
      localStorage.removeItem(`presentation-${id}`);
      setPresentations(presentations.filter((p) => p.id !== id));
    }
  };

  const generatePresentation = async () => {
    if (!topic.trim()) {
      setGenerationError("Please enter a topic for your presentation");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

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
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let partialResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialResponse += new TextDecoder().decode(value);
      }

      const data = JSON.parse(partialResponse);
      if (!data.success) {
        throw new Error(data.error || "Failed to generate presentation");
      }

      const urlParts = data.previewUrl.split("?id=");
      const id = urlParts[1];

      localStorage.setItem(
        `presentation-${id}`,
        JSON.stringify(data.presentationData),
      );

      // Refresh presentations list
      const newPresentation: PresentationItem = {
        id,
        title: data.presentationData.title,
        slideCount: data.presentationData.slides.length,
        createdAt: new Date().toLocaleString(),
      };
      setPresentations([newPresentation, ...presentations]);

      // Close modal and reset form
      setIsModalOpen(false);
      setTopic("");
      
      // Navigate to preview
      window.location.href = `/presentations/preview?id=${id}`;
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const isApiConfigured = settings.value.universalApiKey ||
    (settings.value.apiKey && settings.value.apiUrl && settings.value.apiModel);

  if (isLoading) {
    return (
      <div class="animate-pulse space-y-4">
        {[1, 2, 3].map((num) => (
          <div
            key={`loading-placeholder-${num}`}
            class="bg-gray-100 p-4 rounded-lg"
          >
            <div class="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div class="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div class="text-center py-8 border border-dashed border-gray-300 rounded-lg">
        <p class="text-lg text-gray-700 mb-2">No presentations found</p>
        <p class="text-gray-500 mb-4">
          Create a new presentation to get started
        </p>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <IconPlus class="w-5 h-5 mr-2" />
          Create Presentation
        </Button>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTopic("");
          setGenerationError(null);
        }}
        title="Create New Presentation"
        size="md"
      >
        <div class="space-y-4">
          {!isApiConfigured && (
            <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-yellow-800">
                API configuration is missing. Please configure your API settings
                in the chat settings.
              </p>
            </div>
          )}

          {apiWarningMessage.value && (
            <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-yellow-800">{apiWarningMessage.value}</p>
            </div>
          )}

          <div>
            <label
              for="topic"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Presentation Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onInput={(e) => setTopic((e.target as HTMLInputElement).value)}
              placeholder="Enter a topic for your presentation..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isGenerating}
            />
          </div>

          {generationError && (
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-800 text-sm">{generationError}</p>
            </div>
          )}

          <div class="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setTopic("");
                setGenerationError(null);
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={generatePresentation}
              disabled={isGenerating || !topic.trim() || !isApiConfigured}
            >
              {isGenerating ? "Generating..." : "Generate Presentation"}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    );
  }

  return (
    <>

      <div class="space-y-4">
        {presentations.map((presentation) => (
          <div
            key={presentation.id}
            class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-lg text-gray-900">
                  {presentation.title}
                </h3>
                <p class="text-sm text-gray-500">
                  {presentation.slideCount} slides • Created{" "}
                  {presentation.createdAt}
                </p>
              </div>
              <div class="flex space-x-2">
                <a
                  href={`/presentations/preview?id=${presentation.id}`}
                  class="text-amber-600 hover:text-amber-800"
                  title="View presentation"
                  aria-label="View presentation"
                >
                  <span class="sr-only">View presentation</span>
                  <IconEye />
                </a>
                <button
                  type="button"
                  onClick={() => deletePresentation(presentation.id)}
                  class="text-red-600 hover:text-red-800"
                  title="Delete presentation"
                  aria-label="Delete presentation"
                >
                  <span class="sr-only">Delete presentation</span>
                  <IconTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
