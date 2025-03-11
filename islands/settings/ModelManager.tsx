import { useSignal } from "@preact/signals";
import { IconBrain, IconPlus, IconTrash } from "@tabler/icons-preact";
import type { JSX } from "preact";

interface Model {
  id: string;
  name: string;
  key: string;
  url: string;
  model: string;
  capabilities: string[];
}

interface ModelManagerProps {
  models: Model[];
  onUpdateModel: (model: Model) => void;
  onDeleteModel: (modelId: string) => void;
  onAddModel: (model: Model) => void;
  lang: string;
}

export default function ModelManager({
  models,
  onUpdateModel,
  onDeleteModel,
  onAddModel,
  lang,
}: ModelManagerProps) {
  const showNewModelForm = useSignal(false);
  const editingModel = useSignal<Model | null>(null);

  const defaultModel: Model = {
    id: crypto.randomUUID(),
    name: "",
    key: "",
    url: "",
    model: "",
    capabilities: [],
  };

  const capabilities = [
    {
      id: "chat",
      label: lang === "de" ? "Text-Chat" : "Text Chat",
      icon: "💬",
    },
    {
      id: "vision",
      label: lang === "de" ? "Bild-Verständnis" : "Image Understanding",
      icon: "👁️",
    },
    {
      id: "speak",
      label: lang === "de" ? "Sprachausgabe" : "Voice Output",
      icon: "🔊",
    },
    {
      id: "listen",
      label: lang === "de" ? "Spracherkennung" : "Voice Recognition",
      icon: "🎤",
    },
  ];

  function handleModelSubmit(e: JSX.TargetedEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const modelData = {
      id: editingModel.value?.id || defaultModel.id,
      name: formData.get("name") as string,
      key: formData.get("key") as string,
      url: formData.get("url") as string,
      model: formData.get("model") as string,
      capabilities: capabilities
        .map((cap) => cap.id)
        .filter((capId) => formData.get(`capability-${capId}`) === "on"),
    };

    if (editingModel.value) {
      onUpdateModel(modelData);
    } else {
      onAddModel(modelData);
    }

    editingModel.value = null;
    showNewModelForm.value = false;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {lang === "de" ? "KI-Modelle" : "AI Models"}
        </h3>
        <button
          type="button"
          onClick={() => {
            showNewModelForm.value = true;
            editingModel.value = null;
          }}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <IconPlus className="h-4 w-4 mr-1" />
          {lang === "de" ? "Neues Modell" : "New Model"}
        </button>
      </div>

      {/* Model List */}
      <div className="grid grid-cols-1 gap-4">
        {models.map((model) => (
          <div
            key={model.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {model.name}
                </h4>
                <p className="text-sm text-gray-500 mt-1">{model.model}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    editingModel.value = model;
                    showNewModelForm.value = true;
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <IconBrain className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteModel(model.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <IconTrash className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {model.capabilities.map((capId) => {
                const cap = capabilities.find((c) => c.id === capId);
                return cap ? (
                  <span
                    key={capId}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    <span className="mr-1">{cap.icon}</span>
                    {cap.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Model Form */}
      {showNewModelForm.value && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingModel.value
                ? lang === "de"
                  ? "Modell bearbeiten"
                  : "Edit Model"
                : lang === "de"
                ? "Neues Modell hinzufügen"
                : "Add New Model"}
            </h3>
            <form onSubmit={handleModelSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  {lang === "de" ? "Name" : "Name"}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={editingModel.value?.name}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* API Key */}
              <div>
                <label
                  htmlFor="key"
                  className="block text-sm font-medium text-gray-700"
                >
                  {lang === "de" ? "API-Schlüssel" : "API Key"}
                </label>
                <input
                  type="password"
                  id="key"
                  name="key"
                  defaultValue={editingModel.value?.key}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* URL */}
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700"
                >
                  {lang === "de" ? "API-Endpunkt" : "API Endpoint"}
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  defaultValue={editingModel.value?.url}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Model */}
              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-medium text-gray-700"
                >
                  {lang === "de" ? "Modell" : "Model"}
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  defaultValue={editingModel.value?.model}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Capabilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === "de" ? "Fähigkeiten" : "Capabilities"}
                </label>
                <div className="space-y-2">
                  {capabilities.map((capability) => (
                    <label key={capability.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name={`capability-${capability.id}`}
                        defaultChecked={editingModel.value?.capabilities.includes(
                          capability.id
                        )}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2">
                        {capability.icon} {capability.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    showNewModelForm.value = false;
                    editingModel.value = null;
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  {lang === "de" ? "Abbrechen" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingModel.value
                    ? lang === "de"
                      ? "Speichern"
                      : "Save"
                    : lang === "de"
                    ? "Hinzufügen"
                    : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
