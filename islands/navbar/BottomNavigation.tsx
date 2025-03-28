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
          class={`flex flex-col items-center justify-center w-full h-full  ${
            isActive("/chat") ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <div class="bg-blue-50 box-border border-2 border-blue-300 rounded-lg p-2">

          <svg width="36" height="36" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <title>{t.navigation.chats}</title>
<g filter="url(#filter0_d_25_349)">
<path d="M28 4.66669C40.887 4.66669 51.3333 15.113 51.3333 28C51.3333 40.887 40.887 51.3334 28 51.3334H9.33329C8.09562 51.3334 6.90863 50.8417 6.03346 49.9665C5.15829 49.0914 4.66663 47.9044 4.66663 46.6667V28C4.66663 15.113 15.113 4.66669 28 4.66669Z" fill="#FEC905"/>
</g>
<mask id="mask0_25_349" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="4" y="4" width="48" height="48">
<path d="M28 4.66669C40.887 4.66669 51.3333 15.113 51.3333 28C51.3333 40.887 40.887 51.3334 28 51.3334H9.33329C8.09562 51.3334 6.90863 50.8417 6.03346 49.9665C5.15829 49.0914 4.66663 47.9044 4.66663 46.6667V28C4.66663 15.113 15.113 4.66669 28 4.66669Z" fill="#FEC905"/>
</mask>
<g mask="url(#mask0_25_349)">
<rect opacity="0.3" x="46.8596" width="14.3521" height="71" transform="rotate(54.5798 46.8596 0)" fill="white"/>
<rect opacity="0.3" x="62.8596" y="22" width="14.3521" height="71" transform="rotate(54.5798 62.8596 22)" fill="white"/>
</g>
<path d="M35 23.3333H21C20.4052 23.334 19.8332 23.5617 19.4008 23.97C18.9683 24.3782 18.7081 24.9362 18.6732 25.5299C18.6384 26.1236 18.8315 26.7082 19.2132 27.1643C19.595 27.6203 20.1364 27.9134 20.727 27.9836L21 28H35C35.5947 27.9993 36.1667 27.7716 36.5992 27.3633C37.0316 26.9551 37.2918 26.3971 37.3267 25.8034C37.3615 25.2097 37.1684 24.6251 36.7867 24.169C36.405 23.713 35.8635 23.4199 35.273 23.3496L35 23.3333ZM28 32.6666H21C20.3811 32.6666 19.7876 32.9125 19.35 33.3501C18.9125 33.7876 18.6666 34.3811 18.6666 35C18.6666 35.6188 18.9125 36.2123 19.35 36.6499C19.7876 37.0875 20.3811 37.3333 21 37.3333H28C28.6188 37.3333 29.2123 37.0875 29.6499 36.6499C30.0875 36.2123 30.3333 35.6188 30.3333 35C30.3333 34.3811 30.0875 33.7876 29.6499 33.3501C29.2123 32.9125 28.6188 32.6666 28 32.6666Z" fill="#8F4F44"/>
<defs>
<filter id="filter0_d_25_349" x="4.66663" y="4.66669" width="47.6666" height="47.6667" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dx="1" dy="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.560784 0 0 0 0 0.309804 0 0 0 0 0.266667 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_25_349"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_25_349" result="shape"/>
</filter>
</defs>
</svg>
          </div>
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
            isActive("/graph") ? "text-green-600" : "text-gray-600"
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