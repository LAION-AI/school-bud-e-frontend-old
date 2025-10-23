import { Settings, MessageCircle } from "lucide-preact";
import translations from "../sidebar/sidebar.translations.json" with {
  type: "json",
};

interface BottomNavigationProps {
  lang?: string;
}

export default function BottomNavigation(
  { lang = "en" }: BottomNavigationProps,
) {
  const t = translations[lang as keyof typeof translations];
  const path = globalThis.location?.pathname || "";

  const isActive = (route: string) => {
    // For bottom nav, check exact match or if it's a chat sub-page
    if (route === "/chat") {
      return path === "/chat" || path.startsWith("/chat/");
    }
    return path === route;
  };

  return (
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div class="flex justify-around items-center h-16">
        <a
          href="/chat"
          class={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/chat") ? "text-primary-600" : "text-gray-600"
          }`}
        >
          <MessageCircle size={24} />
          <span class="text-xs mt-1">{t.navigation.chats || "Chat"}</span>
        </a>
        <a
          href="/settings"
          class={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/settings") ? "text-primary-600" : "text-gray-600"
          }`}
        >
          <Settings size={24} />
          <span class="text-xs mt-1">{t.navigation.settings || "Settings"}</span>
        </a>
      </div>
    </nav>
  );
}
