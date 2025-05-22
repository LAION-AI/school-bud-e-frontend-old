import { useState } from "preact/hooks";
import { IS_BROWSER } from "fresh/runtime";
import { IconSettings, IconVolume, IconVolumeOff } from "@tabler/icons-preact";
import { readAlways } from "../../components/chat/speech.ts";

interface UserData {
  name?: string;
  email?: string;
  avatar?: string;
  preferences?: {
    language?: string;
    theme?: string;
  };
}

export default function UserProfileSection({
  lang = "en",
}: {
  lang?: string;
}) {
  const [userData, setUserData] = useState<UserData>(() => {
    if (!IS_BROWSER) return {};

    const storedData = localStorage.getItem("userData");
    return storedData ? JSON.parse(storedData) : {};
  });

  const [isSpeaking, setIsSpeaking] = useState(readAlways.value);
  const handleToggleSpeak = () => {
    readAlways.value = !readAlways.value;
    setIsSpeaking(readAlways.value);
  };

  return (
    <div class="border-t pt-2 flex items-center gap-2">
      <a
        href="/settings"
        class="p-2 rounded hover:bg-primary-100 transition-colors flex items-center gap-2"
        aria-label="Open settings page"
        title={lang === "de" ? "Einstellungen öffnen" : "Open settings"}
        data-tour="open-settings-button"
      >
        <IconSettings />
      </a>
      <button
        onClick={handleToggleSpeak}
        class={`p-2 rounded hover:bg-primary-100 transition-colors flex items-center ${
          isSpeaking ? "text-green-600" : "text-gray-400"
        }`}
        aria-label={isSpeaking
          ? "Mute (disable speech)"
          : "Speak (enable speech)"}
        title={isSpeaking ? "Mute (disable speech)" : "Speak (enable speech)"}
      >
        {isSpeaking ? <IconVolume size={20} /> : <IconVolumeOff size={20} />}
      </button>
    </div>
  );
}
