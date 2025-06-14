import { Signal } from "@preact/signals";
import { IconEye, IconEyeCancel } from "@tabler/icons-preact";
import { useRef } from "preact/hooks";
import Input from "../../components/core/Input.tsx";

interface KeyInputProps {
  universalKey: Signal<string>;
  showPassword: Signal<boolean>;
  hasValidKey: Signal<boolean>;
  lang?: string;
}

export function KeyInput(
  { universalKey, showPassword, hasValidKey, lang = "en" }: KeyInputProps,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateKey = (value: string) => {
    universalKey.value = value;
    hasValidKey.value = value.length > 0;
  };

  const handleInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    updateKey(input.value);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const input = e.target as HTMLInputElement;
    // Use setTimeout to get the value after the paste event
    setTimeout(() => updateKey(input.value), 0);
  };

  const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
    if (inputRef.current && showPassword.value) {
      inputRef.current.focus();
    }
  };

  return (
    <div class="relative">
      <Input
        type={showPassword.value ? "text": "password"}
        value={universalKey.value}
        onInput={handleInput}
        onPaste={handlePaste}
        placeholder={lang === "de" ? "API-Schlüssel eingeben" : "Enter API Key"}
        ref={inputRef}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPassword.value ? <IconEyeCancel /> : <IconEye />}
      </button>
    </div>
  );
}
