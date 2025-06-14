import ChatList from "./(_islands)/ChatList.tsx";
import ChatSyncInitializer from "../../../islands/chat/ChatSyncInitializer.tsx";
import { IconMessagePlus } from "@tabler/icons-preact";
import translations from "../../../islands/sidebar/sidebar.translations.json" with {
  type: "json",
};

interface ChatListPageProps {
  lang?: string;
}

export default function ChatListPage({ lang = "en" }: ChatListPageProps) {
  const t = translations[lang as keyof typeof translations];

  return (
    <div class="max-w-screen mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-gray-900">{t.navigation.chats}</h1>
          <ChatSyncInitializer />
        </div>
        <a
          href="/chat/new"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <IconMessagePlus size={20} />
          <span>{t.actions.newChat}</span>
        </a>
      </div>
      <ChatList lang={lang} />
    </div>
  );
}
