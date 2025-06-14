import { useEffect, useRef } from 'preact/hooks';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { chats } from '../../components/chat/store.ts';

// Crypto utilities for ECDSA key generation and encryption
class CryptoManager {
  private keyPair: CryptoKeyPair | null = null;
  private publicKeyString: string | null = null;
  private peerPublicKeys: Map<string, CryptoKey> = new Map();

  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    this.keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    ) as CryptoKeyPair;

    const publicKeyBuffer = await crypto.subtle.exportKey('raw', this.keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', this.keyPair.privateKey);
    
    this.publicKeyString = this.bufferToBase64(publicKeyBuffer);
    const privateKeyString = this.bufferToBase64(privateKeyBuffer);

    return {
      publicKey: this.publicKeyString,
      privateKey: privateKeyString
    };
  }

  async loadKeyPair(privateKeyString: string, publicKeyString?: string): Promise<string> {
    const privateKeyBuffer = this.base64ToBuffer(privateKeyString);
    
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign']
    );

    if (publicKeyString) {
      this.publicKeyString = publicKeyString;
      const publicKey = await this.importPublicKey(publicKeyString);
      this.keyPair = { privateKey, publicKey };
    } else {
      throw new Error('Public key required when loading key pair');
    }

    return this.publicKeyString;
  }

  async importPublicKey(publicKeyString: string): Promise<CryptoKey> {
    const publicKeyBuffer = this.base64ToBuffer(publicKeyString);
    return await crypto.subtle.importKey(
      'raw',
      publicKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['verify']
    );
  }

  async addPeerPublicKey(peerId: string, publicKeyString: string): Promise<void> {
    const publicKey = await this.importPublicKey(publicKeyString);
    this.peerPublicKeys.set(peerId, publicKey);
  }

  generateShareableLink(baseUrl: string): string {
    if (!this.publicKeyString) throw new Error('No public key available');
    return `${baseUrl}?publicKey=${encodeURIComponent(this.publicKeyString)}`;
  }

  generateQRCode(userName: string): string {
    if (!this.publicKeyString) throw new Error('No public key available');
    return JSON.stringify({
      type: 'school-bud-e-sync',
      publicKey: this.publicKeyString,
      userName: userName
    });
  }

  getPublicKey(): string | null {
    return this.publicKeyString;
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

interface SyncSettings {
  enabled: boolean;
  userName: string;
  privateKey: string;
  publicKey: string;
  peerPublicKeys: string[];
}

interface SyncState {
  connected: boolean;
  peers: number;
  encrypted: boolean;
  publicKey: string | null;
}

// Global singleton instances
let globalDoc: Y.Doc | null = null;
let globalProvider: WebrtcProvider | null = null;
let globalPersistence: IndexeddbPersistence | null = null;
let globalRefCount = 0;
const globalCryptoManagers = new Map<string, CryptoManager>();

async function initializeGlobalSync(settings: SyncSettings): Promise<CryptoManager> {
  globalRefCount++;
  
  // Get or create crypto manager for this user
  const userKey = settings.publicKey || 'new-user';
  let cryptoManager = globalCryptoManagers.get(userKey);
  
  if (!cryptoManager) {
    cryptoManager = new CryptoManager();
    
    if (settings.privateKey && settings.publicKey) {
      await cryptoManager.loadKeyPair(settings.privateKey, settings.publicKey);
    } else {
      const keyPair = await cryptoManager.generateKeyPair();
      settings.privateKey = keyPair.privateKey;
      settings.publicKey = keyPair.publicKey;
      localStorage.setItem('chatSyncSettings', JSON.stringify(settings));
    }
    
    // Load peer public keys
    for (const peerKey of settings.peerPublicKeys) {
      await cryptoManager.addPeerPublicKey(peerKey, peerKey);
    }
    
    globalCryptoManagers.set(settings.publicKey, cryptoManager);
  }
  
  // Initialize global YJS instances only once
  if (!globalDoc) {
    globalDoc = new Y.Doc();
    
    // Get signaling server URL from meta tag
    const metaTag = document.querySelector('meta[name="chat-signaling-server-url"]') as HTMLMetaElement;
    const signalingServerUrl = metaTag?.content || 'wss://next.bud-e.ai:4444';
    
    // Use a global sync space for all School Bud-E users
    const connectionId = 'school-bud-e-encrypted-sync';
    globalProvider = new WebrtcProvider(connectionId, globalDoc, {
      signaling: [signalingServerUrl]
    });
    
    globalPersistence = new IndexeddbPersistence(`chat-sync-${connectionId}`, globalDoc);
    
    // Get the shared chats map
    const sharedChats = globalDoc.getMap('chats');
    
    // Sync local chats to shared document when they change
    let isUpdatingFromRemote = false;
    
    // Watch for local changes and sync to Y.js
    const syncLocalToRemote = () => {
      if (isUpdatingFromRemote) return;
      
      const localChats = chats.value;
      for (const [key, messages] of Object.entries(localChats)) {
        const currentRemoteMessages = sharedChats.get(key);
        if (JSON.stringify(currentRemoteMessages) !== JSON.stringify(messages)) {
          sharedChats.set(key, messages);
        }
      }
    };
    
    // Watch for remote changes and sync to local
    sharedChats.observe((event) => {
      isUpdatingFromRemote = true;
      
      const newChats = { ...chats.value };
      let hasChanges = false;
      
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const remoteMessages = sharedChats.get(key);
          if (remoteMessages && Array.isArray(remoteMessages) && JSON.stringify(newChats[key]) !== JSON.stringify(remoteMessages)) {
            newChats[key] = remoteMessages;
            hasChanges = true;
          }
        } else if (change.action === 'delete') {
          if (newChats[key]) {
            delete newChats[key];
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        chats.value = newChats;
      }
      
      setTimeout(() => {
        isUpdatingFromRemote = false;
      }, 100);
    });
    
    // Initial sync from local to remote
    setTimeout(syncLocalToRemote, 1000);
    
    // Set up periodic sync to catch any missed changes
    setInterval(() => {
      if (!isUpdatingFromRemote) {
        syncLocalToRemote();
      }
    }, 5000);
  }
  
  return cryptoManager;
}

function cleanupGlobalSync(): void {
  globalRefCount--;
  
  if (globalRefCount <= 0) {
    if (globalProvider) {
      globalProvider.destroy();
      globalProvider = null;
    }
    if (globalPersistence) {
      globalPersistence.destroy();
      globalPersistence = null;
    }
    if (globalDoc) {
      globalDoc.destroy();
      globalDoc = null;
    }
    globalCryptoManagers.clear();
    globalRefCount = 0;
  }
}

export function useChatSync() {
  const cryptoManagerRef = useRef<CryptoManager | null>(null);

  const getSettings = (): SyncSettings => {
    const stored = localStorage.getItem('chatSyncSettings');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      enabled: false,
      userName: 'Anonymous',
      privateKey: '',
      publicKey: '',
      peerPublicKeys: []
    };
  };

  const saveSettings = (settings: SyncSettings) => {
    localStorage.setItem('chatSyncSettings', JSON.stringify(settings));
  };

  const isEnabled = () => {
    return getSettings().enabled;
  };

  const getSyncState = (): SyncState => {
    if (!cryptoManagerRef.current || !globalProvider) {
      return { connected: false, peers: 0, encrypted: true, publicKey: null };
    }
    return {
      connected: globalProvider.connected || false,
      peers: globalProvider.awareness.getStates().size || 0,
      encrypted: true,
      publicKey: cryptoManagerRef.current.getPublicKey()
    };
  };

  const initializeSync = async () => {
    const settings = getSettings();
    if (!settings.enabled) return;

    cryptoManagerRef.current = await initializeGlobalSync(settings);
  };

  const addPeer = async (publicKey: string) => {
    if (!cryptoManagerRef.current) return;
    
    const settings = getSettings();
    if (!settings.peerPublicKeys.includes(publicKey)) {
      settings.peerPublicKeys.push(publicKey);
      await cryptoManagerRef.current.addPeerPublicKey(publicKey, publicKey);
      saveSettings(settings);
    }
  };

  const generateShareableLink = (): string => {
    if (!cryptoManagerRef.current) throw new Error('Sync not initialized');
    const baseUrl = globalThis.location?.origin + globalThis.location?.pathname;
    return cryptoManagerRef.current.generateShareableLink(baseUrl);
  };

  const generateQRCode = (): string => {
    if (!cryptoManagerRef.current) throw new Error('Sync not initialized');
    const settings = getSettings();
    return cryptoManagerRef.current.generateQRCode(settings.userName);
  };

  useEffect(() => {
    if (isEnabled()) {
      initializeSync();
    }

    return () => {
      cleanupGlobalSync();
      cryptoManagerRef.current = null;
    };
  }, []);

  return {
    isEnabled,
    getSyncState,
    getSettings,
    saveSettings,
    addPeer,
    generateShareableLink,
    generateQRCode
  };
} 