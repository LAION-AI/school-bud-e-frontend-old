import SidebarLink from "./SidebarLink.tsx";
import CollapsibleSection from "./CollapsibleSection.tsx";
import { IconPresentation } from "@tabler/icons-preact";
import { useState } from "preact/hooks";

interface PresentationsSectionProps {
  isCollapsed: boolean;
}

export default function PresentationsSection({ isCollapsed }: PresentationsSectionProps) {
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
      <SidebarLink href="/presentations/generator">
        Generate Presentation
      </SidebarLink>
    </CollapsibleSection>
  );
}
