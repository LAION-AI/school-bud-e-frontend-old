import { headerContent } from "../../internalization/content.ts";

export default function LogoHeader({ lang }: { lang: string }) {
  return (
    <div class="flex items-center justify-center px-4 drop-shadow-2xl rounded-md w-full">
      {/* Logo Image */}
      <img
        src="/logo.png"
        width="64"
        height="64"
        alt="A little lion wearing a graduation cap."
      />

      <div class="flex flex-col">
        {/* Over Title */}
        <h2 class="text-xs text-gray-600 font-semibold tracking-widest italic">
          {headerContent[lang]["overTitle"]}
        </h2>

        {/* Main Title */}
        <h1 class="text-2xl text-gray-600 font-semibold block self-center">
          {headerContent[lang]["title"]}
        </h1>
      </div>
    </div>
  );
}
