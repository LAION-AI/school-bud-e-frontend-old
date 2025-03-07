import { Button } from "../../components/Button.tsx";
import { useSignal } from "@preact/signals";

interface ApiKeySetupProps {
  userType: "teacher" | "student";
  onComplete: () => void;
  onBack: () => void;
  lang?: string;
}

export default function ApiKeySetup({ userType, onComplete, onBack, lang = "en" }: ApiKeySetupProps) {
  const universalKey = useSignal("");
  const showPassword = useSignal(false);
  const hasValidKey = useSignal(false);
  const selectedOption = useSignal<"store" | "free" | null>(null);

  const handleKeyChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    universalKey.value = input.value;
    hasValidKey.value = input.value.length > 0;
  };

  const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
  };

  const handleStoreSelect = () => {
    selectedOption.value = "store";
  };

  const handleFreeSelect = () => {
    selectedOption.value = "free";
  };

  const getTeacherContent = () => (
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
            {lang === "de" ? "1. Aus dem Store kaufen" : "1. Buy from Store"}
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            {lang === "de"
              ? "Perfekt für Lehrer, die den API-Schlüssel für ihre Schüler einrichten möchten oder wenig Zeit haben."
              : "Perfect for teachers who want to set up the API key for their students or don't have much time."}
          </p>
        </button>

        <button
          type="button"
          onClick={handleFreeSelect}
          class={`p-4 border rounded-lg text-left transition-colors ${
            selectedOption.value === "free"
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200 hover:border-primary-200"
          }`}
        >
          <h3 class="font-medium text-gray-900">
            {lang === "de" ? "2. Kostenlos (5 Minuten)" : "2. Free (5 minutes)"}
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            {lang === "de"
              ? "Folgen Sie den Anweisungen, um einen kostenlosen API-Schlüssel von Google AI Studio zu erhalten."
              : "Follow the instructions to get a free API key from Google AI Studio."}
          </p>
        </button>
      </div>

      {selectedOption.value === "free" && (
        <div class="space-y-4">
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-sm text-yellow-800 mb-2">
              {lang === "de"
                ? "Der kostenlose API-Schlüssel ermöglicht nur Sprachkonversationen. Sie können später weitere API-Schlüssel für zusätzliche Funktionen konfigurieren, wenn Sie einen Anbieter finden."
                : "The free API key only enables voice conversations. You can configure additional API keys for more features later if you find a provider."}
            </p>
          </div>

          <div class="relative">
            <input
              type={showPassword.value ? "text" : "password"}
              value={universalKey.value}
              onChange={handleKeyChange}
              class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={lang === "de" ? "API-Schlüssel eingeben" : "Enter API Key"}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword.value ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

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

      {selectedOption.value === "store" && (
        <div class="space-y-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-blue-700 mb-2">
              {lang === "de"
                ? "Bitte fragen Sie Ihren Lehrer nach dem API-Schlüssel für die Klasse."
                : "Please ask your teacher for the class API key."}
            </p>
          </div>

          <div class="relative">
            <input
              type={showPassword.value ? "text" : "password"}
              value={universalKey.value}
              onChange={handleKeyChange}
              class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={lang === "de" ? "API-Schlüssel eingeben" : "Enter API Key"}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword.value ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const getStudentContent = () => (
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

        <button
          type="button"
          onClick={handleFreeSelect}
          class={`p-4 border rounded-lg text-left transition-colors ${
            selectedOption.value === "free"
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200 hover:border-primary-200"
          }`}
        >
          <h3 class="font-medium text-gray-900">
            {lang === "de" ? "2. Kostenlos (5 Minuten)" : "2. Free (5 minutes)"}
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            {lang === "de"
              ? "Folgen Sie den Anweisungen, um einen kostenlosen API-Schlüssel von Google AI Studio zu erhalten."
              : "Follow the instructions to get a free API key from Google AI Studio."}
          </p>
        </button>
      </div>

      {selectedOption.value === "store" && (
        <div class="space-y-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-blue-700 mb-2">
              {lang === "de"
                ? "Bitte fragen Sie Ihren Lehrer nach dem API-Schlüssel für die Klasse."
                : "Please ask your teacher for the class API key."}
            </p>
          </div>

          <div class="relative">
            <input
              type={showPassword.value ? "text" : "password"}
              value={universalKey.value}
              onChange={handleKeyChange}
              class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={lang === "de" ? "API-Schlüssel eingeben" : "Enter API Key"}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword.value ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
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

          <div class="relative">
            <input
              type={showPassword.value ? "text" : "password"}
              value={universalKey.value}
              onChange={handleKeyChange}
              class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={lang === "de" ? "API-Schlüssel eingeben" : "Enter API Key"}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword.value ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

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

  return (
    <div class="space-y-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {lang === "de" ? "API-Schlüssel einrichten" : "Set Up API Key"}
        </h2>
        <p class="text-gray-600">
          {lang === "de"
            ? "Wählen Sie eine Option aus, um fortzufahren"
            : "Choose an option to continue"}
        </p>
      </div>

      {userType === "teacher" ? getTeacherContent() : getStudentContent()}

      {(selectedOption.value === "free" || selectedOption.value === "store") && (
        <div class="flex justify-between">
          <Button
            variant="secondary"
            onClick={onBack}
          >
            {lang === "de" ? "Zurück" : "Back"}
          </Button>
          <Button
            variant="primary"
            onClick={onComplete}
            disabled={!hasValidKey.value}
          >
            {lang === "de" ? "Weiter" : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
} 