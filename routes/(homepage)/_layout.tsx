import { PageProps } from "fresh";
import Navbar from "../../islands/navbar/Navbar.tsx";

export default function HomepageLayout({ Component, url }: PageProps) {
  const lang = url.searchParams.get("lang") !== undefined &&
      url.searchParams.get("lang") !== null
    ? (url.searchParams.get("lang") as string)
    : "de";

  return (
    <div class="h-[calc(100dvh-4rem)] md:h-screen flex">
      <div class="flex flex-col flex-1">
        <Navbar lang={lang} />
        <div class="flex-1">
          <Component />
        </div>
      </div>
    </div>
  );
} 