import { type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import TestComposerIsland from "../(_islands)/TestComposerIsland.tsx";

export default function CreateTest({ url }: PageProps) {
  // Extract nodeId from URL query params if present
  const nodeId = url.searchParams.get("nodeId") || undefined;
  
  return (
    <>
      <Head>
        <title>Create Test | School Bud-E</title>
      </Head>
      <TestComposerIsland nodeId={nodeId} />
    </>
  );
} 