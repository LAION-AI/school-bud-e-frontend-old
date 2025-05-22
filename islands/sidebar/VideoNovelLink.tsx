import { useState } from "preact/hooks";
import { IconList, IconVideo } from "@tabler/icons-preact";
import CollapsibleSection from "./CollapsibleSection.tsx";

export default function VideoNovelLink(
  { isCollapsed }: { isCollapsed: boolean },
) {
  const [expanded, setExpanded] = useState(() => {
    const path = globalThis.location?.pathname;
    return path?.startsWith("/graph");
  });
  const [currentPath, setCurrentPath] = useState("");

  return (
    <CollapsibleSection
      icon={<IconVideo class={`${isCollapsed ? "" : "mr-2"}`} />}
      title="Video Novel"
      isCollapsed={isCollapsed}
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      baseRoute="/video-novel"
      onRouteMatch={(match) => setCurrentPath(match?.[0] || "")}
    >
      <a
        href="/video-novel"
        class={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-amber-500 ${
          currentPath === "/graph/list"
            ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <IconList
          size={16}
          class={currentPath === "/graph/list"
            ? "text-amber-800"
            : "text-gray-600"}
        />
        <span>All Novels</span>
      </a>
    </CollapsibleSection>
  );
}
