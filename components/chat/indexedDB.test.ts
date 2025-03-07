import { 
  getAllVideoNovels,
  saveVideoNovel,
  deleteVideoNovel,
  initDB
} from "./indexedDB.ts";
import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";

// Skip IndexedDB tests when not in a browser environment
Deno.test({
  name: "IndexedDB operations",
  ignore: typeof window === "undefined" || !("indexedDB" in window),
  async fn(t) {
    await t.step("should initialize database with videoNovels store", async () => {
      const db = await initDB();
      assertEquals(typeof db.objectStoreNames.contains, "function");
      assertEquals(db.objectStoreNames.contains("videoNovels"), true);
    });

    await t.step("should save and retrieve a video novel", async () => {
      const novel = {
        id: "test-id",
        name: "Test Novel",
        images: [],
        audioSrc: "test.mp3",
        segments: []
      };

      await saveVideoNovel(novel);
      const novels = await getAllVideoNovels();
      
      assertEquals(novels.length, 1);
      assertEquals(novels[0], novel);
    });

    await t.step("should delete a video novel", async () => {
      const novel = {
        id: "test-id",
        name: "Test Novel",
        images: [],
        audioSrc: "test.mp3",
        segments: []
      };

      await saveVideoNovel(novel);
      await deleteVideoNovel(novel.id);
      const novels = await getAllVideoNovels();
      
      assertEquals(novels.length, 0);
    });
  }
});
