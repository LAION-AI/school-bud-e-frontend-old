import { IconPresentation } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SidebarLink from "./SidebarLink.tsx";

interface PresentationsSectionProps {
  isCollapsed: boolean;
}

export default function PresentationsSection({
  isCollapsed,
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
