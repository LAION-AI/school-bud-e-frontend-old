import { useEffect, useState } from "preact/hooks";
import { deleteChat } from "../../components/chat/store.ts";
import { TourProgressSidebarSection } from "../../components/sidebar/TourProgressSidebarSection.tsx";
import ChatList from "./ChatList.tsx";
import GraphsSection from "./GraphsSection.tsx";
import PresentationsSection from "./PresentationsSection.tsx";
import SidebarHeader from "./SidebarHeader.tsx";
import TestsSection from "./TestsSection.tsx";
import UserProfileSection from "./UserProfileSection.tsx";
import VideoNovelLink from "./VideoNovelLink.tsx";
import translations from "./sidebar.translations.json" with { type: "json" };

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
      class={`sidebar border-r-2 border-gray-200 bg-white h-full flex-col transition-all duration-300 ease-in-out relative hidden md:flex ${
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
        onClick={() => alert("test")}
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
            isCollapsed={isCollapsed}
            currentChatSuffix={currentChatSuffix}
            onDownloadChat={onDownloadChat}
            onDeleteChat={deleteChat}
            translations={t}
          />
          <TestsSection
            isCollapsed={isCollapsed}
            highlight={selectedSection === "tests"}
            lang={lang}
            translations={t}
          />
          <GraphsSection
            isCollapsed={isCollapsed}
          />
          <PresentationsSection
            isCollapsed={isCollapsed}
            translations={t}
            lang={lang}
          />
          <VideoNovelLink isCollapsed={isCollapsed} />
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
        <TourProgressSidebarSection />
        <UserProfileSection
          lang={lang}
        />
      </div>
    </div>
  );
}
