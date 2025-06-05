import Head from "$fresh/runtime.ts";
import PageProps from "$fresh/server.ts";
import { useEffect, useState } from "preact/hooks";

// Basic demo without web workers to test core sync functionality
export default function SyncBasicPage(props: typeof PageProps) {
  const [syncManager, setSyncManager] = useState(null);
  const [roomName, setRoomName] = useState('test-room');
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load Y.js and related libraries
    const script1 = document.createElement('script');
    script1.src = 'https://unpkg.com/yjs@13.6.10/dist/yjs.min.js';
    
    const script2 = document.createElement('script');
    script2.src = 'https://unpkg.com/y-webrtc@10.3.0/dist/y-webrtc.min.js';
    
    const script3 = document.createElement('script');
    script3.src = 'https://unpkg.com/y-indexeddb@9.0.11/dist/y-indexeddb.min.js';

    document.head.appendChild(script1);
    
    script1.onload = () => {
      document.head.appendChild(script2);
      script2.onload = () => {
        document.head.appendChild(script3);
        script3.onload = () => {
          initializeSync();
        };
      };
    };

    return () => {
      if (syncManager) {
        syncManager.provider?.destroy();
        syncManager.doc?.destroy();
      }
    };
  }, []);

  const initializeSync = () => {
    try {
      // Initialize Y.js
      const doc = new Y.Doc();
      const yMessages = doc.getArray('messages');
      
      // Setup local persistence
      const persistence = new IndexeddbPersistence(roomName, doc);
      
      // Setup WebRTC provider
      const provider = new WebrtcProvider(roomName, doc, {
        signaling: ['wss://signaling.yjs.dev'],
        password: null,
        awareness: {
          name: 'User ' + Math.floor(Math.random() * 100),
          color: '#' + Math.floor(Math.random()*16777215).toString(16)
        }
      });

      // Listen for sync events
      provider.on('synced', (synced) => {
        setConnected(synced.synced);
      });

      provider.on('peers', (change) => {
        setPeers(change.webrtcPeers.size);
      });

      // Observe message changes
      yMessages.observe(() => {
        setMessages(yMessages.toArray());
      });

      setSyncManager({ doc, provider, yMessages, persistence });
    } catch (err) {
      setError(err.message);
      console.error('Failed to initialize sync:', err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!syncManager || !inputMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      text: inputMessage,
      timestamp: Date.now(),
      author: syncManager.provider.awareness.getLocalState()?.user?.name || 'Anonymous'
    };

    syncManager.yMessages.push([message]);
    setInputMessage('');
  };

  const clearMessages = () => {
    if (!syncManager) return;
    syncManager.yMessages.delete(0, syncManager.yMessages.length);
  };

  return (
    <>
      <Head>
        <title>Basic P2P Sync Test</title>
      </Head>
      
      <div class="min-h-screen bg-gray-100 p-4">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-lg shadow-md p-6 mb-4">
            <h1 class="text-2xl font-bold mb-4">Basic P2P Sync Test</h1>
            
            <div class="mb-4 flex items-center space-x-4">
              <div class="flex items-center">
                <div class={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                <span>{connected ? 'Connected' : 'Connecting...'}</span>
              </div>
              <span class="text-gray-600">Room: {roomName}</span>
              <span class="text-gray-600">Peers: {peers}</span>
            </div>

            {error && (
              <div class="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
                Error: {error}
              </div>
            )}
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">Shared Messages</h2>
              <button
                onClick={clearMessages}
                class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Clear All
              </button>
            </div>

            <div class="mb-4 h-64 overflow-y-auto border rounded p-4 bg-gray-50">
              {messages.length === 0 ? (
                <p class="text-gray-500 text-center">No messages yet. Send one!</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} class="mb-2 p-2 bg-white rounded shadow-sm">
                    <div class="font-semibold text-sm">{msg.author}</div>
                    <div>{msg.text}</div>
                    <div class="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} class="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onInput={(e) => setInputMessage(e.target.value)}
                class="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a message..."
                disabled={!connected}
              />
              <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={!connected}
              >
                Send
              </button>
            </form>
          </div>

          <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-2">How to test:</h3>
            <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open this page in multiple browser tabs</li>
              <li>Send messages in one tab</li>
              <li>See them appear instantly in all other tabs</li>
              <li>Messages persist even after page refresh</li>
              <li>Works across different browsers on the same network</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}