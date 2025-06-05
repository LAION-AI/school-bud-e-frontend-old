# P2P Sync Example Implementation

This guide provides a practical example of implementing P2P data synchronization using Y.js and WebRTC.

## Quick Start Example

### 1. Installation

```bash
npm install yjs y-webrtc y-indexeddb
```

### 2. Basic Implementation

```javascript
// sync-manager.js
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

class SyncManager {
  constructor(roomName, signaling = ['wss://signaling.yjs.dev']) {
    // Initialize Y.js document
    this.doc = new Y.Doc();
    
    // Create shared data structures
    this.data = this.doc.getMap('sharedData');
    this.users = this.doc.getMap('users');
    
    // Setup local persistence
    this.persistence = new IndexeddbPersistence(roomName, this.doc);
    
    // Setup P2P provider
    this.provider = new WebrtcProvider(roomName, this.doc, {
      signaling,
      password: null, // Optional: Add password for private rooms
      awareness: {
        // Share user presence information
        name: 'Anonymous User',
        color: this.getRandomColor()
      }
    });
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Listen for sync status changes
    this.provider.on('synced', (synced) => {
      console.log('Sync status:', synced ? 'synced' : 'syncing');
    });
    
    // Listen for peer changes
    this.provider.on('peers', (peers) => {
      console.log('Connected peers:', peers.size);
    });
    
    // Listen for data changes
    this.data.observe((event) => {
      event.changes.keys.forEach((change, key) => {
        console.log(`Data changed - ${key}:`, this.data.get(key));
      });
    });
    
    // Listen for awareness updates (user presence)
    this.provider.awareness.on('change', () => {
      const states = Array.from(this.provider.awareness.getStates().values());
      console.log('Active users:', states);
    });
  }
  
  // Add or update data
  setData(key, value) {
    this.data.set(key, value);
  }
  
  // Get data
  getData(key) {
    return this.data.get(key);
  }
  
  // Get all data
  getAllData() {
    return Object.fromEntries(this.data.entries());
  }
  
  // Update user info
  updateUserInfo(info) {
    this.provider.awareness.setLocalState(info);
  }
  
  // Get connected peers
  getConnectedPeers() {
    return Array.from(this.provider.room.peers.values());
  }
  
  // Destroy connection
  destroy() {
    this.provider.destroy();
    this.persistence.destroy();
    this.doc.destroy();
  }
  
  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default SyncManager;
```

### 3. Using in Your App

```javascript
// app.js
import SyncManager from './sync-manager.js';

// Initialize sync manager
const sync = new SyncManager('my-app-room');

// Example: Todo list sync
function addTodo(text) {
  const todos = sync.getData('todos') || [];
  const newTodo = {
    id: Date.now(),
    text,
    completed: false,
    createdBy: sync.provider.awareness.clientID
  };
  todos.push(newTodo);
  sync.setData('todos', todos);
}

// Listen for changes
sync.data.observe((event) => {
  if (event.changes.keys.has('todos')) {
    const todos = sync.getData('todos');
    renderTodos(todos);
  }
});

// Update user presence
sync.updateUserInfo({
  name: 'John Doe',
  status: 'online',
  lastActive: Date.now()
});
```

### 4. Web Worker Implementation

```javascript
// sync-worker.js
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

let doc, provider;

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'init':
      initializeSync(data.roomName, data.signaling);
      break;
      
    case 'update':
      updateData(data.key, data.value);
      break;
      
    case 'get':
      const value = getData(data.key);
      self.postMessage({ type: 'data', key: data.key, value });
      break;
      
    case 'destroy':
      cleanup();
      break;
  }
});

function initializeSync(roomName, signaling) {
  doc = new Y.Doc();
  const sharedData = doc.getMap('sharedData');
  
  provider = new WebrtcProvider(roomName, doc, { signaling });
  
  // Listen for changes
  sharedData.observe((event) => {
    const changes = {};
    event.changes.keys.forEach((change, key) => {
      changes[key] = sharedData.get(key);
    });
    
    self.postMessage({ 
      type: 'changes', 
      changes 
    });
  });
  
  // Sync status
  provider.on('synced', (synced) => {
    self.postMessage({ 
      type: 'sync-status', 
      synced 
    });
  });
}

function updateData(key, value) {
  const sharedData = doc.getMap('sharedData');
  sharedData.set(key, value);
}

function getData(key) {
  const sharedData = doc.getMap('sharedData');
  return sharedData.get(key);
}

function cleanup() {
  if (provider) provider.destroy();
  if (doc) doc.destroy();
}
```

### 5. Main Thread Usage with Worker

```javascript
// main-app.js
class WorkerSyncManager {
  constructor(roomName) {
    this.worker = new Worker('./sync-worker.js', { type: 'module' });
    this.callbacks = new Map();
    
    // Initialize worker
    this.worker.postMessage({
      type: 'init',
      data: { roomName }
    });
    
    // Handle worker messages
    this.worker.addEventListener('message', (event) => {
      const { type, ...data } = event.data;
      
      switch (type) {
        case 'changes':
          this.handleChanges(data.changes);
          break;
          
        case 'sync-status':
          this.handleSyncStatus(data.synced);
          break;
          
        case 'data':
          this.handleDataResponse(data);
          break;
      }
    });
  }
  
  updateData(key, value) {
    this.worker.postMessage({
      type: 'update',
      data: { key, value }
    });
  }
  
  getData(key) {
    return new Promise((resolve) => {
      const id = Math.random();
      this.callbacks.set(id, resolve);
      
      this.worker.postMessage({
        type: 'get',
        data: { key, id }
      });
    });
  }
  
  handleChanges(changes) {
    // Override this method to handle changes
    console.log('Data changed:', changes);
  }
  
  handleSyncStatus(synced) {
    // Override this method to handle sync status
    console.log('Sync status:', synced);
  }
  
  destroy() {
    this.worker.postMessage({ type: 'destroy' });
    this.worker.terminate();
  }
}
```

## React Integration Example

```jsx
// useSyncState.js
import { useState, useEffect, useRef } from 'react';
import SyncManager from './sync-manager';

export function useSyncState(roomName, key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const syncRef = useRef(null);
  
  useEffect(() => {
    // Initialize sync manager
    syncRef.current = new SyncManager(roomName);
    
    // Set initial value if not exists
    const existingValue = syncRef.current.getData(key);
    if (existingValue !== undefined) {
      setValue(existingValue);
    } else {
      syncRef.current.setData(key, initialValue);
    }
    
    // Listen for changes
    const observer = (event) => {
      if (event.changes.keys.has(key)) {
        setValue(syncRef.current.getData(key));
      }
    };
    
    syncRef.current.data.observe(observer);
    
    // Cleanup
    return () => {
      syncRef.current.destroy();
    };
  }, [roomName, key]);
  
  const setSyncValue = (newValue) => {
    syncRef.current.setData(key, newValue);
    setValue(newValue);
  };
  
  return [value, setSyncValue];
}

// Usage in React component
function TodoApp() {
  const [todos, setTodos] = useSyncState('todo-room', 'todos', []);
  
  const addTodo = (text) => {
    const newTodos = [...todos, {
      id: Date.now(),
      text,
      completed: false
    }];
    setTodos(newTodos);
  };
  
  return (
    <div>
      <h1>Synced Todo List</h1>
      {todos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  );
}
```

## Setting Up Your Own Signaling Server

```javascript
// signaling-server.js
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
  let currentRoom = null;
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'join':
        currentRoom = data.room;
        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, new Set());
        }
        rooms.get(currentRoom).add(ws);
        
        // Notify others in room
        broadcast(currentRoom, {
          type: 'peer-joined',
          peerId: data.peerId
        }, ws);
        break;
        
      case 'signal':
        // Forward signaling data to specific peer
        const room = rooms.get(currentRoom);
        if (room) {
          room.forEach(peer => {
            if (peer !== ws && peer.readyState === WebSocket.OPEN) {
              peer.send(JSON.stringify(data));
            }
          });
        }
        break;
    }
  });
  
  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

function broadcast(room, data, exclude) {
  const peers = rooms.get(room);
  if (peers) {
    peers.forEach(peer => {
      if (peer !== exclude && peer.readyState === WebSocket.OPEN) {
        peer.send(JSON.stringify(data));
      }
    });
  }
}

server.listen(4444, () => {
  console.log('Signaling server running on port 4444');
});
```

## Testing Your Implementation

```javascript
// test-sync.js
import SyncManager from './sync-manager';

// Create two instances simulating different browsers
const user1 = new SyncManager('test-room');
const user2 = new SyncManager('test-room');

// User 1 sets data
user1.setData('message', 'Hello from User 1');

// User 2 will receive the update
setTimeout(() => {
  console.log('User 2 sees:', user2.getData('message'));
}, 1000);

// Test collaborative editing
const sharedList = [];
user1.setData('list', ['item1']);
user2.data.observe(() => {
  const list = user2.getData('list');
  if (list) {
    list.push('item2');
    user2.setData('list', list);
  }
});

// Clean up
setTimeout(() => {
  user1.destroy();
  user2.destroy();
}, 5000);
```

## Next Steps

1. **Add Authentication**: Implement peer authentication using passwords or tokens
2. **Optimize for Large Data**: Use Y.js sub-documents for better performance
3. **Add Offline Queue**: Queue changes when offline and sync when reconnected
4. **Implement Presence**: Show live cursors, user avatars, and activity indicators
5. **Add Encryption**: Implement end-to-end encryption for sensitive data

This example provides a solid foundation for P2P synchronization. You can extend it based on your specific requirements.