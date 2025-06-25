import { Button } from "../../../components/Button.tsx";
// @ts-ignore: Preact JSX
import PresentationsListIsland from "../../../islands/PresentationsListIsland.tsx";

export default function PresentationsPage() {
  return (
    <>
      <head>
        <title>Presentations | School Bud-E</title>
        <meta
          name="description"
          content="Create and manage AI-generated presentations"
        />
      </head>

      <div class="min-h-screen bg-white max-h-screen overflow-y-auto">
        <div class="container mx-auto px-6 py-8 max-w-4xl">
          <h1 class="text-3xl font-bold mb-6">Your Presentations</h1>
          <PresentationsListIsland />
        </div>
      </div>
    </>
  );
}
