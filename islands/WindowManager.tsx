import { useSignal } from "@preact/signals";
import { JSX } from "preact";
import AIFloatingButton from "./AIFloatingButton.tsx";

interface Window {
  id: string;
  title: string;
  content: JSX.Element;
  isMinimized: boolean;
}

interface WindowManagerProps {
  initialWindow: Window;
}

export default function WindowManager({ initialWindow }: WindowManagerProps) {
  const windows = useSignal<Window[]>([initialWindow]);
  const activeWindowId = useSignal<string>(initialWindow.id);

  const handleMinimize = (windowId: string) => {
    windows.value = windows.value.map(w => 
      w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
    );
  };

  const handleActivate = (windowId: string) => {
    activeWindowId.value = windowId;
  };

  return (
    <div class="relative md:min-h-screen bg-gray-100">
      <div class="flex space-x-2 p-4 bg-white shadow-sm">
        {windows.value.map(window => (
          <button
            key={window.id}
            type="button"
            onClick={() => handleMinimize(window.id)}
            class={`px-4 py-2 rounded-lg transition-colors ${
              window.id === activeWindowId.value
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            {window.title}
          </button>
        ))}
      </div>

      <div class="p-4">
        {windows.value.map(window => (
          !window.isMinimized && (
            <button
              key={window.id}
              type="button"
              onClick={() => handleActivate(window.id)}
              class={`rounded-lg shadow-lg overflow-hidden transition-all ${
                window.id === activeWindowId.value
                  ? "z-10"
                  : "z-0 opacity-50"
              }`}
            >
              {window.content}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
