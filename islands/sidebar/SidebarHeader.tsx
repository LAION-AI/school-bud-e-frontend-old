import { IconLayoutSidebarLeftCollapse } from "@tabler/icons-preact";
import translations from "./sidebar.translations.json" with { type: "json" };

interface SidebarHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  translations: typeof translations[keyof typeof translations];
}

export default function SidebarHeader({
  isCollapsed,
  setIsCollapsed,
  translations,
}: SidebarHeaderProps) {
  const handleCollapse = () => {
    setIsCollapsed((prev: boolean) => !prev);
  };

  return (
    <div class="flex justify-between px-3 py-4 relative">
      <img
        src="/logo.png"
        width="48"
        height="48"
        alt={translations.navigation.logoAlt}
      />
    </div>
  );
}
