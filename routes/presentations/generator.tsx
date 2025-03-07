// @ts-ignore: Preact JSX
import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import PresentationGeneratorIsland from "../../islands/PresentationGeneratorIsland.tsx";

export default function PresentationGeneratorPage() {
  return (
    <>
      <Head>
        <title>Presentation Generator | School Bud-E</title>
        <meta name="description" content="Generate PowerPoint presentations with AI" />
      </Head>
      
      <div class="min-h-screen bg-gray-100 max-h-screen overflow-y-auto">
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            <div class="bg-white rounded-lg shadow-lg p-6">
              <PresentationGeneratorIsland />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
