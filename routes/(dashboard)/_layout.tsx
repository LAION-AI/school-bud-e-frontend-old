import { PageProps } from "fresh";
import BottomNavigation from "../../islands/navbar/BottomNavigation.tsx";
import TopAppBar from "../../islands/navbar/TopAppBar.tsx";
import Sidebar from "../../islands/sidebar/index.tsx";
import AIFloatingButton from "../../islands/AIFloatingButton.tsx";
import translations from "../../islands/sidebar/sidebar.translations.json" with {
  type: "json",
};

export default function DashboardLayout({ Component, url }: PageProps) {
  const lang = url.searchParams.get("lang") !== undefined &&
      url.searchParams.get("lang") !== null
    ? (url.searchParams.get("lang") as string)
    : "de";

  const enableP2PSync = Deno.env.get("ENABLE_P2P_SYNC") === "true";
  const pathname = url.pathname;
  const isChatListPage = pathname === "/chat";
  const isSettingsPage = pathname === "/settings";
  const showBottomNav = isChatListPage || isSettingsPage;
  const showTopAppBar = !showBottomNav;
  const t = translations[lang as keyof typeof translations];

  // Determine the title for the top app bar based on the current page
  const getPageTitle = () => {
    if (pathname.startsWith("/chat/")) {
      return t.navigation.chats;
    } else if (pathname === "/graph/list") {
      return t.navigation.graphs;
    } else if (pathname.startsWith("/graph/")) {
      return t.navigation.graphs;
    }
    return "School Bud-E";
  };

  return (
    <div class="h-screen flex overflow-hidden">
      <Sidebar
        currentChatSuffix=""
        lang={lang}
        enableP2PSync={enableP2PSync}
      />
      <AIFloatingButton />
      <div class="flex-1 flex flex-col min-w-0">
        {showTopAppBar && (
          <TopAppBar
            title={getPageTitle()}
            backUrl="/chat"
          />
        )}
        <div class={`flex-1 overflow-auto ${showTopAppBar ? "pt-14 md:pt-0" : "pb-16 md:pb-0"}`}>
          <Component />
          {showBottomNav && <BottomNavigation lang={lang} />}
        </div>
      </div>
    </div>
  );
} 