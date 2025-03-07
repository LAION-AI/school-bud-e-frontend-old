import { Button } from "../../components/Button.tsx";

interface UserTypeSelectorProps {
  onSelect: (type: "teacher" | "student") => void;
  lang?: string;
}

export default function UserTypeSelector({ onSelect, lang = "en" }: UserTypeSelectorProps) {
  return (
    <div class="space-y-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {lang === "de" ? "Willkommen bei School Bud-E!" : "Welcome to School Bud-E!"}
        </h2>
        <p class="text-gray-600">
          {lang === "de" 
            ? "Bitte wählen Sie aus, ob Sie Lehrer oder Schüler sind."
            : "Please select whether you are a teacher or a student."}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Button
          variant="primary"
          size="lg"
          onClick={() => onSelect("teacher")}
          class="w-full"
        >
          {lang === "de" ? "Ich bin Lehrer" : "I am a Teacher"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => onSelect("student")}
          class="w-full"
        >
          {lang === "de" ? "Ich bin Schüler" : "I am a Student"}
        </Button>
      </div>
    </div>
  );
} 