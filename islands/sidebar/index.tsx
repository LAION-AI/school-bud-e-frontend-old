import { useEffect, useState } from "preact/hooks";
import { deleteChat } from "../../components/chat/store.ts";

import ChatList from "./ChatList.tsx";
import GraphsSection from "./GraphsSection.tsx";
import PresentationsSection from "./PresentationsSection.tsx";
import SidebarHeader from "./SidebarHeader.tsx";
import TestsSection from "./TestsSection.tsx";
import UserProfileSection from "./UserProfileSection.tsx";
import VideoNovelLink from "./VideoNovelLink.tsx";
import ChatSyncInitializer from "../chat/ChatSyncInitializer.tsx";
import translations from "./sidebar.translations.json" with { type: "json" };
// 1. Import the toolbar
import { initToolbar } from '@stagewise/toolbar';

// 2. Define your toolbar configuration
const stagewiseConfig = {
  plugins: [],
};

// 3. Initialize the toolbar when your app starts
// Framework-agnostic approach - call this when your app initializes
function setupStagewise() {
  // Only initialize once and only in development mode
  if (process.env.NODE_ENV === 'development') {
    initToolbar(stagewiseConfig);
  }
}

// Call the setup function when appropriate for your framework
setupStagewise();

interface SidebarProps {
  currentChatSuffix: string;
  lang?: string;
}

export default function Sidebar({
  currentChatSuffix,
  lang = "en",
}: SidebarProps) {
  const t = translations[lang as keyof typeof translations];
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(globalThis.location?.search);
    const collapsed = urlParams.get("collapsed");
    return collapsed === "true";
  });

  const onDownloadChat = () => {
    console.log("Download chat not yet implemented");
  };

  // State to manage which section is highlighted
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Event listener to handle link clicks in the sidebar
  const handleLinkClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor?.getAttribute("href")) {
      const href = anchor.getAttribute("href");
      if (href?.startsWith("/games")) {
        setSelectedSection("games");
      } else if (href?.startsWith("/graphs")) {
        setSelectedSection("graphs");
      } else if (href?.startsWith("/presentations")) {
        setSelectedSection("presentations");
      } else if (href?.startsWith("/tests")) {
        setSelectedSection("tests");
      } else {
        setSelectedSection(null);
      }
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location?.search);
    urlParams.set("collapsed", `${isCollapsed}`);
    const newUrl =
      `${globalThis.location?.origin}${globalThis.location?.pathname}?${urlParams.toString()}`;
    globalThis.history?.replaceState(null, "", newUrl);
  }, [isCollapsed]);

  // Set the initial selected section based on the current URL
  useEffect(() => {
    const path = globalThis.location?.pathname || "";
    if (path.startsWith("/games")) {
      setSelectedSection("games");
    } else if (path.startsWith("/graphs")) {
      setSelectedSection("graphs");
    } else if (path.startsWith("/presentations")) {
      setSelectedSection("presentations");
    } else if (path.startsWith("/tests")) {
      setSelectedSection("tests");
    } else {
      setSelectedSection(null);
    }
  }, []);

  return (
    <div
      class={`sidebar border-r border-gray-200 bg-white h-full flex-col transition-all duration-300 ease-in-out relative hidden md:flex ${
        isCollapsed ? "w-0 overflow-hidden" : "w-[21rem]"
      }`}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        translations={t}
      />

      <div
        class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300"
      >
        <nav
          class="p-3 space-y-3"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleLinkClick(e as unknown as MouseEvent);
            }
          }}
        >
          <ChatList
            currentChatSuffix={currentChatSuffix}
            onDownloadChat={onDownloadChat}
            onDeleteChat={deleteChat}
            translations={t}
          />
          <TestsSection
            highlight={selectedSection === "tests"}
            lang={lang}
            translations={t}
          />
          <GraphsSection />
          <PresentationsSection
            isCollapsed={isCollapsed}
            translations={t}
            lang={lang}
          />
          <VideoNovelLink isCollapsed={isCollapsed} lang={lang} />
          {
            /*
          <GamesSection
            isCollapsed={isCollapsed}
            highlight={selectedSection === "games"}
          />
          */
          }
        </nav>
      </div>

      <div class="p-3 pt-0">
        <div class="mb-3">
          <ChatSyncInitializer lang={lang} />
        </div>
        <UserProfileSection
          lang={lang}
        />
      </div>
    </div>
  );
}
