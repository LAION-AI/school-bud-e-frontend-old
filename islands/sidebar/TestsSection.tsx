import { useState } from "preact/hooks";
import CollapsibleSection from "./CollapsibleSection.tsx";
import { ListTodo } from "lucide-preact";
import type { LucideProps } from "lucide-preact";
import type { VNode } from "preact";

// @ts-ignore: Suppressing linter error for ListTodo not being a valid JSX component
const SafeListTodoIcon = (props: LucideProps): VNode => <ListTodo {...props} />;

interface TestsSectionProps {
  isCollapsed: boolean;
  highlight?: boolean;
}

export default function TestsSection({ isCollapsed, highlight }: TestsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  // Define the variant for this section
  const sectionVariant = "amber" as const;

  // Helper function to generate link classes based on active state and variant
  const getLinkClasses = (linkPath: string) => {
    const baseClasses = "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2";
    let ringClass = "";
    let activeClasses = "";
    if (sectionVariant === "amber") {
      ringClass = "focus-visible:ring-amber-500";
      activeClasses = "bg-amber-100 text-amber-900 hover:bg-amber-200";
    }
    // You can add more variants here if needed
    const inactiveClasses = "text-gray-700 hover:bg-gray-50 hover:text-gray-900";
    const active = currentPath === linkPath;
    return `${baseClasses} ${ringClass} ${active ? activeClasses : inactiveClasses}`;
  };

  return (
    <CollapsibleSection
      icon={<SafeListTodoIcon />}
      title="Tests"
      isCollapsed={isCollapsed}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      baseRoute="/tests"
      onRouteMatch={(match) => setCurrentPath(match?.[0] || "")}
      variant={sectionVariant}
    >
      <a
        href="/tests"
        class={getLinkClasses("/tests")}
      >
        All Tests
      </a>
      <a
        href="/tests/generate"
        class={getLinkClasses("/tests/generate")}
      >
        Generate Tests
      </a>
      <a
        href="/tests/check"
        class={getLinkClasses("/tests/check")}
      >
        Check Tests
      </a>
    </CollapsibleSection>
  );
}
