import { Button } from "../../../../components/Button.tsx";
import type { FormData } from "./types.ts";
import { useEffect, useRef } from "preact/hooks";

interface CreateStoryModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  formData: FormData;
  onClose: () => void;
  onInputChange: (e: Event) => void;
  onSubmit: (e: Event) => void;
}

// Predefined story plots with detailed descriptions
const STORY_PLOTS = [
  { 
    id: "adventure", 
    label: "Adventure Quest", 
    plot: "A young explorer discovers an ancient map leading to a legendary treasure hidden in a dangerous jungle. Along the journey, they encounter mysterious creatures, ancient traps, and form unexpected alliances."
  },
  { 
    id: "mystery", 
    label: "Mystery Investigation", 
    plot: "In a small coastal town, a renowned detective must solve a series of puzzling disappearances that seem connected to an old town legend. As they dig deeper, they uncover long-forgotten history that powerful people want to keep hidden."
  },
  { 
    id: "fantasy", 
    label: "Magical Academy", 
    plot: "A teenager discovers they possess rare magical abilities and is invited to attend a secret school for gifted individuals. While learning to control their powers, they uncover a hidden truth about the school's mysterious founder."
  },
  { 
    id: "sci-fi", 
    label: "Space Colony", 
    plot: "The first human colony on a distant planet faces unexpected challenges when strange phenomena begin affecting the settlers. The colony's scientist must race against time to understand the planet's secrets before it's too late."
  }
];

export default function CreateStoryModal({
  isOpen,
  isGenerating,
  formData,
  onClose,
  onInputChange,
  onSubmit,
}: CreateStoryModalProps) {
  if (!isOpen) return null;
  
  // Refs for focus trapping
  const modalRef = useRef<HTMLDialogElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Handle plot selection
  const handlePlotSelect = (plot: string) => {
    // Create a synthetic event to simulate input change
    const event = new Event('input', { bubbles: true });
    const textarea = document.getElementById('prompt') as HTMLTextAreaElement;
    
    if (textarea) {
      // Set the textarea value to the selected plot
      textarea.value = plot;
      
      // Update the formData by dispatching the event
      textarea.dispatchEvent(event);
    }
  };
  
  // Handle keyboard events for accessibility
  useEffect(() => {
    if (!isOpen) return;
    
    // Focus the first element when modal opens
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close modal on Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      
      // Trap focus within modal
      if (e.key === 'Tab') {
        // If shift+tab on first element, move to last element
        if (e.shiftKey && document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        } 
        // If tab on last element, move to first element
        else if (!e.shiftKey && document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };
    
    // Add event listener for keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent scrolling of background content
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <dialog 
        ref={modalRef}
        open={isOpen}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">Create New Video Novel</h2>
            <button
              ref={firstFocusableRef}
              type="button"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <title>Close icon</title>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  Story Prompt
                </label>
                
                {/* Story plot suggestions */}
                <div className="mb-4" aria-label="Suggested story plots">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Choose a story plot or write your own:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {STORY_PLOTS.map((storyPlot) => (
                      <button
                        key={storyPlot.id}
                        type="button"
                        onClick={() => handlePlotSelect(storyPlot.plot)}
                        className="text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        aria-label={`Use ${storyPlot.label} plot`}
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          {storyPlot.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {storyPlot.plot.substring(0, 100)}...
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={4}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 dark:text-white"
                  placeholder="Describe the story you want to create..."
                  value={formData.prompt}
                  onChange={onInputChange}
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select a plot suggestion above or write your own creative story prompt
                </p>
              </div>

              <div>
                <label
                  htmlFor="style"
                  className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  Visual Style
                </label>
                <select
                  id="style"
                  name="style"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 dark:text-white"
                  value={formData.style}
                  onChange={onInputChange}
                >
                  <option value="realistic">Realistic</option>
                  <option value="anime">Anime</option>
                  <option value="cartoon">Cartoon</option>
                  <option value="watercolor">Watercolor</option>
                  <option value="oil-painting">Oil Painting</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="customInstructions"
                  className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  Custom Instructions (Optional)
                </label>
                <textarea
                  id="customInstructions"
                  name="customInstructions"
                  rows={3}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 dark:text-white"
                  placeholder="Add any specific instructions for the AI..."
                  value={formData.customInstructions}
                  onChange={onInputChange}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-white"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  ref={lastFocusableRef}
                  type="submit"
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md flex items-center gap-2 text-white"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <title>Loading spinner</title>
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>Generate</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
} 