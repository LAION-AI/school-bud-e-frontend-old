import { useState } from "preact/hooks";
import { IconQuestionMark } from "@tabler/icons-preact";

export default function FAQButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        class="fixed bottom-4 right-4 bg-primary-500 text-white p-3 rounded-full shadow-lg hover:bg-primary-600 transition-colors w-10 h-10 border"
        aria-label="FAQ"
      >
        <IconQuestionMark />
      </button>

      {isOpen && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-start mb-4">
              <h2 class="text-2xl font-bold">Frequently Asked Questions</h2>
              <button
                onClick={() => setIsOpen(false)}
                class="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div class="space-y-4">
              <div>
                <h3 class="font-semibold text-lg">Why isn't the service free?</h3>
                <p class="text-gray-600">
                  We would love to offer our service for free, but we face significant costs in providing high-quality AI assistance. However, we're committed to making education accessible:
                </p>
                <ul class="list-disc ml-6 mt-2 text-gray-600">
                  <li>We maintain a free tier with limited usage</li>
                  <li>We provide detailed tutorials on how to get started with free API keys</li>
                  <li>We offer special pricing for educational institutions</li>
                </ul>
                <p class="mt-2 text-gray-600">
                  Check out our <a href="/tutorials" class="text-primary-500 hover:underline">tutorials page</a> to learn how to get started with free API keys from various providers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 