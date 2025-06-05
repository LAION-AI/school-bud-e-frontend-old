// @ts-ignore: Preact JSX
import { page, PageProps } from "fresh";
import PresentationPreviewIsland from "../../../islands/PresentationPreviewIsland.tsx";
import { define } from "../../../utils.ts";

interface Data {
  id: string;
}

export const handler = define.handlers<Data>({
  GET(ctx) {
    const req = ctx.req;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Presentation ID is required", { status: 400 });
    }

    return page({ id });
  },
});

export default function PresentationPreviewPage({ data }: PageProps<Data>) {
  const { id } = data;

  return (
      <>
        <head>
          <title>Presentation Preview | School Bud-E</title>
          <meta
            name="description"
            content="Preview your AI-generated presentation"
          />
        </head>

        <div class="min-h-screen bg-gray-100 max-h-screen overflow-y-auto">
          <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <div class="flex justify-between items-center">
                <h1 class="text-3xl font-bold text-gray-900">
                  Presentation Preview
                </h1>
                <a
                  href="/presentations"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Generator
                </a>
              </div>
            </div>
          </header>

          <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div class="px-4 py-6 sm:px-0">
              <div class="bg-white rounded-lg shadow-lg p-6">
                <PresentationPreviewIsland id={id} />
              </div>
            </div>
          </main>
        </div>
    </>
  );
}
