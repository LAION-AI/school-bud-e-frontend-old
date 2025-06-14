import { IconBrain, IconKey, IconLink } from "@tabler/icons-preact";
import type { JSX } from "preact";

interface ModelConfig {
  url: string;
  model: string;
  key?: string;
}

interface ModelSelectorProps {
  serviceType: string;
  currentConfig: ModelConfig;
  onUpdateSettings: (key: string, value: string) => void;
  capabilities: string[];
  title: string;
  lang: string;
}

export default function ModelSelector({
  serviceType,
  currentConfig,
  onUpdateSettings,
  capabilities,
  title,
  lang,
}: ModelSelectorProps) {
  const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    onUpdateSettings(`${serviceType}${target.name}`, target.value);
  };

  const getCapabilityLabel = (capability: string) => {
    const labels: Record<string, { de: string; en: string }> = {
      chat: { de: "Text-Chat", en: "Text Chat" },
      vision: { de: "Bild-Verständnis", en: "Image Understanding" },
      speak: { de: "Sprachausgabe", en: "Voice Output" },
      listen: { de: "Spracherkennung", en: "Voice Recognition" },
    };

    return labels[capability]?.[lang === "de" ? "de" : "en"] || capability;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <IconBrain className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      </div>

      <div className="space-y-4">
        {/* API Key Input */}
        <div>
          <label className="flex items-center text-sm text-gray-600 mb-1">
            <IconKey className="h-4 w-4 mr-1" />
            {lang === "de" ? "API-Schlüssel" : "API Key"}
          </label>
          <input
            type="password"
            name="Key"
            value={currentConfig.key || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={lang === "de"
              ? "API-Schlüssel eingeben"
              : "Enter API key"}
          />
        </div>

        {/* Model Selection */}
        <div>
          <label className="flex items-center text-sm text-gray-600 mb-1">
            <IconBrain className="h-4 w-4 mr-1" />
            {lang === "de" ? "Modell" : "Model"}
          </label>
          <input
            type="text"
            name="Model"
            value={currentConfig.model}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={lang === "de" ? "Modell auswählen" : "Select model"}
          />
        </div>

        {/* URL Input */}
        <div>
          <label className="flex items-center text-sm text-gray-600 mb-1">
            <IconLink className="h-4 w-4 mr-1" />
            {lang === "de" ? "API-Endpunkt" : "API Endpoint"}
          </label>
          <input
            type="text"
            name="Url"
            value={currentConfig.url}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={lang === "de"
              ? "API-Endpunkt eingeben"
              : "Enter API endpoint"}
          />
        </div>

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className="mt-2">
            <label className="text-xs text-gray-500 mb-1">
              {lang === "de"
                ? "Unterstützte Funktionen"
                : "Supported Capabilities"}
            </label>
            <div className="flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <span
                  key={capability}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {getCapabilityLabel(capability)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
