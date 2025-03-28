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
      <button
        type="button"
        onClick={handleCollapse}
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <IconLayoutSidebarLeftCollapse
          class={`h-6 w-6 transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
