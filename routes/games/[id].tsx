import { Handlers, PageProps } from "$fresh/server.ts";
import type { Game, SavedGame } from "../../types/formats.ts";
import GamePageIsland from "../../islands/GamePage.tsx";
import KvStorage from "../api/(_utils)/kv_storage.ts";

interface Data {
  game: Game | null;
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const id = ctx.params.id;
    try {
      const game = await fetchGame(id);
      return ctx.render({ game });
    } catch (err) {
      return ctx.render({ game: null });
    }
  },
};

async function fetchGame(id: string): Promise<Game> {
  const kvStorage = new KvStorage();
  const savedGames = await kvStorage.read();
  const game = savedGames?.games.find((g: SavedGame) => g.id === id);
  if (!game) {
    throw new Error("Game not found");
  }
  return {
    id: game.id,
    title: game.name,
    description: game.code,
    createdAt: game.timestamp,
    updatedAt: game.timestamp,
  };
}

export default function GameRoute(props: PageProps<Data>) {
  const { game } = props.data;
  
  if (!game) {
    return <div>Game not found</div>;
  }

  return <GamePageIsland game={game} />;
}
