import { useState } from "preact/hooks";
import SpeechToggleButton from "../core/buttons/SpeechToggleButton.tsx";
import { IconSettings } from "@tabler/icons-preact";

export default function UserProfileSection({ lang = "en" }: { lang?: string }) {
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  return (
    <div class="border-t border-gray-200 pt-2 flex items-center gap-2 relative">
      <button
        type="button"
        class="text-sm px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
        onClick={() => setIsWalletOpen((prev) => !prev)}
        aria-pressed={isWalletOpen}
        aria-label={isWalletOpen ? (lang === "de" ? "AI Wallet schließen" : "Close AI Wallet") : (lang === "de" ? "AI Wallet öffnen" : "Open AI Wallet")}
        title={isWalletOpen ? (lang === "de" ? "AI Wallet schließen" : "Close AI Wallet") : (lang === "de" ? "AI Wallet öffnen" : "Open AI Wallet")}
      >
        <IconSettings />
        <span class="text-sm">Settings</span>
      </button>
      <SpeechToggleButton lang={lang} />

      {isWalletOpen && (
        <div class="absolute left-0 mb-20 z-50 min-w-full" style="width: 30rem; bottom: 1.7rem;">
          <ai-wallet open sync></ai-wallet>
          <script type="module" src="/ai-wallet/stencil-component-example.esm.js"></script>
        </div>
      )}
    </div>
  );
}
