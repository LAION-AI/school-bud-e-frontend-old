import type { PageProps } from "fresh";
import GamesList from "../../../islands/GamesList.tsx";

export default function GamesListPage(_ctx: PageProps) {
  const req = ctx.req;
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") || "de";

  return (
    <div class="flex h-screen overflow-hidden px-4">
      <GamesList lang={lang} />
    </div>
  );
}
