import { FreshContext } from "fresh";
import SyncJoinFormIsland from "../islands/SyncJoinFormIsland.tsx";

export default function SyncPage(ctx: FreshContext) {
  const req = ctx.req;
  const url = new URL(req.url);

  const defaultRoom = url.searchParams.get('room') || 'default-room';

  return (
    <>
        <title>P2P Sync Demo</title>
      
      <div class="min-h-screen bg-gray-100">
        <div class="bg-white shadow-sm">
          <div class="max-w-6xl mx-auto px-4 py-4">
            <h1 class="text-2xl font-bold text-gray-900">P2P Sync Demo</h1>
            <p class="text-sm text-gray-600 mt-1">
              Test peer-to-peer file synchronization with WebRTC
            </p>
          </div>
        </div>

        <SyncJoinFormIsland initialRoomName={defaultRoom} />

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