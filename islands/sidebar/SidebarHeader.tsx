import { IconSquareToggleHorizontal} from "@tabler/icons-preact";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function SidebarHeader({ isCollapsed, setIsCollapsed }: SidebarHeaderProps) {
  return (
    <div class="flex justify-between py-4 relative">
      <img
        src="/logo.png"
        width="48"
        height="48"
        alt="A little lion wearing a graduation cap."
      />
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        class={`p-3 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 ${
          isCollapsed 
            ? "fixed left-10 bg-white shadow-md hover:bg-gray-50" 
            : ""
        }`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <IconSquareToggleHorizontal
          class={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}