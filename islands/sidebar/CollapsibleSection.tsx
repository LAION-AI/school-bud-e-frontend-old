import { IconChevronDown } from "@tabler/icons-preact";

import type { ComponentChildren, VNode } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

const SafeChevronDown = (props: any): VNode => <IconChevronDown {...props} />;

interface CollapsibleSectionProps {
  icon: ComponentChildren;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ComponentChildren | ((activeRoute: string) => ComponentChildren);
  baseRoute?: string;
  routePattern?: RegExp;
  onRouteMatch?: (match: RegExpMatchArray | null) => void;
  variant?: "amber" | "blue" | "red" | "purple" | "green";
}

export default function CollapsibleSection({
  icon,
  title,
  isExpanded: propIsExpanded,
  onToggle,
  children,
  baseRoute,
  routePattern,
  onRouteMatch,
}: CollapsibleSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(propIsExpanded);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [activeRoute, setActiveRoute] = useState(() => {
    return globalThis.location?.pathname || "";
  });

  // Stable function to check route match
  const checkRouteMatch = useCallback(() => {
    const path = globalThis.location?.pathname;
    if (!path) return { isActive: false, match: null };

    let match: RegExpMatchArray | null = null;
    let isCurrentlyActive = false;

    if (routePattern) {
      match = path.match(routePattern) || null;
      isCurrentlyActive = Boolean(match);
    } else if (baseRoute) {
      isCurrentlyActive = path.startsWith(baseRoute);
    }

    return { isActive: isCurrentlyActive, match };
  }, [baseRoute, routePattern]);

  // Handle route-based active state
  useEffect(() => {
    const { isActive: currentlyActive, match } = checkRouteMatch();
    setIsActive(currentlyActive);
    
    // Update active route
    const newActiveRoute = match?.[0] || globalThis.location?.pathname || "";
    setActiveRoute(newActiveRoute);
    
    // Auto-expand if this section becomes active and hasn't been auto-expanded before
    if (currentlyActive && !isExpanded && !hasAutoExpanded) {
      setIsExpanded(true);
      setHasAutoExpanded(true);
      onToggle();
    }

    // Call external route match callback if provided
    if (onRouteMatch) {
      onRouteMatch(match);
    }
  }, [checkRouteMatch, isExpanded, hasAutoExpanded, onToggle, onRouteMatch]);

  // Sync with prop changes
  useEffect(() => {
    setIsExpanded(propIsExpanded);
  }, [propIsExpanded]);

  // Listen for navigation events to re-check routes
  useEffect(() => {
    const handleNavigation = () => {
      const { isActive: currentlyActive, match } = checkRouteMatch();
      setIsActive(currentlyActive);
      
      // Update active route
      const newActiveRoute = match?.[0] || globalThis.location?.pathname || "";
      setActiveRoute(newActiveRoute);
      
      if (onRouteMatch) {
        onRouteMatch(match);
      }
    };

    // Listen for popstate (back/forward navigation)
    globalThis.addEventListener?.('popstate', handleNavigation);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = globalThis.history?.pushState;
    const originalReplaceState = globalThis.history?.replaceState;
    
    if (originalPushState) {
      globalThis.history.pushState = function(...args) {
        originalPushState.apply(this, args);
        handleNavigation();
      };
    }
    
    if (originalReplaceState) {
      globalThis.history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        handleNavigation();
      };
    }

    return () => {
      globalThis.removeEventListener?.('popstate', handleNavigation);
      if (originalPushState) {
        globalThis.history.pushState = originalPushState;
      }
      if (originalReplaceState) {
        globalThis.history.replaceState = originalReplaceState;
      }
    };
  }, [checkRouteMatch, onRouteMatch]);

  const getButtonColorClasses = (active: boolean) => {
    if (active) {
      return "bg-primary-100 text-primary-900 hover:bg-primary-200 border-2 border-primary-500 focus-visible:ring-primary-500";
    }
    return "hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-2 border-transparent";
  };

  const getIconColorClasses = (active: boolean) => {
    if (active) {
      return "text-primary-800";
    }
    return "text-gray-600 group-hover:text-gray-800";
  };

  const getChevronColorClasses = (active: boolean) => {
    if (active) {
      return "text-primary-800";
    }
    return "text-gray-500 group-hover:text-gray-700";
  };

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    // Mark as manually toggled so we don't auto-expand again
    if (newExpanded) {
      setHasAutoExpanded(true);
    }
    
    onToggle();
  };

  const buttonBaseClasses =
    "w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2";

  // Support both regular children and render prop pattern
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(activeRoute);
    }
    return children;
  };

  return (
    <div class="relative group">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={`${title.toLowerCase()}-content`}
        class={`${buttonBaseClasses} ${getButtonColorClasses(isActive)}`}
      >
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <div
              class={`h-5 w-5 transition-colors ${getIconColorClasses(isActive)}`}
            >
              {icon}
            </div>
          </div>
          <span class="font-medium text-sm">{title}</span>
        </div>
        <SafeChevronDown
          class={`h-4 w-4 transition-transform duration-200 ${getChevronColorClasses(isActive)} ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {isExpanded && (
        <div
          id={`${title.toLowerCase()}-content`}
          class="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-4"
        >
          {renderChildren()}
        </div>
      )}
    </div>
  );
}
