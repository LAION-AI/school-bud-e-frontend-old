import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import { SyncManager } from "../components/sync/SyncManager.tsx";
import { useState } from "preact/hooks";

export default function SyncPage(props: PageProps) {
  const urlParams = new URLSearchParams(props.url.search);
  const defaultRoom = urlParams.get('room') || 'default-room';
  const [roomName, setRoomName] = useState(defaultRoom);
  const [userName, setUserName] = useState('');
  const [showConfig, setShowConfig] = useState(true);

  const handleJoinRoom = (e: Event) => {
    e.preventDefault();
    setShowConfig(false);
  };

  return (
    <>
      <Head>
        <title>P2P Sync Demo</title>
      </Head>
      
      <div class="min-h-screen bg-gray-100">
        <div class="bg-white shadow-sm">
          <div class="max-w-6xl mx-auto px-4 py-4">
            <h1 class="text-2xl font-bold text-gray-900">P2P Sync Demo</h1>
            <p class="text-sm text-gray-600 mt-1">
              Test peer-to-peer file synchronization with WebRTC
            </p>
          </div>
        </div>

        {showConfig ? (
          <div class="max-w-md mx-auto mt-12 p-6">
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold mb-4">Join a Sync Room</h2>
              
              <form onSubmit={handleJoinRoom}>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onInput={(e) => setRoomName((e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter room name"
                    required
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Share this room name with others to sync files
                  </p>
                </div>

                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onInput={(e) => setUserName((e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                </div>

                <button
                  type="submit"
                  class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Join Room
                </button>
              </form>

              <div class="mt-6 pt-6 border-t border-gray-200">
                <h3 class="font-medium text-gray-900 mb-2">How it works:</h3>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li>• Files are synced directly between browsers using WebRTC</li>
                  <li>• Metadata syncs automatically, large files sync on-demand</li>
                  <li>• Data is stored locally using OPFS for gigabyte-scale files</li>
                  <li>• Works offline once files are synced</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div class="py-6">
            <SyncManager 
              roomName={roomName} 
              userName={userName || undefined}
            />
            
            <div class="max-w-6xl mx-auto px-6 mt-4">
              <button
                onClick={() => setShowConfig(true)}
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to room selection
              </button>
            </div>
          </div>
        )}

        <div class="max-w-6xl mx-auto px-6 py-8 mt-8">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
            <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open this page in multiple browser tabs or different browsers</li>
              <li>Use the same room name to connect them</li>
              <li>Upload files in one tab and see them appear in others</li>
              <li>Large files show as "pending" until manually downloaded</li>
              <li>Try going offline - local files remain accessible</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}