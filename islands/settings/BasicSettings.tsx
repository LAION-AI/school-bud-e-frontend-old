import { Settings } from "../../types/settings.ts";
import { settingsContent } from "../../internalization/content.ts";

interface BasicSettingsProps {
  settings: Pick<Settings, "universalApiKey">;
  onUpdateSettings: (key: string, value: string) => void;
  lang: string;
}

export default function BasicSettings({ settings, onUpdateSettings, lang }: BasicSettingsProps) {
  return (
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        🌐 {settingsContent[lang].universalApiKeyLabel}
      </label>
      <input
        type="password"
        value={settings.universalApiKey}
        onChange={(e) =>
          onUpdateSettings(
            "universalApiKey",
            (e.target as HTMLInputElement).value,
          )}
        class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-yellow-50"
        placeholder={settingsContent[lang].universalApiKeyPlaceholder}
      />
    </div>
  );
}