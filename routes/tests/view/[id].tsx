import { type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import TestViewIsland from "../(_islands)/TestViewIsland.tsx";

export default function TestView({ params }: PageProps) {
  return (
    <>
      <Head>
        <title>Test View | School Bud-E</title>
      </Head>
      <TestViewIsland testId={params.id} />
    </>
  );
} 