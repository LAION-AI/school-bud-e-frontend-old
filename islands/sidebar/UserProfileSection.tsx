import { IconSettings } from "@tabler/icons-preact";
import SpeechToggleButton from "../core/buttons/SpeechToggleButton.tsx";

export default function UserProfileSection({ lang = "en" }: { lang?: string }) {
  return (
    <div class="border-t border-gray-200 pt-2 flex items-center gap-2">
      <a
        href="/settings"
        class="border border-gray-200 p-2 rounded hover:bg-primary-100 transition-colors flex items-center gap-2"
        aria-label="Open settings page"
        title={lang === "de" ? "Einstellungen öffnen" : "Open settings"}
        data-tour="open-settings-button"
      >
        <IconSettings />
        <span class="text-sm font-medium">
          {lang === "de" ? "Einstellungen" : "Settings"}
        </span>
      </a>
      <SpeechToggleButton lang={lang} />
    </div>
  );
}
