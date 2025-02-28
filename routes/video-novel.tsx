import VideoNovelIsland from "../islands/VideoNovelIsland.tsx";

export default function VideoNovel(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") as string !== undefined &&
    url.searchParams.get("lang") !== null
    ? url.searchParams.get("lang")
    : "de";

  return (
    <>
      <div class="flex h-screen overflow-hidden">
        {/* Main Chat Area */}
        <div class="flex-1 h-screen flex flex-col overflow-hidden">
          {/* <Header lang={lang as string} /> */}
          <div
            class="flex-1 h-screen overflow-auto"
            style={{
              backgroundImage: "url('/lines.svg')",
              backgroundPosition: "center",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
            }}
          >
            <VideoNovelIsland lang={lang as string} />
          </div>
        </div>
      </div>
    </>
  );
}
