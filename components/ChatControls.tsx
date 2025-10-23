import { Mouse, MouseOff, Volume2, VolumeX } from "lucide-preact";
import { chatTemplateContent } from "../internalization/content.ts";

interface ChatControlsProps {
  readAlways: boolean;
  autoScroll: boolean;
  onToggleReadAlwaysAction: () => void;
  onToggleAutoScrollAction: () => void;
  lang: string;
}

export function ChatControls({
  readAlways,
  autoScroll,
  onToggleReadAlwaysAction,
  onToggleAutoScrollAction,
  lang,
}: ChatControlsProps) {
  return (
    <div class="flex space-x-4">
      <button
        class="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all backdrop-blur-sm bg-gray-800/30"
        onClick={onToggleReadAlwaysAction}
        title={readAlways
          ? chatTemplateContent[lang].readOutText
          : chatTemplateContent[lang].silent}
        type="button"
      >
        {readAlways ? <Volume2 /> : <VolumeX />}
      </button>
      <button
        class="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all backdrop-blur-sm bg-gray-800/30"
        onClick={onToggleAutoScrollAction}
        title={autoScroll
          ? chatTemplateContent[lang].autoScrollOn
          : chatTemplateContent[lang].autoScrollOff}
        type="button"
      >
        {autoScroll ? <Mouse /> : <MouseOff />}
      </button>
    </div>
  );
}
