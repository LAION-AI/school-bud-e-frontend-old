import { useChatSync } from '../../lib/sync/useChatSync.ts';
import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

interface ChatSyncStatusProps {
  lang?: string;
}

export function ChatSyncStatus({ lang = "en" }: ChatSyncStatusProps) {
  const { getSyncState, isEnabled } = useChatSync();
  const syncState = useSignal(getSyncState());
  
  useEffect(() => {
    // Update sync state periodically
    const interval = setInterval(() => {
      syncState.value = getSyncState();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [getSyncState]);
  
  if (!isEnabled()) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
      <div className={`w-2 h-2 rounded-full ${
        syncState.value.connected ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span>
        {syncState.value.connected 
          ? (lang === "de" ? 'Synchronisiert' : 'Synced')
          : (lang === "de" ? 'Synchronisiere...' : 'Syncing...')
        }
      </span>
      {syncState.value.peers > 0 && (
        <span className="text-gray-400">
          • {syncState.value.peers} {lang === "de" 
            ? (syncState.value.peers === 1 ? 'Peer' : 'Peers')
            : `peer${syncState.value.peers !== 1 ? 's' : ''}`
          }
        </span>
      )}
    </div>
  );
} 