// @ts-ignore: Preact JSX
import PresentationGeneratorIsland from "../../../islands/PresentationGeneratorIsland.tsx";

export default function PresentationGeneratorPage() {
  return (
    <>
      <head>
        <title>Presentation Generator | School Bud-E</title>
        <meta
          name="description"
          content="Generate PowerPoint presentations with AI"
        />
      </head>

      <div class="min-h-screen bg-gray-100 max-h-screen overflow-y-auto">
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <PresentationGeneratorIsland />
        </main>
      </div>
    </>
  );
}
