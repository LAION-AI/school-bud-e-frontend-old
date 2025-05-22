import { asset } from "fresh/runtime";
import { Button } from "../../components/Button.tsx";

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
              <Button href="/chat/0" variant="primary">
                {lang === "de" ? "Jetzt starten" : "Start Now"}
              </Button>
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
