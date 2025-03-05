import { useState, useEffect } from "preact/hooks";

interface Configuration {
    name: string;
    url: string;
    model: string;
    key?: string;
}

interface ConfigurationSelectorProps {
    serviceType: string;
    currentConfig: {
        url: string;
        model: string;
        key?: string;
    };
    onUpdateSettings: (key: string, value: string) => void;
    lang: string;
    icon: string;
    title: string;
}

export default function ConfigurationSelector({
    serviceType,
    currentConfig,
    onUpdateSettings,
    lang,
    icon,
    title,
}: ConfigurationSelectorProps) {
    const [showNewConfig, setShowNewConfig] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);

    const [savedConfigs, setSavedConfigs] = useState<Configuration[]>(() => {
        const saved = localStorage.getItem(`${serviceType}Configs`);
        return saved ? JSON.parse(saved) : [];
    });

    const [newConfigName, setNewConfigName] = useState("");

    useEffect(() => {
        if (savedConfigs.length > 0 && !selectedConfig) {
            // Try to retrieve the saved selection from localStorage
            const savedSelectedName = localStorage.getItem(`${serviceType}SelectedConfig`);
            const defaultConfig = savedConfigs.find(config => config.name === savedSelectedName) || savedConfigs[0];
            setSelectedConfig(defaultConfig);
            // Apply the configuration immediately
            onUpdateSettings(`${serviceType}Url`, defaultConfig.url);
            onUpdateSettings(`${serviceType}Model`, defaultConfig.model);
            if (defaultConfig.key) {
                onUpdateSettings(`${serviceType}Key`, defaultConfig.key);
            }
        }
    }, [savedConfigs, selectedConfig, onUpdateSettings, serviceType]);

    const saveNewConfiguration = () => {
        if (!newConfigName) return;

        const newConfig = {
            name: newConfigName,
            url: currentConfig.url,
            model: currentConfig.model,
            key: currentConfig.key,
        };

        const updatedConfigs = [...savedConfigs, newConfig];
        setSavedConfigs(updatedConfigs);
        localStorage.setItem(`${serviceType}Configs`, JSON.stringify(updatedConfigs));
        setNewConfigName("");
        setShowNewConfig(false);
    };

    const loadConfiguration = (config: Configuration) => {
        onUpdateSettings(`${serviceType}Url`, config.url);
        onUpdateSettings(`${serviceType}Model`, config.model);
        if (config.key) {
            onUpdateSettings(`${serviceType}Key`, config.key);
        }
    };

    return (
        <div class="mb-4">
            <h3 class="font-medium mb-2">
                {icon} {title}
            </h3>
            <div class="space-y-4">
                {savedConfigs.length > 0 && (
                    <div class="flex gap-2">
                        <select
                            onChange={(e) => {
                                const index = Number((e.target as HTMLSelectElement).value);
                                const selected = savedConfigs[index];
                                if (selected) {
                                    setSelectedConfig(selected);
                                    // Persist the selected configuration's name (or index)
                                    localStorage.setItem(`${serviceType}SelectedConfig`, selected.name);
                                    loadConfiguration(selected);
                                } else {
                                    // Clear the fields when disabled
                                    onUpdateSettings(`${serviceType}Url`, "");
                                    onUpdateSettings(`${serviceType}Model`, "");
                                    onUpdateSettings(`${serviceType}Key`, "");
                                    setSelectedConfig(null);
                                    localStorage.removeItem(`${serviceType}SelectedConfig`);
                                }
                            }}
                            class="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            value={selectedConfig ? savedConfigs.findIndex(config => config.name === selectedConfig.name).toString() : ""}
                        >
                            <option value="">
                                {savedConfigs.length > 0 ? "Disable" : "Select a saved configuration"}
                            </option>
                            {savedConfigs.map((config, index) => (
                                <option key={config.name} value={index}>
                                    {config.name}
                                </option>
                            ))}
                        </select>
                        <div class="flex gap-2">
                            <button
                                onClick={() => {
                                    if (selectedConfig) {
                                        const newConfigs = savedConfigs.filter(c => c.name !== selectedConfig.name);
                                        setSavedConfigs(newConfigs);
                                        localStorage.setItem(`${serviceType}Configs`, JSON.stringify(newConfigs));
                                        setSelectedConfig(newConfigs.length > 0 ? newConfigs[0] : null);
                                    }
                                }}
                                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
                                disabled={!selectedConfig}
                            >
                                🗑️
                            </button>
                            <button
                                onClick={() => setShowNewConfig(true)}
                                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}

                {selectedConfig && (
                    <div class="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-medium">{selectedConfig.name}</h4>
                            <button
                                onClick={() => setSelectedConfig(null)}
                                class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                            >
                                Close
                            </button>
                        </div>
                        <div class="space-y-2">
                            <div>
                                <label class="text-sm text-gray-600">API Key:</label>
                                <div class="font-mono bg-gray-100 p-2 rounded mt-1">
                                    {selectedConfig.key ? "*".repeat(12) : "Not set"}
                                </div>
                            </div>
                            <div>
                                <label class="text-sm text-gray-600">URL:</label>
                                <div class="font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                                    {selectedConfig.url}
                                </div>
                            </div>
                            <div>
                                <label class="text-sm text-gray-600">Model:</label>
                                <input
                                    type="text"
                                    value={selectedConfig.model}
                                    onChange={(e) => {
                                        const newModel = (e.target as HTMLInputElement).value;
                                        // Update the selected config
                                        setSelectedConfig({ ...selectedConfig, model: newModel });
                                        // Update the settings
                                        onUpdateSettings(`${serviceType}Model`, newModel);
                                        // Update the saved configs
                                        const updatedConfigs = savedConfigs.map(config =>
                                            config.name === selectedConfig.name
                                                ? { ...config, model: newModel }
                                                : config
                                        );
                                        setSavedConfigs(updatedConfigs);
                                        localStorage.setItem(`${serviceType}Configs`, JSON.stringify(updatedConfigs));
                                    }}
                                    class="w-full font-mono p-2 border rounded focus:ring-2 focus:ring-blue-500 mt-1"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {(showNewConfig || savedConfigs.length === 0) && (
                    <div class="space-y-4">
                        <input
                            type="text"
                            value={newConfigName}
                            onChange={(e) => setNewConfigName((e.target as HTMLInputElement).value)}
                            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Configuration name"
                        />
                        <input
                            type="password"
                            value={currentConfig.key || ''}
                            onChange={(e) => onUpdateSettings(`${serviceType}Key`, (e.target as HTMLInputElement).value)}
                            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                            placeholder="API Key"
                        />
                        <input
                            type="text"
                            value={currentConfig.url}
                            onChange={(e) => onUpdateSettings(`${serviceType}Url`, (e.target as HTMLInputElement).value)}
                            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="API URL"
                        />
                        <input
                            type="text"
                            value={currentConfig.model}
                            onChange={(e) => onUpdateSettings(`${serviceType}Model`, (e.target as HTMLInputElement).value)}
                            class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Model"
                        />
                        <div class="flex gap-2">
                            <button
                                onClick={saveNewConfiguration}
                                disabled={!newConfigName}
                                class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                            >
                                Save Configuration
                            </button>
                            {savedConfigs.length > 0 && (
                                <button
                                    onClick={() => setShowNewConfig(false)}
                                    class="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
