import { Signal } from "@preact/signals";
import { KeyInput } from "./KeyInput.tsx";

interface StudentContentProps {
  selectedOption: Signal<"store" | "free" | null>;
  universalKey: Signal<string>;
  showPassword: Signal<boolean>;
  hasValidKey: Signal<boolean>;
  lang?: string;
}

export function StudentContent({ selectedOption, universalKey, showPassword, hasValidKey, lang = "en" }: StudentContentProps) {
  const handleStoreSelect = () => {
    selectedOption.value = "store";
  };

  const handleFreeSelect = () => {
    selectedOption.value = "free";
  };

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={handleStoreSelect}
          class={`p-4 border rounded-lg text-left transition-colors ${
            selectedOption.value === "store"
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200 hover:border-primary-200"
          }`}
        >
          <h3 class="font-medium text-gray-900">
            {lang === "de" ? "1. Von Ihrem Lehrer erhalten" : "1. Get from Teacher"}
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            {lang === "de"
              ? "Fragen Sie Ihren Lehrer nach dem API-Schlüssel für die Klasse."
              : "Ask your teacher for the class API key."}
          </p>
        </button>

        <a
          href="/settings"
          class={`p-4 border rounded-lg text-left transition-colors ${
            selectedOption.value === "free"
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200 hover:border-primary-200"
          }`}
        >
          <h3 class="font-medium text-gray-900">
            {lang === "de" ? "2. Kostenlos (5 Minuten, nicht Datenschutzkonform)" : "2. Free (5 minutes, not GDPR compliant)"}
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            {lang === "de"
              ? "Folgen Sie den Anweisungen, um einen kostenlosen API-Schlüssel von Google AI Studio zu erhalten."
              : "Follow the instructions to get a free API key from Google AI Studio."}
          </p>
        </a>
      </div>

      {selectedOption.value === "store" && (
        <div class="space-y-4">
          <div class="bg-primary-50 p-4 rounded-lg">
            <p class="text-sm text-primary-700 mb-2">
              {lang === "de"
                ? "Bitte fragen Sie Ihren Lehrer nach dem API-Schlüssel für die Klasse."
                : "Please ask your teacher for the class API key."}
            </p>
          </div>

          <KeyInput universalKey={universalKey} showPassword={showPassword} hasValidKey={hasValidKey} lang={lang} />
        </div>
      )}

      {selectedOption.value === "free" && (
        <div class="space-y-4">
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-sm text-yellow-800 mb-2">
              {lang === "de"
                ? "Der kostenlose API-Schlüssel ermöglicht nur Sprachkonversationen. Sie können später weitere API-Schlüssel für zusätzliche Funktionen konfigurieren, wenn Sie einen Anbieter finden."
                : "The free API key only enables voice conversations. You can configure additional API keys for more features later if you find a provider."}
            </p>
          </div>

          <KeyInput universalKey={universalKey} showPassword={showPassword} hasValidKey={hasValidKey} lang={lang} />

          <div class="text-sm text-gray-600">
            <p class="mb-2">
              {lang === "de"
                ? "Sie können einen API-Schlüssel von Google AI Studio erhalten:"
                : "You can get an API key from Google AI Studio:"}
            </p>
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 hover:text-primary-700 underline"
            >
              {lang === "de"
                ? "API-Schlüssel erstellen"
                : "Create API Key"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 