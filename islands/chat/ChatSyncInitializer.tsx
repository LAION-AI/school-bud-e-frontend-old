import { useChatSync } from '../../lib/sync/useChatSync.ts';
import { ChatSyncStatus } from '../../components/chat/ChatSyncStatus.tsx';

export default function ChatSyncInitializer() {
  // Initialize chat sync
  useChatSync();
  
  return <ChatSyncStatus />;
} 