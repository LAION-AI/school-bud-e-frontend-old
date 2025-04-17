import { asset } from "$fresh/runtime.ts";

interface NavbarProps {
  lang: string;
}

export default function Navbar({ lang }: NavbarProps) {
  return (
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <a href="/" class="flex items-center">
                <img
                  class="h-8 w-auto"
                  src={asset("/logo.png")}
                  alt="School Bud-E"
                />
                <span class="ml-2 text-xl font-semibold text-gray-900">
                  School Bud-E
                </span>
              </a>
            </div>
          </div>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <a
                href="/chat/0"
                class="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {lang === "de" ? "Jetzt starten" : "Start Now"}
              </a>
            </div>
            <div class="ml-4">
              <a
                href={`/?lang=${lang === "de" ? "en" : "de"}`}
                class="text-gray-500 hover:text-gray-700"
              >
                {lang === "de" ? "EN" : "DE"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 