import { IconChevronDown } from "@tabler/icons-preact";

import type { ComponentChildren, VNode } from "preact";
import { useEffect, useState } from "preact/hooks";

const SafeChevronDown = (props: any): VNode => <IconChevronDown {...props} />;

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
  variant?: "amber" | "blue" | "red" | "purple" | "green";
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
  variant = "amber",
}: CollapsibleSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const [shouldBeExpanded, setShouldBeExpanded] = useState(propIsExpanded);
  const [hasInitialized, setHasInitialized] = useState(false);

  const getButtonColorClasses = (
    active: boolean,
  ) => {
    if (active) {
      return "bg-primary-100 text-primary-900 hover:bg-primary-200 border-2 border-primary-500 focus-visible:ring-primary-500";
    }
    return "hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-2 border-transparent";
  };

  const getIconColorClasses = (
    active: boolean,
  ) => {
    if (active) {
      return "text-primary-800";
    }
    return "text-gray-600 group-hover:text-gray-800";
  };

  const getChevronColorClasses = (
    active: boolean,
  ) => {
    if (active) {
      return "text-primary-800";
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
  }, [
    baseRoute,
    routePattern,
    onRouteMatch,
    onToggle,
    shouldBeExpanded,
    hasInitialized,
  ]);

  useEffect(() => {
    setShouldBeExpanded(propIsExpanded);
  }, [propIsExpanded]);

  const handleToggle = () => {
    setShouldBeExpanded(!shouldBeExpanded);
    onToggle();
  };

  const buttonBaseClasses =
    "w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2";

  return (
    <div class="relative group">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={shouldBeExpanded}
        aria-controls={`${title.toLowerCase()}-content`}
        class={`${buttonBaseClasses} ${
          getButtonColorClasses(
            isActive,
          )
        }`}
      >
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <div
              class={`h-5 w-5 transition-colors ${
                getIconColorClasses(
                  isActive,
                )
              }`}
            >
              {icon}
            </div>
          </div>
          {!isCollapsed && <span class="font-medium text-sm">{title}</span>}
        </div>
        {!isCollapsed && (
          <SafeChevronDown
            class={`h-4 w-4 transition-transform duration-200 ${
              getChevronColorClasses(
                isActive,
              )
            } ${shouldBeExpanded ? "rotate-180" : ""}`}
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
