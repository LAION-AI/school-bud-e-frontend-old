import { Redis } from "npm:ioredis";
import type { SavedGamesData } from "../../../types/formats.ts";

class KvStorage {
  private redisClient: Redis | null = null;

  init() {
    console.log("[KV] Initializing Redis client...");
    this.redisClient = new Redis({
      host: "keydb",
      port: 6379,
      password: 'mypassword',
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    // Add error handler
    this.redisClient.on('error', (err) => {
      console.error("[KV] Redis Client Error:", err);
    });

    this.redisClient.on('connect', () => {
      console.log("[KV] Redis client connected successfully");
    });

    // Initialize with default games if Redis is empty
    this.initializeDefaultGames().catch(console.error);
  }

  private async initializeDefaultGames() {
    try {
      console.log("[KV] Checking for existing games...");
      // Check if we already have games in Redis
      const existingGames = await this.read();
      if (!existingGames || existingGames.games.length === 0) {
        console.log("[KV] No existing games found, loading defaults...");
        // Load default games from static JSON
        const defaultGames = JSON.parse(
          await Deno.readTextFile("./static/saved-games.json")
        ) as SavedGamesData;
        
        console.log("[KV] Loaded default games:", defaultGames);
        // Write default games to Redis
        await this.write(defaultGames);
        console.log('[KV] Initialized Redis with default games');
      } else {
        console.log("[KV] Found existing games:", existingGames.games.length);
      }
    } catch (error) {
      console.error('[KV] Error initializing default games:', error);
    }
  }

  private async getClient(): Promise<Redis> {
    if (!this.redisClient) {
      console.log("[KV] No Redis client, initializing...");
      await this.init();
    }
    return this.redisClient as Redis;
  }

  async get(key: string): Promise<SavedGamesData | undefined> {
    const client = await this.getClient();
    try {
      const result = await client.get(key);
      const parsed = result ? JSON.parse(result) : undefined;
      return parsed;
    } catch (error) {
      console.error(`[KV] Error getting key ${key} from Redis:`, error);
      return undefined;
    }
  }

  async set(key: string, value: SavedGamesData): Promise<void> {
    const client = await this.getClient();
    try {
      console.log("[KV] Setting key:", key);
      console.log("[KV] Value to set:", value);
      await client.set(key, JSON.stringify(value));
      console.log("[KV] Successfully set value");
    } catch (error) {
      console.error(`[KV] Error setting key ${key} in Redis:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.del(key);
    } catch (error) {
      console.error(`[KV] Error deleting key ${key} from Redis:`, error);
    }
  }

  async read(): Promise<SavedGamesData | null> {
    const data = await this.get("savedGames");
    // If no data exists yet, return empty games array
    return data || { games: [] };
  }

  async write(data: SavedGamesData): Promise<void> {
    console.log("[KV] Writing saved games:", data);
    await this.set("savedGames", data);
  }
}

export default KvStorage;
