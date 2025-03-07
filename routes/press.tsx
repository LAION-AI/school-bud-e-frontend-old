import { asset } from "$fresh/runtime.ts";

export default function Press(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") as string !== undefined &&
    url.searchParams.get("lang") !== null
    ? url.searchParams.get("lang")
    : "de";

  return (
    <div class="min-h-screen bg-white w-full">
      {/* Header */}
      <div class="bg-indigo-700 w-full">
        <div class="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              {lang === "de" ? "Presse & Medien" : "Press & Media"}
            </h1>
            <p class="mt-6 max-w-3xl mx-auto text-xl text-indigo-200">
              {lang === "de" 
                ? "Ressourcen und Informationen für Medienvertreter und Partner"
                : "Resources and information for media representatives and partners"}
            </p>
          </div>
        </div>
      </div>

      {/* About LAION */}
      <div class="py-16 bg-gray-50 overflow-hidden w-full">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="lg:grid lg:grid-cols-2 lg:gap-8">
            <div>
              <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                {lang === "de" ? "Über LAION" : "About LAION"}
              </h2>
              <p class="mt-3 max-w-3xl text-lg text-gray-500">
                {lang === "de" 
                  ? "LAION (Large-scale Artificial Intelligence Open Network) ist eine gemeinnützige Organisation mit Mitgliedern aus der ganzen Welt."
                  : "LAION (Large-scale Artificial Intelligence Open Network) is a non-profit organization with members from all over the world."}
              </p>
              <div class="mt-8 space-y-6">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" title="Mission">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                      {lang === "de" ? "Unsere Mission" : "Our Mission"}
                    </h3>
                    <p class="mt-2 text-base text-gray-500">
                      {lang === "de" 
                        ? "Wir stellen Datensätze, Tools und Modelle zur Verfügung, um die Forschung im Bereich des maschinellen Lernens zu demokratisieren."
                        : "We provide datasets, tools and models to liberate machine learning research."}
                    </p>
                  </div>
                </div>
                <div class="flex">
                  <div class="flex-shrink-0">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" title="Values">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                      {lang === "de" ? "Unsere Werte" : "Our Values"}
                    </h3>
                    <p class="mt-2 text-base text-gray-500">
                      {lang === "de" 
                        ? "100% gemeinnützig. 100% offen. Wir fördern öffentliche Bildung und einen umweltfreundlicheren Umgang mit Ressourcen."
                        : "100% non-profit. 100% open. We encourage open public education and a more environment-friendly use of resources."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-12 lg:mt-0">
              <div class="pl-4 -mr-48 sm:pl-6 md:-mr-16 lg:px-0 lg:m-0 lg:relative lg:h-full">
                <img
                  class="w-full rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 lg:absolute lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                  src={asset("/logo.png")}
                  alt="LAION Logo"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div class="bg-white w-full">
        <div class="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div class="max-w-3xl mx-auto text-center">
            <h2 class="text-3xl font-extrabold text-gray-900">
              {lang === "de" ? "Kontaktinformationen" : "Contact Information"}
            </h2>
            <p class="mt-4 text-lg text-gray-500">
              {lang === "de" 
                ? "Für Presseanfragen und weitere Informationen stehen wir Ihnen gerne zur Verfügung."
                : "For press inquiries and more information, we're here to help."}
            </p>
          </div>
          <div class="mt-12 sm:mt-16 lg:mt-20">
            <div class="bg-gray-50 rounded-lg overflow-hidden shadow divide-y divide-gray-200 sm:divide-y-0 sm:grid sm:grid-cols-2 sm:gap-px">
              <div class="p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                <div class="mt-8">
                  <h3 class="text-lg font-medium text-gray-900">
                    <a href="https://laion.ai/contact" class="focus:outline-none">
                      {lang === "de" ? "Allgemeine Anfragen" : "General Inquiries"}
                    </a>
                  </h3>
                  <p class="mt-2 text-sm text-gray-500">
                    {lang === "de" 
                      ? "Für allgemeine Fragen und Informationen besuchen Sie bitte unsere Website."
                      : "For general questions and information, please visit our website."}
                  </p>
                  <div class="mt-6">
                    <a href="https://laion.ai" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      {lang === "de" ? "Website besuchen" : "Visit Website"} <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
              <div class="p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                <div class="mt-8">
                  <h3 class="text-lg font-medium text-gray-900">
                    <a href="https://laion.ai/blog" class="focus:outline-none">
                      {lang === "de" ? "Blog & Updates" : "Blog & Updates"}
                    </a>
                  </h3>
                  <p class="mt-2 text-sm text-gray-500">
                    {lang === "de" 
                      ? "Bleiben Sie auf dem Laufenden mit unseren neuesten Blogbeiträgen und Updates."
                      : "Stay up to date with our latest blog posts and updates."}
                  </p>
                  <div class="mt-6">
                    <a href="https://laion.ai/blog" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      {lang === "de" ? "Blog lesen" : "Read Blog"} <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Assets */}
      <div class="bg-gray-50 w-full">
        <div class="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div class="max-w-3xl mx-auto text-center">
            <h2 class="text-3xl font-extrabold text-gray-900">
              {lang === "de" ? "Medien-Assets" : "Media Assets"}
            </h2>
            <p class="mt-4 text-lg text-gray-500">
              {lang === "de" 
                ? "Laden Sie Logos, Bilder und andere Medien-Assets für Ihre Berichterstattung herunter."
                : "Download logos, images, and other media assets for your coverage."}
            </p>
          </div>
          <div class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div class="group relative">
              <div class="relative h-80 w-full overflow-hidden rounded-lg bg-white group-hover:opacity-75 sm:aspect-w-2 sm:aspect-h-1 sm:h-64 lg:aspect-w-1 lg:aspect-h-1">
                <img
                  src={asset("/logo.png")}
                  alt="LAION Logo"
                  class="h-full w-full object-contain object-center"
                />
              </div>
              <h3 class="mt-6 text-sm text-gray-500">
                <a href={asset("/logo.png")} download class="hover:underline">
                  <span class="absolute inset-0" />
                  {lang === "de" ? "Logo (PNG)" : "Logo (PNG)"}
                </a>
              </h3>
              <p class="text-base font-semibold text-gray-900">
                {lang === "de" ? "LAION Logo in hoher Auflösung" : "LAION Logo in high resolution"}
              </p>
            </div>
            <div class="group relative">
              <div class="relative h-80 w-full overflow-hidden rounded-lg bg-white group-hover:opacity-75 sm:aspect-w-2 sm:aspect-h-1 sm:h-64 lg:aspect-w-1 lg:aspect-h-1">
                <img
                  src={asset("/banner.png")}
                  alt="LAION Banner"
                  class="h-full w-full object-contain object-center"
                />
              </div>
              <h3 class="mt-6 text-sm text-gray-500">
                <a href={asset("/banner.png")} download class="hover:underline">
                  <span class="absolute inset-0" />
                  {lang === "de" ? "Banner (PNG)" : "Banner (PNG)"}
                </a>
              </h3>
              <p class="text-base font-semibold text-gray-900">
                {lang === "de" ? "LAION Banner für Websites und Präsentationen" : "LAION Banner for websites and presentations"}
              </p>
            </div>
            <div class="group relative">
              <div class="relative h-80 w-full overflow-hidden rounded-lg bg-white group-hover:opacity-75 sm:aspect-w-2 sm:aspect-h-1 sm:h-64 lg:aspect-w-1 lg:aspect-h-1">
                <img
                  src={asset("/lines.svg")}
                  alt="LAION Background"
                  class="h-full w-full object-contain object-center"
                />
              </div>
              <h3 class="mt-6 text-sm text-gray-500">
                <a href={asset("/lines.svg")} download class="hover:underline">
                  <span class="absolute inset-0" />
                  {lang === "de" ? "Hintergrund (SVG)" : "Background (SVG)"}
                </a>
              </h3>
              <p class="text-base font-semibold text-gray-900">
                {lang === "de" ? "Hintergrundbild für Präsentationen" : "Background image for presentations"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with links */}
      <div class="bg-indigo-700 w-full">
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div class="xl:grid xl:grid-cols-3 xl:gap-8">
            <div class="space-y-8 xl:col-span-1">
              <img
                class="h-10"
                src={asset("/logo.png")}
                alt="LAION"
              />
              <p class="text-white text-base">
                {lang === "de" 
                  ? "LAION - Large-scale Artificial Intelligence Open Network"
                  : "LAION - Large-scale Artificial Intelligence Open Network"}
              </p>
              <div class="flex space-x-6">
                <a href="https://twitter.com/laion_ai" class="text-white hover:text-gray-200">
                  <span class="sr-only">Twitter</span>
                  <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" title="Twitter">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://github.com/LAION-AI" class="text-white hover:text-gray-200">
                  <span class="sr-only">GitHub</span>
                  <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" title="GitHub">
                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div class="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div class="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 class="text-sm font-semibold text-white tracking-wider uppercase">
                    {lang === "de" ? "Ressourcen" : "Resources"}
                  </h3>
                  <ul class="mt-4 space-y-4">
                    <li>
                      <a href="https://laion.ai/blog" class="text-base text-indigo-100 hover:text-white">
                        {lang === "de" ? "Blog" : "Blog"}
                      </a>
                    </li>
                    <li>
                      <a href="https://laion.ai/projects" class="text-base text-indigo-100 hover:text-white">
                        {lang === "de" ? "Projekte" : "Projects"}
                      </a>
                    </li>
                    <li>
                      <a href="https://laion.ai/team" class="text-base text-indigo-100 hover:text-white">
                        {lang === "de" ? "Team" : "Team"}
                      </a>
                    </li>
                  </ul>
                </div>
                <div class="mt-12 md:mt-0">
                  <h3 class="text-sm font-semibold text-white tracking-wider uppercase">
                    {lang === "de" ? "Rechtliches" : "Legal"}
                  </h3>
                  <ul class="mt-4 space-y-4">
                    <li>
                      <a href="https://laion.ai/privacy-policy" class="text-base text-indigo-100 hover:text-white">
                        {lang === "de" ? "Datenschutz" : "Privacy"}
                      </a>
                    </li>
                    <li>
                      <a href="https://laion.ai/impressum" class="text-base text-indigo-100 hover:text-white">
                        {lang === "de" ? "Impressum" : "Imprint"}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-12 border-t border-indigo-500 pt-8">
            <p class="text-base text-indigo-100 xl:text-center">
              &copy; {new Date().getFullYear()} LAION. {lang === "de" ? "Alle Rechte vorbehalten." : "All rights reserved."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 