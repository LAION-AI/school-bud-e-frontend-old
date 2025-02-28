import { type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import TestComposerIsland from "../(_islands)/TestComposerIsland.tsx";

export default function EditTest({ params }: PageProps) {
  return (
    <>
      <Head>
        <title>Edit Test | School Bud-E</title>
      </Head>
      <TestComposerIsland testId={params.id} />
    </>
  );
} 