import { Settings } from "../../types/settings.ts";
import { settingsContent } from "../../internalization/content.ts";

interface TTSSettingsProps {
  settings: Pick<Settings, "ttsKey" | "ttsUrl" | "ttsModel">;
  onUpdateSettings: (key: string, value: string) => void;
  lang: string;
}

export default function TTSSettings({ settings, onUpdateSettings, lang }: TTSSettingsProps) {
  return (
    <div class="mb-4">
      <h3 class="font-medium mb-2">
        🗣️ {settingsContent[lang].ttsTitle}
      </h3>
      <div class="space-y-4">
        <input
          type="password"
          value={settings.ttsKey}
          onChange={(e) =>
            onUpdateSettings(
              "ttsKey",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-yellow-50"
          placeholder={settingsContent[lang].ttsKeyPlaceholder}
        />
        <input
          type="text"
          value={settings.ttsUrl}
          onChange={(e) =>
            onUpdateSettings(
              "ttsUrl",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder={settingsContent[lang].ttsUrlPlaceholder}
        />
        <input
          type="text"
          value={settings.ttsModel}
          onChange={(e) =>
            onUpdateSettings(
              "ttsModel",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder={settingsContent[lang].ttsModelPlaceholder}
        />
      </div>
    </div>
  );
}