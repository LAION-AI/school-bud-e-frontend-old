import type { Handlers } from "$fresh/server.ts";
import { ServerSentEventStream } from "https://deno.land/std@0.210.0/http/server_sent_event_stream.ts";
import { formatTemplates } from "../../../types/formats.ts";

import { chatContent } from "../../../internalization/content.ts";
import replacePDFWithMarkdownInMessages from "../(_utils)/pdfToMarkdown.ts";
import { deductOutputTokens } from "./(_utils)/shop.ts";
import { getApiKeys } from "./(_utils)/apiKeys.ts";

// Definiere das Message-Interface
interface Message {
  role: string;
  content: string;
}

async function getModelResponseStream(
  {
    messages,
    lang,
    universalShopApiKey,
    universalApiKey,
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
    universalShopApiKey: string;
    universalApiKey: string;
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
  console.log(systemPrompt);
  if (universalApiKey !== "" && !universalApiKey.startsWith("sbe-")) {
    return new Response(
      "Invalid Universal API Key. It needs to start with '**sbe-**'.",
      { status: 400 },
    );
  }

  // Entferne ggf. alte Assistant-Nachrichten am Ende der Konversation
  let isLastMessageAssistant =
    messages[messages.length - 1].role === "assistant";

  while (isLastMessageAssistant) {
    messages.pop();
    isLastMessageAssistant = messages[messages.length - 1].role === "assistant";
  }

  // Prüfe, ob im letzten Nachrichteninhalt ein #korrektur/#correction-Hashtag vorkommt
  const isCorrectionInLastMessage = hasKorrekturHashtag(messages);
  console.log("isCorrectionInLastMessage", isCorrectionInLastMessage);

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

  console.log(useThisSystemPrompt);

  // Setze den System-Prompt an den Anfang der Nachrichtenliste
  messages.unshift({
    role: "system",
    content: useThisSystemPrompt,
  });

  // Searches for a PDF in the messages and converts it to markdown text.
  const _error = await replacePDFWithMarkdownInMessages(messages);

  // Prüfe, ob Bildinhalte in den Nachrichten vorkommen
  const isImageInMessages = messages.some((message) => {
    if (Array.isArray(message.content)) {
      return message.content.some((item) => item.type === "image_url");
    }
    if (
      typeof message.content === "object" && message.content !== null
    ) {
      return (message.content as { type?: string }).type === "image_url";
    }
    return false;
  });

  const { api_url, api_key, api_model } = await getApiKeys({
    messages,
    isImageInMessages,
    isCorrectionInLastMessage,
    universalApiKey,
    universalShopApiKey,
    llmApiUrl,
    llmApiKey,
    llmApiModel,
    vlmApiUrl,
    vlmApiKey,
    vlmApiModel,
    vlmCorrectionModel,
  });

  console.log("Using this API URL: ", api_url);
  console.log("Using this API Key: ", api_key);
  console.log("Using this API Model: ", api_model);

  if (api_url === "" || api_key === "" || api_model === "") {
    const missingSettingsText = `The following settings are missing: ${
      api_url === "" ? "api_url " : ""
    }${api_key === "" ? "api_key " : ""}${
      api_model === "" ? "api_model " : ""
    }. The current generation mode is: ${
      isImageInMessages ? "VLM" : "LLM"
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
      messages: messages,
      model: api_model,
      stream: true,
    }),
  };

  const response = await fetch(api_url, fetchOptions);

  console.log("response", response);
  console.log("response status", response.status);

  if (response.status !== 200) {
    return new Response(response.statusText, { status: response.status });
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let entireResponse = "";

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          // if (pdfConversionError) {
          //   // Let the user know something went wrong while converting the PDF
          //   controller.enqueue({
          //     data: JSON.stringify(pdfConversionError),
          //     id: Date.now(),
          //     event: "error",
          //   });
          // }
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
                      console.log("End of model response!");
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
                console.log("Closing controller!");
                controller.close();
                console.log("universalShopApiKey", universalShopApiKey);
                if (universalShopApiKey) {
                  deductOutputTokens(entireResponse, universalShopApiKey);
                }
              }
            }
          }
        } catch (_error) {
          controller.close();
        }
      },
      cancel(err) {
        console.log("Stream cancelled", err);
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
function hasKorrekturHashtag(messages: any[]): boolean {
  if (!messages || messages.length === 0) return false;

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content) return false;

  let content = "";

  // Unterstütze unterschiedliche Inhaltsformate
  if (typeof lastMessage.content === "string") {
    content = lastMessage.content;
  } else if (Array.isArray(lastMessage.content)) {
    const textContent = lastMessage.content.find(
      // deno-lint-ignore no-explicit-any
      (item: any) => item.type === "text",
    );
    content = textContent?.text || "";
  }

  return content.toLowerCase().includes("#korrektur") ||
    content.toLowerCase().includes("#correction");
}

export const handler: Handlers = {
  async POST(req: Request) {
    const payload = await req.json();

    try {
      return await getModelResponseStream(
        {
          messages: payload.messages,
          lang: payload.lang,
          universalShopApiKey: payload.universalShopApiKey,
          universalApiKey: payload.universalApiKey,
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
