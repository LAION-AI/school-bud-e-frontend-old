import { useState } from "preact/hooks";
import { IconQuestionMark } from "@tabler/icons-preact";
import Modal from "../islands/Modal.tsx";

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

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Frequently Asked Questions"
        size="lg"
      >
        <div class="space-y-6">
          <div class="space-y-4">
            <h3 class="font-medium text-lg">What is School Bud-E?</h3>
            <p class="text-gray-600">
              School Bud-E is your AI-powered educational companion, designed to
              help students and teachers with various learning tasks.
            </p>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium text-lg">How does it work?</h3>
            <p class="text-gray-600">
              School Bud-E uses advanced AI to understand your questions and
              provide helpful, educational responses. It can assist with
              homework, explain concepts, and help you learn more effectively.
            </p>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium text-lg">Is it free to use?</h3>
            <p class="text-gray-600">
              School Bud-E offers both free and premium features. Basic
              functionality is available to all users, while advanced features
              may require a subscription.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
