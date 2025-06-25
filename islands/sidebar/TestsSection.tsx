import { IconListCheck } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import CollapsibleSection from "./CollapsibleSection.tsx";
import translations from "./sidebar.translations.json" with { type: "json" };
import SidebarLink from "./SidebarLink.tsx";

interface TestsSectionProps {
  highlight?: boolean;
  lang: string;
  translations: typeof translations[keyof typeof translations];
}

export default function TestsSection({
  translations,
}: TestsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <CollapsibleSection
      icon={<IconListCheck />}
      title={translations.actions.test}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      routePattern={/^\/tests(\/.*)?$/}
    >
      {(activeRoute) => (
        <>
          <SidebarLink 
            href="/tests" 
            isActive={activeRoute === "/tests"}
            className="flex items-center group"
          >
            <span className="flex-1">
              {translations.actions.allTests}
            </span>
          </SidebarLink>
          <SidebarLink 
            href="/tests/check" 
            isActive={activeRoute === "/tests/check"}
            className="flex items-center group"
          >
            <span className="flex-1">
              {translations.actions.checkTests}
            </span>
          </SidebarLink>
        </>
      )}
    </CollapsibleSection>
  );
}
