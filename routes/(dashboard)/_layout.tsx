import { PageProps } from "fresh";
import BottomNavigation from "../../islands/navbar/BottomNavigation.tsx";
import Sidebar from "../../islands/sidebar/index.tsx";
import AIFloatingButton from "../../islands/AIFloatingButton.tsx";

export default function DashboardLayout({ Component, url }: PageProps) {
  const lang = url.searchParams.get("lang") !== undefined &&
      url.searchParams.get("lang") !== null
    ? (url.searchParams.get("lang") as string)
    : "de";

  return (
    <div class="h-[calc(100dvh-4rem)] md:h-screen flex">
      <Sidebar
        currentChatSuffix=""
        lang={lang}
      />
      <AIFloatingButton />
      <div class="flex-1">
        <div class="pb-16 md:pb-0">
          <Component />
          <BottomNavigation lang={lang} />
        </div>
      </div>
    </div>
  );
} 