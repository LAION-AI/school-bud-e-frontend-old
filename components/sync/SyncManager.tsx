import { useSyncStorage } from '../../lib/sync/useSyncStorage.ts';
import { useState, useRef } from 'preact/hooks';
import { formatBytes, formatRelativeTime } from '../../utils/format.ts';

interface SyncManagerProps {
  roomName: string;
  userName?: string;
  password?: string;
}

export function SyncManager({ roomName, userName, password }: SyncManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  
  const { state, addFile, downloadFile, requestPersistentStorage } = useSyncStorage({
    roomName,
    userName,
    password,
    autoSync: true,
    autoSyncInterval: 30000
  });

  const handleFileUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    for (const file of files) {
      try {
        const fileId = await addFile(file, {
          name: file.name,
          type: file.type
        });
        console.log('File uploaded:', fileId);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    // Reset input
    input.value = '';
  };

  const handleDownload = async (fileId: string) => {
    try {
      await downloadFile(fileId);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleRequestPersistentStorage = async () => {
    const granted = await requestPersistentStorage();
    if (granted) {
      alert('Persistent storage granted!');
    } else {
      alert('Persistent storage denied.');
    }
  };

  if (!state.initialized) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Initializing P2P sync...</span>
      </div>
    );
  }

  return (
    <div class="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-900">P2P Sync Manager</h2>
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <div class={`w-3 h-3 rounded-full ${state.connected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <span class="text-sm text-gray-600">
                {state.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span class="text-sm text-gray-500">
              {state.peers} {state.peers === 1 ? 'peer' : 'peers'}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-500">Room</div>
            <div class="font-mono text-sm mt-1">{roomName}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-500">User ID</div>
            <div class="font-mono text-xs mt-1 truncate">{state.userId}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-500">Storage</div>
            <div class="text-sm mt-1">
              {formatBytes(state.storageInfo.used || 0)} used
              {state.storageInfo.available && ` / ${formatBytes(state.storageInfo.available)} available`}
            </div>
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload File
          </button>
          <button
            onClick={handleRequestPersistentStorage}
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Request Persistent Storage
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          class="hidden"
        />
      </div>

      {/* Files List */}
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Shared Files</h3>
        
        {state.files.length === 0 ? (
          <div class="text-center py-8 text-gray-500">
            No files shared yet. Upload a file to get started!
          </div>
        ) : (
          <div class="space-y-2">
            {state.files.map((file) => (
              <div
                key={file.metadata.id}
                class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 truncate">
                    {file.metadata.name}
                  </div>
                  <div class="text-sm text-gray-500 mt-1">
                    {formatBytes(file.metadata.size)} • 
                    {formatRelativeTime(file.metadata.modified)} • 
                    {file.metadata.author === state.userId ? ' You' : ' Peer'}
                  </div>
                </div>
                
                <div class="flex items-center ml-4">
                  {file.syncStatus === 'synced' && (
                    <span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      Available
                    </span>
                  )}
                  {file.syncStatus === 'pending' && (
                    <button
                      onClick={() => handleDownload(file.metadata.id)}
                      class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Download
                    </button>
                  )}
                  {file.syncStatus === 'downloading' && (
                    <div class="flex items-center">
                      <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          class="bg-blue-600 h-2 rounded-full transition-all"
                          style={`width: ${downloadProgress[file.metadata.id] || 0}%`}
                        ></div>
                      </div>
                      <span class="text-sm text-gray-600">
                        {downloadProgress[file.metadata.id] || 0}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connected Users */}
      {state.users.length > 0 && (
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Connected Users</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.users.map((user) => (
              <div
                key={user.clientId}
                class="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={`background-color: ${user.color || '#gray'}`}
                >
                  {(user.name || 'Anonymous').charAt(0).toUpperCase()}
                </div>
                <div class="ml-3">
                  <div class="font-medium">{user.name || 'Anonymous'}</div>
                  <div class="text-sm text-gray-500">
                    {user.userId === state.userId ? 'You' : 'Peer'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800">Error: {state.error}</p>
        </div>
      )}
    </div>
  );
}

// Utility functions (should be in a separate utils file)
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}