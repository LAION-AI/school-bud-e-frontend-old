import translations from "./sidebar.translations.json" with { type: "json" };

interface SidebarHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  translations: typeof translations[keyof typeof translations];
}

export default function SidebarHeader({ translations }: SidebarHeaderProps) {
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
