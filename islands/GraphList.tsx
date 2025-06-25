import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { graphs } from "../components/graph/store.ts";

export default function GraphList() {
  const isClient = useSignal(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    isClient.value = true;

    // Simulate a short loading time to show the loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [isClient]);

  // Loading skeleton UI during SSR or initial client load
  if (!isClient.value || isLoading) {
    return (
      <div class="container mx-auto px-6 max-w-4xl">
        <div class="animate-pulse mb-8">
          <div class="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        </div>

        {[...Array(3)].map((_, index) => (
          <div
            key={`skeleton-${index}`}
            class="animate-pulse border border-gray-100 rounded-md p-4 mb-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div class="flex gap-2 mb-2">
                  <div class="h-4 bg-gray-100 rounded w-16" />
                </div>
                <div class="flex gap-3">
                  <div class="h-3 bg-gray-100 rounded w-20" />
                  <div class="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
              <div class="h-8 w-8 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const graphEntries = Array.from(graphs.value.entries());

  return (
    <div class="container mx-auto px-6 max-w-4xl">
      <h1 class="text-3xl font-bold mb-6">Your Knowledge Graphs</h1>

      {graphEntries.length > 0
        ? (
          <div class="space-y-3">
            {graphEntries.map(([id, graph]) => (
              <a
                key={id}
                href={`/graph/${id}`}
                class="group border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all px-4 py-3 rounded-md flex items-center cursor-pointer w-full text-left"
                aria-label={`View graph: ${graph.name || "Untitled Graph"}`}
              >
                <div class="flex-1 min-w-0 mr-4">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-lg font-bold text-gray-800 group-hover:text-primary-700">
                      {graph.name || "Untitled Graph"}
                    </h2>
                    <span class="bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-full">
                      {graph.items.length}{" "}
                      {graph.items.length === 1 ? "node" : "nodes"}
                    </span>
                  </div>

                  <div class="flex flex-wrap items-center gap-x-4 text-xs text-gray-500 mt-1">
                    <div class="flex items-center" title="Nodes">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-3 h-3 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-labelledby="nodesIconTitle"
                      >
                        <title id="nodesIconTitle">Nodes icon</title>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>{graph.items.length} nodes</span>
                    </div>

                    <div class="flex items-center" title="Connections">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-3 h-3 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-labelledby="connectionsIconTitle"
                      >
                        <title id="connectionsIconTitle">
                          Connections icon
                        </title>
                        <path d="M9 6l6 6l-6 6" />
                      </svg>
                      <span>
                        {graph.items.reduce((count, item) => {
                          if (item.childItems) {
                            return count + item.childItems.length;
                          }
                          return count;
                        }, 0)} connections
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  class="flex-shrink-0 flex items-center justify-center opacity-80 group-hover:opacity-100 bg-primary-100 group-hover:bg-primary-600 p-2 rounded-full text-primary-600 group-hover:text-white transition-colors"
                  title="View Graph"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-labelledby="viewGraphIconTitle"
                  >
                    <title id="viewGraphIconTitle">View graph</title>
                    <path d="M9 6l6 6l-6 6" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )
        : (
          <div class="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-12 h-12 mx-auto text-gray-400 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-labelledby="emptyGraphIconTitle"
            >
              <title id="emptyGraphIconTitle">Empty graph state</title>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <p class="text-lg text-gray-700 mb-2">No graphs found</p>
            <p class="text-gray-500 mb-4">
              Create a new graph to get started with your knowledge base
            </p>
            <a
              href="/graph/new"
              class="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Create New Graph
            </a>
          </div>
        )}
    </div>
  );
}
