import { Settings } from "../../types/settings.ts";
import { settingsContent } from "../../internalization/content.ts";

interface VLMSettingsProps {
  settings: Pick<Settings, "vlmKey" | "vlmUrl" | "vlmModel" | "vlmCorrectionModel">;
  onUpdateSettings: (key: string, value: string) => void;
  lang: string;
}

export default function VLMSettings({ settings, onUpdateSettings, lang }: VLMSettingsProps) {
  return (
    <div class="mb-4">
      <h3 class="font-medium mb-2">
        👀 {settingsContent[lang].vlmTitle}
      </h3>
      <div class="space-y-4">
        <input
          type="password"
          value={settings.vlmKey}
          onChange={(e) =>
            onUpdateSettings(
              "vlmKey",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-yellow-50"
          placeholder={settingsContent[lang].vlmKeyPlaceholder}
        />
        <input
          type="text"
          value={settings.vlmUrl}
          onChange={(e) =>
            onUpdateSettings(
              "vlmUrl",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder={settingsContent[lang].vlmUrlPlaceholder}
        />
        <input
          type="text"
          value={settings.vlmModel}
          onChange={(e) =>
            onUpdateSettings(
              "vlmModel",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder={settingsContent[lang].vlmModelPlaceholder}
        />
        <input
          type="text"
          value={settings.vlmCorrectionModel}
          onChange={(e) =>
            onUpdateSettings(
              "vlmCorrectionModel",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder={settingsContent[lang].vlmCorrectionModelPlaceholder}
        />
      </div>
    </div>
  );
}