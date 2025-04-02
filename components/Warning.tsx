import { warningContent } from "../internalization/content.ts";
import { useEffect, useState } from "preact/hooks";

function Warning({ lang }: { lang: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(localStorage.getItem("warning") === "true");
  console.log({isHidden});

  useEffect(() => {
    localStorage.setItem("warning", isHidden);
  }, [isHidden]);

  const formatBoldTextWhereDoubleAsterisk = (text: string) => {
    const parts = text.split('**');
    return parts.reduce((acc, part, i) => {
      return i % 2 === 0 ? acc + part : `${acc}<strong>${part}</strong>`;
    }, '');
  };

  return (
    <div
      class={`bg-yellow-200/75 border-l-4 border-yellow-500 rounded-md text-yellow-700 mb-2 ${isHidden ? "hidden" : ""}`}
      role="alert"
    >
      <button onClick={() => setIsHidden(!isHidden)}>
        {isHidden ? "Show" : "Hide"}
      </button>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        class="w-full p-4 flex justify-between items-center cursor-pointer hover:bg-yellow-200/90 transition-colors"
        aria-expanded={isExpanded}
      >
        <p class="font-bold">{warningContent[lang]["title"]}</p>
        <span class={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      <div
        class={`px-4 pb-4 overflow-hidden transition-[max-height] duration-300 ease-in-out ${isExpanded ? 'max-h-[800px]' : 'max-h-0'}`}
      >
        <p class={isExpanded ? "mb-4":""}>
          {warningContent[lang]["content"]}
        </p>
        <p 
          class="whitespace-pre-line"
          dangerouslySetInnerHTML={{ 
            __html: formatBoldTextWhereDoubleAsterisk(warningContent[lang]["usage"]) 
          }}
        />
      </div>
    </div>
  );
}

export default Warning;
