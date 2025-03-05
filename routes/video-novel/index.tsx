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
      <VideoNovelIsland lang={lang} />
    </div>
    </>
  );
}
