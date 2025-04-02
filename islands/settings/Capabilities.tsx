import { useSignal } from "@preact/signals";
import { IconChevronDown } from "@tabler/icons-preact";
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
  lang: string;
}

export default function Capabilities({
  enabledCapabilities,
  models,
  selectedModels,
  onSelectModel,
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
    })
  );

  const totalCapabilities = allCapabilities.length;
  const radius = 160;
  const centerX = radius;
  const centerY = radius;
  const innerRadius = 60;
  const segmentSpacing = 4;
  const segmentAngle =
    (360 - totalCapabilities * segmentSpacing) / totalCapabilities;

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
    <div className="flex flex-col items-center space-y-8 p-4">
      <div
        className="relative"
        style={{ width: radius * 2, height: radius * 2 }}
      >
        {/* Center circle with Bud-E logo */}
        <div
          className="absolute bg-white rounded-full shadow-lg flex items-center justify-center"
          style={{
            width: innerRadius * 2,
            height: innerRadius * 2,
            left: centerX - innerRadius,
            top: centerY - innerRadius,
            zIndex: 10,
          }}
        >
          <span className="text-3xl" role="img" aria-label="Bud-E Logo">
            <img src="/logo.png" alt="Bud-E Logo" width="48" height="48" />
          </span>
        </div>

        {/* Capability segments */}
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

          const iconAngle = (startAngle + segmentAngle / 2) * (Math.PI / 180);
          const iconRadius = innerRadius + (radius - innerRadius) / 2;
          const iconX = centerX + iconRadius * Math.cos(iconAngle);
          const iconY = centerY + iconRadius * Math.sin(iconAngle);

          const textAngle = iconAngle;
          const textRadius = radius + 20;
          const textX = centerX + textRadius * Math.cos(textAngle);
          const textY = centerY + textRadius * Math.sin(textAngle);

          const selectedModel = selectedModels[capability.id];
          const availableModels = models.filter((m) =>
            m.capabilities.includes(capability.id)
          );

          return (
            <div key={capability.id} className="absolute inset-0">
              {/* Segment */}
              <svg className="absolute inset-0 w-full h-full">
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
                  aria-label={`${capability.title} ${
                    isEnabled
                      ? lang === "de"
                        ? "aktiviert"
                        : "enabled"
                      : lang === "de"
                      ? "deaktiviert"
                      : "disabled"
                  }`}
                />
              </svg>

              {/* Icon */}
              <div
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full ${
                  isEnabled ? "text-green-600" : "text-gray-400"
                }`}
                style={{
                  left: iconX,
                  top: iconY,
                }}
              >
                <span
                  className="text-xl"
                  role="img"
                  aria-label={capability.title}
                >
                  {capability.icon}
                </span>
              </div>

              {/* Title and description */}
              <div
                className={`absolute text-sm ${
                  textAngle > 0 && textAngle < Math.PI
                    ? "text-left"
                    : "text-right"
                }`}
                style={{
                  left: textX,
                  top: textY,
                  transform: `translate(${
                    textAngle > 0 && textAngle < Math.PI ? "10px" : "-110%"
                  }, -50%)`,
                  maxWidth: "200px",
                }}
              >
                <h3
                  className={`font-medium ${
                    isEnabled ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {capability.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {capability.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Capability chips with model selection */}
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {allCapabilities.map((capability) => {
          const isEnabled = enabledCapabilities.includes(capability.id);
          const selectedModel = selectedModels[capability.id];
          const availableModels = models.filter((m) =>
            m.capabilities.includes(capability.id)
          );

          return (
            <div key={capability.id} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isEnabled) {
                    showModelSelector.value =
                      showModelSelector.value === capability.id
                        ? null
                        : capability.id;
                  }
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isEnabled
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500"
                } transition-colors duration-200`}
              >
                <span className="text-base">{capability.icon}</span>
                <span className="text-sm font-medium">{capability.title}</span>
                {isEnabled && (
                  <>
                    <span className="text-xs text-green-600">
                      {selectedModel
                        ? models.find((m) => m.id === selectedModel)?.name
                        : t.selectModel}
                    </span>
                    <IconChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Model selection dropdown */}
              {showModelSelector.value === capability.id && (
                <div className="absolute z-10 mt-1 w-48 bg-white shadow-lg rounded-md py-1 border border-gray-200">
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
          );
        })}
      </div>
    </div>
  );
}
