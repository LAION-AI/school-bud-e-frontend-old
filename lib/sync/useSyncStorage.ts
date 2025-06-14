import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import { HybridFile } from './HybridStorage.ts';
import { StorageProgress } from '../storage/LargeFileStorage.ts';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface SyncStorageConfig {
  roomName: string;
  userName?: string;
  password?: string;
  autoSync?: boolean;
  autoSyncInterval?: number;
  signaling?: string[];
}

export interface SyncStorageState {
  initialized: boolean;
  connected: boolean;
  userId: string | null;
  peers: number;
  files: HybridFile[];
  users: any[];
  storageInfo: any;
  error: string | null;
}

export interface UseSyncStorageResult {
  state: SyncStorageState;
  addFile: (file: File | Blob, metadata?: any) => Promise<string>;
  downloadFile: (fileId: string) => Promise<void>;
  openFile: (fileId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  getFileData: (fileId: string) => Promise<ArrayBuffer>;
  setSharedData: (key: string, value: any) => void;
  getSharedData: (key: string) => any;
  updateUserInfo: (info: { name?: string; color?: string; status?: string }) => void;
  requestPersistentStorage: () => Promise<boolean>;
  isFileViewable: (fileType: string) => boolean;
  destroy: () => void;
}

// Main thread sync manager
class SyncManager {
  doc: Y.Doc;
  metadata: Y.Map<any>;
  sharedData: Y.Map<any>;
  fileData: Y.Map<any>;
  userId: string;
  config: SyncStorageConfig;
  provider: WebrtcProvider;
  persistence: IndexeddbPersistence;
  localFiles: Map<string, ArrayBuffer>;
  
  constructor(config: SyncStorageConfig) {
    this.doc = new Y.Doc();
    this.metadata = this.doc.getMap('metadata');
    this.sharedData = this.doc.getMap('sharedData');
    this.fileData = this.doc.getMap('fileData');
    this.userId = crypto.randomUUID();
    this.config = config;
    this.localFiles = new Map();
    
    // Setup persistence
    this.persistence = new IndexeddbPersistence(config.roomName, this.doc);
    
    // Setup WebRTC provider
    this.provider = new WebrtcProvider(config.roomName, this.doc, {
      signaling: config.signaling || ['ws://192.168.178.40:1234'],
      password: config.password
    });
    
    // Set awareness data
    this.provider.awareness.setLocalState({
      name: config.userName || 'Anonymous',
      color: this.getRandomColor(),
      userId: this.userId
    });
  }
  
  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  async addFileWithData(file: File | Blob, metadata: any) {
    const fileId = metadata.id || crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    
    // Store file data locally
    this.localFiles.set(fileId, arrayBuffer);
    
    // Add metadata
    const fileMetadata = {
      ...metadata,
      id: fileId,
      author: this.userId,
      created: metadata.created || Date.now(),
      modified: Date.now(),
      size: file.size,
      type: file.type || metadata.type
    };
    
    this.metadata.set(fileId, fileMetadata);
    
    // Store file data in YJS for sharing (convert to base64 for JSON serialization)
    const base64Data = this.arrayBufferToBase64(arrayBuffer);
    this.fileData.set(fileId, base64Data);
    
    return fileId;
  }
  
  addFileMetadata(metadata: any) {
    metadata.author = this.userId;
    metadata.created = metadata.created || Date.now();
    metadata.modified = Date.now();
    this.metadata.set(metadata.id, metadata);
  }
  
  getAllFileMetadata() {
    return Array.from(this.metadata.values());
  }
  
  getFileData(fileId: string): ArrayBuffer | null {
    // First check local storage
    if (this.localFiles.has(fileId)) {
      return this.localFiles.get(fileId)!;
    }
    
    // Then check shared YJS data
    const base64Data = this.fileData.get(fileId);
    if (base64Data) {
      const arrayBuffer = this.base64ToArrayBuffer(base64Data);
      this.localFiles.set(fileId, arrayBuffer); // Cache locally
      return arrayBuffer;
    }
    
    return null;
  }
  
  isFileAvailable(fileId: string): boolean {
    return this.localFiles.has(fileId) || this.fileData.has(fileId);
  }
  
  // Utility methods for base64 conversion
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  getConnectedUsers() {
    return Array.from(this.provider.awareness.getStates().entries()).map(([clientId, state]) => ({
      clientId,
      ...state
    }));
  }
  
  setSharedData(key: string, value: any) {
    this.sharedData.set(key, value);
  }
  
  getSharedData(key: string) {
    return this.sharedData.get(key);
  }
  
  destroy() {
    this.provider?.disconnect();
    this.provider?.destroy();
    this.persistence?.destroy();
    this.doc.destroy();
  }
}

export function useSyncStorage(config: SyncStorageConfig): UseSyncStorageResult {
  const syncManagerRef = useRef<SyncManager | null>(null);
  const sharedDataRef = useRef<Map<string, any>>(new Map());
  const [state, setState] = useState<SyncStorageState>({
    initialized: false,
    connected: false,
    userId: null,
    peers: 0,
    files: [],
    users: [],
    storageInfo: {},
    error: null
  });

  // Initialize sync manager
  useEffect(() => {
    try {
      console.log('INIT SYNC MANAGER', config);
      debugger;
      const syncManager = new SyncManager(config);
      syncManagerRef.current = syncManager;

      // Set up event listeners
      syncManager.provider.on('synced', (synced: boolean) => {
        setState(prev => ({
          ...prev,
          connected: synced
        }));
      });

      syncManager.provider.on('peers', (change: any) => {
        setState(prev => ({
          ...prev,
          peers: change.webrtcPeers?.size || 0
        }));
      });

      syncManager.metadata.observe(() => {
        updateStatus();
      });

      // Initial state
      setState(prev => ({
        ...prev,
        initialized: true,
        userId: syncManager.userId,
        error: null
      }));

      // Start auto-sync if enabled
      const updateStatus = () => {
        const files = syncManager.getAllFileMetadata().map(metadata => ({
          metadata,
          locallyAvailable: syncManager.isFileAvailable(metadata.id),
          syncStatus: syncManager.isFileAvailable(metadata.id) ? 'synced' as const : 'pending' as const
        }));
        
        const connectedUsers = syncManager.getConnectedUsers();
        
        setState(prev => ({
          ...prev,
          files,
          users: connectedUsers,
          peers: syncManager.provider.awareness?.getStates()?.size || 0
        }));
      };

      if (config.autoSync) {
        const statusInterval = setInterval(updateStatus, config.autoSyncInterval || 30000);
        return () => {
          clearInterval(statusInterval);
          syncManager.destroy();
          syncManagerRef.current = null;
        };
      }

      // Cleanup
      return () => {
        syncManager.destroy();
        syncManagerRef.current = null;
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  }, [config.roomName]); // Only reinitialize if room changes

  // Add file
  const addFile = useCallback(async (file: File | Blob, metadata: any = {}) => {
    if (!syncManagerRef.current) throw new Error('Sync manager not initialized');
    return await syncManagerRef.current.addFileWithData(file, metadata);
  }, []);

  // Download file
  const downloadFile = useCallback(async (fileId: string) => {
    if (!syncManagerRef.current) throw new Error('Sync manager not initialized');
    
    const fileData = syncManagerRef.current.getFileData(fileId);
    if (!fileData) {
      throw new Error('File not available for download');
    }
    
    // Get file metadata for download
    const metadata = Array.from(syncManagerRef.current.metadata.values()).find(
      (m: any) => m.id === fileId
    );
    
    if (!metadata) {
      throw new Error('File metadata not found');
    }
    
    // Create blob and trigger download
    const blob = new Blob([fileData], { type: metadata.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = metadata.name;
    a.style.display = 'none';
    
    // Prevent Fresh from intercepting this click
    a.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    document.body.appendChild(a);
    
    // Use setTimeout to ensure the click happens after DOM insertion
    setTimeout(() => {
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }, []);

  // Get file data
  const getFileData = useCallback(async (fileId: string): Promise<ArrayBuffer> => {
    if (!syncManagerRef.current) throw new Error('Sync manager not initialized');
    
    const fileData = syncManagerRef.current.getFileData(fileId);
    if (!fileData) {
      throw new Error('File data not available');
    }
    
    return fileData;
  }, []);

  // Open file in new tab/window
  const openFile = useCallback(async (fileId: string) => {
    if (!syncManagerRef.current) throw new Error('Sync manager not initialized');
    
    const fileData = syncManagerRef.current.getFileData(fileId);
    if (!fileData) {
      throw new Error('File not available for opening');
    }
    
    // Get file metadata
    const metadata = Array.from(syncManagerRef.current.metadata.values()).find(
      (m: any) => m.id === fileId
    );
    
    if (!metadata) {
      throw new Error('File metadata not found');
    }
    
    // Create blob and open in new tab
    const blob = new Blob([fileData], { type: metadata.type });
    const url = URL.createObjectURL(blob);
    
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      // Fallback if popup blocked - trigger download instead
      await downloadFile(fileId);
    } else {
      // Clean up URL after a delay (give browser time to load)
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    }
  }, [downloadFile]);

  // Check if file type is viewable in browser
  const isFileViewable = useCallback((fileType: string): boolean => {
    const viewableTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Text files
      'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/markdown',
      // Code files that browsers can display as text
      'application/json', 'application/xml',
      // PDFs
      'application/pdf'
    ];
    
    return viewableTypes.includes(fileType.toLowerCase()) || 
           fileType.startsWith('text/') || 
           fileType.startsWith('image/');
  }, []);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    throw new Error('Delete not yet implemented');
  }, []);

  // Set shared data
  const setSharedData = useCallback((key: string, value: any) => {
    if (!syncManagerRef.current) return;
    
    syncManagerRef.current.setSharedData(key, value);
    sharedDataRef.current.set(key, value);
  }, []);

  // Get shared data
  const getSharedData = useCallback((key: string): any => {
    if (syncManagerRef.current) {
      return syncManagerRef.current.getSharedData(key);
    }
    return sharedDataRef.current.get(key);
  }, []);

  // Update user info
  const updateUserInfo = useCallback((info: { name?: string; color?: string; status?: string }) => {
    if (syncManagerRef.current) {
      syncManagerRef.current.provider.awareness.setLocalState(info);
    }
  }, []);

  // Request persistent storage
  const requestPersistentStorage = useCallback(async (): Promise<boolean> => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return await navigator.storage.persist();
    }
    return false;
  }, []);

  // Destroy
  const destroy = useCallback(() => {
    if (syncManagerRef.current) {
      syncManagerRef.current.destroy();
      syncManagerRef.current = null;
    }
  }, []);

  return {
    state,
    addFile,
    downloadFile,
    openFile,
    deleteFile,
    getFileData,
    setSharedData,
    getSharedData,
    updateUserInfo,
    requestPersistentStorage,
    isFileViewable,
    destroy
  };
}