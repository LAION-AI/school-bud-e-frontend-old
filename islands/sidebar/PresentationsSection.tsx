import { IconPresentation } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SidebarLink from "./SidebarLink.tsx";
import translations from "./sidebar.translations.json" with { type: "json" };

interface PresentationsSectionProps {
  isCollapsed: boolean;
  lang: string;
  translations: typeof translations[keyof typeof translations];
}

export default function PresentationsSection({
  isCollapsed,
  lang,
  translations,
}: PresentationsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Presentation Generator"
      icon={<IconPresentation />}
      isCollapsed={isCollapsed}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      baseRoute="/presentations"
    >
      <SidebarLink href="/presentations">
        Generate Presentation
      </SidebarLink>
    </CollapsibleSection>
  );
}
