import { v4 as uuidv4 } from 'uuid';

export interface ChunkInfo {
  id: string;
  index: number;
  size: number;
  hash: string;
}

export interface StorageProgress {
  totalBytes: number;
  processedBytes: number;
  percentage: number;
}

export class LargeFileStorage {
  private readonly CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
  private readonly CACHE_NAME = 'large-files-v1';
  private opfsRoot: FileSystemDirectoryHandle | null = null;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    // Check if OPFS is available
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
      try {
        this.opfsRoot = await navigator.storage.getDirectory();
      } catch (error) {
        console.warn('OPFS not available, falling back to Cache API');
      }
    }
  }

  // Store a large file with chunking
  async storeFile(
    fileId: string, 
    data: ArrayBuffer | Blob | File,
    onProgress?: (progress: StorageProgress) => void
  ): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];
    const totalSize = data instanceof ArrayBuffer ? data.byteLength : data.size;
    let processedBytes = 0;

    // Convert to ArrayBuffer if needed
    const buffer = data instanceof ArrayBuffer ? data : await data.arrayBuffer();
    
    // Split into chunks
    const chunkCount = Math.ceil(totalSize / this.CHUNK_SIZE);
    
    for (let i = 0; i < chunkCount; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, totalSize);
      const chunk = buffer.slice(start, end);
      
      // Generate chunk ID and hash
      const chunkId = `${fileId}-chunk-${i}`;
      const hash = await this.hashChunk(chunk);
      
      // Store chunk
      await this.storeChunk(chunkId, chunk);
      
      chunks.push({
        id: chunkId,
        index: i,
        size: chunk.byteLength,
        hash
      });
      
      processedBytes += chunk.byteLength;
      
      if (onProgress) {
        onProgress({
          totalBytes: totalSize,
          processedBytes,
          percentage: Math.round((processedBytes / totalSize) * 100)
        });
      }
    }
    
    return chunks;
  }

  // Store a single chunk
  private async storeChunk(chunkId: string, data: ArrayBuffer): Promise<void> {
    if (this.opfsRoot) {
      // Use OPFS for better performance
      await this.storeChunkOPFS(chunkId, data);
    } else {
      // Fallback to Cache API
      await this.storeChunkCache(chunkId, data);
    }
  }

  // Store chunk using OPFS
  private async storeChunkOPFS(chunkId: string, data: ArrayBuffer): Promise<void> {
    try {
      const fileHandle = await this.opfsRoot!.getFileHandle(chunkId, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
    } catch (error) {
      console.error('OPFS write error:', error);
      // Fallback to Cache API
      await this.storeChunkCache(chunkId, data);
    }
  }

  // Store chunk using Cache API
  private async storeChunkCache(chunkId: string, data: ArrayBuffer): Promise<void> {
    const cache = await caches.open(this.CACHE_NAME);
    const response = new Response(data);
    await cache.put(new Request(chunkId), response);
  }

  // Retrieve a file by reassembling chunks
  async retrieveFile(
    chunks: ChunkInfo[],
    onProgress?: (progress: StorageProgress) => void
  ): Promise<ArrayBuffer> {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const buffers: ArrayBuffer[] = [];
    let processedBytes = 0;

    // Sort chunks by index
    const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);

    for (const chunk of sortedChunks) {
      const data = await this.retrieveChunk(chunk.id);
      
      if (!data) {
        throw new Error(`Missing chunk: ${chunk.id}`);
      }
      
      // Verify chunk integrity
      const hash = await this.hashChunk(data);
      if (hash !== chunk.hash) {
        throw new Error(`Chunk corruption detected: ${chunk.id}`);
      }
      
      buffers.push(data);
      processedBytes += data.byteLength;
      
      if (onProgress) {
        onProgress({
          totalBytes: totalSize,
          processedBytes,
          percentage: Math.round((processedBytes / totalSize) * 100)
        });
      }
    }

    // Combine chunks
    return this.combineBuffers(buffers);
  }

  // Retrieve a single chunk
  private async retrieveChunk(chunkId: string): Promise<ArrayBuffer | null> {
    if (this.opfsRoot) {
      const data = await this.retrieveChunkOPFS(chunkId);
      if (data) return data;
    }
    
    // Fallback to Cache API
    return await this.retrieveChunkCache(chunkId);
  }

  // Retrieve chunk from OPFS
  private async retrieveChunkOPFS(chunkId: string): Promise<ArrayBuffer | null> {
    try {
      const fileHandle = await this.opfsRoot!.getFileHandle(chunkId);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch (error) {
      return null;
    }
  }

  // Retrieve chunk from Cache API
  private async retrieveChunkCache(chunkId: string): Promise<ArrayBuffer | null> {
    const cache = await caches.open(this.CACHE_NAME);
    const response = await cache.match(new Request(chunkId));
    
    if (!response) return null;
    
    return await response.arrayBuffer();
  }

  // Delete a file and all its chunks
  async deleteFile(chunks: ChunkInfo[]): Promise<void> {
    await Promise.all(chunks.map(chunk => this.deleteChunk(chunk.id)));
  }

  // Delete a single chunk
  private async deleteChunk(chunkId: string): Promise<void> {
    if (this.opfsRoot) {
      try {
        await this.opfsRoot.removeEntry(chunkId);
      } catch (error) {
        // Ignore if not found
      }
    }
    
    const cache = await caches.open(this.CACHE_NAME);
    await cache.delete(new Request(chunkId));
  }

  // Check if a chunk exists
  async hasChunk(chunkId: string): Promise<boolean> {
    if (this.opfsRoot) {
      try {
        await this.opfsRoot.getFileHandle(chunkId);
        return true;
      } catch {
        // Continue to cache check
      }
    }
    
    const cache = await caches.open(this.CACHE_NAME);
    const response = await cache.match(new Request(chunkId));
    return response !== undefined;
  }

  // Get storage usage
  async getStorageInfo(): Promise<{ used: number; available?: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota
      };
    }
    
    return { used: 0 };
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return await navigator.storage.persist();
    }
    return false;
  }

  // Hash a chunk for integrity checking
  private async hashChunk(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Combine multiple ArrayBuffers
  private combineBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    
    return result.buffer;
  }

  // Clear all stored data
  async clearAll(): Promise<void> {
    if (this.opfsRoot) {
      // Clear OPFS
      for await (const entry of this.opfsRoot.values()) {
        if (entry.kind === 'file') {
          await this.opfsRoot.removeEntry(entry.name);
        }
      }
    }
    
    // Clear cache
    await caches.delete(this.CACHE_NAME);
  }
}