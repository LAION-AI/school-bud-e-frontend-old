import { SyncManager } from "../components/sync/SyncManager.tsx";

interface SyncManagerIslandProps {
  roomName: string;
  userName?: string;
  password?: string;
}

export default function SyncManagerIsland(props: SyncManagerIslandProps) {
  return <SyncManager {...props} />;
} 