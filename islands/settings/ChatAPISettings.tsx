import { Settings } from "../../types/settings.ts";
import { settingsContent } from "../../internalization/content.ts";

interface ChatAPISettingsProps {
  settings: Pick<Settings, "apiKey" | "apiUrl" | "apiModel">;
  onUpdateSettings: (key: string, value: string) => void;
  lang: string;
}

export default function ChatAPISettings({ settings, onUpdateSettings, lang }: ChatAPISettingsProps) {
  return (
    <div class="mb-4">
      <h3 class="font-medium mb-2">
        💬 {settingsContent[lang].chatApiTitle}
      </h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {settingsContent[lang].apiKeyLabel}
          </label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) =>
              onUpdateSettings(
                "apiKey",
                (e.target as HTMLInputElement).value,
              )}
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-yellow-50"
            placeholder={settingsContent[lang].apiKeyPlaceholder}
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {settingsContent[lang].apiUrlLabel}
          </label>
          <input
            type="text"
            value={settings.apiUrl}
            onChange={(e) =>
              onUpdateSettings(
                "apiUrl",
                (e.target as HTMLInputElement).value,
              )}
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder={settingsContent[lang].apiUrlPlaceholder}
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {settingsContent[lang].modelLabel}
          </label>
          <input
            type="text"
            value={settings.apiModel}
            onChange={(e) =>
              onUpdateSettings(
                "apiModel",
                (e.target as HTMLInputElement).value,
              )}
            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder={settingsContent[lang].modelPlaceholder}
          />
        </div>
      </div>
    </div>
  );
}