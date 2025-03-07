import { useState } from "preact/hooks";
import { JSX } from "preact";

interface TooltipProps {
  content: string;
  position?: "top" | "right" | "bottom" | "left";
  children: JSX.Element;
}

const positionStyles = {
  top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
  right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
  left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
};

export default function Tooltip({ 
  content, 
  position = "top",
  children 
}: TooltipProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      class="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div 
          class={`absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md shadow-sm whitespace-nowrap ${positionStyles[position]}`}
          role="tooltip"
        >
          {content}
          <div 
            class={`
              absolute w-2 h-2 bg-gray-900 transform rotate-45
              ${position === "top" ? "top-full -mt-1 left-1/2 -translate-x-1/2" : ""}
              ${position === "right" ? "right-full -mr-1 top-1/2 -translate-y-1/2" : ""}
              ${position === "bottom" ? "bottom-full -mb-1 left-1/2 -translate-x-1/2" : ""}
              ${position === "left" ? "left-full -ml-1 top-1/2 -translate-y-1/2" : ""}
            `}
          ></div>
        </div>
      )}
    </div>
  );
} 