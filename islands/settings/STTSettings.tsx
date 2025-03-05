import { Settings } from "../../types/settings.ts";
import { settingsContent } from "../../internalization/content.ts";

interface STTSettingsProps {
  settings: Pick<Settings, "sttKey" | "sttUrl" | "sttModel">;
  onUpdateSettings: (key: string, value: string) => void;
  lang: string;
}

export default function STTSettings({ settings, onUpdateSettings, lang }: STTSettingsProps) {
  return (
    <div class="mb-4">
      <h3 class="font-medium mb-2">
        👂 {settingsContent[lang].sttTitle}
      </h3>
      <div class="space-y-4">
        <input
          type="password"
          value={settings.sttKey}
          onChange={(e) =>
            onUpdateSettings(
              "sttKey",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-yellow-50"
          placeholder={settingsContent[lang].sttKeyPlaceholder}
        />
        <input
          type="text"
          value={settings.sttUrl}
          onChange={(e) =>
            onUpdateSettings(
              "sttUrl",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder={settingsContent[lang].sttUrlPlaceholder}
        />
        <input
          type="text"
          value={settings.sttModel}
          onChange={(e) =>
            onUpdateSettings(
              "sttModel",
              (e.target as HTMLInputElement).value,
            )}
          class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder={settingsContent[lang].sttModelPlaceholder}
        />
      </div>
    </div>
  );
}