import { JSX } from "preact";
import { useState } from "preact/hooks";

interface CollapsibleProps {
  title: string | JSX.Element;
  icon?: JSX.Element;
  children: JSX.Element | JSX.Element[];
  defaultExpanded?: boolean;
}

export default function Collapsible({ title, icon, children, defaultExpanded = false }: CollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div class="space-y-1">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        class="w-full flex items-center justify-between p-2 text-left text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div class="flex items-center space-x-3">
          {icon}
          <span class="font-medium">{title}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={`h-5 w-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-label="Expand/collapse icon"
        >
          <title>Toggle section visibility</title>
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isExpanded && (
        <div class="ml-10 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}
