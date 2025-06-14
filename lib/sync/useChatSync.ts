import { useEffect, useRef, useCallback } from 'preact/hooks';
import { chats } from '../../components/chat/store.ts';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

// Global singleton to prevent multiple connections to the same room
const globalSyncManagers = new Map<string, ChatSyncManager>();

interface ChatSyncConfig {
  roomName: string;
  userName: string;
  password: string;
  enabled: boolean;
}

interface ChatSyncState {
  connected: boolean;
  peers: number;
  syncing: boolean;
  error: string | null;
}

// Simple chat sync manager for main thread
class ChatSyncManager {
  doc: Y.Doc;
  chatData: Y.Map<any>;
  provider: WebrtcProvider;
  persistence: IndexeddbPersistence;
  userId: string;
  config: ChatSyncConfig;
  refCount: number;
  connected: boolean;
  
  constructor(config: ChatSyncConfig) {
    this.doc = new Y.Doc();
    this.chatData = this.doc.getMap('chats');
    this.userId = crypto.randomUUID();
    this.config = config;
    this.refCount = 1;
    this.connected = false;
    
    // Setup persistence
    this.persistence = new IndexeddbPersistence(`chat-sync-${config.roomName}`, this.doc);
    
    // Setup WebRTC provider
    this.provider = new WebrtcProvider(config.roomName, this.doc, {
      signaling: ['ws://192.168.178.40:1234'],
      password: config.password
    });
    
    // Track connection status
    this.provider.on('synced', (event: any) => {
      this.connected = event.synced || false;
    });
    
    // Set awareness data
    this.provider.awareness.setLocalState({
      name: config.userName,
      userId: this.userId,
      color: this.getRandomColor()
    });
    
    // Sync local chats to YJS
    this.syncLocalChatsToYJS();
    
    // Listen for changes from other peers
    this.chatData.observe(() => {
      this.syncYJSChatsToLocal();
    });
  }
  
  addRef() {
    this.refCount++;
  }
  
  removeRef() {
    this.refCount--;
    return this.refCount;
  }
  
  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  syncLocalChatsToYJS() {
    const localChats = chats.peek();
    for (const [chatKey, messages] of Object.entries(localChats)) {
      if (chatKey.startsWith('bude-chat-')) {
        // Only sync if this chat has been modified locally and isn't already in YJS
        const existingYJSChat = this.chatData.get(chatKey);
        if (!existingYJSChat || JSON.stringify(existingYJSChat) !== JSON.stringify(messages)) {
          this.chatData.set(chatKey, {
            messages,
            lastModified: Date.now(),
            modifiedBy: this.userId
          });
        }
      }
    }
  }
  
  syncYJSChatsToLocal() {
    const yjsChats = Object.fromEntries(this.chatData.entries());
    const localChats = chats.peek();
    let hasChanges = false;
    
    for (const [chatKey, chatData] of Object.entries(yjsChats)) {
      if (chatKey.startsWith('bude-chat-') && chatData && typeof chatData === 'object') {
        const yjsMessages = chatData.messages;
        const localMessages = localChats[chatKey];
        
        // Only update if the YJS version is different and newer
        if (yjsMessages && 
            (JSON.stringify(yjsMessages) !== JSON.stringify(localMessages))) {
          localChats[chatKey] = yjsMessages;
          hasChanges = true;
        }
      }
    }
    
    if (hasChanges) {
      chats.value = { ...localChats };
    }
  }
  
  getPeerCount(): number {
    return this.provider.awareness?.getStates()?.size || 0;
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  destroy() {
    this.provider?.disconnect();
    this.provider?.destroy();
    this.persistence?.destroy();
    this.doc.destroy();
  }
}

export function useChatSync() {
  const syncManagerRef = useRef<ChatSyncManager | null>(null);
  const configRef = useRef<ChatSyncConfig | null>(null);
  
  const getSyncConfig = useCallback((): ChatSyncConfig => {
    return {
      roomName: localStorage.getItem("bud-e-sync-room") || "school-bud-e-default",
      userName: localStorage.getItem("bud-e-sync-user") || "Student",
      password: localStorage.getItem("bud-e-sync-password") || "secure123",
      enabled: localStorage.getItem("bud-e-sync-enabled") === "true",
    };
  }, []);
  
  const initializeSync = useCallback(() => {
    const config = getSyncConfig();
    
    if (!config.enabled) {
      // Clean up local reference but don't destroy shared instance
      if (syncManagerRef.current) {
        const remaining = syncManagerRef.current.removeRef();
        if (remaining === 0) {
          // No more references, safe to destroy
          syncManagerRef.current.destroy();
          globalSyncManagers.delete(getRoomKey(syncManagerRef.current.config));
        }
        syncManagerRef.current = null;
      }
      return;
    }
    
    const roomKey = getRoomKey(config);
    
    // Check if we already have a manager for this room
    let existingManager = globalSyncManagers.get(roomKey);
    
    if (existingManager) {
      // Reuse existing manager
      existingManager.addRef();
      syncManagerRef.current = existingManager;
      configRef.current = config;
      console.log('Reusing existing chat sync for room:', config.roomName);
    } else {
      // Create new manager
      console.log('Initializing new chat sync...', config);
      const newManager = new ChatSyncManager(config);
      globalSyncManagers.set(roomKey, newManager);
      syncManagerRef.current = newManager;
      configRef.current = config;
    }
  }, [getSyncConfig]);
  
  const getRoomKey = (config: ChatSyncConfig): string => {
    return `${config.roomName}-${config.password}`;
  };
  
  const getSyncState = useCallback((): ChatSyncState => {
    if (!syncManagerRef.current) {
      return {
        connected: false,
        peers: 0,
        syncing: false,
        error: null
      };
    }
    
    return {
      connected: syncManagerRef.current.isConnected(),
      peers: syncManagerRef.current.getPeerCount(),
      syncing: getSyncConfig().enabled,
      error: null
    };
  }, [getSyncConfig]);
  
  const forceSync = useCallback(() => {
    if (syncManagerRef.current) {
      syncManagerRef.current.syncLocalChatsToYJS();
    }
  }, []);
  
  // Initialize and cleanup
  useEffect(() => {
    initializeSync();
    
    // Listen for storage changes (settings updates)
    const handleStorageChange = () => {
      initializeSync();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (syncManagerRef.current) {
        const remaining = syncManagerRef.current.removeRef();
        if (remaining === 0) {
          // No more references, safe to destroy
          syncManagerRef.current.destroy();
          globalSyncManagers.delete(getRoomKey(syncManagerRef.current.config));
        }
        syncManagerRef.current = null;
      }
    };
  }, [initializeSync]);
  
  // Sync when chats change
  useEffect(() => {
    if (syncManagerRef.current && getSyncConfig().enabled) {
      syncManagerRef.current.syncLocalChatsToYJS();
    }
  }, [chats.value, getSyncConfig]);
  
  return {
    initializeSync,
    getSyncState,
    forceSync,
    isEnabled: () => getSyncConfig().enabled
  };
} 