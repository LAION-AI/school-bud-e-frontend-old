import { IconMessageCircle, IconPlus, IconX, IconArrowRight} from "@tabler/icons-preact";
import { useSignal, useSignalEffect } from "@preact/signals";
import { useRef, useEffect } from "preact/hooks";
import ChatHistory from "../../components/chat/ChatHistory.tsx";
import { messages as storeMessages, addMessage, startNewChat } from "../../components/chat/store.ts";
import { startStream } from "../../components/chat/stream.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";

export default function FloatingChat() {
  const isOpen = useSignal(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isProcessing = useSignal(false);
  
  // Don't render on chat pages
  const isOnChatPage = IS_BROWSER ? location.pathname.startsWith('/chat') : false;
  if (isOnChatPage) return null;

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Setup event listeners
  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen.value) isOpen.value = false;
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Auto-scroll on new messages
  useSignalEffect(() => {
    if (isOpen.value && storeMessages.value.length > 0) {
      setTimeout(scrollToBottom, 0);
    }
  });

  // Notify other components of chat state changes
  useSignalEffect(() => {
    window.dispatchEvent(
      new CustomEvent("chatStateChange", { detail: { isOpen: isOpen.value } })
    );
  });

  // Handle message submission
  const handleSubmit = async () => {
    const userMessage = inputRef.current?.value.trim();
    if (!userMessage || isProcessing.value) return;

    // Clear input, add message, and scroll
    inputRef.current.value = "";
    addMessage({ role: "user", content: userMessage });
    setTimeout(scrollToBottom, 0);
    
    isProcessing.value = true;

    try {
      await startStream(userMessage, undefined, []);
      setTimeout(scrollToBottom, 0);
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      });
      setTimeout(scrollToBottom, 0);
    } finally {
      isProcessing.value = false;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div class="fixed bottom-4 right-10 z-50">
      {isOpen.value ? (
        <div
          class="bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col overflow-hidden border border-gray-300"
        >
          {/* Header */}
          <div class="p-3 bg-white border-b border-gray-200 flex justify-between items-center">
            <h3 class="font-medium text-gray-800 flex items-center gap-2">
              <IconMessageCircle size={18} className="text-blue-500" />
              Chat Assistant
            </h3>
            <div class="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  startNewChat();
                  setTimeout(scrollToBottom, 0);
                }}
                class="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Start new chat"
                title="Start new chat"
              >
                <IconPlus size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  isOpen.value = false;
                }}
                class="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close chat"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>

          {/* Chat history */}
          <div 
            ref={messagesContainerRef} 
            class="flex-1 overflow-y-auto p-4 bg-gray-50"
          >
            <ChatHistory messages={storeMessages.value} />
          </div>

          {/* Input area */}
          <div class="p-3 bg-white border-t border-gray-200">
            <div class="flex rounded-lg border border-gray-300 overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <textarea
                ref={inputRef}
                placeholder="Type your message..."
                class="flex-1 p-2 resize-none min-h-[40px] max-h-24 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isProcessing.value}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing.value}
                class={`px-3 flex items-center justify-center ${
                  isProcessing.value
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                aria-label="Send message"
              >
                <IconArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            isOpen.value = true;
            setTimeout(scrollToBottom, 0);
          }}
          class="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Open chat"
        >
          <IconMessageCircle size={24} />
        </button>
      )}
    </div>
  );
} 