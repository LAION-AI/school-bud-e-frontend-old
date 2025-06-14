import { useSignal } from "@preact/signals";
import {
  IconBrain,
  IconChevronDown,
  IconKey,
  IconLink,
} from "@tabler/icons-preact";
import type { Translations } from "./settings.translations.d.ts";
import translations from "./settings.translations.json" with { type: "json" };

interface Model {
  id: string;
  name: string;
  capabilities: string[];
}

interface CapabilitiesProps {
  enabledCapabilities: string[];
  models: Model[];
  selectedModels: Record<string, string>;
  onSelectModel: (capabilityId: string, modelId: string) => void;
  onEnableCapability?: (capabilityId: string) => void;
  lang: string;
}

export default function Capabilities({
  enabledCapabilities,
  models,
  selectedModels,
  onSelectModel,
  onEnableCapability,
  lang,
}: CapabilitiesProps) {
  const activeCapability = useSignal<string | null>(null);
  const showModelSelector = useSignal<string | null>(null);
  const t = (translations as Translations)[lang as keyof Translations];

  const allCapabilities = Object.entries(t.capabilities).map(
    ([id, capability]) => ({
      id,
      ...capability,
      icon: getCapabilityIcon(id),
    }),
  );

  const radius = 160;
  const centerX = radius;
  const centerY = radius;
  const innerRadius = 60;
  const segmentAngle = 80;
  const segmentSpacing = 10;

  function getCapabilityIcon(id: string): string {
    const icons: Record<string, string> = {
      chat: "💬",
      vision: "👁️",
      speak: "🔊",
      listen: "🎤",
    };
    return icons[id] || "✨";
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="grid grid-cols-2 grid-rows-[auto_1fr_auto] lg:grid-cols-3 lg:grid-rows-2 gap-4 w-full max-w-5xl relative">
        <div className="col-start-1 col-span-2 lg:col-span-1 lg:col-start-2 lg:row-span-2 flex items-center justify-center">
          <div className="relative w-full h-full min-h-[300px]">
            <div
              className="absolute bg-white shadow-lg flex items-center justify-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                height: "25%",
                aspectRatio: "1/1",
                borderRadius: "50%",
              }}
            >
              <span className="text-3xl" role="img" aria-label="Bud-E Logo">
                <img src="/logo.png" alt="Bud-E Logo" width="48" height="48" />
              </span>
            </div>

            <svg
              className="absolute inset-0 w-full h-full"
              aria-label="Capability Segments"
              title="Capability Segments"
              viewBox={`0 0 ${radius * 2} ${radius * 2}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {allCapabilities.map((capability, index) => {
                const isEnabled = enabledCapabilities.includes(capability.id);
                const isActive = activeCapability.value === capability.id;
                const startAngle = index * (segmentAngle + segmentSpacing) - 90;
                const endAngle = startAngle + segmentAngle;

                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const x1 = centerX + innerRadius * Math.cos(startRad);
                const y1 = centerY + innerRadius * Math.sin(startRad);
                const x2 = centerX + radius * Math.cos(startRad);
                const y2 = centerY + radius * Math.sin(startRad);
                const x3 = centerX + radius * Math.cos(endRad);
                const y3 = centerY + radius * Math.sin(endRad);
                const x4 = centerX + innerRadius * Math.cos(endRad);
                const y4 = centerY + innerRadius * Math.sin(endRad);

                const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                const path = [
                  `M ${x1} ${y1}`,
                  `L ${x2} ${y2}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x3} ${y3}`,
                  `L ${x4} ${y4}`,
                  `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
                  "Z",
                ].join(" ");

                const iconAngle = (startAngle + segmentAngle / 2) *
                  (Math.PI / 180);
                const iconRadius = innerRadius + (radius - innerRadius) / 2;
                const iconX = centerX + iconRadius * Math.cos(iconAngle);
                const iconY = centerY + iconRadius * Math.sin(iconAngle);

                return (
                  <g key={capability.id}>
                    <title>{capability.title}</title>
                    <path
                      d={path}
                      className={`transition-all duration-300 ${
                        isEnabled
                          ? isActive
                            ? "fill-green-200 stroke-green-600"
                            : "fill-green-100 stroke-green-500"
                          : "fill-gray-100 stroke-gray-300"
                      }`}
                      strokeWidth="2"
                    />
                    <foreignObject
                      x={iconX - 20}
                      y={iconY - 20}
                      width="40"
                      height="40"
                      className="overflow-visible"
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 ${
                          isEnabled ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <span
                          className="text-xl"
                          role="img"
                          aria-label={capability.title}
                        >
                          {capability.icon}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {allCapabilities.map((capability, index) => {
          const isEnabled = enabledCapabilities.includes(capability.id);
          const selectedModel = selectedModels[capability.id];
          const availableModels = models.filter((m) =>
            m.capabilities.includes(capability.id)
          );

          const gridPositions = [
            "lg:col-start-1 lg:row-start-1 col-start-1 row-start-1",
            "lg:col-start-3 lg:row-start-1 col-start-2 row-start-1",
            "lg:col-start-1 lg:row-start-2 col-start-1 row-start-3",
            "lg:col-start-3 lg:row-start-2 col-start-2 row-start-3",
          ];

          return (
            <div
              key={capability.id}
              className={`flex flex-col p-4 rounded-lg ${
                isEnabled ? "bg-green-50" : "bg-gray-50"
              } ${gridPositions[index]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3
                  className={`font-medium ${
                    isEnabled ? "text-green-700" : "text-gray-700"
                  }`}
                >
                  {capability.title}
                </h3>
                {!isEnabled && onEnableCapability && (
                  <button
                    type="button"
                    onClick={() => onEnableCapability(capability.id)}
                    className="flex items-center justify-center w-6 h-6 rounded-full text-white bg-primary-600 hover:bg-gray-300 focus-visible:ring focus-visible:ring-offset-2 focus:outline-none focus-visible:ring-primary-600 hover:text-gray-700 transition-colors"
                    aria-label={lang === "de" ? "Aktivieren" : "Enable"}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      title="Plus Icon"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {capability.description}
              </p>

              {isEnabled && (
                <div className="relative mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      showModelSelector.value =
                        showModelSelector.value === capability.id
                          ? null
                          : capability.id;
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200 w-full"
                  >
                    <span className="text-base">{capability.icon}</span>
                    <span className="text-sm">
                      {selectedModel
                        ? models.find((m) => m.id === selectedModel)?.name
                        : t.selectModel}
                    </span>
                    <IconChevronDown className="h-4 w-4 ml-auto" />
                  </button>

                  {showModelSelector.value === capability.id && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 border border-gray-200">
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            onSelectModel(capability.id, model.id);
                            showModelSelector.value = null;
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            selectedModel === model.id
                              ? "text-primary-600 bg-primary-50"
                              : "text-gray-700"
                          }`}
                        >
                          {model.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
