import { Button } from "../../components/Button.tsx";
import { useSignal } from "@preact/signals";
import { TeacherContent } from "./TeacherContent.tsx";
import { StudentContent } from "./StudentContent.tsx";

interface ApiKeySetupProps {
  userType: "teacher" | "student";
  onComplete: () => void;
  onBack: () => void;
  lang?: string;
}

export default function ApiKeySetup({ userType, onComplete, onBack, lang = "en" }: ApiKeySetupProps) {
  const universalKey = useSignal("");
  const showPassword = useSignal(false);
  const hasValidKey = useSignal(false);
  const selectedOption = useSignal<"store" | "free" | null>(null);

  return (
    <div class="space-y-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {lang === "de" ? "API-Schlüssel einrichten" : "Set Up API Key"}
        </h2>
        <p class="text-gray-600">
          {lang === "de"
            ? "Wählen Sie eine Option aus, um fortzufahren"
            : "Choose an option to continue"}
        </p>
      </div>

      {userType === "teacher" ? (
        <TeacherContent
          selectedOption={selectedOption}
          universalKey={universalKey}
          showPassword={showPassword}
          hasValidKey={hasValidKey}
          lang={lang}
        />
      ) : (
        <StudentContent
          selectedOption={selectedOption}
          universalKey={universalKey}
          showPassword={showPassword}
          hasValidKey={hasValidKey}
          lang={lang}
        />
      )}

      {(selectedOption.value === "free" || selectedOption.value === "store") && (
        <div class="flex justify-between">
          <Button
            variant="secondary"
            onClick={onBack}
          >
            {lang === "de" ? "Zurück" : "Back"}
          </Button>
          <Button
            variant="primary"
            onClick={onComplete}
            disabled={!hasValidKey.value}
          >
            {lang === "de" ? "Weiter" : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
} 