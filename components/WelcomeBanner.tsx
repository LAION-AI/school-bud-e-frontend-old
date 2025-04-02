import { Button } from "./Button.tsx";
import { lang } from "./chat/store.ts";
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

  return (
    <div
      className="mx-auto max-w-xl bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg shadow-md p-6 mb-6 border border-primary-200 animate-fadeIn"
      data-tour="welcome-banner"
    >
      <h2 className="text-xl font-bold text-primary-800 mb-2">
        {content.title}
      </h2>
      <p className="mb-4 text-primary-700">{content.description}</p>
      <div className="flex space-x-3">
        <a href="/settings">
          <Button
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            data-tour="open-settings-button"
          >
            {content.setupButton}
          </Button>
        </a>
        <Button
          onClick={onStartTour}
          className="relative bg-white hover:bg-gray-50 text-primary-600 border border-primary-600 font-medium py-2 px-4 rounded-md transition-colors animate-pulse"
          data-tour="start-tour-button"
        >
          <span className="mr-2">{content.tourButton}</span>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
            !
          </span>
        </Button>
      </div>
    </div>
  );
}
