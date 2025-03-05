import VideoNovelIsland from "./(_islands)/VideoNovelIsland.tsx";
import { Head } from "$fresh/runtime.ts";

export default function VideoNovel(req: Request) {
  const url = new URL(req.url);
  const defaultLang = "de";
  const langParam = url.searchParams.get("lang");
  const lang = langParam !== null ? langParam : defaultLang;
  
  return (
    <>
      <Head>
        <title>Interactive Video Novel</title>
        <meta name="description" content="Explore interactive video novels with AI-generated stories" />
      </Head>
      
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <title>Video icon</title>
                <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1z" />
                <path d="M4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Video Novel Studio</h1>
          </div>
        </div>
      </header>

      <VideoNovelIsland lang={lang} />
    </div>
    </>
  );
}
