import { asset } from "$fresh/runtime.ts";
import { UserProfile } from "../islands/UserProfile.tsx";
import Settings from "../islands/settings/Settings.tsx";

export default function SignIn(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") as string !== undefined &&
    url.searchParams.get("lang") !== null
    ? url.searchParams.get("lang")
    : "de";

  return (
    <div class="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-4rem)] w-full">
      {/* Left side - Settings */}
      <div class="overflow-y-auto">
        <div class="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-extrabold text-gray-900">
              {lang === "de" ? "Dein Profil einrichten" : "Set Up Your Profile"}
            </h1>
            <p class="mt-2 text-sm text-gray-600">
              {lang === "de" 
                ? "Passe deine Einstellungen an, um das Beste aus School Bud-E herauszuholen."
                : "Customize your settings to get the most out of School Bud-E."}
            </p>
          </div>

          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div class="space-y-6">
              <UserProfile lang={lang as string} />
              <div class="pt-6 border-t border-gray-200">
                <Settings lang={lang as string} />
              </div>
              
              <div class="pt-6 border-t border-gray-200">
                <div class="flex items-center justify-between">
                  <div class="text-sm">
                    <a href="/" class="font-medium text-indigo-600 hover:text-indigo-500">
                      {lang === "de" ? "Zurück zur Startseite" : "Back to Home"}
                    </a>
                  </div>
                  <div>
                    <a
                      href="/press"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {lang === "de" ? "Mehr über uns" : "Learn More About Us"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div class="hidden lg:block relative">
        <img
          src={asset("/lines.svg")}
          alt="School Bud-E"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-indigo-600 bg-opacity-20 flex items-center justify-center">
          <div class="text-center max-w-md mx-auto p-6 bg-white bg-opacity-90 rounded-lg shadow-lg">
            <h2 class="text-3xl font-bold text-indigo-700 mb-4">
              {lang === "de" ? "Willkommen bei School Bud-E" : "Welcome to School Bud-E"}
            </h2>
            <p class="text-gray-700">
              {lang === "de" 
                ? "Konfiguriere deine Einstellungen, um dein Lernerlebnis zu personalisieren."
                : "Configure your settings to personalize your learning experience."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 