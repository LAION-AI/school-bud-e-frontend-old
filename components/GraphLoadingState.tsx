import type { JSX } from "preact";
import { IconCheck, IconLoader } from "@tabler/icons-preact";

interface GraphLoadingStateProps {
  isLoading: boolean;
  isComplete: boolean;
  type: "graph" | "webresult" | "game";
}

export function GraphLoadingState(
  { isLoading, isComplete, type }: GraphLoadingStateProps,
): JSX.Element {
  let subject = "";

  switch (type) {
    case "graph":
      subject = "Graph";
      break;
    case "webresult":
      subject = "Web results";
      break;
    case "game":
      subject = "Game";
      break;
  }

  return (
    <div class="flex items-center justify-center p-4 space-x-2 border rounded-md bg-white">
      {isLoading && !isComplete && (
        <>
          <IconLoader class="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent" />
          <span class="text-gray-700">Generating {subject}...</span>
        </>
      )}
      {!isLoading && isComplete && (
        <>
          <IconCheck />
          <span class="text-gray-700">{subject} generated successfully</span>
        </>
      )}
    </div>
  );
}
