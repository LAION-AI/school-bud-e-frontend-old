import { IconListCheck } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import CollapsibleSection from "./CollapsibleSection.tsx";
import translations from "./sidebar.translations.json" with { type: "json" };
import SidebarLink from "./SidebarLink.tsx";

interface TestsSectionProps {
  isCollapsed: boolean;
  highlight?: boolean;
  lang: string;
  translations: typeof translations[keyof typeof translations];
}

export default function TestsSection({
  isCollapsed,
  translations,
}: TestsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

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
      <SidebarLink href="/tests" className="flex items-center group">
        <span className="flex-1 py-2">
          {translations.actions.allTests}
        </span>
      </SidebarLink>
      <SidebarLink href="/tests/check" className="flex items-center group">
        <span className="flex-1 py-2">
          {translations.actions.checkTests}
        </span>
      </SidebarLink>
    </CollapsibleSection>
  );
}
