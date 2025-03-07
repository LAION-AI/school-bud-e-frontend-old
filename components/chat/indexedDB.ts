/// <reference lib="dom" />

const DB_NAME = "video-novels";
const DB_VERSION = 4;

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("videoNovels")) {
        const novelStore = db.createObjectStore("videoNovels", {
          keyPath: "id",
        });
        novelStore.createIndex("name", "name", { unique: false });
        novelStore.createIndex("createdAt", "createdAt", { unique: false });
        novelStore.createIndex("lastPlayed", "lastPlayed", { unique: false });
      }

      if (!db.objectStoreNames.contains("segments")) {
        const segmentsStore = db.createObjectStore("segments", {
          keyPath: "id",
        });
        segmentsStore.createIndex("novelId", "novelId", { unique: false });
        segmentsStore.createIndex("order", "order", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }

    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create or upgrade images store
      if (!db.objectStoreNames.contains("images")) {
        const imageStore = db.createObjectStore("images", {
          keyPath: "id",
          autoIncrement: true,
        });
        imageStore.createIndex("name", "name", { unique: false });
      }

      // Create or upgrade videoNovels store
      if (!db.objectStoreNames.contains("videoNovels")) {
        const novelStore = db.createObjectStore("videoNovels", {
          keyPath: "id",
          autoIncrement: true,
        });
        novelStore.createIndex("title", "title", { unique: false });
        novelStore.createIndex("createdAt", "createdAt", { unique: false });
        novelStore.createIndex("lastPlayed", "lastPlayed", { unique: false });
      }

      // Add segments store for audio ordering
      if (!db.objectStoreNames.contains("segments")) {
        const segmentsStore = db.createObjectStore("segments", {
          keyPath: "id",
          autoIncrement: true,
        });
        segmentsStore.createIndex("novelId", "novelId", { unique: false });
        segmentsStore.createIndex("order", "order", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error(
        "IndexedDB error:",
        (event.target as IDBOpenDBRequest).error,
      );
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export function saveImageToDB(imageFile: File, imageName: string) {
  getDB().then((db) => {
    const transaction = db.transaction("images", "readwrite");
    const store = transaction.objectStore("images");

    // Create an entry with metadata
    const imageEntry = {
      name: imageName,
      blob: imageFile, // the image file is stored as a Blob
      timestamp: Date.now(),
    };

    const addRequest = store.add(imageEntry);
    addRequest.onsuccess = () => {
      console.log("Image saved successfully!");
    };
    addRequest.onerror = () => {
      console.error("Error saving image:", addRequest.error);
    };
  }).catch((error) => {
    console.error("Error accessing database:", error);
  });
}

function loadImagesFromDB() {
  getDB().then((db) => {
    const transaction = db.transaction("images", "readonly");
    const store = transaction.objectStore("images");

    const images: {
      id: number;
      name: string;
      blob: Blob;
      timestamp: number;
    }[] = [];
    const cursorRequest = store.openCursor();

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        images.push(cursor.value);
        cursor.continue();
      } else {
        // All images retrieved – now create preview URLs
        for (const img of images) {
          const previewURL = URL.createObjectURL(img.blob);
          // You can now update your state to include this preview URL along with other data
          console.log(`Image ${img.name} loaded with preview URL:`, previewURL);
        }
      }
    };
  });
}

export function deleteImageFromDB(id: number) {
  const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
  dbRequest.onsuccess = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    const transaction = db.transaction("images", "readwrite");
    const store = transaction.objectStore("images");

    const deleteRequest = store.delete(id);
    deleteRequest.onsuccess = () => {
      console.log("Image deleted successfully!");
    };
    deleteRequest.onerror = () => {
      console.error("Error deleting image:", deleteRequest.error);
    };
  };
}

// Video Novel Types and CRUD Operations
export interface Segment {
  id: string;
  novelId: string;
  order: number;
  text: string;
  audioBlob?: Blob;
  timestamp: number;
}

export interface ImageSegment {
  order: number;
  url: string;
  timestamp: number;
  duration: number; // Duration in seconds for this image
  associatedSegmentId?: string; // Link to specific audio segment
}

export interface VideoNovel {
  id: string;
  name: string;
  images: ImageSegment[];
  audioBlob?: Blob;
  segments: Segment[];
  createdAt?: number;
  lastPlayed?: number;
}

export function saveVideoNovel(novel: VideoNovel): Promise<string> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
    dbRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(
        ["videoNovels", "segments"],
        "readwrite",
      );
      const novelStore = transaction.objectStore("videoNovels");
      const segmentsStore = transaction.objectStore("segments");

      const novelEntry = {
        ...novel,
        createdAt: Date.now(),
      };

      const addRequest = novelStore.add(novelEntry);

      addRequest.onsuccess = () => {
        // Save segments
        const segmentPromises = novel.segments.map((segment) => {
          return new Promise<void>((resolve, reject) => {
            const segmentEntry = {
              ...segment,
              novelId: novel.id,
            };
            const segmentRequest = segmentsStore.add(segmentEntry);
            segmentRequest.onsuccess = () => resolve();
            segmentRequest.onerror = () => reject(segmentRequest.error);
          });
        });

        Promise.all(segmentPromises)
          .then(() => resolve(novel.id))
          .catch(reject);
      };

      addRequest.onerror = () => {
        reject(addRequest.error);
      };
    };
    dbRequest.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export function saveVideoNovelSegment(segment: Segment): Promise<string> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
    dbRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("segments", "readwrite");
      const store = transaction.objectStore("segments");

      const addRequest = store.add(segment);
      addRequest.onsuccess = () => resolve(segment.id);
      addRequest.onerror = () => reject(addRequest.error);
    };
    dbRequest.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export function getVideoNovelSegments(novelId: string): Promise<Segment[]> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
    dbRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("segments", "readonly");
      const store = transaction.objectStore("segments");
      const index = store.index("novelId");

      const segments: Segment[] = [];
      const cursorRequest = index.openCursor(IDBKeyRange.only(novelId));

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          segments.push(cursor.value);
          cursor.continue();
        } else {
          // Sort segments by order before returning
          resolve(segments.sort((a, b) => a.order - b.order));
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    };
    dbRequest.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export function getVideoNovel(id: string): Promise<VideoNovel> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
    dbRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("videoNovels", "readonly");
      const store = transaction.objectStore("videoNovels");

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else {
          reject(new Error("Video novel not found"));
        }
      };
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    };
    dbRequest.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export function getAllVideoNovels(): Promise<VideoNovel[]> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
    dbRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("videoNovels", "readonly");
      const store = transaction.objectStore("videoNovels");

      const novels: VideoNovel[] = [];
      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          novels.push(cursor.value);
          cursor.continue();
        } else {
          resolve(novels);
        }
      };
      cursorRequest.onerror = () => {
        reject(cursorRequest.error);
      };
    };
    dbRequest.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export function updateVideoNovel(
  id: string,
  updates: Partial<VideoNovel>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
    dbRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("videoNovels", "readwrite");
      const store = transaction.objectStore("videoNovels");

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          reject(new Error("Video novel not found"));
          return;
        }

        const updatedNovel = {
          ...getRequest.result,
          ...updates,
          lastPlayed: Date.now(),
        };

        const putRequest = store.put(updatedNovel);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
    dbRequest.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export function deleteVideoNovel(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);
    dbRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("videoNovels", "readwrite");
      const store = transaction.objectStore("videoNovels");

      const deleteRequest = store.delete(id);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    dbRequest.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}
