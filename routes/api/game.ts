import type { Handlers } from "$fresh/server.ts";
import KvStorage from "./(_utils)/kv_storage.ts";
import type { SavedGame, SavedGamesData } from "../../types/formats.ts";

interface GameData {
  code: string;
  name?: string;
  points?: number;
}

const kvStorage = new KvStorage();

export const handler: Handlers = {
  async PUT(req: Request) {
    try {
      const payload = await req.json();
      if (!payload.id) {
        return new Response(JSON.stringify({
          success: false,
          error: "Game ID is required"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const savedGames = await kvStorage.read();
      if (!savedGames) {
        return new Response(JSON.stringify({
          success: false,
          error: "Could not read saved games file"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const gameIndex = savedGames.games.findIndex(game => game.id === payload.id);
      if (gameIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: "Game not found"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Update code if provided
      if (payload.code) {
        savedGames.games[gameIndex].code = payload.code;
      }

      // Update points if provided
      if (typeof payload.points === 'number') {
        savedGames.games[gameIndex].points += payload.points;
      }
      await kvStorage.write(savedGames);

      return new Response(JSON.stringify({
        success: true,
        game: savedGames.games[gameIndex]
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Error updating game:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
  async POST(req: Request) {
    try {
      const payload = await req.json() as GameData;

      if (!payload.code || !payload.name) {
        return new Response("Invalid game data", { status: 400 });
      }

      const savedGames = await kvStorage.read() || { games: [] };

      const newGame: SavedGame = {
        id: crypto.randomUUID(),
        name: payload.name,
        code: payload.code,
        timestamp: new Date().toISOString(),
        points: payload.points || 0
      };

      savedGames.games.push(newGame);
      await kvStorage.write(savedGames);

      return new Response(JSON.stringify({
        success: true,
        game: newGame
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Error creating game file:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
  async GET(_req) {
    console.log("[API] GET /api/game - Starting request");
    try {
      console.log("[API] Reading from KV storage...");
      const savedGames = await kvStorage.read();

      if (!savedGames || !savedGames.games) {
        console.log("[API] No games found or invalid format, returning empty array");
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      console.log("[API] Games array found. Length:", savedGames.games.length);
      
      const response = new Response(JSON.stringify(savedGames.games), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
      
      return response;
    } catch (error) {
      console.error("[API] Error in GET handler:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
  async DELETE(req) {
    try {
      const url = new URL(req.url);
      const gameId = url.searchParams.get("id");
      if (!gameId) {
        return new Response("Invalid game ID", { status: 400 });
      }

      const savedGames = await kvStorage.read();
      if (!savedGames) {
        return new Response(JSON.stringify({ success: false, error: "No games data found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      savedGames.games = savedGames.games.filter(game => game.id !== gameId);
      await kvStorage.write(savedGames);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error deleting game:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
