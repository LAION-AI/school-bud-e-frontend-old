import { Download, MessageCircle, X } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";
import { chats } from "../../components/chat/store.ts";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SidebarLink from "./SidebarLink.tsx";
import translations from "./sidebar.translations.json" with { type: "json" };

interface ChatListProps {
  currentChatSuffix: string;
  onDownloadChat: () => void;
  onDeleteChat: (suffix: string) => void;
  translations: (typeof translations)[keyof typeof translations];
}

export default function ChatList({
  onDownloadChat,
  onDeleteChat,
  translations: t,
}: ChatListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const nextChatSuffix = useMemo(() => {
    const keys = Object.keys(chats.peek()).filter(key => key.startsWith("bude-chat-"));
    const numbers = keys.map(key => Number.parseInt(key.slice(10)));
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 0;
  }, [Object.keys(chats.peek()).length]);

  return (
    <CollapsibleSection
      icon={<MessageCircle size={20} />}
      title={t.navigation.chats}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      routePattern={/^\/chat\/(\d+|new)$/}
    >
      {(activeRoute) => {
        const activeSuffix = activeRoute.match(/^\/chat\/(\d+|new)$/)?.[1] || "";
        
        return [
          ...Object.keys(chats.value)
            .filter((key) => key.startsWith("bude-chat-"))
            .sort((a, b) => {
              const numA = Number.parseInt(a.slice(10));
              const numB = Number.parseInt(b.slice(10));
              return numA - numB;
            })
            .map((key) => {
              const suffix = key.slice(10);
              console.log({ suffix, nextChatSuffix, activeSuffix });
              return (
                <SidebarLink
                  href={`/chat/${suffix}`}
                  isActive={suffix === activeSuffix}
                  className="flex items-center group"
                  key={suffix}
                >
                  <span className="flex-1">
                    {`Chat ${Number.parseInt(suffix) + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDownloadChat();
                    }}
                    class="group-hover:text-gray-400 text-transparent px-2"
                    aria-label={t.actions.downloadChat}
                  >
                    <Download class="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteChat(suffix);
                    }}
                    class="group-hover:text-gray-400 text-transparent px-2"
                    aria-label={t.actions.deleteChat}
                  >
                    <X size={24} aria-hidden="true" />
                  </button>
                </SidebarLink>
              );
            }),
          <SidebarLink
            key="new"
            href={`/chat/${nextChatSuffix}`}
            className="flex items-center group flex-1 py-2"
          >
            {t.actions.newChat}
          </SidebarLink>,
        ];
      }}
    </CollapsibleSection>
  );
}
