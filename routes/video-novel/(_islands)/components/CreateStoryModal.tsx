import { Button } from "../../../../components/Button.tsx";
import type { FormData } from "./types.ts";

interface CreateStoryModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  formData: FormData;
  onClose: () => void;
  onInputChange: (e: Event) => void;
  onSubmit: (e: Event) => void;
}

export default function CreateStoryModal({
  isOpen,
  isGenerating,
  formData,
  onClose,
  onInputChange,
  onSubmit,
}: CreateStoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Video Novel</h2>
            <button
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
      </div>
    </div>
  );
} 