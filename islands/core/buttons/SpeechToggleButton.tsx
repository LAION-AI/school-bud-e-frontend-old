import { Volume2, VolumeX } from "lucide-preact";
import { readAlways, toggleReadAlways } from "../../../components/chat/speech.ts";

interface SpeechToggleButtonProps {
  lang?: string;
}

export default function SpeechToggleButton({ lang = "de" }: SpeechToggleButtonProps) {
  const handleToggle = () => {
    toggleReadAlways(!readAlways.value);
  };

  const getText = () => {
    if (readAlways.value) {
      return lang === "en" ? "Disable Audio" : "Ton an";
    } else {
      return lang === "en" ? "Enable Audio" : "Ton aus";
    }
  };

  const getAriaLabel = () => {
    if (readAlways.value) {
      return lang === "en" ? "Disable AI speech" : "KI-Sprache deaktivieren";
    } else {
      return lang === "en" ? "Enable AI speech" : "KI-Sprache aktivieren";
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      class={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
        readAlways.value
          ? "bg-primary-100 text-primary-600 hover:bg-primary-200"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
      }`}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      {readAlways.value ? (
        <Volume2 size={20} />
      ) : (
        <VolumeX size={20} />
      )}
      <span class="text-sm font-medium">{getText()}</span>
    </button>
  );
} 