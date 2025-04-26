import { Button } from "./Button.tsx";
import { lang } from "./chat/store.ts";
import { KeyInput } from "../islands/signin/KeyInput.tsx";
import { signal } from "@preact/signals";

// Define welcome content for different languages
const welcomeContent = {
  en: {
    title: "Welcome to Bud-E! 👋",
    description:
      "To get started, you'll need to set up your API key. Our guided tour will help you through the process.",
    setupButton: "Set up API Key",
    tourButton: "Take the Tour",
  },
  de: {
    title: "Willkommen bei Bud-E! 👋",
    description:
      "Um zu beginnen, musst du einen API-Schlüssel einrichten. Unsere Führung hilft dir durch den Prozess.",
    setupButton: "API-Schlüssel einrichten",
    tourButton: "Führung starten",
  },
  // Add other languages as needed
};

export default function WelcomeBanner({
  onStartTour,
}: {
  onStartTour: () => void;
}) {
  const content = welcomeContent[lang.value] || welcomeContent.en;
  const universalKey = signal("");
  const showPassword = signal(false);
  const hasValidKey = signal(false);

  return (
    <div
      className="mx-auto max-w-xl bg-primary-50 border-2 border-primary-500 rounded-lg p-6 mb-6 animate-fadeIn"
      data-tour="welcome-banner"
    >
      <h2 className="text-xl font-bold text-primary-700 mb-2">
        {content.title}
      </h2>
      <p className="mb-4 text-primary-700">{content.description}</p>
      <div className="mb-4">
        <KeyInput
          universalKey={universalKey}
          showPassword={showPassword}
          hasValidKey={hasValidKey}
          lang={lang.value}
        />
      </div>
      <div className="flex space-x-3">
        <a href="/settings">
          <Button data-tour="open-settings-button" variant="primary">
            {content.setupButton}
          </Button>
        </a>
      </div>
    </div>
  );
}
