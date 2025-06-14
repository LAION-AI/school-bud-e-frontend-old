import type { SavedGamesData } from "../../../types/formats.ts";

class KvStorage {
  private storage: Map<string, SavedGamesData>;

  constructor() {
    this.storage = new Map();
  }

  async init() {
    await this.initializeDefaultGames();
  }

  private async initializeDefaultGames() {
    const exists = await this.get("savedGames");
    if (!exists) {
      await this.set("savedGames", { games: [] });
    }
  }

  async get(key: string): Promise<SavedGamesData | undefined> {
    return this.storage.get(key);
  }

  async set(key: string, value: SavedGamesData): Promise<void> {
    this.storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async read(): Promise<SavedGamesData | null> {
    const data = await this.get("savedGames");
    return data || { games: [] };
  }

  async write(data: SavedGamesData): Promise<void> {
    await this.set("savedGames", data);
  }
}

export default KvStorage;
