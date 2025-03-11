import { IconBook, IconListCheck, IconMessageCircle, IconPresentation, IconVideo } from "@tabler/icons-preact";
import translations from "../sidebar/sidebar.translations.json" with { type: "json" };

interface BottomNavigationProps {
  lang?: string;
}

export default function BottomNavigation({ lang = "en" }: BottomNavigationProps) {
  const t = translations[lang as keyof typeof translations];
  const path = globalThis.location?.pathname || "";

  const isActive = (route: string) => path.startsWith(route);

  return (
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div class="flex justify-around items-center h-16">
        <a
          href="/chat"
          class={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/chat") ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <IconMessageCircle size={24} />
          <span class="text-xs mt-1">{t.navigation.chats}</span>
        </a>
        <a
          href="/tests"
          class={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/tests") ? "text-red-600" : "text-gray-600"
          }`}
        >
          <IconListCheck size={24} />
          <span class="text-xs mt-1">{t.navigation.tests}</span>
        </a>
        <a
          href="/graph/list"
          class={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/graph") ? "text-lime-600" : "text-gray-600"
          }`}
        >
          <IconBook size={24} />
          <span class="text-xs mt-1">{t.navigation.graphs}</span>
        </a>
        <a
          href="/presentations"
          class={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/presentations") ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <IconPresentation size={24} />
          <span class="text-xs mt-1">{t.navigation.presentations}</span>
        </a>
        <a
          href="/video-novel"
          class={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/video-novel") ? "text-amber-600" : "text-gray-600"
          }`}
        >
          <IconVideo size={24} />
          <span class="text-xs mt-1">{t.navigation.videoNovel}</span>
        </a>
      </div>
    </nav>
  );
} 