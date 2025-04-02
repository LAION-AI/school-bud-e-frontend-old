import { asset } from "$fresh/runtime.ts";
import { Button } from "../components/Button.tsx";
import Footer from "../components/Footer.tsx";

export default function Press(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") as string !== undefined &&
    url.searchParams.get("lang") !== null
    ? url.searchParams.get("lang")
    : "de";

  return (
    <div class="min-h-screen bg-white w-full">
      {/* Header */}
      <div class="bg-primary-700 w-full">
        <div class="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1 class="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              {lang === "de" ? "Presse & Medien" : "Press & Media"}
            </h1>
            <p class="mt-6 max-w-3xl mx-auto text-xl text-primary-200">
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
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
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
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
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
                    <Button variant="primary" size="lg" href="https://laion.ai">
                      {lang === "de" ? "Website besuchen" : "Visit Website"}
                    </Button>
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
                    <Button variant="primary" size="lg" href="https://laion.ai/blog">
                      {lang === "de" ? "Blog lesen" : "Read Blog"}
                    </Button>
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
            <div class="group relative bg-white rounded-lg shadow-lg p-6">
              <div class="relative h-80 w-full overflow-hidden rounded-lg bg-white group-hover:opacity-75 sm:aspect-w-2 sm:aspect-h-1 sm:h-64 lg:aspect-w-1 lg:aspect-h-1">
                <img
                  src={asset("/logo.png")}
                  alt="LAION Logo"
                  class="h-full w-full object-contain object-center"
                />
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">
                {lang === "de" ? "LAION Logo" : "LAION Logo"}
              </h3>
              <p class="mt-2 text-sm text-gray-500">
                {lang === "de" ? "Logo in hoher Auflösung" : "Logo in high resolution"}
              </p>
              <div class="mt-6">
                <Button variant="primary" size="lg" href={asset("/logo.png")} download>
                  {lang === "de" ? "Logo herunterladen" : "Download Logo"}
                </Button>
              </div>
            </div>
            <div class="group relative bg-white rounded-lg shadow-lg p-6">
              <div class="relative h-80 w-full overflow-hidden rounded-lg bg-white group-hover:opacity-75 sm:aspect-w-2 sm:aspect-h-1 sm:h-64 lg:aspect-w-1 lg:aspect-h-1">
                <img
                  src={asset("/banner.png")}
                  alt="LAION Banner"
                  class="h-full w-full object-contain object-center"
                />
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">
                {lang === "de" ? "LAION Banner" : "LAION Banner"}
              </h3>
              <p class="mt-2 text-sm text-gray-500">
                {lang === "de" ? "Banner für Websites und Präsentationen" : "Banner for websites and presentations"}
              </p>
              <div class="mt-6">
                <Button variant="primary" size="lg" href={asset("/banner.png")} download>
                  {lang === "de" ? "Banner herunterladen" : "Download Banner"}
                </Button>
              </div>
            </div>
            <div class="group relative bg-white rounded-lg shadow-lg p-6">
              <div class="relative h-80 w-full overflow-hidden rounded-lg bg-white group-hover:opacity-75 sm:aspect-w-2 sm:aspect-h-1 sm:h-64 lg:aspect-w-1 lg:aspect-h-1">
                <img
                  src={asset("/lines.svg")}
                  alt="LAION Background"
                  class="h-full w-full object-contain object-center"
                />
              </div>
              <h3 class="mt-6 text-lg font-medium text-gray-900">
                {lang === "de" ? "LAION Hintergrund" : "LAION Background"}
              </h3>
              <p class="mt-2 text-sm text-gray-500">
                {lang === "de" ? "Hintergrundbild für Präsentationen" : "Background image for presentations"}
              </p>
              <div class="mt-6">
                <Button variant="primary" size="lg" href={asset("/lines.svg")} download>
                  {lang === "de" ? "Hintergrund herunterladen" : "Download Background"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer lang={lang} />
    </div>
  );
} 