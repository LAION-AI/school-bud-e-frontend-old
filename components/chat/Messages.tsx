import { useSignal } from "@preact/signals";
import { isApiConfigured } from "./store.ts";
// Remove the import for ChatWarning if it exists
// import { ChatWarning } from "./ChatWarning.tsx";

export function Messages() {
  // ... existing code ...
  
  return (
    <div className="flex-1 overflow-y-auto pb-32 pt-10 messages-container">
      {/* Remove this conditional rendering of the warning */}
      {/*
      {!isApiConfigured.value && (
        <ChatWarning />
      )}
      */}
      
      {/* Rest of the messages component */}
      {messageGroups.value.map((group, index) => (
        // ... existing message rendering code
      ))}
    </div>
  );
} 