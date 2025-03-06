import { IconMessageCircle, IconDownload, IconX } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import { chats } from "../../components/chat/store.ts";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SidebarLink from "./SidebarLink.tsx";

interface ChatListProps {
  isCollapsed: boolean;
  currentChatSuffix: string;
  onDownloadChat: () => void;
  onDeleteChat: (suffix: string) => void;
}

export default function ChatList({
  isCollapsed,
  currentChatSuffix,
  onDownloadChat,
  onDeleteChat,
}: ChatListProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const path = globalThis.location?.pathname;
    return path?.startsWith("/chat");
  });
  const [activeSuffix, setActiveSuffix] = useState(currentChatSuffix);

  return (
    <CollapsibleSection
      icon={<IconMessageCircle size={20} />}
      title="Chats"
      isCollapsed={isCollapsed}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      routePattern={/^\/chat\/(\d+|new)$/}
      onRouteMatch={(match) => setActiveSuffix(match?.[1] || "")}
    >
      {[...Object.keys(chats.value)
        .filter(key => key.startsWith("bude-chat-"))
        .sort((a, b) => {
          const numA = Number.parseInt(a.slice(10));
          const numB = Number.parseInt(b.slice(10));
          return numA - numB;
        })
        .map((key) => {
          const suffix = key.slice(10);
          return (
            <div
              key={suffix}
              class="flex items-center group"
            >
              <SidebarLink
                href={`/chat/${suffix}`}
                isActive={suffix === activeSuffix}
                className="flex-1"
              >
                {isCollapsed
                  ? `#${Number.parseInt(suffix) + 1}`
                  : `Chat ${Number.parseInt(suffix) + 1}`}
              </SidebarLink>
              <button
                type="button"
                onClick={onDownloadChat}
                class="group-hover:text-gray-400 text-transparent p-2"
              >
                <IconDownload class="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteChat(suffix)}
                class="group-hover:text-gray-400 text-transparent p-2"
              >
                <IconX size={24} />
              </button>
            </div>
          );
        }), 
        <div key="new" class="flex items-center group">
          <SidebarLink
            href="/chat/new"
            isActive={"new" === activeSuffix}
            className="flex-1"
          >
            {isCollapsed ? "+" : "New Chat"}
          </SidebarLink>
        </div>
      ]}
    </CollapsibleSection>
  );
} 