import { IconListCheck } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import CollapsibleSection from "./CollapsibleSection.tsx";
import translations from "./sidebar.translations.json" with { type: "json" };

interface TestsSectionProps {
  isCollapsed: boolean;
  highlight?: boolean;
  lang: string;
  translations: typeof translations[keyof typeof translations];
}

export default function TestsSection({
  isCollapsed,
  highlight,
  lang,
  translations,
}: TestsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  // Define the variant for this section
  const sectionVariant = "red" as const;

  // Helper function to generate link classes based on active state and variant
  const getLinkClasses = (linkPath: string) => {
    const baseClasses =
      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2";
    let ringClass = "";
    let activeClasses = "";
    if (sectionVariant === "red") {
      ringClass = "focus-visible:ring-red-500";
      activeClasses = "bg-red-100 text-red-900 hover:bg-red-200";
    }
    // You can add more variants here if needed
    const inactiveClasses =
      "text-gray-700 hover:bg-gray-50 hover:text-gray-900";
    const active = currentPath === linkPath;
    return `${baseClasses} ${ringClass} ${
      active ? activeClasses : inactiveClasses
    }`;
  };

  return (
    <CollapsibleSection
      icon={<IconListCheck />}
      title={translations.actions.test}
      isCollapsed={isCollapsed}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      baseRoute="/tests"
      onRouteMatch={(match) => setCurrentPath(match?.[0] || "")}
    >
      <a href="/tests" class={getLinkClasses("/tests")}>
        {translations.actions.allTests}
      </a>
      <a href="/tests/check" class={getLinkClasses("/tests/check")}>
        {translations.actions.checkTests}
      </a>
    </CollapsibleSection>
  );
}
