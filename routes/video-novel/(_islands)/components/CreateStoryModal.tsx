import { Button } from "../../../../components/Button.tsx";
import type { FormData } from "./types.ts";
import { useEffect, useRef, useState } from "preact/hooks";

interface CreateStoryModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  formData: FormData;
  onClose: () => void;
  onInputChange: (e: Event) => void;
  onSubmit: (e: Event) => void;
  error?: { message: string; stack?: string } | null;
}

// Predefined story plots with detailed descriptions
const STORY_PLOTS = [
  { 
    id: "adventure", 
    label: "Adventure Quest", 
    plot: "A young explorer discovers an ancient map leading to a legendary treasure hidden in a dangerous jungle. Along the journey, they encounter mysterious creatures, ancient traps, and form unexpected alliances.",
    icon: "🗺️"
  },
  { 
    id: "mystery", 
    label: "Mystery Investigation", 
    plot: "In a small coastal town, a renowned detective must solve a series of puzzling disappearances that seem connected to an old town legend. As they dig deeper, they uncover long-forgotten history that powerful people want to keep hidden.",
    icon: "🔍"
  },
  { 
    id: "fantasy", 
    label: "Magical Academy", 
    plot: "A teenager discovers they possess rare magical abilities and is invited to attend a secret school for gifted individuals. While learning to control their powers, they uncover a hidden truth about the school's mysterious founder.",
    icon: "✨"
  },
  { 
    id: "sci-fi", 
    label: "Space Colony", 
    plot: "The first human colony on a distant planet faces unexpected challenges when strange phenomena begin affecting the settlers. The colony's scientist must race against time to understand the planet's secrets before it's too late.",
    icon: "🚀"
  }
];

// Visual style options with icons for better recognition
const VISUAL_STYLES = [
  { value: "realistic", label: "Realistic", icon: "📷" },
  { value: "anime", label: "Anime", icon: "🎭" },
  { value: "cartoon", label: "Cartoon", icon: "🎨" },
  { value: "watercolor", label: "Watercolor", icon: "💧" },
  { value: "oil-painting", label: "Oil Painting", icon: "🖼️" }
];

export default function CreateStoryModal({
  isOpen,
  isGenerating,
  formData,
  onClose,
  onInputChange,
  onSubmit,
  error = null,
}: CreateStoryModalProps) {
  // Track the selected plot for visual feedback
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Refs for focus trapping
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Handle plot selection
  const handlePlotSelect = (plot: string, plotId: string) => {
    // Update selected plot for visual feedback
    setSelectedPlotId(plotId);
    
    // Call the parent's onInputChange with our synthetic event
    if (onInputChange) {
      const syntheticEvent = {
        target: {
          name: 'prompt',
          value: plot
        }
      } as unknown as Event;
      onInputChange(syntheticEvent);
    }
  };
  
  // Handle style selection with synthetic event
  const handleStyleSelect = (style: string) => {
    const event = new Event('change', { bubbles: true });
    const select = document.getElementById('style') as HTMLSelectElement;
    
    if (select) {
      select.value = style;
      select.dispatchEvent(event);
      
      // Call the parent's onInputChange with our synthetic event
      if (onInputChange) {
        const syntheticEvent = {
          target: {
            name: 'style',
            value: style
          }
        } as unknown as Event;
        onInputChange(syntheticEvent);
      }
    }
  };

  // Copy error to clipboard
  const copyErrorToClipboard = () => {
    if (!error) return;
    
    const errorText = `Error: ${error.message}\n\nStack Trace:\n${error.stack || 'No stack trace available'}`;
    navigator.clipboard.writeText(errorText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  // Handle dialog opening and closing
  useEffect(() => {
    if (isOpen) {
      // Open the dialog when isOpen is true
      if (dialogRef.current) {
        if (!dialogRef.current.open) {
          dialogRef.current.showModal();
        }
      }
      
      // Focus the first element when modal opens
      setTimeout(() => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        }
      }, 50);
    } else {
      // Close the dialog when isOpen is false
      if (dialogRef.current) {
        if (dialogRef.current.open) {
          dialogRef.current.close();
        }
      }
    }
  }, [isOpen]);
  
  // Reset selected plot when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlotId(null);
    }
  }, [isOpen]);
  
  // Handle escape key and click outside
  const handleDialogClick = (e: MouseEvent) => {
    // Only close if clicking on the backdrop element itself
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // If not open, don't render anything
  if (!isOpen) return null;

  return (
    <dialog 
      ref={dialogRef}
      className="bg-white rounded-xl border border-gray-200 w-full max-w-2xl p-0 backdrop:bg-black/70"
      aria-labelledby="modal-title"
      onClick={handleDialogClick}
      onKeyDown={handleKeyDown}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="p-6">
        {/* Header with clear visual hierarchy */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">Create New Video Novel</h2>
          <button
            ref={firstFocusableRef}
            type="button"
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
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

        {/* Error message display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error generating story</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.message}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={copyErrorToClipboard}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {isCopied ? (
                      <>
                        <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                        Copy Error Details
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Step 1: Choose a story plot */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Choose a Story Plot
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {STORY_PLOTS.map((storyPlot) => (
                <button
                  key={storyPlot.id}
                  type="button"
                  onClick={() => handlePlotSelect(storyPlot.plot, storyPlot.id)}
                  className={`text-left p-4 rounded-lg border relative ${
                    selectedPlotId === storyPlot.id 
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-500' 
                      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-green-300'
                  } transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 h-full group`}
                  aria-label={`Use ${storyPlot.label} plot`}
                  aria-pressed={selectedPlotId === storyPlot.id}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3" aria-hidden="true">{storyPlot.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {storyPlot.label}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {storyPlot.plot.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                  <div className={`absolute bottom-2 right-2 text-xs font-medium px-2 py-1 rounded-full ${
                    selectedPlotId === storyPlot.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity'
                  }`}>
                    {selectedPlotId === storyPlot.id ? 'Selected' : 'Select'}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Custom Plot Textarea */}
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium mb-1 text-gray-700"
              >
                Custom Plot <span className="text-sm font-normal text-gray-500 ml-1">(or edit selected plot)</span>
              </label>
              <textarea
                id="prompt"
                name="prompt"
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800"
                placeholder="Describe your own story plot or edit the selected one..."
                value={formData.prompt}
                onChange={(e) => {
                  onInputChange(e);
                  // If user edits the text, clear the selected plot highlight
                  // but only if the text is significantly different
                  if (selectedPlotId) {
                    const selectedPlot = STORY_PLOTS.find(p => p.id === selectedPlotId);
                    const inputValue = (e.target as HTMLTextAreaElement).value;
                    if (selectedPlot && inputValue !== selectedPlot.plot) {
                      setSelectedPlotId(null);
                    }
                  }
                }}
                required
              />
            </div>
          </div>
            
          {/* Step 2: Choose visual style */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Choose Visual Style
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {VISUAL_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => handleStyleSelect(style.value)}
                  className={`p-3 rounded-lg border relative ${
                    formData.style === style.value 
                      ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-green-300'
                  } transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex flex-col items-center group`}
                  aria-pressed={formData.style === style.value}
                >
                  <span className="text-2xl mb-1" aria-hidden="true">{style.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{style.label}</span>
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                    formData.style === style.value 
                      ? 'bg-green-500' 
                      : 'bg-transparent'
                  }`}>
                    {formData.style === style.value && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-3 h-3" aria-hidden="true">
                        <title>Selected checkmark</title>
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Hidden select for form submission */}
            <select
              id="style"
              name="style"
              className="sr-only"
              value={formData.style}
              onChange={onInputChange}
            >
              {VISUAL_STYLES.map((style) => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            <Button
              ref={lastFocusableRef}
              type="submit"
              className={`px-5 py-2 rounded-md flex items-center gap-2 text-white font-medium ${
                !formData.prompt.trim() || !formData.style || isGenerating
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              disabled={!formData.prompt.trim() || !formData.style || isGenerating}
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                <>Generate Story</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
} 