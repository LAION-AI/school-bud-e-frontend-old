import { useComputed } from "@preact/signals";
import { Book, List, X } from "lucide-preact";
import { useState } from "preact/hooks";
import { deleteGraph, graphs } from "../../components/graph/store.ts";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SidebarLink from "./SidebarLink.tsx";

export default function GraphsSection() {
  const [expanded, setExpanded] = useState(() => {
    const path = globalThis.location?.pathname;
    return path?.startsWith("/graph");
  });

  const lastThreeGraphs = useComputed(() => {
    const value = (Array.from(graphs.value.keys()) as string[])
      .sort((a, b) => b?.length - a?.length)
      .slice(0, 59);
    return value;
  });

  return (
    <CollapsibleSection
      icon={<Book />}
      title="Graphs"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      routePattern={/^\/graph(\/.*)?$/}
    >
      {(activeRoute) => (
        <div class="space-y-2">
          <SidebarLink
            href="/graph/list"
            isActive={activeRoute === "/graph/list"}
            className="flex items-center group"
          >
            <span className="flex items-center flex-1">
              <List
                size={16}
                class={activeRoute === "/graph/list"
                  ? `text-primary-800`
                  : "text-gray-600"}
              />
              <span class="ml-2">All Graphs</span>
            </span>
          </SidebarLink>

          {lastThreeGraphs.value.length > 0 && (
            <div class="pt-1">
              <h3 class="text-xs font-medium text-gray-500 px-3 mb-2">
                Recent Graphs
              </h3>
              <div class="space-y-1">
                {lastThreeGraphs.value.map((graphId) => (
                  <SidebarLink
                    key={graphId}
                    href={`/graph/${graphId}`}
                    isActive={activeRoute === `/graph/${graphId}`}
                    className="flex items-center group"
                  >
                    <span className="flex-1 truncate">
                      {graphs.value.get(graphId)?.name || graphId}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteGraph(graphId)}
                      class="group-hover:text-gray-400 text-transparent px-2"
                      aria-label={`Delete graph ${
                        graphs.value.get(graphId)?.name || graphId
                      }`}
                    >
                      <X size={24} aria-hidden="true" />
                    </button>
                  </SidebarLink>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
