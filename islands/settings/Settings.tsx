import { useSignal, useComputed } from "@preact/signals";
import { settingsContent } from "../../internalization/content.ts";
import ConfigurationSelector from "./ConfigurationSelector.tsx";
import TokenUsage from "./TokenUsage.tsx";
import { settings } from "../../components/chat/store.ts";

export default function Settings({
  lang = "en",
}: {
  lang?: string;
}) {
  const newSettings = useSignal({
    ...settings.value,
  });
  const activeTab = useSignal("general");
  const showPassword = useSignal(false);

  const providerConfigs = {
    googleai: {
      keyCharacteristics: { startsWith: "AI" },
      config: {
        api: {
          url:
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          model: "gemini-1.5-flash",
        },
        vlm: {
          url:
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          model: "gemini-1.5-flash",
        },
      },
      capabilities: ["chat", "vision"]
    },
    hyprlab: {
      keyCharacteristics: { startsWith: "hypr-lab" },
      config: {
        api: {
          url: "https://api.hyprlab.io/v1/chat/completions",
          model: "gemini-1.5-pro",
        },
        vlm: {
          url: "https://api.hyprlab.io/v1/chat/completions",
          model: "gemini-1.5-pro",
        },
      },
      capabilities: ["chat", "vision"]
    },
    groq: {
      keyCharacteristics: { startsWith: "gsk_" },
      config: {
        api: {
          url: "https://api.groq.com/openai/v1/chat/completions",
          model: "llama-3.3-70b-versatile",
        },
        vlm: {
          url: "https://api.groq.com/openai/v1/chat/completions",
          model: "llama-3.2-90b-vision-preview",
        },
        stt: {
          url: "https://api.groq.com/openai/v1/audio/transcriptions",
          model: "whisper-large-v3-turbo",
        },
      },
      capabilities: ["chat", "vision", "listen"]
    },
    sambanova: {
      keyCharacteristics: { length: 36 },
      config: {
        api: {
          url: "https://api.sambanova.ai/v1/chat/completions",
          model: "Meta-Llama-3.3-70B-Instruct",
        },
        vlm: {
          url: "https://api.sambanova.ai/v1/chat/completions",
          model: "Meta-Llama-3.2-90B-Vision-Instruct",
        },
      },
      capabilities: ["chat", "vision"]
    },
    fish: {
      keyCharacteristics: { length: 32 },
      config: {
        tts: {
          url: "https://api.fish.audio/v1/tts",
          model: lang === "de" ? "61561f50f41046e0b267aa4cb30e4957" : "6f45f4694ff54d6980337a68902e20d7",
        },
      },
      capabilities: ["speak"]
    },
    deepgram: {
      keyCharacteristics: { length: 40 },
      config: {
        stt: {
          url: `https://api.deepgram.com/v1/listen?language=en&model=nova-2`,
          model: "nova-2",
        },
        tts: {
          url: `https://api.deepgram.com/v1/speak?model=aura-helios-en`,
          model: "aura-helios-en",
        },
      },
      capabilities: ["speak", "listen"]
    },
  };

  // Compute enabled capabilities based on current settings
  const enabledCapabilities = useComputed(() => {
    const capabilities = new Set<string>();
    
    // Check if universal API key is provided
    if (newSettings.value.universalApiKey) {
      // Try to determine provider based on key characteristics
      for (const [provider, config] of Object.entries(providerConfigs)) {
        const { keyCharacteristics } = config;
        if (
          ("startsWith" in keyCharacteristics && 
           newSettings.value.universalApiKey.startsWith(keyCharacteristics.startsWith)) ||
          ("length" in keyCharacteristics && 
           keyCharacteristics.length === newSettings.value.universalApiKey.length)
        ) {
          // Add all capabilities from this provider
          config.capabilities.forEach(cap => capabilities.add(cap));
          break;
        }
      }
    }
    
    // Check individual service keys too
    if (newSettings.value.apiKey) capabilities.add("chat");
    if (newSettings.value.vlmKey) capabilities.add("vision");
    if (newSettings.value.ttsKey) capabilities.add("speak");
    if (newSettings.value.sttKey) capabilities.add("listen");
    
    return Array.from(capabilities);
  });

  function handleTogglePasswordVisibility() {
    showPassword.value = !showPassword.value;
  }

  function handleChange(e: any) {
    const { name, value } = e.target;
    updateSettings(name, value);
  }

  function handleSubmit(e: any) {
    e.preventDefault();
    settings.value = { ...newSettings.value };
  }

  const updateSettings = (key: string, value: string) => {
    const updatedSettings = { ...newSettings.value };

    if (key !== "universalApiKey") {
      if (key.endsWith("Key") && value !== "") {
        const serviceType = key.slice(0, -3);
        const urlKey = `${serviceType}Url` as keyof typeof settings.value;
        const modelKey = `${serviceType}Model` as keyof typeof settings.value;

        // Find matching provider based on key characteristics
        const provider = Object.values(providerConfigs).find((provider) => {
          const { keyCharacteristics } = provider;
          return (
            ("startsWith" in keyCharacteristics &&
              value.startsWith(keyCharacteristics.startsWith)) ||
            ("length" in keyCharacteristics &&
              keyCharacteristics.length === value.length)
          );
        });

        if (provider?.config[serviceType as keyof typeof provider.config]) {
          const serviceConfig = provider
            .config[serviceType as keyof typeof provider.config] as {
              url: string;
              model: string;
            };
          updatedSettings[urlKey] = serviceConfig.url;
          updatedSettings[modelKey] = serviceConfig.model;
        }
      }
    }

    updatedSettings[key as keyof typeof settings.value] = value;
    newSettings.value = updatedSettings;
  }
  console.log(updateSettings);

  // Get capability explanation
  function getCapabilityExplanation(capability: string) {
    const explanations = {
      chat: {
        title: lang === "de" ? "Text-Chat" : "Text Chat",
        description: lang === "de" 
          ? "Bud-E kann mit dir über Text kommunizieren." 
          : "Bud-E can communicate with you through text.",
        icon: "💬"
      },
      vision: {
        title: lang === "de" ? "Bild-Verständnis" : "Image Understanding",
        description: lang === "de" 
          ? "Bud-E kann Bilder sehen und verstehen, die du hochlädst." 
          : "Bud-E can see and understand images you upload.",
        icon: "👁️"
      },
      speak: {
        title: lang === "de" ? "Sprachausgabe" : "Voice Output",
        description: lang === "de" 
          ? "Bud-E kann mit dir sprechen und Text in gesprochene Sprache umwandeln." 
          : "Bud-E can speak to you and convert text to speech.",
        icon: "🔊"
      },
      listen: {
        title: lang === "de" ? "Spracherkennung" : "Voice Recognition",
        description: lang === "de" 
          ? "Bud-E kann zuhören und deine gesprochene Sprache verstehen." 
          : "Bud-E can listen and understand your spoken words.",
        icon: "🎤"
      }
    };
    
    return explanations[capability as keyof typeof explanations] || {
      title: capability,
      description: "",
      icon: "✨"
    };
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => activeTab.value = "general"}
            className={`${
              activeTab.value === "general"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {lang === "de" ? "Allgemein" : "General"}
          </button>
          <button
            onClick={() => activeTab.value = "token-usage"}
            className={`${
              activeTab.value === "token-usage"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {lang === "de" ? "Token-Nutzung" : "Token Usage"}
          </button>
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab.value === "general" && (
        <>
          {/* Add a highlight box for API key importance */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">API Key Required</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    To use Bud-E, you need to provide an API key. Enter your key below to unlock all features.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Existing settings form, but with better styling */}
          <form onSubmit={handleSubmit} className="space-y-4" data-tour="settings-form">
            {/* Universal API Key input with copy-paste guidance */}
            <div className="mb-6" data-tour="api-key-input">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Universal API Key
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showPassword.value ? "text" : "password"}
                  name="universalApiKey"
                  value={newSettings.value.universalApiKey}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your API key here"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={handleTogglePasswordVisibility}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    {showPassword.value ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter your AI provider API key here.
              </p>
            </div>
            
            {/* New - Capability Display Section */}
            {newSettings.value.universalApiKey && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-md font-medium text-gray-800 mb-3">
                  {lang === "de" ? "Aktivierte Funktionen" : "Enabled Capabilities"}
                </h3>
                
                {enabledCapabilities.value.length > 0 ? (
                  <div className="space-y-3">
                    {enabledCapabilities.value.map(capability => {
                      const capInfo = getCapabilityExplanation(capability);
                      return (
                        <div key={capability} className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 text-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">
                              <span className="mr-2">{capInfo.icon}</span>
                              {capInfo.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {capInfo.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    {lang === "de" 
                      ? "Keine Funktionen aktiviert. Bitte gib einen API-Schlüssel ein."
                      : "No capabilities enabled. Please provide an API key."}
                  </p>
                )}
                
                <div className="mt-3 text-xs text-gray-500">
                  {lang === "de"
                    ? "Die Fähigkeiten von Bud-E hängen vom verwendeten API-Schlüssel ab."
                    : "Bud-E's capabilities depend on the API key provided."}
                </div>
              </div>
            )}

            {/* System Prompt */}
            <div className="mb-6" data-tour="system-prompt">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Prompt <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                name="systemPrompt"
                value={newSettings.value.systemPrompt}
                onChange={handleChange}
                rows={4}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter a system prompt to customize the AI's behavior"
              ></textarea>
              <p className="mt-1 text-sm text-gray-500">
                Customize how the AI responds by providing specific instructions.
              </p>
            </div>

            {/* Advanced Settings - Now always visible */}
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Advanced Settings</h3>
              <ConfigurationSelector
                serviceType="api"
                currentConfig={{
                  url: newSettings.value.apiUrl,
                  model: newSettings.value.apiModel,
                  key: newSettings.value.apiKey,
                }}
                onUpdateSettings={updateSettings}
                lang={lang}
                icon="💬"
                title={settingsContent[lang].chatApiTitle}
              />
              <ConfigurationSelector
                serviceType="tts"
                currentConfig={{
                  url: newSettings.value.ttsUrl,
                  model: newSettings.value.ttsModel,
                  key: newSettings.value.ttsKey,
                }}
                onUpdateSettings={updateSettings}
                lang={lang}
                icon="🗣️"
                title={settingsContent[lang].ttsTitle}
              />
              <ConfigurationSelector
                serviceType="stt"
                currentConfig={{
                  url: newSettings.value.sttUrl,
                  model: newSettings.value.sttModel,
                  key: newSettings.value.sttKey,
                }}
                onUpdateSettings={updateSettings}
                lang={lang}
                icon="👂"
                title={settingsContent[lang].sttTitle}
              />
              <ConfigurationSelector
                serviceType="vlm"
                currentConfig={{
                  url: newSettings.value.vlmUrl,
                  model: newSettings.value.vlmModel,
                  key: newSettings.value.vlmKey,
                }}
                onUpdateSettings={updateSettings}
                lang={lang}
                icon="👀"
                title={settingsContent[lang].vlmTitle}
              />
            </div>
            
            {/* Submit and Cancel buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                data-tour="save-settings"
              >
                Save Settings
              </button>
            </div>
          </form>
        </>
      )}

      {/* Token Usage Tab */}
      {activeTab.value === "token-usage" && (
        <TokenUsage lang={lang} />
      )}
    </div>
  );
}