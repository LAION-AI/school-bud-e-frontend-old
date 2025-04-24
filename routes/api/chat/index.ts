import type { Handlers } from "$fresh/server.ts";
import { ServerSentEventStream } from "https://deno.land/std@0.210.0/http/server_sent_event_stream.ts";
import { formatTemplates } from "../../../types/formats.ts";

import { chatContent } from "../../../internalization/content.ts";
import { deductOutputTokens } from "./(_utils)/shop.ts";
import { getApiKeys } from "./(_utils)/apiKeys.ts";

// Definiere das Message-Interface
interface Message {
  role: string;
  content: string | string[] | {
    type: string;
    text?: string;
    image_url?: { url: string; detail?: string };
    pdf_url?: { url: string; size?: number };
  }[];
  processedContent?: string;
}

async function getModelResponseStream(
  {
    messages,
    lang,
    shopApiKey,
    llmApiUrl,
    llmApiKey,
    llmApiModel,
    systemPrompt,
    vlmApiUrl,
    vlmApiKey,
    vlmApiModel,
    vlmCorrectionModel,
  }: {
    messages: Message[];
    lang: string;
    shopApiKey: string;
    llmApiUrl: string;
    llmApiKey: string;
    llmApiModel: string;
    systemPrompt: string;
    vlmApiUrl: string;
    vlmApiKey: string;
    vlmApiModel: string;
    vlmCorrectionModel: string;
  },
) {
  // Entferne ggf. alte Assistant-Nachrichten am Ende der Konversation
  let isLastMessageAssistant =
    messages[messages.length - 1].role === "assistant";

  while (isLastMessageAssistant) {
    messages.pop();
    isLastMessageAssistant = messages[messages.length - 1].role === "assistant";
  }

  // Prüfe, ob im letzten Nachrichteninhalt ein #korrektur/#correction-Hashtag vorkommt
  const isCorrectionInLastMessage = hasKorrekturHashtag(messages);

  let useThisSystemPrompt = isCorrectionInLastMessage
    ? chatContent[lang].correctionSystemPrompt
    : chatContent[lang].systemPrompt;

  if (systemPrompt !== "") {
    useThisSystemPrompt = systemPrompt;
  }

  // Füge Anweisungen hinzu, damit die KI, wenn möglich, die strukturierte JSON-Antwort generiert
  const jsonInstruction = `
If you have additional structured data to provide (such as search results, graph data, flashcards, or game content), please include a JSON object in your response with one of the following structures:

${
    Object.entries(formatTemplates).map(([key, value]) =>
      `${value.description}:
${value.template}
${value.requirements.join("\n")}`
    ).join("\n\n")
  }`;

  useThisSystemPrompt += `\n\n${jsonInstruction}`;

  // Setze den System-Prompt an den Anfang der Nachrichtenliste
  messages.unshift({
    role: "system",
    content: useThisSystemPrompt,
  });

  // Clone messages to avoid modifying the original
  const apiMessages = JSON.parse(JSON.stringify(messages));

  // Log message contents for debugging
  apiMessages.forEach((msg: Message, idx: number) => {
    if (typeof msg.content === "string") {
      console.debug(`[Chat API] Message ${idx}: string content (${msg.content.length} chars)`);
    } else if (Array.isArray(msg.content)) {
      console.debug(`[Chat API] Message ${idx}: array content with ${msg.content.length} items`);
      
      // Check for different content types in this message
      const contentTypes = msg.content
        .filter(item => typeof item === 'object')
        .map(item => item.type)
        .filter(Boolean);
        
      if (contentTypes.length > 0) {
        console.debug(`[Chat API] Message ${idx} content types:`, contentTypes);
      }
      
      // Check and log PDF items specifically
      const pdfItems = msg.content.filter(item => 
        typeof item === 'object' && item.type === 'pdf_url' && item.pdf_url);
        
      if (pdfItems.length > 0) {
        console.debug(`[Chat API] Found ${pdfItems.length} PDF items in message ${idx}`);
        
        pdfItems.forEach((item, i) => {
          if (item.pdf_url) {
            const urlType = item.pdf_url.url.substring(0, 20);
            const size = item.pdf_url.size || 'unknown';
            console.debug(`[Chat API] PDF ${i} in message ${idx}: URL type: ${urlType}..., size: ${size}`);
          }
        });
      }
    } else if (msg.content && typeof msg.content === "object") {
      console.debug(`[Chat API] Message ${idx}: object content of type ${msg.content.type || "unknown"}`);
    }
  });

  // Create a copy of messages with processedContent for API request
  const apiMessagesWithProcessedContent = apiMessages.map(msg => {
    if (msg.processedContent) {
      return { ...msg, content: msg.processedContent };
    }
    if (Array.isArray(msg.content) && msg.content.length === 0) {
      return null;
    }
    return msg;
  }).filter(Boolean);

  // Check for images and PDFs in messages
  const isImageInMessages = apiMessagesWithProcessedContent.some((message) => {
    if (Array.isArray(message.content)) {
      return message.content.some((item) => item.type === "image_url");
    }
    if (typeof message.content === "object" && message.content !== null) {
      return (message.content as { type?: string }).type === "image_url";
    }
    return false;
  });

  const isPDFInMessages = apiMessagesWithProcessedContent.some((message) => {
    if (Array.isArray(message.content)) {
      return message.content.some((item) => item.type === "pdf_url");
    }
    if (typeof message.content === "object" && message.content !== null) {
      return (message.content as { type?: string }).type === "pdf_url";
    }
    return false;
  });

  // Use VLM if we have images OR PDFs
  const shouldUseVLM = isImageInMessages || isPDFInMessages;
  console.debug(`[Chat API] Using VLM: ${shouldUseVLM} (Images: ${isImageInMessages}, PDFs: ${isPDFInMessages})`);

  vlmApiModel = "gemini-2.5-pro-preview-03-25";
  const { api_url, api_key, api_model  } = await getApiKeys({
    messages: apiMessagesWithProcessedContent,
    isImageInMessages: shouldUseVLM,
    isCorrectionInLastMessage,
    shopApiKey,
    llmApiUrl,
    llmApiKey,
    llmApiModel,
    vlmApiUrl,
    vlmApiKey,
    vlmApiModel,
    vlmCorrectionModel,
  }, "gemini-2.5-pro-preview-03-25");


  // Process PDFs and images for API request
  try {
    console.debug("[Chat API] Not Processing PDFs in messages...");
    console.debug({
      api_url,
      api_key,
      api_model,
      shopApiKey
    });
    console.debug("[Chat API] Not PDF processing complete");
  } catch (error) {
    console.error("[Chat API] Error processing PDFs:", error);
    return new Response(JSON.stringify({ error: "Error processing PDFs" }), {
      status: 500,
    });
  }

  console.debug("Using this API URL: ", api_url);
  console.debug("Using this API Key: ", api_key);
  console.debug("Using this API Model: ", api_model);

  if (api_url === "" || api_key === "" || api_model === "") {
    const missingSettingsText = `The following settings are missing: ${
      api_url === "" ? "api_url " : ""
    }${api_key === "" ? "api_key " : ""}${
      api_model === "" ? "api_model " : ""
    }. The current generation mode is: ${
      shouldUseVLM ? "VLM" : "LLM"
    }. The current correction mode is: ${
      isCorrectionInLastMessage
        ? "Running with correction"
        : "Running without correction"
    }`;
    return new Response(missingSettingsText, { status: 400 });
  }

  const fetchOptions: RequestInit = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: apiMessagesWithProcessedContent,
      model: api_model,
      stream: true,
    }),
  };

  const response = await fetch(api_url, fetchOptions);

  console.debug("response", response);
  console.debug("response status", response.status);

  if (response.status !== 200) {
    return new Response(response.statusText, { status: response.status });
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let entireResponse = "";

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          // Check if the last message contains a PDF that might cause issues
          const lastMessage = apiMessages[apiMessages.length - 1];
          let hasBlobPdf = false;
          
          if (lastMessage && Array.isArray(lastMessage.content)) {
            for (const item of lastMessage.content) {
              if (item && 
                  typeof item === 'object' && 
                  item.type === 'pdf_url' && 
                  item.pdf_url?.url && 
                  item.pdf_url.url.startsWith('blob:')) {
                hasBlobPdf = true;
                console.debug("[Stream] Detected blob: PDF URL in message that may cause issues");
                break;
              }
            }
          }
          
          if (hasBlobPdf) {
            console.debug("[Stream] Warning user about blob: PDF URLs");
            controller.enqueue("⚠️ Note: PDF files with blob URLs can't be processed by the server. " +
              "Please convert PDFs to data URLs client-side before sending them. " +
              "The system will continue processing other content.\n\n");
          }

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                const jsonStr = line.substring(5); // Passe dies ggf. an die API-Antwort an
                try {
                  const data = JSON.parse(jsonStr);
                  if (
                    data.choices[0] !== undefined &&
                    data.choices[0].delta.content !== undefined &&
                    data.choices[0].delta.content !== null
                  ) {
                    if (data.choices[0].delta.content === "<|im_end|>") {
                      console.debug("End of model response!");
                      controller.close();
                    } else {
                      entireResponse += data.choices[0].delta.content;
                      const content = data.choices[0].delta.content;
                      // Sende den regulären Chattext
                      controller.enqueue({
                        data: JSON.stringify(content),
                        id: Date.now(),
                        event: "message",
                      });
                    }
                  }
                } catch (error) {
                  console.error("Error parsing JSON:", error, jsonStr);
                }
              } else if (line === "data: [DONE]") {
                console.debug("Closing controller!");
                controller.close();
                console.debug("shopApiKey", shopApiKey);
                if (shopApiKey) {
                  deductOutputTokens(entireResponse, shopApiKey);
                }
              }
            }
          }
        } catch (_error) {
          controller.close();
        }
      },
      cancel(err) {
        console.debug("Stream cancelled", err);
      },
    }).pipeThrough(new ServerSentEventStream()),
    {
      headers: {
        "Content-Type": "text/event-stream",
      },
    },
  );
}

// deno-lint-ignore no-explicit-any
function hasKorrekturHashtag(messages: Message[]): boolean {
  if (!messages || messages.length === 0) return false;

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content) return false;

  let content = "";

  // Unterstütze unterschiedliche Inhaltsformate
  if (typeof lastMessage.content === "string") {
    content = lastMessage.content;
  } else if (Array.isArray(lastMessage.content)) {
    const textContent = lastMessage.content.find(
      (item: { type: string; text?: string }) => item.type === "text",
    );
    content = textContent?.text || "";
  }

  return content.toLowerCase().includes("#korrektur") ||
    content.toLowerCase().includes("#correction");
}

export const handler: Handlers = {
  async POST(req: Request) {
    const payload = await req.json();
    console.debug("payload", payload);

    try {
      return await getModelResponseStream(
        {
          messages: payload.messages,
          lang: payload.lang,
          shopApiKey: payload.universalApiKey,
          llmApiUrl: payload.llmApiUrl,
          llmApiKey: payload.llmApiKey,
          llmApiModel: payload.llmApiModel,
          systemPrompt: payload.systemPrompt,
          vlmApiUrl: payload.vlmApiUrl,
          vlmApiKey: payload.vlmApiKey,
          vlmApiModel: payload.vlmApiModel,
          vlmCorrectionModel: payload.vlmCorrectionModel,
        },
      );
    } catch (error: unknown) {
      console.error("Error in getModelResponseStream:", error);
      if (error instanceof Error) {
        return new Response(error.message, { status: 500 });
      }
      return new Response("An unknown error occurred", { status: 500 });
    }
  },
};
