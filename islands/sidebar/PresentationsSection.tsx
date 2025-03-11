import { IconPresentation } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SidebarLink from "./SidebarLink.tsx";
import type { Translations } from "./sidebar.translations.d.ts";
interface PresentationsSectionProps {
  isCollapsed: boolean;
  lang: string;
  translations: Translations[keyof Translations];
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
      variant="blue"
    >
      <SidebarLink href="/presentations" variant="blue">
        Generate Presentation
      </SidebarLink>
    </CollapsibleSection>
  );
}
