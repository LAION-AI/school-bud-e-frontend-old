import { useState, useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { IconTrash } from "@tabler/icons-preact";

interface PresentationItem {
  id: string;
  title: string;
  slideCount: number;
  createdAt: string;
}

export default function PresentationsListIsland() {
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load presentations from localStorage
  useEffect(() => {
    if (IS_BROWSER) {
      setIsLoading(true);
      
      // Get all keys from localStorage that start with "presentation-"
      const presentationKeys = Object.keys(localStorage).filter(key => 
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
      presentationsList.sort((a, b) => Number.parseInt(b.id) - Number.parseInt(a.id));
      
      setPresentations(presentationsList);
      setIsLoading(false);
    }
  }, []);
  
  const deletePresentation = (id: string) => {
    if (confirm("Are you sure you want to delete this presentation?")) {
      localStorage.removeItem(`presentation-${id}`);
      setPresentations(presentations.filter(p => p.id !== id));
    }
  };
  
  if (isLoading) {
    return (
      <div class="animate-pulse space-y-4">
        {[1, 2, 3].map((num) => (
          <div key={`loading-placeholder-${num}`} class="bg-gray-100 p-4 rounded-lg">
            <div class="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div class="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }
  
  if (presentations.length === 0) {
    return (
      <div class="text-center py-8 text-gray-500">
        <p>You haven't created any presentations yet.</p>
        <p class="mt-2">
          <a 
            href="/presentations/generator" 
            class="text-amber-600 hover:text-amber-800 underline"
          >
            Create your first presentation
          </a>
        </p>
      </div>
    );
  }
  
  return (
    <div class="space-y-4">
      {presentations.map(presentation => (
        <div key={presentation.id} class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-lg text-gray-900">{presentation.title}</h3>
              <p class="text-sm text-gray-500">
                {presentation.slideCount} slides • Created {presentation.createdAt}
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
  );
} 