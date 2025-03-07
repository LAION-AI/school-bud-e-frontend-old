import { Redis } from "npm:ioredis";
import type { SavedGamesData } from "../types/formats.ts";

async function importGames() {
  const redis = new Redis({
    host: "localhost",
    port: 6379,
    password: 'mypassword',
  });

  try {
    console.log("Reading default games from static file...");
    const defaultGames = JSON.parse(
      await Deno.readTextFile("./static/saved-games.json")
    ) as SavedGamesData;

    console.log(`Found ${defaultGames.games.length} games to import`);

    // Store the games in Redis
    await redis.set("savedGames", JSON.stringify(defaultGames));
    console.log("Successfully imported games into Redis");

  } catch (error) {
    console.error("Error importing games:", error);
  } finally {
    await redis.quit();
  }
}

// Run the import
if (import.meta.main) {
  await importGames();
} 