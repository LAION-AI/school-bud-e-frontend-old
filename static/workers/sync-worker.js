console.log('Web-Worker - Sync Worker - started');

import * as Y from 'https://esm.sh/yjs@13.5.41';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@11.1.0';
import { WebrtcProvider } from 'https://esm.sh/y-webrtc@10.3.0';
import { IndexeddbPersistence } from 'https://esm.sh/y-indexeddb@9.0.12';

console.log('SYNC WORKER - modules imported successfully');

let hybridStorage = null;
let syncInterval = null;

// Simple implementation of storage classes for the worker
class WorkerSyncManager {
  constructor(config) {
    this.doc = new Y.Doc();
    this.metadata = this.doc.getMap('metadata');
    this.sharedData = this.doc.getMap('sharedData');
    this.userId = uuidv4();
    this.config = config;
    this.events = {};
    
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
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.provider.on('synced', (synced) => {
      postMessage({ type: 'SYNC_STATUS_CHANGED', payload: { synced: synced.synced } });
    });
    
    this.provider.on('peers', (change) => {
      postMessage({ type: 'PEERS_CHANGED', payload: { count: change.webrtcPeers.size } });
    });
    
    this.metadata.observe(() => {
      const changes = Array.from(this.metadata.entries());
      postMessage({ type: 'DATA_CHANGED', payload: changes });
    });
  }
  
  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  addFileMetadata(metadata) {
    metadata.author = this.userId;
    metadata.created = metadata.created || Date.now();
    metadata.modified = Date.now();
    this.metadata.set(metadata.id, metadata);
  }
  
  getAllFileMetadata() {
    return Array.from(this.metadata.values());
  }
  
  getConnectedUsers() {
    return Array.from(this.provider.awareness.getStates().entries()).map(([clientId, state]) => ({
      clientId,
      ...state.user
    }));
  }
  
  setSharedData(key, value) {
    this.sharedData.set(key, value);
  }
  
  destroy() {
    this.provider?.disconnect();
    this.provider?.destroy();
    this.persistence?.destroy();
    this.doc.destroy();
  }
}

// Message handler
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  console.log('MESSAGE', type, payload);
  switch (type) {
    case 'INIT':
      await initializeWorker(payload);
      break;
      
    case 'ADD_FILE':
      await handleAddFile(payload);
      break;
      
    case 'GET_STATUS':
      await handleGetStatus();
      break;
      
    case 'SET_DATA':
      await handleSetData(payload);
      break;
      
    case 'START_AUTO_SYNC':
      startAutoSync(payload.interval || 30000);
      break;
      
    case 'STOP_AUTO_SYNC':
      stopAutoSync();
      break;
      
    case 'DESTROY':
      await destroy();
      break;
      
    default:
      postMessage({ type: 'ERROR', error: 'Unknown message type' });
  }
});

// Initialize the worker with sync configuration
async function initializeWorker(config) {
  try {
    hybridStorage = new WorkerSyncManager(config.syncConfig);
    console.log('INITIALIZED', hybridStorage);
    
    postMessage({ 
      type: 'INITIALIZED', 
      payload: { 
        userId: hybridStorage.userId,
        roomName: config.syncConfig.roomName,
        persistent: false // Will be handled on main thread
      }
    });
  } catch (error) {
    postMessage({ type: 'ERROR', error: error.message });
  }
}

// Handle file addition (metadata only in worker)
async function handleAddFile({ file, metadata, options }) {
  try {
    // In the worker, we only handle metadata
    const fileMetadata = {
      id: metadata.id || uuidv4(),
      name: metadata.name || file.name,
      size: file.size,
      type: metadata.type || file.type,
      created: Date.now(),
      modified: Date.now(),
      ...metadata
    };
    
    hybridStorage.addFileMetadata(fileMetadata);
    
    postMessage({ 
      type: 'FILE_ADDED', 
      payload: { fileId: fileMetadata.id }
    });
  } catch (error) {
    postMessage({ type: 'ERROR', error: error.message });
  }
}

// Get current sync status
async function handleGetStatus() {
  try {
    const files = hybridStorage.getAllFileMetadata().map(metadata => ({
      metadata,
      locallyAvailable: false, // Will be determined on main thread
      syncStatus: 'pending'
    }));
    
    const connectedUsers = hybridStorage.getConnectedUsers();
    
    postMessage({
      type: 'STATUS_UPDATE',
      payload: {
        files,
        storage: { used: 0, available: 0 }, // Will be calculated on main thread
        users: connectedUsers,
        peers: hybridStorage.provider.room?.peers?.size || 0
      }
    });
  } catch (error) {
    postMessage({ type: 'ERROR', error: error.message });
  }
}

// Handle shared data updates
async function handleSetData({ key, value }) {
  try {
    hybridStorage.setSharedData(key, value);
    postMessage({ 
      type: 'DATA_SET', 
      payload: { key, value }
    });
  } catch (error) {
    postMessage({ type: 'ERROR', error: error.message });
  }
}

// Auto-sync functionality
function startAutoSync(interval) {
  stopAutoSync(); // Clear any existing interval
  
  syncInterval = setInterval(async () => {
    try {
      // Send periodic status update
      await handleGetStatus();
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  }, interval);
  
  postMessage({ type: 'AUTO_SYNC_STARTED', payload: { interval } });
}

function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    postMessage({ type: 'AUTO_SYNC_STOPPED' });
  }
}

// Cleanup
async function destroy() {
  stopAutoSync();
  
  if (hybridStorage) {
    hybridStorage.destroy();
    hybridStorage = null;
  }
  
  postMessage({ type: 'DESTROYED' });
}

// Error handling
self.addEventListener('error', (error) => {
  postMessage({ 
    type: 'ERROR', 
    error: `Worker error: ${error.message}` 
  });
});

self.addEventListener('unhandledrejection', (event) => {
  postMessage({ 
    type: 'ERROR', 
    error: `Unhandled promise rejection: ${event.reason}` 
  });
});