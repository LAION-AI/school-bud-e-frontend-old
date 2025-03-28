import { useComputed } from "@preact/signals";
import { IconBook, IconList, IconX } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import { deleteGraph, graphs } from "../../components/graph/store.ts";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SidebarLink from "./SidebarLink.tsx";

interface GraphsSectionProps {
  isCollapsed: boolean;
  variant?: "amber" | "blue" | "red" | "purple" | "green";
}

export default function GraphsSection({
  isCollapsed,
  variant = "green",
}: GraphsSectionProps) {
  const [expanded, setExpanded] = useState(() => {
    const path = globalThis.location?.pathname;
    return path?.startsWith("/graph");
  });
  const [currentPath, setCurrentPath] = useState("");

  const lastThreeGraphs = useComputed(() => {
    const value = (Array.from(graphs.value.keys()) as string[])
      .sort((a, b) => b?.length - a?.length)
      .slice(0, 59);
    return value;
  });

  return (
    <CollapsibleSection
      icon={<IconBook />}
      title="Graphs"
      isCollapsed={isCollapsed}
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      baseRoute="/graph"
      routePattern={/^\/graph(\/.*)?$/}
      onRouteMatch={(match) => setCurrentPath(match?.[0] || "")}
      variant={variant}
    >
      <div class="space-y-2">
        <a
          href="/graph/list"
          class={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-${variant}-500 ${
            currentPath === "/graph/list"
              ? `bg-${variant}-100 text-${variant}-900 hover:bg-${variant}-200`
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <IconList
            size={16}
            class={
              currentPath === "/graph/list"
                ? `text-${variant}-800`
                : "text-gray-600"
            }
          />
          <span>All Graphs</span>
        </a>

        {lastThreeGraphs.value.length > 0 && (
          <div class="pt-1">
            <h3 class="text-xs font-medium text-gray-500 px-3 mb-2">
              Recent Graphs
            </h3>
            <div class="space-y-1">
              {lastThreeGraphs.value.map((graphId) => (
                <div key={graphId} class="group flex items-center">
                  <SidebarLink
                    href={`/graph/${graphId}`}
                    isActive={currentPath === `/graph/${graphId}`}
                    className="flex-1 truncate"
                    variant={variant}
                  >
                    {graphs.value.get(graphId)?.name || graphId}
                  </SidebarLink>
                  <button
                    type="button"
                    onClick={() => deleteGraph(graphId)}
                    class="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-600 transition-all duration-200 outline-none rounded focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:opacity-100"
                    aria-label={`Delete graph ${
                      graphs.value.get(graphId)?.name || graphId
                    }`}
                  >
                    <IconX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
