/// <reference lib="dom" />

const DB_NAME = "bud-e-chats";
const DB_VERSION = 1;
const CHAT_STORE = "chats";

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
      
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        db.createObjectStore(CHAT_STORE, { keyPath: "id" });
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
  if (db) return Promise.resolve(db);
  return initDB();
}

// Get all chats from IndexedDB
export async function getAllChats(): Promise<{ [key: string]: Message[] }> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHAT_STORE], "readonly");
    const store = transaction.objectStore(CHAT_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const chats: { [key: string]: Message[] } = {};
      for (const item of request.result) {
        chats[item.id] = item.messages;
      }
      resolve(chats);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Save a chat to IndexedDB
export async function saveChat(chatId: string, messages: Message[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHAT_STORE], "readwrite");
    const store = transaction.objectStore(CHAT_STORE);
    
    const request = store.put({
      id: chatId,
      messages: messages,
      updatedAt: Date.now()
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Delete a chat from IndexedDB
export async function deleteChat(chatId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHAT_STORE], "readwrite");
    const store = transaction.objectStore(CHAT_STORE);
    
    const request = store.delete(chatId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Delete all chats from IndexedDB
export async function deleteAllChats(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHAT_STORE], "readwrite");
    const store = transaction.objectStore(CHAT_STORE);
    
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Export chat data as JSON
export function exportChats(chats: { [key: string]: Message[] }): string {
  return JSON.stringify(chats);
}

// Import chat data from JSON
export async function importChats(json: string): Promise<{ [key: string]: Message[] }> {
  try {
    const importedChats = JSON.parse(json);
    const db = await getDB();
    
    // Clear existing chats
    const clearTransaction = db.transaction([CHAT_STORE], "readwrite");
    const clearStore = clearTransaction.objectStore(CHAT_STORE);
    await new Promise<void>((resolve, reject) => {
      const clearRequest = clearStore.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Add imported chats
    const transaction = db.transaction([CHAT_STORE], "readwrite");
    const store = transaction.objectStore(CHAT_STORE);
    
    const promises = Object.entries(importedChats).map(([chatId, messages]) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put({
          id: chatId,
          messages,
          updatedAt: Date.now()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
    
    await Promise.all(promises);
    return importedChats;
  } catch (error) {
    console.error("Error importing chats:", error);
    throw error;
  }
} 