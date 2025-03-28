import { isApiConfigured } from "./store.ts";
import WelcomeBanner from "../WelcomeBanner.tsx";

export function ChatTemplate({ onOpenSettings, onStartTour }) {
  return (
    <div className="flex flex-col md:min-h-screen">
      {!isApiConfigured.value && (
        <WelcomeBanner
          onOpenSettings={onOpenSettings}
          onStartTour={onStartTour}
        />
      )}
    </div>
  );
} 