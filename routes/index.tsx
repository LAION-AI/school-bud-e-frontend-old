import { Button } from "../components/Button.tsx";
import Footer from "../components/Footer.tsx";

export default function Home(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") as string !== undefined &&
    url.searchParams.get("lang") !== null
    ? url.searchParams.get("lang")
    : "de";

  return (
    <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white w-full">
      {/* Hero Section */}
      <div class="relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-10 sm:pt-16 lg:pt-20">
            <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div class="sm:text-center lg:text-left">
                <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span class="block">School Bud-E</span>
                  <span class="block text-primary-600">{lang === "de" ? "Dein KI-Lernbegleiter" : "Your AI Learning Companion"}</span>
                </h1>
                <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  {lang === "de" 
                    ? "Entdecke eine neue Art des Lernens mit School Bud-E, deinem persönlichen KI-Lernbegleiter. Verbessere deine Lernerfahrung und erreiche deine Bildungsziele schneller."
                    : "Discover a new way of learning with School Bud-E, your personal AI learning companion. Enhance your learning experience and achieve your educational goals faster."}
                </p>
                <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-4">
                    <Button href="/signin" variant="primary">{lang === "de" ? "Jetzt starten" : "Get Started"}</Button>
                    <Button href="/press" variant="primary">{lang === "de" ? "Mehr erfahren" : "Learn More"}</Button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div class="py-12 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="lg:text-center">
            <h2 class="text-base text-primary-600 font-semibold tracking-wide uppercase">
              {lang === "de" ? "Funktionen" : "Features"}
            </h2>
            <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {lang === "de" ? "Eine bessere Art zu lernen" : "A better way to learn"}
            </p>
            <p class="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              {lang === "de" 
                ? "School Bud-E bietet dir innovative Werkzeuge, um dein Lernerlebnis zu verbessern."
                : "School Bud-E provides you with innovative tools to enhance your learning experience."}
            </p>
          </div>

          <div class="mt-10">
            <div class="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div class="relative">
                <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" title={lang === "de" ? "Personalisiertes Lernen" : "Personalized Learning"}>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="ml-16">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    {lang === "de" ? "Personalisiertes Lernen" : "Personalized Learning"}
                  </h3>
                  <p class="mt-2 text-base text-gray-500">
                    {lang === "de" 
                      ? "Maßgeschneiderte Lernerfahrungen, die sich an deine individuellen Bedürfnisse anpassen."
                      : "Tailored learning experiences that adapt to your individual needs."}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div class="relative">
                <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" title={lang === "de" ? "Interaktive Übungen" : "Interactive Exercises"}>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div class="ml-16">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    {lang === "de" ? "Interaktive Übungen" : "Interactive Exercises"}
                  </h3>
                  <p class="mt-2 text-base text-gray-500">
                    {lang === "de" 
                      ? "Engagiere dich mit interaktiven Übungen, die das Lernen spannend und effektiv machen."
                      : "Engage with interactive exercises that make learning exciting and effective."}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div class="relative">
                <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" title={lang === "de" ? "KI-gestützte Unterstützung" : "AI-powered Support"}>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div class="ml-16">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    {lang === "de" ? "KI-gestützte Unterstützung" : "AI-powered Support"}
                  </h3>
                  <p class="mt-2 text-base text-gray-500">
                    {lang === "de" 
                      ? "Erhalte sofortige Hilfe und Feedback durch fortschrittliche KI-Technologie."
                      : "Get immediate help and feedback through advanced AI technology."}
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div class="relative">
                <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" title={lang === "de" ? "Fortschrittsverfolgung" : "Progress Tracking"}>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div class="ml-16">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    {lang === "de" ? "Fortschrittsverfolgung" : "Progress Tracking"}
                  </h3>
                  <p class="mt-2 text-base text-gray-500">
                    {lang === "de" 
                      ? "Verfolge deinen Lernfortschritt und identifiziere Bereiche für Verbesserungen."
                      : "Track your learning progress and identify areas for improvement."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div class="bg-primary-700 border-b">
        <div class="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-extrabold text-white sm:text-4xl">
            <span class="block">{lang === "de" ? "Bereit zum Starten?" : "Ready to get started?"}</span>
            <span class="block">{lang === "de" ? "Beginne noch heute mit School Bud-E." : "Begin your journey with School Bud-E today."}</span>
          </h2>
          <p class="mt-4 text-lg leading-6 text-primary-200">
            {lang === "de" 
              ? "Melde dich an und entdecke, wie School Bud-E dein Lernerlebnis revolutionieren kann."
              : "Sign up and discover how School Bud-E can revolutionize your learning experience."}
          </p>
          <a
            href="/signin"
            class="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 sm:w-auto"
          >
            {lang === "de" ? "Jetzt starten" : "Get Started"}
          </a>
        </div>
      </div>
      <Footer lang={lang} />
    </div>
  );
}
