import { useState } from "preact/hooks";
import { JSX } from "preact";

interface ChatActionsProps {
  onExport: () => void;
  onClear: () => void;
  onShare: () => void;
}

export default function ChatActions({ onExport, onClear, onShare }: ChatActionsProps): JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  return (
    <div class="relative">
      <button
        onClick={toggleDropdown}
        class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <span>Actions</span>
        <svg
          class="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
      
      {isDropdownOpen && (
        <div
          class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10"
          role="menu"
          aria-orientation="vertical"
        >
          <div class="py-1" role="none">
            <button
              onClick={() => {
                onExport();
                setIsDropdownOpen(false);
              }}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Export Chat
            </button>
            <button
              onClick={() => {
                onShare();
                setIsDropdownOpen(false);
              }}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Share Chat
            </button>
            <button
              onClick={() => {
                onClear();
                setIsDropdownOpen(false);
              }}
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              role="menuitem"
            >
              Clear Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 