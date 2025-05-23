import { IconVolume, IconVolumeOff } from "@tabler/icons-preact";
import { readAlways, toggleReadAlways } from "../../../components/chat/speech.ts";

export default function SpeechToggleButton() {
  const handleToggle = () => {
    toggleReadAlways(!readAlways.value);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      class={`p-2 rounded-lg transition-colors flex items-center justify-center ${
        readAlways.value
          ? "bg-primary-100 text-primary-600 hover:bg-primary-200"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
      }`}
      aria-label={readAlways.value ? "Disable AI speech" : "Enable AI speech"}
      title={readAlways.value ? "Disable AI speech" : "Enable AI speech"}
    >
      {readAlways.value ? (
        <IconVolume size={20} />
      ) : (
        <IconVolumeOff size={20} />
      )}
    </button>
  );
} 