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
      
      <div class="min-h-screen bg-gray-100">
        <header class="bg-white shadow">
          <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center">
              <h1 class="text-3xl font-bold text-gray-900">Presentation Generator</h1>
              <a 
                href="/presentations" 
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Presentations
              </a>
            </div>
          </div>
        </header>
        
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
