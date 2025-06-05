import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { v4 as uuidv4 } from 'uuid';

export interface SyncConfig {
  roomName: string;
  signaling?: string[];
  password?: string;
  userName?: string;
  userColor?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  chunks?: string[];
  hash?: string;
  created: number;
  modified: number;
  author: string;
  localPath?: string;
}

export interface SyncEvents {
  onSynced?: (synced: boolean) => void;
  onPeersChanged?: (peers: Map<number, any>) => void;
  onDataChanged?: (changes: Map<string, any>) => void;
  onAwarenessChanged?: (states: any[]) => void;
  onError?: (error: Error) => void;
}

export class SyncManager {
  private doc: Y.Doc;
  private provider: WebrtcProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private metadata: Y.Map<FileMetadata>;
  private sharedData: Y.Map<any>;
  private awareness: any;
  private events: SyncEvents;
  private userId: string;

  constructor(config: SyncConfig, events: SyncEvents = {}) {
    this.userId = uuidv4();
    this.events = events;
    
    // Initialize Y.js document
    this.doc = new Y.Doc();
    
    // Create shared data structures
    this.metadata = this.doc.getMap('metadata');
    this.sharedData = this.doc.getMap('sharedData');
    
    // Setup local persistence
    this.setupPersistence(config.roomName);
    
    // Setup P2P provider
    this.setupProvider(config);
  }

  private setupPersistence(roomName: string) {
    try {
      this.persistence = new IndexeddbPersistence(roomName, this.doc);
      
      this.persistence.on('synced', () => {
        console.log('Local persistence synced');
      });
    } catch (error) {
      console.error('Failed to setup persistence:', error);
      this.events.onError?.(error as Error);
    }
  }

  private setupProvider(config: SyncConfig) {
    try {
      const signalingServers = config.signaling || [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ];

      this.provider = new WebrtcProvider(config.roomName, this.doc, {
        signaling: signalingServers,
        password: config.password,
        awareness: {
          name: config.userName || 'Anonymous',
          color: config.userColor || this.getRandomColor(),
          userId: this.userId
        },
        maxConns: 20,
        filterBcConns: true,
        peerOpts: {} // WebRTC peer options
      });

      this.awareness = this.provider.awareness;
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to setup provider:', error);
      this.events.onError?.(error as Error);
    }
  }

  private setupEventListeners() {
    if (!this.provider) return;

    // Sync status changes
    this.provider.on('synced', (synced: { synced: boolean }) => {
      console.log('Sync status:', synced.synced ? 'synced' : 'syncing');
      this.events.onSynced?.(synced.synced);
    });

    // Peer changes
    this.provider.on('peers', (change: { added: number[], removed: number[], webrtcPeers: Map<number, any>, bcPeers: Map<number, any> }) => {
      console.log('Peers changed:', {
        added: change.added,
        removed: change.removed,
        total: change.webrtcPeers.size
      });
      this.events.onPeersChanged?.(change.webrtcPeers);
    });

    // Metadata changes
    this.metadata.observe((event) => {
      const changes = new Map();
      event.changes.keys.forEach((change, key) => {
        changes.set(key, this.metadata.get(key));
      });
      this.events.onDataChanged?.(changes);
    });

    // Shared data changes
    this.sharedData.observe((event) => {
      const changes = new Map();
      event.changes.keys.forEach((change, key) => {
        changes.set(key, this.sharedData.get(key));
      });
      this.events.onDataChanged?.(changes);
    });

    // Awareness updates (user presence)
    this.awareness.on('change', () => {
      const states = Array.from(this.awareness.getStates().values());
      this.events.onAwarenessChanged?.(states);
    });

    // Error handling
    this.provider.on('error', (error: Error) => {
      console.error('Provider error:', error);
      this.events.onError?.(error);
    });
  }

  // File metadata operations
  addFileMetadata(file: FileMetadata) {
    file.author = this.userId;
    file.created = file.created || Date.now();
    file.modified = Date.now();
    this.metadata.set(file.id, file);
  }

  updateFileMetadata(fileId: string, updates: Partial<FileMetadata>) {
    const existing = this.metadata.get(fileId);
    if (existing) {
      this.metadata.set(fileId, {
        ...existing,
        ...updates,
        modified: Date.now()
      });
    }
  }

  getFileMetadata(fileId: string): FileMetadata | undefined {
    return this.metadata.get(fileId);
  }

  getAllFileMetadata(): FileMetadata[] {
    return Array.from(this.metadata.values());
  }

  deleteFileMetadata(fileId: string) {
    this.metadata.delete(fileId);
  }

  // Shared data operations
  setData(key: string, value: any) {
    this.sharedData.set(key, value);
  }

  getData(key: string): any {
    return this.sharedData.get(key);
  }

  getAllData(): Record<string, any> {
    return Object.fromEntries(this.sharedData.entries());
  }

  deleteData(key: string) {
    this.sharedData.delete(key);
  }

  // User awareness operations
  updateUserInfo(info: Partial<{ name: string; color: string; status: string; cursor?: any }>) {
    this.awareness.setLocalStateField('user', {
      ...this.awareness.getLocalState()?.user,
      ...info,
      userId: this.userId,
      lastActive: Date.now()
    });
  }

  getConnectedUsers() {
    return Array.from(this.awareness.getStates().entries()).map(([clientId, state]) => ({
      clientId,
      ...state.user
    }));
  }

  // Utility methods
  getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#FF6B9D', '#C44569', '#2C3E50', '#3498DB', '#E74C3C'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getRoomName(): string {
    return this.provider?.roomName || '';
  }

  getUserId(): string {
    return this.userId;
  }

  isConnected(): boolean {
    return this.provider?.connected || false;
  }

  getPeerCount(): number {
    return this.provider?.room?.peers?.size || 0;
  }

  // Cleanup
  destroy() {
    this.provider?.disconnect();
    this.provider?.destroy();
    this.persistence?.destroy();
    this.doc.destroy();
  }

  // Export/Import for backup
  async exportState(): Promise<Uint8Array> {
    return Y.encodeStateAsUpdate(this.doc);
  }

  async importState(state: Uint8Array) {
    Y.applyUpdate(this.doc, state);
  }

  // Get document for advanced operations
  getYDoc(): Y.Doc {
    return this.doc;
  }
}