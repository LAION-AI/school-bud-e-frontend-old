import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { IconInfoCircleFilled } from "@tabler/icons-preact";
import type { JSX } from "preact";
import { settings } from "../../components/chat/store.ts";
import Capabilities from "./Capabilities.tsx";
import ModelManager from "./ModelManager.tsx";
import TokenUsage from "./TokenUsage.tsx";
import type { Translations } from "./settings.translations.d.ts";
import translations from "./settings.translations.json" with { type: "json" };
import Input from "../../components/core/Input.tsx";
import Textarea from "../../components/core/Textarea.tsx";

interface Model {
  id: string;
  name: string;
  key: string;
  url: string;
  model: string;
  capabilities: string[];
}

const STORAGE_KEYS = {
  MODELS: "bud-e-models",
  SELECTED_MODELS: "bud-e-selected-models",
} as const;

export default function Settings({ lang = "en" }: { lang?: string }) {
  const t = (translations as Translations)[lang as keyof Translations];
  const newSettings = useSignal({
    ...settings.peek(),
  });
  
  // Sync settings
  const syncSettings = useSignal({
    roomName: localStorage.getItem("bud-e-sync-room") || "school-bud-e-default",
    userName: localStorage.getItem("bud-e-sync-user") || "Student",
    password: localStorage.getItem("bud-e-sync-password") || "secure123",
    enabled: localStorage.getItem("bud-e-sync-enabled") === "true",
  });
  const activeTab = useSignal("general");
  const models = useSignal<Model[]>([]);
  const selectedModels = useSignal<Record<string, string>>({});
  const showPassword = useSignal(false);
  const showNewModelForm = useSignal(false);
  const editingModel = useSignal<Model | null>(null);
  const preselectedCapability = useSignal<string | null>(null);

  useEffect(() => {
    // Initialize models from localStorage or settings
    if (models.value.length === 0) {
      // Try to load from localStorage first
      const savedModels = localStorage.getItem(STORAGE_KEYS.MODELS);
      const savedSelectedModels = localStorage.getItem(
        STORAGE_KEYS.SELECTED_MODELS,
      );

      if (savedModels && savedSelectedModels) {
        try {
          models.value = JSON.parse(savedModels);
          selectedModels.value = JSON.parse(savedSelectedModels);
          // Update settings based on saved models
          updateSettingsFromModels();
        } catch (error) {
          console.error("Error loading saved models:", error);
          initializeModelsFromSettings();
        }
      } else {
        initializeModelsFromSettings();
      }
    }

    // Cleanup function
    return () => {
      // Clear signals on unmount to prevent memory leaks
      models.value = [];
      selectedModels.value = {};
      newSettings.value = { ...settings.peek() };
      showPassword.value = false;
      activeTab.value = "general";
    };
  }, [models, selectedModels, newSettings, showPassword, activeTab]);

  function initializeModelsFromSettings() {
    const initialModels: Model[] = [];
    const initialSelectedModels: Record<string, string> = {};

    // Add models from individual settings
    if (newSettings.value.apiKey) {
      initialModels.push({
        id: "default-chat",
        name: "Default Chat Model",
        key: newSettings.value.apiKey,
        url: newSettings.value.apiUrl,
        model: newSettings.value.apiModel,
        capabilities: ["chat"],
      });
      initialSelectedModels.chat = "default-chat";
    }
    if (newSettings.value.vlmKey) {
      initialModels.push({
        id: "default-vision",
        name: "Default Vision Model",
        key: newSettings.value.vlmKey,
        url: newSettings.value.vlmUrl,
        model: newSettings.value.vlmModel,
        capabilities: ["vision"],
      });
      initialSelectedModels.vision = "default-vision";
    }
    if (newSettings.value.ttsKey) {
      initialModels.push({
        id: "default-tts",
        name: "Default TTS Model",
        key: newSettings.value.ttsKey,
        url: newSettings.value.ttsUrl,
        model: newSettings.value.ttsModel,
        capabilities: ["speak"],
      });
      initialSelectedModels.speak = "default-tts";
    }
    if (newSettings.value.sttKey) {
      initialModels.push({
        id: "default-stt",
        name: "Default STT Model",
        key: newSettings.value.sttKey,
        url: newSettings.value.sttUrl,
        model: newSettings.value.sttModel,
        capabilities: ["listen"],
      });
      initialSelectedModels.listen = "default-stt";
    }

    models.value = initialModels;
    selectedModels.value = initialSelectedModels;

    // Save to localStorage
    saveModelsToStorage();
  }

  function saveModelsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models.value));
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_MODELS,
        JSON.stringify(selectedModels.value),
      );
    } catch (error) {
      console.error("Error saving models to localStorage:", error);
    }
  }

  // Compute enabled capabilities based on available models
  const enabledCapabilities = useComputed(() => {
    const capabilities = new Set<string>();

    for (const model of models.value) {
      for (const capability of model.capabilities) {
        capabilities.add(capability);
      }
    }

    return Array.from(capabilities);
  });

  function handleTogglePasswordVisibility() {
    showPassword.value = !showPassword.value;
  }

  function handleChange(
    e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    updateSettings(target.name, target.value);
  }

  const updateSettings = (key: string, value: string) => {
    const updatedSettings = { ...newSettings.value };
    updatedSettings[key as keyof typeof settings.value] = value;
    newSettings.value = updatedSettings;
    // Immediately save to global settings
    settings.value = { ...updatedSettings };
  };

  function handleUpdateModel(model: Model) {
    const updatedModels = models.value.map((m) =>
      m.id === model.id ? model : m
    );
    models.value = updatedModels;
    updateSettingsFromModels();
    saveModelsToStorage();
  }

  function handleDeleteModel(modelId: string) {
    models.value = models.value.filter((m) => m.id !== modelId);
    // Remove any selected model references
    const updatedSelectedModels = { ...selectedModels.value };
    for (
      const [capability, selectedId] of Object.entries(
        updatedSelectedModels,
      )
    ) {
      if (selectedId === modelId) {
        delete updatedSelectedModels[capability];
      }
    }
    selectedModels.value = updatedSelectedModels;
    updateSettingsFromModels();
    saveModelsToStorage();
  }

  function handleAddModel(model: Model) {
    models.value = [...models.value, model];
    // If this is the first model for any capability, select it automatically
    for (const capability of model.capabilities) {
      if (!selectedModels.value[capability]) {
        selectedModels.value = {
          ...selectedModels.value,
          [capability]: model.id,
        };
      }
    }
    updateSettingsFromModels();
    saveModelsToStorage();
  }

  function handleSelectModel(capabilityId: string, modelId: string) {
    selectedModels.value = {
      ...selectedModels.value,
      [capabilityId]: modelId,
    };
    updateSettingsFromModels();
    saveModelsToStorage();
  }

  function updateSettingsFromModels() {
    const updatedSettings = { ...newSettings.value };

    // Reset all model-related settings
    updatedSettings.apiKey = "";
    updatedSettings.apiUrl = "";
    updatedSettings.apiModel = "";
    updatedSettings.vlmKey = "";
    updatedSettings.vlmUrl = "";
    updatedSettings.vlmModel = "";
    updatedSettings.ttsKey = "";
    updatedSettings.ttsUrl = "";
    updatedSettings.ttsModel = "";
    updatedSettings.sttKey = "";
    updatedSettings.sttUrl = "";
    updatedSettings.sttModel = "";

    // Update settings based on selected models
    for (const [capability, modelId] of Object.entries(selectedModels.value)) {
      const model = models.value.find((m) => m.id === modelId);
      if (!model) continue;

      switch (capability) {
        case "chat":
          updatedSettings.apiKey = model.key;
          updatedSettings.apiUrl = model.url;
          updatedSettings.apiModel = model.model;
          break;
        case "vision":
          updatedSettings.vlmKey = model.key;
          updatedSettings.vlmUrl = model.url;
          updatedSettings.vlmModel = model.model;
          break;
        case "speak":
          updatedSettings.ttsKey = model.key;
          updatedSettings.ttsUrl = model.url;
          updatedSettings.ttsModel = model.model;
          break;
        case "listen":
          updatedSettings.sttKey = model.key;
          updatedSettings.sttUrl = model.url;
          updatedSettings.sttModel = model.model;
          break;
      }
    }

    newSettings.value = updatedSettings;
    settings.value = { ...updatedSettings };
  }

  function handleSystemPromptChange(e: JSX.TargetedEvent<HTMLTextAreaElement>) {
    const target = e.target as HTMLTextAreaElement;
    newSettings.value = {
      ...newSettings.value,
      systemPrompt: target.value,
    };
    settings.value = {
      ...settings.value,
      systemPrompt: target.value,
    };
  }

  // Get capability explanation
  function getCapabilityExplanation(capability: string) {
    const explanations = {
      chat: {
        title: lang === "de" ? "Text-Chat" : "Text Chat",
        description: lang === "de"
          ? "Bud-E kann mit dir über Text kommunizieren."
          : "Bud-E can communicate with you through text.",
        icon: "💬",
      },
      vision: {
        title: lang === "de" ? "Bild-Verständnis" : "Image Understanding",
        description: lang === "de"
          ? "Bud-E kann Bilder sehen und verstehen, die du hochlädst."
          : "Bud-E can see and understand images you upload.",
        icon: "👁️",
      },
      speak: {
        title: lang === "de" ? "Sprachausgabe" : "Voice Output",
        description: lang === "de"
          ? "Bud-E kann mit dir sprechen und Text in gesprochene Sprache umwandeln."
          : "Bud-E can speak to you and convert text to speech.",
        icon: "🔊",
      },
      listen: {
        title: lang === "de" ? "Spracherkennung" : "Voice Recognition",
        description: lang === "de"
          ? "Bud-E kann zuhören und deine gesprochene Sprache verstehen."
          : "Bud-E can listen and understand your spoken words.",
        icon: "🎤",
      },
    };

    return (
      explanations[capability as keyof typeof explanations] || {
        title: capability,
        description: "",
        icon: "✨",
      }
    );
  }

  const handleEnableCapability = (capabilityId: string) => {
    preselectedCapability.value = capabilityId;
    showNewModelForm.value = true;
    editingModel.value = null;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => {
              activeTab.value = "general";
            }}
            className={`${
              activeTab.value === "general"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t.general}
          </button>
          <button
            type="button"
            onClick={() => {
              activeTab.value = "token-usage";
            }}
            className={`${
              activeTab.value === "token-usage"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t.tokenUsage}
          </button>
          <button
            type="button"
            onClick={() => {
              activeTab.value = "sync";
            }}
            className={`${
              activeTab.value === "sync"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Chat Sync
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* General Settings Tab */}
        {activeTab.value === "general" && (
          <>
            {/* Add a highlight box for model configuration */}
            <div className="bg-primary-50 border-l-4 border-primary-500 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <IconInfoCircleFilled class="h-5 w-5 text-primary-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-primary-800">
                    {t.configureAiModels}
                  </h3>
                  <div className="mt-2 text-sm text-primary-700">
                    <p>{t.configureAiModelsDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Capabilities Visualization */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {t.availableCapabilities}
              </h3>
              <Capabilities
                enabledCapabilities={enabledCapabilities.value}
                models={models.value}
                selectedModels={selectedModels.value}
                onSelectModel={handleSelectModel}
                onEnableCapability={handleEnableCapability}
                lang={lang}
              />
            </div>

            {/* Model Manager */}
            <ModelManager
              models={models.value}
              onUpdateModel={handleUpdateModel}
              onDeleteModel={handleDeleteModel}
              onAddModel={handleAddModel}
              showNewModelForm={showNewModelForm}
              editingModel={editingModel}
              preselectedCapability={preselectedCapability}
              lang={lang}
            />

            {/* Universal API Key */}
            <div className="mt-8">
              <label
                htmlFor="universalApiKey"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t.universalApiKey || "Universal API Key"}
              </label>
              <Input
                type={showPassword.value ? "text" : "password"}
                id="universalApiKey"
                name="universalApiKey"
                value={newSettings.value.universalApiKey}
                onChange={handleChange}
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            {/* System Prompt */}
            <div className="mt-8">
              <label
                htmlFor="systemPrompt"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t.systemPrompt}{" "}
                <span className="text-gray-500">{t.systemPromptOptional}</span>
              </label>
              <Textarea
                id="systemPrompt"
                name="systemPrompt"
                value={newSettings.value.systemPrompt}
                onChange={handleSystemPromptChange}
                rows={4}
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder={t.systemPromptPlaceholder}
              />
              <p className="mt-1 text-sm text-gray-500">
                {t.systemPromptDescription}
              </p>
            </div>
          </>
        )}

        {/* Token Usage Tab */}
        {activeTab.value === "token-usage" && <TokenUsage lang={lang} />}

        {/* Chat Sync Tab */}
        {activeTab.value === "sync" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <IconInfoCircleFilled class="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Chat Synchronization
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Sync your chats across devices using P2P technology. Your chats are encrypted and shared only with authorized devices.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Enable Toggle */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.value.enabled}
                  onChange={(e) => {
                    const enabled = (e.target as HTMLInputElement).checked;
                    syncSettings.value = { ...syncSettings.value, enabled };
                    localStorage.setItem("bud-e-sync-enabled", enabled.toString());
                  }}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Enable Chat Synchronization
                </span>
              </label>
            </div>

            {/* Sync Settings */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <Input
                  type="text"
                  id="roomName"
                  value={syncSettings.value.roomName}
                  onChange={(e) => {
                    const roomName = (e.target as HTMLInputElement).value;
                    syncSettings.value = { ...syncSettings.value, roomName };
                    localStorage.setItem("bud-e-sync-room", roomName);
                  }}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="school-bud-e-default"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Devices with the same room name will sync chats together
                </p>
              </div>

              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                  User Name
                </label>
                <Input
                  type="text"
                  id="userName"
                  value={syncSettings.value.userName}
                  onChange={(e) => {
                    const userName = (e.target as HTMLInputElement).value;
                    syncSettings.value = { ...syncSettings.value, userName };
                    localStorage.setItem("bud-e-sync-user", userName);
                  }}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Student"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your display name for other users
                </p>
              </div>

              <div>
                <label htmlFor="syncPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Password
                </label>
                <Input
                  type="password"
                  id="syncPassword"
                  value={syncSettings.value.password}
                  onChange={(e) => {
                    const password = (e.target as HTMLInputElement).value;
                    syncSettings.value = { ...syncSettings.value, password };
                    localStorage.setItem("bud-e-sync-password", password);
                  }}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="secure123"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Password to join the sync room (shared with other users)
                </p>
              </div>
            </div>

            {/* Sync Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Sync Status</h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${syncSettings.value.enabled ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
                <span className="text-sm text-gray-600">
                  {syncSettings.value.enabled ? 'Sync Enabled' : 'Sync Disabled'}
                </span>
              </div>
              {syncSettings.value.enabled && (
                <p className="text-xs text-gray-500 mt-2">
                  Chat synchronization will start when you navigate to a chat
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
