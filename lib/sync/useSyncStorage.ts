import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import { HybridFile } from './HybridStorage.ts';
import { StorageProgress } from '../storage/LargeFileStorage.ts';

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
  deleteFile: (fileId: string) => Promise<void>;
  getFileData: (fileId: string) => Promise<ArrayBuffer>;
  setSharedData: (key: string, value: any) => void;
  getSharedData: (key: string) => any;
  updateUserInfo: (info: { name?: string; color?: string; status?: string }) => void;
  requestPersistentStorage: () => Promise<boolean>;
  destroy: () => void;
}

export function useSyncStorage(config: SyncStorageConfig): UseSyncStorageResult {
  const workerRef = useRef<Worker | null>(null);
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

  // Initialize worker
  useEffect(() => {
    const worker = new Worker('/workers/sync-worker.js', { type: 'module' });
    workerRef.current = worker;

    // Handle worker messages
    worker.addEventListener('message', (event) => {
      const { type, payload, error } = event.data;

      switch (type) {
        case 'INITIALIZED':
          setState(prev => ({
            ...prev,
            initialized: true,
            userId: payload.userId,
            error: null
          }));
          
          // Start auto-sync if enabled
          if (config.autoSync) {
            worker.postMessage({
              type: 'START_AUTO_SYNC',
              payload: { interval: config.autoSyncInterval || 30000 }
            });
          }
          break;

        case 'SYNC_STATUS_CHANGED':
          setState(prev => ({
            ...prev,
            connected: payload.synced
          }));
          break;

        case 'PEERS_CHANGED':
          setState(prev => ({
            ...prev,
            peers: payload.count
          }));
          break;

        case 'DATA_CHANGED':
          // Update shared data cache
          payload.forEach(([key, value]: [string, any]) => {
            if (key && value) {
              sharedDataRef.current.set(key, value);
            }
          });
          break;

        case 'STATUS_UPDATE':
          setState(prev => ({
            ...prev,
            files: payload.files || [],
            users: payload.users || [],
            storageInfo: payload.storage || {},
            peers: payload.peers || 0
          }));
          break;

        case 'ERROR':
          setState(prev => ({
            ...prev,
            error: error || 'Unknown error'
          }));
          console.error('Sync error:', error);
          break;

        case 'FILE_ADDED':
        case 'FILE_DOWNLOADED':
          // Request status update
          worker.postMessage({ type: 'GET_STATUS' });
          break;
      }
    });

    // Initialize the sync system
    worker.postMessage({
      type: 'INIT',
      payload: {
        syncConfig: {
          roomName: config.roomName,
          userName: config.userName,
          password: config.password,
          signaling: config.signaling
        }
      }
    });

    // Request initial status
    const statusInterval = setInterval(() => {
      if (state.initialized) {
        worker.postMessage({ type: 'GET_STATUS' });
      }
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(statusInterval);
      worker.postMessage({ type: 'DESTROY' });
      worker.terminate();
      workerRef.current = null;
    };
  }, [config.roomName]); // Only reinitialize if room changes

  // Add file
  const addFile = useCallback(async (file: File | Blob, metadata: any = {}) => {
    if (!workerRef.current) throw new Error('Worker not initialized');

    return new Promise<string>((resolve, reject) => {
      const fileId = metadata.id || crypto.randomUUID();
      
      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        
        if (type === 'FILE_ADDED' && payload.fileId === fileId) {
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve(fileId);
        } else if (type === 'ERROR') {
          workerRef.current?.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error));
        }
      };

      workerRef.current.addEventListener('message', handleMessage);
      
      workerRef.current.postMessage({
        type: 'ADD_FILE',
        payload: { file, metadata: { ...metadata, id: fileId } }
      });
    });
  }, []);

  // Download file
  const downloadFile = useCallback(async (fileId: string) => {
    if (!workerRef.current) throw new Error('Worker not initialized');

    return new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        
        if (type === 'FILE_DOWNLOADED' && payload.fileId === fileId) {
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve();
        } else if (type === 'DOWNLOAD_ERROR' && payload.fileId === fileId) {
          workerRef.current?.removeEventListener('message', handleMessage);
          reject(new Error(payload.error));
        }
      };

      workerRef.current.addEventListener('message', handleMessage);
      
      workerRef.current.postMessage({
        type: 'DOWNLOAD_FILE',
        payload: { fileId }
      });
    });
  }, []);

  // Get file data
  const getFileData = useCallback(async (fileId: string): Promise<ArrayBuffer> => {
    // This would need to be implemented differently since workers can't return ArrayBuffers directly
    // For now, throw an error indicating this should be done on the main thread
    throw new Error('File data retrieval must be done on the main thread');
  }, []);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    // TODO: Implement delete in worker
    throw new Error('Delete not yet implemented');
  }, []);

  // Set shared data
  const setSharedData = useCallback((key: string, value: any) => {
    if (!workerRef.current) return;
    
    workerRef.current.postMessage({
      type: 'SET_DATA',
      payload: { key, value }
    });
    
    // Update local cache
    sharedDataRef.current.set(key, value);
  }, []);

  // Get shared data
  const getSharedData = useCallback((key: string): any => {
    return sharedDataRef.current.get(key);
  }, []);

  // Update user info
  const updateUserInfo = useCallback((info: { name?: string; color?: string; status?: string }) => {
    // TODO: Implement in worker
    console.log('Update user info:', info);
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
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'DESTROY' });
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    state,
    addFile,
    downloadFile,
    deleteFile,
    getFileData,
    setSharedData,
    getSharedData,
    updateUserInfo,
    requestPersistentStorage,
    destroy
  };
}