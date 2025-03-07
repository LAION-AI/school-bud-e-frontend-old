import { Head } from "$fresh/runtime.ts";
import TestsListIsland from "./(_islands)/TestsListIsland.tsx";

export default function TestsListPage() {
  return (
    <>
      <Head>
        <title>Tests | School Bud-E</title>
      </Head>
      <TestsListIsland />
    </>
  );
} 