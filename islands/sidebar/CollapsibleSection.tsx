import { IconChevronDown } from "@tabler/icons-preact";

import type { ComponentChildren, VNode } from "preact";
import { useState, useEffect } from "preact/hooks";

const SafeChevronDown = (props: LucideProps): VNode => <IconChevronDown {...props} />;

interface CollapsibleSectionProps {
  icon: ComponentChildren;
  title: string;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: ComponentChildren;
  baseRoute?: string;
  routePattern?: RegExp;
  onRouteMatch?: (match: RegExpMatchArray | null) => void;
  variant?: "amber" | "blue" | "red" | "purple" | "lime";
}

export default function CollapsibleSection({
  icon,
  title,
  isCollapsed,
  isExpanded: propIsExpanded,
  onToggle,
  children,
  baseRoute,
  routePattern,
  onRouteMatch,
  variant = "amber"
}: CollapsibleSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const [shouldBeExpanded, setShouldBeExpanded] = useState(propIsExpanded);
  const [hasInitialized, setHasInitialized] = useState(false);

  const getButtonColorClasses = (active: boolean, variant: "amber" | "blue" | "red" | "purple" | "lime") => {
    if (active) {
      if (variant === "blue") return "bg-blue-100 text-blue-900 hover:bg-blue-200 focus-visible:ring-blue-500";
      if (variant === "red") return "bg-red-100 text-red-900 hover:bg-red-200 focus-visible:ring-red-500";
      if (variant === "purple") return "bg-purple-100 text-purple-900 hover:bg-purple-200 focus-visible:ring-purple-500";
      if (variant === "lime") return "bg-lime-100 text-lime-900 hover:bg-lime-200 focus-visible:ring-lime-500";
      return "bg-amber-100 text-amber-900 hover:bg-amber-200 focus-visible:ring-amber-500";
    }
    return "hover:bg-gray-50 text-gray-700 hover:text-gray-900";
  };

  const getIconColorClasses = (active: boolean, variant: "amber" | "blue" | "red" | "purple" | "lime") => {
    if (active) {
      if (variant === "blue") return "text-blue-800";
      if (variant === "red") return "text-red-800";
      if (variant === "purple") return "text-purple-800";
      if (variant === "lime") return "text-lime-800";
      return "text-amber-800";
    }
    return "text-gray-600 group-hover:text-gray-800";
  };

  const getChevronColorClasses = (active: boolean, variant: "amber" | "blue" | "red" | "purple" | "lime") => {
    if (active) {
      if (variant === "blue") return "text-blue-800";
      if (variant === "red") return "text-red-800";
      if (variant === "purple") return "text-purple-800";
      if (variant === "lime") return "text-lime-800";
      return "text-amber-800";
    }
    return "text-gray-500 group-hover:text-gray-700";
  };

  // Run once on mount to check if this section should be active
  useEffect(() => {
    const checkActive = () => {
      const path = globalThis.location?.pathname;
      
      let isCurrentlyActive = false;
      let match: RegExpMatchArray | null = null;
  
      if (routePattern) {
        match = path?.match(routePattern) || null;
        isCurrentlyActive = Boolean(match);
      } else if (baseRoute) {
        isCurrentlyActive = Boolean(path?.startsWith(baseRoute));
      }
  
      setIsActive(isCurrentlyActive);
  
      if (!hasInitialized && isCurrentlyActive && !shouldBeExpanded) {
        setShouldBeExpanded(true);
        onToggle();
      }
      setHasInitialized(true);
  
      if (onRouteMatch) {
        onRouteMatch(match);
      }
    };
    
    checkActive();
  }, [baseRoute, routePattern, onRouteMatch, onToggle, shouldBeExpanded, hasInitialized]);

  useEffect(() => {
    setShouldBeExpanded(propIsExpanded);
  }, [propIsExpanded]);

  const handleToggle = () => {
    setShouldBeExpanded(!shouldBeExpanded);
    onToggle();
  };

  const buttonBaseClasses = "w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2";

  return (
    <div class="relative group">
      <button
        type="button"
        onClick={(e) => {
          handleToggle();
          
          // Only navigate if this is a direct click on the section header button
          // and not already on the section's route
          if (!shouldBeExpanded && !isCollapsed) {
            const path = globalThis.location?.pathname;
            // Only navigate if we're not already on a path that starts with the baseRoute
            if (baseRoute && !path?.startsWith(baseRoute)) {
              // Use preventDefault to avoid any default navigation
              e.preventDefault();
              // Use history.pushState instead of changing location.href to avoid page reload
              globalThis.history?.pushState(null, "", baseRoute);
              // Manually update the active state since we're not reloading the page
              setIsActive(true);
            }
          }
        }}
        aria-expanded={shouldBeExpanded}
        aria-controls={`${title.toLowerCase()}-content`}
        class={`${buttonBaseClasses} ${getButtonColorClasses(isActive, variant)}`}
      >
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <div class={`h-5 w-5 transition-colors ${getIconColorClasses(isActive, variant)}`}>
              {icon}
            </div>
          </div>
          {!isCollapsed && (
            <span class="font-medium text-sm">
              {title}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <SafeChevronDown
            class={`h-4 w-4 transition-transform duration-200 ${getChevronColorClasses(isActive, variant)} ${shouldBeExpanded ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {shouldBeExpanded && !isCollapsed && (
        <div 
          id={`${title.toLowerCase()}-content`}
          class="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-4"
        >
          {children}
        </div>
      )}
    </div>
  );
} 