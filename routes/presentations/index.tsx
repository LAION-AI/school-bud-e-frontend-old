// @ts-ignore: Preact JSX
import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import PresentationsListIsland from "../../islands/PresentationsListIsland.tsx";

export default function PresentationsPage() {
  return (
    <>
      <Head>
        <title>Presentations | School Bud-E</title>
        <meta name="description" content="Create and manage AI-generated presentations" />
      </Head>
      
      <div class="min-h-screen bg-gray-100 max-h-screen overflow-y-auto">
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            <div class="flex flex-col md:flex-row gap-6">
              {/* Left column - Presentation Generator */}
              <div class="w-full md:w-1/2 bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-4">Create New Presentation</h2>
                <p class="text-gray-600 mb-6">
                  Generate a new PowerPoint presentation using AI. Simply enter a topic and our AI will create a well-structured presentation with multiple slides.
                </p>
                <a 
                  href="/presentations/generator" 
                  class="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Create Presentation
                </a>
              </div>
              
              {/* Right column - Presentations List */}
              <div class="w-full md:w-1/2 bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-4">Your Presentations</h2>
                <PresentationsListIsland />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 