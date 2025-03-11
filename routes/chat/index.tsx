import { IconMessagePlus } from "@tabler/icons-preact";
import { chats } from "../../components/chat/store.ts";
import translations from "../../islands/sidebar/sidebar.translations.json" with { type: "json" };

interface ChatListPageProps {
  lang?: string;
}

export default function ChatListPage({ lang = "en" }: ChatListPageProps) {
  const t = translations[lang as keyof typeof translations];

  // Get all chats and sort them by last message time (newest first)
  const chatList = Object.entries(chats.value)
    .filter(([key]) => key.startsWith("bude-chat-"))
    .map(([key, messages]) => {
      const suffix = key.slice(10);
      const lastMessage = messages[messages.length - 1];
      const content = Array.isArray(lastMessage?.content) 
        ? lastMessage.content[0]
        : lastMessage?.content || "";
      const messageText = typeof content === "string" ? content : "Image message";
      
      return {
        id: suffix,
        title: `Chat ${Number.parseInt(suffix) + 1}`,
        lastMessage: messageText || "No messages yet",
        timestamp: new Date().toISOString(), // Since we don't store timestamps, use current time
        isAI: lastMessage?.role === "assistant",
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div class="max-w-3xl mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{t.navigation.chats}</h1>
        <a
          href="/chat/new"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <IconMessagePlus size={20} />
          <span>{t.actions.newChat}</span>
        </a>
      </div>

      <div class="space-y-2">
        {chatList.length > 0 ? (
          chatList.map((chat) => (
            <a
              key={chat.id}
              href={`/chat/${chat.id}`}
              class="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div class="p-4">
                <div class="flex justify-between items-start mb-1">
                  <h2 class="text-lg font-medium text-gray-900">{chat.title}</h2>
                  <span class="text-sm text-gray-500">
                    {new Date(chat.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  {chat.isAI && (
                    <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      AI
                    </span>
                  )}
                  <p class="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                </div>
              </div>
            </a>
          ))
        ) : (
          <div class="text-center py-12">
            <p class="text-gray-500 mb-4">No chats yet</p>
            <a
              href="/chat/new"
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconMessagePlus size={20} />
              <span>{t.actions.newChat}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 