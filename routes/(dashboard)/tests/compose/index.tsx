import { type PageProps } from "fresh";
import TestComposerIsland from "../(_islands)/TestComposerIsland.tsx";

export default function CreateTest({ url }: PageProps) {
  // Extract nodeId from URL query params if present
  const nodeId = url.searchParams.get("nodeId") || undefined;
  const language = url.searchParams.get("language") || undefined;
  return (
    <>
      <head>
        <title>Create Test | School Bud-E</title>
      </head>
      <TestComposerIsland nodeId={nodeId} />
    </>
  );
}
