import { useState } from "preact/hooks";

import { agreementContent } from "../internalization/content.ts";

interface ChatAgreementProps {
  lang: string;
}

export default function ChatAgreement({ lang }: ChatAgreementProps) {
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    localStorage.setItem("school-bud-e-agreement", "true");
    globalThis.location.reload();
  };

  //   title: "Welcome to School Bud-E!",
  //   content:
  //     "Please read and accept the following terms and conditions to continue using School Bud-E.",
  //   accept: "Accept",
  //   terms: "Terms and Conditions",
  //   temsAndConditionsContent: "Placeholder Terms and Conditions",

  return (
    <div class="w-full max-w-xl bg-white/50 rounded-lg shadow-md mb-4 overflow-hidden mx-auto mt-10">
      <div class="relative">
        <div class={"px-4 pt-4 max-h-[60vh] overflow-auto"}>
          <h2 class="text-2xl font-bold mb-4">
            {agreementContent[lang].title}
          </h2>
          <p class="mb-4">{agreementContent[lang].content}</p>
          <p class="mb-4">
            {agreementContent[lang].terms && (
              <a href="#" class="underline">
                {agreementContent[lang].terms}
              </a>
            )}
          </p>
          <p
            class="mb-4"
            dangerouslySetInnerHTML={{
              __html: agreementContent[lang].temsAndConditionsContent,
            }}
          />
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-500/20 to-transparent pointer-events-none">
        </div>
      </div>
      <div class={"p-4"}>
        <div class="mb-4">
          <label class="flex items-center">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) =>
                setAgreed((e.target as HTMLInputElement).checked)}
              class="mr-2"
            />
            <span>{agreementContent[lang].agree}</span>
          </label>
        </div>
        <button
          onClick={handleAgree}
          disabled={!agreed}
          class={`w-full p-2 rounded ${
            agreed
              ? "bg-primary-500 text-white"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {agreementContent[lang].accept}
        </button>
      </div>
    </div>
  );
}
