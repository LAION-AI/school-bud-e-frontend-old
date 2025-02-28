import { useEffect, useState } from "preact/hooks";
import { Button } from "../../../components/Button.tsx";
import { ArrowRight, PlayCircle, Calendar, FileText, BookOpen, Tag } from "lucide-preact";
import type { LucideProps } from "lucide-preact";
import type { VNode } from "preact";
import type { Test } from "../../../components/tests/store.ts";
import * as graphStore from "../../../components/graph/store.ts";
import type { GraphNode } from "../../../islands/RightSidebar.tsx";

// Create safe wrappers for Lucide icons to work properly in JSX
function SafeArrowRight(props: LucideProps): VNode {
  return <ArrowRight {...props} />;
}

function SafePlayCircle(props: LucideProps): VNode {
  return <PlayCircle {...props} />;
}

function SafeCalendar(props: LucideProps): VNode {
  return <Calendar {...props} />;
}

function SafeFileText(props: LucideProps): VNode {
  return <FileText {...props} />;
}

function SafeBookOpen(props: LucideProps): VNode {
  return <BookOpen {...props} />;
}

function SafeTag(props: LucideProps): VNode {
  return <Tag {...props} />;
}

// Format date to be more compact
function formatDate(date: number | string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

export default function TestsListIsland() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodesMap, setNodesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load all tests
    import("../../../components/tests/store.ts").then((module) => {
      setTests(module.tests.value);
      setLoading(false);
    });

    // Get node names for the test references
    if (graphStore.graphData.value?.items) {
      const nodeMap: Record<string, string> = {};
      for (const node of graphStore.graphData.value.items) {
        // Handle the fact that nodes in the graph store may use the 'item' property as identifier
        const nodeId = (node as GraphNode).item;
        const nodeLabel = (node as GraphNode).item;
        if (nodeId) {
          nodeMap[nodeId] = nodeLabel;
        }
      }
      setNodesMap(nodeMap);
    }
  }, []);

  const handleGoToGraph = () => {
    window.location.href = "/graph";
  };

  const handleStartTest = (testId: string) => {
    window.location.href = `/tests/view/${testId}`;
  };

  if (loading) {
    return <div class="container mx-auto px-6 py-8 max-w-4xl">Loading tests...</div>;
  }

  return (
    <div class="container mx-auto px-6 py-8 max-w-4xl">
      <div class="mb-4">
        <a href="/graph" class="inline-flex items-center text-blue-600 hover:text-blue-800">
          <SafeArrowRight class="w-4 h-4 mr-2 rotate-180" />
          Back to Graph
        </a>
      </div>
      
      <h1 class="text-3xl font-bold mb-6">Your Tests</h1>
      
      {tests.length === 0 ? (
        <div class="my-8">
          <p class="text-lg text-gray-700 mb-6">No tests have been created yet. Select a node in the graph to create a test.</p>
          <Button variant="primary" onClick={handleGoToGraph}>
            Go to Graph
          </Button>
        </div>
      ) : (
        <div class="space-y-3">
          {tests.map(test => (
            <div 
              key={test.id} 
              class="group border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all px-4 py-3 rounded-md flex items-center cursor-pointer"
              onClick={() => handleStartTest(test.id)}
              role="button"
              aria-label={`Take test: ${test.name}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleStartTest(test.id);
                }
              }}
            >
              <div class="flex-1 min-w-0 mr-4">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-lg font-bold text-gray-800 group-hover:text-blue-700">{test.name}</h2>
                  <span class="bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-full">
                    {test.questions.length} q
                  </span>
                </div>
                
                <div class="flex flex-wrap items-center gap-x-4 text-xs text-gray-500 mt-1">
                  <div class="flex items-center" title="Node">
                    <SafeTag class="w-3 h-3 mr-1" />
                    <span class="truncate max-w-[150px]">{nodesMap[test.nodeId] || test.nodeId}</span>
                  </div>
                  
                  <div class="flex items-center" title="Last updated">
                    <SafeCalendar class="w-3 h-3 mr-1" />
                    <span>{test.lastUpdatedAt ? formatDate(test.lastUpdatedAt) : formatDate(test.createdAt)}</span>
                  </div>
                  
                  <div class="flex items-center" title="Question types">
                    <SafeBookOpen class="w-3 h-3 mr-1" />
                    <span>
                      {Array.from(new Set(test.questions.map(q => {
                        switch(q.type) {
                          case 'multiple_choice': return 'MC';
                          case 'true_false': return 'T/F';
                          case 'short_answer': return 'SA';
                          default: return q.type;
                        }
                      }))).join(", ")}
                    </span>
                  </div>
                </div>
              </div>
              
              <div 
                class="flex-shrink-0 flex items-center justify-center opacity-80 group-hover:opacity-100 bg-blue-100 group-hover:bg-blue-600 p-2 rounded-full text-blue-600 group-hover:text-white transition-colors"
                title="Take Test"
                onClick={(e) => {
                  // Prevent the click from triggering twice
                  e.stopPropagation();
                  handleStartTest(test.id);
                }}
              >
                <SafePlayCircle class="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 