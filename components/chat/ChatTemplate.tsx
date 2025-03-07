import { isApiConfigured } from "./store.ts";
import WelcomeBanner from "../WelcomeBanner.tsx";

export function ChatTemplate({ onOpenSettings, onStartTour }) {
  return (
    <div className="flex flex-col min-h-screen">
      {!isApiConfigured.value && (
        <WelcomeBanner
          onOpenSettings={onOpenSettings}
          onStartTour={onStartTour}
        />
      )}
    </div>
  );
} 