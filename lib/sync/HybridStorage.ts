import { SyncManager, FileMetadata, SyncConfig, SyncEvents } from './SyncManager.ts';
import { LargeFileStorage, ChunkInfo, StorageProgress } from '../storage/LargeFileStorage.ts';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadOptions {
  onProgress?: (progress: StorageProgress) => void;
  autoSync?: boolean;
}

export interface FileDownloadOptions {
  onProgress?: (progress: StorageProgress) => void;
  priority?: 'high' | 'normal' | 'low';
}

export interface HybridFile {
  metadata: FileMetadata;
  locallyAvailable: boolean;
  syncStatus: 'synced' | 'pending' | 'downloading' | 'error';
  downloadProgress?: number;
}

export class HybridStorage {
  private syncManager: SyncManager;
  private fileStorage: LargeFileStorage;
  private downloadQueue: Map<string, Promise<ArrayBuffer>>;
  private localFileCache: Map<string, boolean>;

  constructor(config: SyncConfig, events?: SyncEvents) {
    this.syncManager = new SyncManager(config, {
      ...events,
      onDataChanged: (changes) => {
        // Check for new files that need to be downloaded
        this.checkForNewFiles(changes);
        events?.onDataChanged?.(changes);
      }
    });
    
    this.fileStorage = new LargeFileStorage();
    this.downloadQueue = new Map();
    this.localFileCache = new Map();
    
    // Initialize local file cache
    this.initializeLocalCache();
  }

  private async initializeLocalCache() {
    // Check which files are available locally
    const allMetadata = this.syncManager.getAllFileMetadata();
    
    for (const metadata of allMetadata) {
      if (metadata.chunks) {
        const hasAllChunks = await this.checkLocalAvailability(metadata.chunks);
        this.localFileCache.set(metadata.id, hasAllChunks);
      }
    }
  }

  private async checkLocalAvailability(chunks: string[]): Promise<boolean> {
    const chunkInfos: ChunkInfo[] = chunks.map((id, index) => ({
      id,
      index,
      size: 0, // Not needed for existence check
      hash: ''
    }));

    for (const chunk of chunkInfos) {
      if (!await this.fileStorage.hasChunk(chunk.id)) {
        return false;
      }
    }
    
    return true;
  }

  private checkForNewFiles(changes: Map<string, any>) {
    // Auto-download high priority files or small files
    changes.forEach((metadata, key) => {
      if (metadata && metadata.chunks && !this.localFileCache.get(metadata.id)) {
        // Auto-download if file is small (< 10MB)
        if (metadata.size < 10 * 1024 * 1024) {
          this.downloadFileFromPeer(metadata.id, { priority: 'high' });
        }
      }
    });
  }

  // Add a local file and sync metadata
  async addFile(
    file: File | Blob | ArrayBuffer,
    metadata: Partial<FileMetadata> = {},
    options: FileUploadOptions = {}
  ): Promise<string> {
    const fileId = metadata.id || uuidv4();
    
    // Store file chunks locally
    const chunks = await this.fileStorage.storeFile(
      fileId,
      file,
      options.onProgress
    );
    
    // Create complete metadata
    const fullMetadata: FileMetadata = {
      id: fileId,
      name: metadata.name || (file instanceof File ? file.name : 'untitled'),
      size: file instanceof ArrayBuffer ? file.byteLength : file.size,
      type: metadata.type || (file instanceof File ? file.type : 'application/octet-stream'),
      chunks: chunks.map(c => c.id),
      created: Date.now(),
      modified: Date.now(),
      author: this.syncManager.getUserId(),
      ...metadata
    };
    
    // Add metadata to sync
    this.syncManager.addFileMetadata(fullMetadata);
    
    // Mark as locally available
    this.localFileCache.set(fileId, true);
    
    return fileId;
  }

  // Get file metadata with availability status
  getFile(fileId: string): HybridFile | null {
    const metadata = this.syncManager.getFileMetadata(fileId);
    if (!metadata) return null;
    
    const locallyAvailable = this.localFileCache.get(fileId) || false;
    const isDownloading = this.downloadQueue.has(fileId);
    
    return {
      metadata,
      locallyAvailable,
      syncStatus: locallyAvailable ? 'synced' : isDownloading ? 'downloading' : 'pending',
      downloadProgress: isDownloading ? 0 : undefined // TODO: Track actual progress
    };
  }

  // Get all files with their status
  getAllFiles(): HybridFile[] {
    return this.syncManager.getAllFileMetadata().map(metadata => {
      const locallyAvailable = this.localFileCache.get(metadata.id) || false;
      const isDownloading = this.downloadQueue.has(metadata.id);
      
      return {
        metadata,
        locallyAvailable,
        syncStatus: locallyAvailable ? 'synced' : isDownloading ? 'downloading' : 'pending'
      };
    });
  }

  // Download file data from peers
  async downloadFileFromPeer(
    fileId: string,
    options: FileDownloadOptions = {}
  ): Promise<ArrayBuffer> {
    // Check if already downloading
    const existingDownload = this.downloadQueue.get(fileId);
    if (existingDownload) return existingDownload;
    
    // Check if already available locally
    if (this.localFileCache.get(fileId)) {
      return this.getLocalFileData(fileId);
    }
    
    const metadata = this.syncManager.getFileMetadata(fileId);
    if (!metadata || !metadata.chunks) {
      throw new Error('File metadata not found');
    }
    
    // Create download promise
    const downloadPromise = this.performDownload(metadata, options);
    this.downloadQueue.set(fileId, downloadPromise);
    
    try {
      const data = await downloadPromise;
      this.localFileCache.set(fileId, true);
      return data;
    } finally {
      this.downloadQueue.delete(fileId);
    }
  }

  private async performDownload(
    metadata: FileMetadata,
    options: FileDownloadOptions
  ): Promise<ArrayBuffer> {
    // In a real implementation, this would request chunks from peers
    // For now, we'll simulate by checking if chunks exist locally
    
    if (!metadata.chunks) {
      throw new Error('No chunks defined for file');
    }
    
    const chunkInfos: ChunkInfo[] = metadata.chunks.map((id, index) => ({
      id,
      index,
      size: 0, // Will be determined during retrieval
      hash: '' // Should be stored in metadata
    }));
    
    // TODO: Implement actual P2P chunk download from peers
    // For now, just try to retrieve from local storage
    return await this.fileStorage.retrieveFile(chunkInfos, options.onProgress);
  }

  // Get file data from local storage
  async getLocalFileData(fileId: string): Promise<ArrayBuffer> {
    const metadata = this.syncManager.getFileMetadata(fileId);
    if (!metadata || !metadata.chunks) {
      throw new Error('File metadata not found');
    }
    
    const chunkInfos: ChunkInfo[] = metadata.chunks.map((id, index) => ({
      id,
      index,
      size: 0,
      hash: ''
    }));
    
    return await this.fileStorage.retrieveFile(chunkInfos);
  }

  // Delete a file (both metadata and chunks)
  async deleteFile(fileId: string): Promise<void> {
    const metadata = this.syncManager.getFileMetadata(fileId);
    if (metadata && metadata.chunks) {
      const chunkInfos: ChunkInfo[] = metadata.chunks.map((id, index) => ({
        id,
        index,
        size: 0,
        hash: ''
      }));
      
      await this.fileStorage.deleteFile(chunkInfos);
    }
    
    this.syncManager.deleteFileMetadata(fileId);
    this.localFileCache.delete(fileId);
  }

  // Get storage information
  async getStorageInfo() {
    const storageInfo = await this.fileStorage.getStorageInfo();
    const files = this.getAllFiles();
    
    return {
      ...storageInfo,
      fileCount: files.length,
      localFiles: files.filter(f => f.locallyAvailable).length,
      pendingFiles: files.filter(f => f.syncStatus === 'pending').length,
      totalSize: files.reduce((sum, f) => sum + f.metadata.size, 0)
    };
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    return await this.fileStorage.requestPersistentStorage();
  }

  // Sync operations
  getUserId(): string {
    return this.syncManager.getUserId();
  }

  getRoomName(): string {
    return this.syncManager.getRoomName();
  }

  getConnectedPeers(): number {
    return this.syncManager.getPeerCount();
  }

  getConnectedUsers() {
    return this.syncManager.getConnectedUsers();
  }

  updateUserInfo(info: Partial<{ name: string; color: string; status: string }>) {
    this.syncManager.updateUserInfo(info);
  }

  // Shared data operations (for non-file data)
  setSharedData(key: string, value: any) {
    this.syncManager.setData(key, value);
  }

  getSharedData(key: string): any {
    return this.syncManager.getData(key);
  }

  // Export/Import for backup
  async exportState(): Promise<{ metadata: Uint8Array; hasLocalFiles: boolean }> {
    const metadata = await this.syncManager.exportState();
    const hasLocalFiles = Array.from(this.localFileCache.values()).some(v => v);
    
    return { metadata, hasLocalFiles };
  }

  async importState(state: Uint8Array) {
    await this.syncManager.importState(state);
    await this.initializeLocalCache();
  }

  // Cleanup
  async destroy() {
    this.syncManager.destroy();
    this.downloadQueue.clear();
    this.localFileCache.clear();
  }

  // Clear all data
  async clearAll() {
    await this.fileStorage.clearAll();
    await this.destroy();
  }
}