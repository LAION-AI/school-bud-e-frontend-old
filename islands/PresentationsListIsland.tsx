import { useState, useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

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
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => deletePresentation(presentation.id)}
                class="text-red-600 hover:text-red-800"
                title="Delete presentation"
                aria-label="Delete presentation"
              >
                <span class="sr-only">Delete presentation</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 