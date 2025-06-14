import VideoNovelIsland from "./(_islands)/VideoNovelIsland.tsx";
import { FreshContext } from "fresh";

export default function VideoNovel(ctx: FreshContext) {
  const req = ctx.req;
  const url = new URL(req.url);
  const defaultLang = "de";
  const langParam = url.searchParams.get("lang");
  const lang = langParam !== null ? langParam : defaultLang;

  return (
    <>
      <head>
        <title>Interactive Video Novel</title>
        <meta
          name="description"
          content="Explore interactive video novels with AI-generated stories"
        />
      </head>

      <div className="min-h-screen bg-white text-gray-900">
        <VideoNovelIsland lang={lang} />
      </div>
    </>
  );
}
