/**
 * This function should accept a prompt and return a response from the LLM as a string.
 * It always responds in a stream so we need to handle that.
 */
import { settings, messages as chatMessages, lang, addMessage } from "../../components/chat/store.ts";
import { fetchEventSource } from "https://esm.sh/@microsoft/fetch-event-source@2.0.1";

export async function getLLMResponse(prompt: string): Promise<string> {
  // Add the user message to the global message store
  const userMessage = { role: "user", content: prompt };
  addMessage(userMessage);
  
  return new Promise((resolve, reject) => {
    const responseChunks: string[] = [];
    
    fetchEventSource("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRequestBody(prompt)),
      onmessage(ev) {
        try {
          const parsedData = JSON.parse(ev.data);
          responseChunks.push(parsedData);
        } catch (error) {
          console.error("Error parsing message data:", error);
        }
      },
      async onopen(response) {
        if (response.ok) {
          console.log("Connection established");
        } else {
          reject(`Failed to establish connection: ${response.status} ${response.statusText}`);
        }
      },
      onerror(err) {
        reject(`Error in stream: ${err.message}`);
      },
      onclose() {
        console.log("Connection closed");
        const fullResponse = responseChunks.join("");
        // Add the assistant response to the global message store
        addMessage({ role: "assistant", content: [fullResponse] });
        resolve(fullResponse);
      },
    });
  });
}

// Create request body with common settings and message formatting
function createRequestBody(prompt: string) {
  // Get the messages but don't append the new prompt as it's already added via addMessage
  const messages = chatMessages.value;
  
  return {
    lang: lang.value,
    messages: messages,
    universalApiKey: settings.value.universalApiKey,
    // Add universalShopApiKey as empty string to match API expectations
    universalShopApiKey: "",
    llmApiUrl: settings.value.apiUrl,
    llmApiKey: settings.value.apiKey,
    llmApiModel: settings.value.apiModel,
    vlmApiUrl: settings.value.vlmUrl,
    vlmApiKey: settings.value.vlmKey,
    vlmApiModel: settings.value.vlmModel,
    vlmCorrectionModel: settings.value.vlmCorrectionModel,
    systemPrompt: settings.value.systemPrompt,
  };
}
