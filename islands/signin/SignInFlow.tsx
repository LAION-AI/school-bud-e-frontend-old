import { useSignal } from "@preact/signals";
import { asset } from "fresh/runtime";
import UserTypeSelector from "./UserTypeSelector.tsx";
import ApiKeySetup from "./ApiKeySetup.tsx";
import { settings } from "../../components/chat/store.ts";

interface SignInFlowProps {
  lang: string;
}

export default function SignInFlow({ lang }: SignInFlowProps) {
  const step = useSignal<"type" | "api">("type");
  const userType = useSignal<"teacher" | "student" | null>(null);

  const handleUserTypeSelect = (type: "teacher" | "student") => {
    userType.value = type;
    step.value = "api";
  };

  const handleApiKeyComplete = () => {
    // Save settings and redirect to home
    settings.value = {
      ...settings.value,
      universalApiKey:
        (document.querySelector('input[type="password"]') as HTMLInputElement)
          .value,
    };
    window.location.href = "/chat/new";
  };

  const handleApiKeyBack = () => {
    step.value = "type";
    userType.value = null;
  };

  return (
    <div class="grid grid-cols-1 lg:grid-cols-2 w-full h-screen">
      {/* Left side - Content */}
      <div class="overflow-y-auto">
        <div class="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-8">
            <img
              src={asset("/logo.png")}
              alt="School Bud-E"
              class="h-16 mx-auto mb-4"
            />
            <h1 class="text-3xl font-extrabold text-gray-900">
              {lang === "de"
                ? "Willkommen bei School Bud-E"
                : "Welcome to School Bud-E"}
            </h1>
            <p class="mt-2 text-sm text-gray-600">
              {lang === "de"
                ? "Ihr persönlicher Lernassistent"
                : "Your personal learning assistant"}
            </p>
          </div>

          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {step.value === "type"
              ? <UserTypeSelector onSelect={handleUserTypeSelect} lang={lang} />
              : userType.value && (
                <ApiKeySetup
                  userType={userType.value}
                  onComplete={handleApiKeyComplete}
                  onBack={handleApiKeyBack}
                  lang={lang}
                />
              )}
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div class="hidden lg:block relative bg-primary-500">
        <div class="flex flex-col items-center justify-center h-full p-8">
          <div class="w-48 h-48 relative">
            <img
              src={asset("/logo.png")}
              alt="School Bud-E"
              class="w-full h-full object-contain"
            />
          </div>
          <h2 class="text-4xl font-bold text-white mt-8">bud-e</h2>
          <p class="text-xl text-white mt-4">
            {lang === "de"
              ? "Lerne was immer du willst."
              : "Learn whatever you want."}
          </p>
        </div>
      </div>
    </div>
  );
}
