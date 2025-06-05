# Handling Large Data Storage (Gigabytes) in P2P Sync

## Storage Limitations & Solutions

### Browser Storage Limits

#### IndexedDB Limitations
| Browser | Storage Limit | Notes |
|---------|--------------|-------|
| Chrome | 60% of disk space | Can request unlimited storage |
| Firefox | 50% of disk space | Group limit (eTLD+1) |
| Safari | 1GB initially | Can request more via Storage API |
| Edge | Same as Chrome | Chromium-based |

**Reality Check**: While theoretically you can store gigabytes, IndexedDB performance degrades significantly with large datasets.

#### Better Browser Solutions for Large Data

1. **Origin Private File System (OPFS)**
```javascript
// Modern API for large file storage
const root = await navigator.storage.getDirectory();
const fileHandle = await root.getFileHandle('large-data.db', { create: true });
const writable = await fileHandle.createWritable();
await writable.write(largeData);
await writable.close();

// Much better performance for large files
// Can handle gigabytes efficiently
```

2. **Cache API + Chunking**
```javascript
// Split large data into chunks
class ChunkedStorage {
  constructor(chunkSize = 10 * 1024 * 1024) { // 10MB chunks
    this.chunkSize = chunkSize;
    this.cacheName = 'large-data-v1';
  }
  
  async store(key, data) {
    const chunks = this.splitIntoChunks(data);
    const cache = await caches.open(this.cacheName);
    
    for (let i = 0; i < chunks.length; i++) {
      await cache.put(
        new Request(`${key}/chunk-${i}`),
        new Response(chunks[i])
      );
    }
    
    // Store metadata
    await cache.put(
      new Request(`${key}/meta`),
      new Response(JSON.stringify({ chunks: chunks.length }))
    );
  }
  
  async retrieve(key) {
    const cache = await caches.open(this.cacheName);
    const metaResponse = await cache.match(`${key}/meta`);
    const meta = await metaResponse.json();
    
    const chunks = [];
    for (let i = 0; i < meta.chunks; i++) {
      const response = await cache.match(`${key}/chunk-${i}`);
      chunks.push(await response.arrayBuffer());
    }
    
    return this.mergeChunks(chunks);
  }
}
```

### Mobile Storage Solutions

#### React Native Storage Options

1. **SQLite for Structured Data**
```javascript
import SQLite from 'react-native-sqlite-storage';

// Can handle gigabytes efficiently
const db = await SQLite.openDatabase({
  name: 'main.db',
  location: 'default',
  createFromLocation: '~data.db' // Pre-populated database
});

// For large blobs, store file paths instead
await db.executeSql(
  'INSERT INTO files (id, path, metadata) VALUES (?, ?, ?)',
  [id, filePath, JSON.stringify(metadata)]
);
```

2. **File System for Large Blobs**
```javascript
import RNFS from 'react-native-fs';

// Store large files directly
const documentsPath = RNFS.DocumentDirectoryPath;
const filePath = `${documentsPath}/data/${filename}`;

// Write large file
await RNFS.writeFile(filePath, data, 'base64');

// Stream large files
const uploadBegin = (response) => {
  const jobId = response.jobId;
  console.log('UPLOAD HAS BEGUN! JobId: ' + jobId);
};

const uploadProgress = (response) => {
  const percentage = Math.floor((response.totalBytesSent/response.totalBytesExpectedToSend) * 100);
  console.log('UPLOAD IS ' + percentage + '% DONE!');
};
```

3. **Realm Database (Alternative)**
```javascript
import Realm from 'realm';

// Efficient for complex data with relationships
const realm = await Realm.open({
  schema: [{
    name: 'LargeData',
    properties: {
      id: 'string',
      data: 'data', // Binary data type
      metadata: 'string'
    }
  }],
  path: 'large.realm',
  encryptionKey: generateKey() // Optional encryption
});
```

## Hybrid Storage Architecture for Gigabytes

```javascript
class HybridStorage {
  constructor() {
    this.metadataDB = new Y.Doc(); // Y.js for metadata sync
    this.localStorage = new LargeFileStorage();
  }
  
  async store(id, data, metadata) {
    // Store metadata in Y.js (synced via P2P)
    this.metadataDB.getMap('files').set(id, {
      id,
      size: data.byteLength,
      hash: await this.hash(data),
      chunks: Math.ceil(data.byteLength / this.chunkSize),
      created: Date.now(),
      ...metadata
    });
    
    // Store actual data locally
    if (isBrowser()) {
      await this.storeInOPFS(id, data);
    } else {
      await this.storeInFileSystem(id, data);
    }
  }
  
  async sync(peerId) {
    // Only sync metadata automatically
    const peerMetadata = await this.getPeerMetadata(peerId);
    const localMetadata = this.metadataDB.getMap('files').toJSON();
    
    // Manual sync for large files
    const missingFiles = this.findMissingFiles(localMetadata, peerMetadata);
    
    // Let user choose which large files to sync
    const toSync = await this.promptUserForSync(missingFiles);
    
    // Progressive sync with resume support
    for (const file of toSync) {
      await this.syncFileWithResume(file, peerId);
    }
  }
}
```

## Android Background Services Without Notifications

### 1. WorkManager for Periodic Sync
```kotlin
class SyncWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        // This runs without notification
        // Limited to 15 minutes every few hours
        performSync()
        return Result.success()
    }
}

// Schedule periodic work
val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()
    )
    .build()

WorkManager.getInstance(context).enqueue(syncRequest)
```

### 2. JobScheduler (More Control)
```java
JobInfo.Builder builder = new JobInfo.Builder(JOB_ID,
        new ComponentName(context, SyncJobService.class));

builder.setRequiredNetworkType(JobInfo.NETWORK_TYPE_UNMETERED)
       .setPeriodic(TimeUnit.HOURS.toMillis(1))
       .setRequiresBatteryNotLow(true)
       .setPersisted(true); // Survives reboot

JobScheduler jobScheduler = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
jobScheduler.schedule(builder.build());
```

### 3. Firebase Cloud Messaging for Wake-ups
```javascript
// Silent push to wake app for sync
import messaging from '@react-native-firebase/messaging';

// Server sends high-priority data message
messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (remoteMessage.data.type === 'sync') {
    // Perform sync - app has ~30 seconds
    await performQuickSync();
  }
});
```

## Local-First Solid Pods Implementation

While Solid pods are designed for server deployment, you can implement a local-first version:

```javascript
class LocalSolidPod {
  constructor(storage) {
    this.storage = storage; // OPFS, SQLite, etc.
    this.rdf = new N3.Store(); // RDF triple store
  }
  
  async init() {
    // Solid pod structure
    await this.createContainer('/profile/');
    await this.createContainer('/public/');
    await this.createContainer('/private/');
    await this.createContainer('/inbox/');
    
    // WebID document
    await this.createResource('/profile/card', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': '#me',
      name: 'Local User',
      storage: 'local://'
    });
  }
  
  async createResource(path, data) {
    // Convert to RDF
    const quads = this.jsonldToQuads(data);
    
    // Store locally
    await this.storage.put(path, {
      contentType: 'text/turtle',
      data: this.quadsToTurtle(quads),
      modified: new Date(),
      acl: this.getDefaultAcl(path)
    });
    
    // Update RDF store
    this.rdf.addQuads(quads);
  }
  
  // Implement Solid Protocol locally
  async handleRequest(method, path, headers, body) {
    switch (method) {
      case 'GET':
        return this.handleGet(path, headers);
      case 'PUT':
        return this.handlePut(path, headers, body);
      case 'POST':
        return this.handlePost(path, headers, body);
      case 'DELETE':
        return this.handleDelete(path);
      case 'PATCH':
        return this.handlePatch(path, headers, body);
    }
  }
  
  // P2P Sync for Solid pods
  async syncWithPeer(peerId) {
    // Exchange WebID documents
    const peerWebId = await this.getPeerWebId(peerId);
    
    // Selective sync based on ACL
    const resources = await this.getPublicResources();
    
    // Use SPARQL for querying
    const query = `
      SELECT ?resource ?modified WHERE {
        ?resource a ldp:Resource ;
                  dcterms:modified ?modified .
        FILTER (?modified > "${lastSync}"^^xsd:dateTime)
      }
    `;
    
    const updates = await this.rdf.query(query);
    await this.exchangeUpdates(peerId, updates);
  }
}
```

## Practical Architecture for Gigabyte-Scale P2P Storage

```javascript
class GigabyteP2PStorage {
  constructor() {
    // Metadata sync (small, always synced)
    this.metadataSync = new Y.Doc();
    this.metadataProvider = new WebrtcProvider('metadata', this.metadataSync);
    
    // File storage (large, selective sync)
    this.fileStorage = new LargeFileStorage();
    
    // Torrent-like chunk sharing
    this.chunkManager = new ChunkManager();
  }
  
  async addLargeFile(file) {
    // 1. Chunk the file
    const chunks = await this.chunkManager.chunkFile(file, {
      chunkSize: 1024 * 1024, // 1MB chunks
      compression: 'gzip'
    });
    
    // 2. Store chunks locally
    const chunkHashes = await Promise.all(
      chunks.map(chunk => this.fileStorage.storeChunk(chunk))
    );
    
    // 3. Create metadata entry
    const metadata = {
      id: generateId(),
      name: file.name,
      size: file.size,
      chunks: chunkHashes,
      created: Date.now(),
      author: this.deviceId
    };
    
    // 4. Only sync metadata
    this.metadataSync.getMap('files').set(metadata.id, metadata);
    
    return metadata.id;
  }
  
  async requestFile(fileId, peerId) {
    const metadata = this.metadataSync.getMap('files').get(fileId);
    
    // Progressive download with resume
    const downloader = new ChunkDownloader(metadata, peerId);
    
    downloader.on('progress', (percent) => {
      console.log(`Downloading ${metadata.name}: ${percent}%`);
    });
    
    // Download chunks in parallel from multiple peers
    const chunks = await downloader.download({
      maxParallel: 4,
      resumable: true,
      verifyHash: true
    });
    
    // Reassemble file
    return this.chunkManager.reassemble(chunks);
  }
}
```

## Key Recommendations

1. **Separate Metadata from Data**: Sync metadata (KB) automatically, large files (GB) on-demand
2. **Use Chunking**: Break large files into manageable pieces
3. **Progressive Sync**: Allow partial downloads with resume capability
4. **Selective Sync**: Let users choose what large files to sync
5. **Compression**: Use compression for better storage and transfer efficiency
6. **Background Limits**: Accept that mobile OS limits background execution; design around it

This hybrid approach gives you Solid-like data sovereignty with practical P2P sync for large datasets.