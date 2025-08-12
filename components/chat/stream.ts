import { signal } from "@preact/signals";
import {
  addMessage,
  editMessage,
  lang,
  messages,
  query,
  settings,
} from "./store.ts";
import { chatIslandContent } from "../../internalization/content.ts";
import { getTTS, resetTranscript } from "./speech.ts";
import {
  type EventSourceMessage,
  fetchEventSource,
} from "https://esm.sh/@microsoft/fetch-event-source@2.0.1";
import { generateText, streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"


class RetriableError extends Error {}
class FatalError extends Error {}

const streamComplete = signal(true);

export const startStream = async (
  transcript: string,
  prevMessages?: Message[],
  images?: Image[],
) => {
  const ongoingStream: string[] = [];

  if (streamComplete.value) {
    streamComplete.value = false;
    resetTranscript.value++;

    const currentQuery = transcript || query.value;
    let previousMessages = prevMessages || messages.value;

    previousMessages = previousMessages.map((msg) => {
      if (typeof msg.content === "string") {
        return msg;
      }
      if (Array.isArray(msg.content) && typeof msg.content[0] === "string") {
        return { role: msg.role, content: msg.content.join("") };
      }
      return msg;
    });

    const messagesToSend: Message[] = [...previousMessages];
    const queryWithImages: (Message | Image)[] = [];

    if (images && images.length > 0) {
      console.log("[Stream] Handling message with files:", images.length);

      // Create a properly structured message with text content
      const textContent = {
        role: "user",
        content: [{ type: "text", text: currentQuery }],
      };

      // Add the text message first
      queryWithImages.push(textContent);

      // Process image objects
      console.log("[Stream] Images to process:", images);

      // Create a single message with multiple content items including text and images/PDFs
      const mediaContent: any[] = [];
      mediaContent.push({ type: "text", text: currentQuery });

      // Add each image/PDF as a content item
      for (const img of images) {
        console.log(
          `[Stream] Processing file object: ${
            JSON.stringify(img).substring(0, 100)
          }...`,
        );

        // Check for in-progress transcriptions - these should not be sent
        if (img.type === "pdf_url" && img.pdf_url?.isTranscribing) {
          console.warn("[Stream] Skipping PDF that is still being transcribed");
          continue;
        }

        if (img.type === "image_url" && img.image_url) {
          mediaContent.push({
            type: "image_url",
            image_url: {
              url: img.image_url.url,
              detail: img.image_url.detail || "high",
              transcription: img.image_url.transcription,
            },
          });
        } else if (img.type === "pdf_url" && img.pdf_url) {
          // For PDFs, don't send the PDF URL to the server
          // Instead, just send the transcription as text
          if (img.pdf_url.transcription) {
            console.log(
              "[Stream] Using PDF transcription instead of sending PDF URL",
            );

            // Add the transcription as text
            mediaContent.push({
              type: "text",
              text:
                `\`\`\`pdf_transcription\n\n${img.pdf_url.transcription}\n\`\`\``,
            });
          } else {
            console.warn("[Stream] PDF has no transcription, skipping");
          }
        }
      }

      // Add a single message with all content items
      messagesToSend.push({
        role: "user",
        content: mediaContent,
      });

      console.log(
        "[Stream] Final message structure:",
        `${JSON.stringify(messagesToSend).substring(0, 100)}...`,
      );
    } else if (currentQuery) {
      messagesToSend.push({ role: "user", content: currentQuery });
    }

    // Add the user message to the UI
    if (messagesToSend.length > 0) {
      addMessage(messagesToSend[messagesToSend.length - 1]);
    }

    // Start with an empty assistant message that we'll stream into
    const assistantMessage = { role: "assistant", content: "" };
    addMessage(assistantMessage);

    const openai = createOpenAI({
      apiKey: settings.value.apiKey,
      baseURL: settings.value.apiUrl
    });

    /*
    await fetchEventSource("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messagesToSend,
        images: queryWithImages,
        lang: lang.value,
        universalApiKey: settings.value.universalApiKey,
        llmApiUrl: settings.value.apiUrl,
        llmApiKey: settings.value.apiKey,
        llmApiModel: settings.value.apiModel,
        vlmApiUrl: settings.value.vlmUrl,
        vlmApiKey: settings.value.vlmKey,
        vlmApiModel: settings.value.vlmModel,
        vlmCorrectionModel: settings.value.vlmCorrectionModel,
        systemPrompt: settings.value.systemPrompt,
      }),
      onmessage(ev: EventSourceMessage) {
        const parsedData = JSON.parse(ev.data);
        ongoingStream.push(parsedData);

        const lastMessage = messages.value[messages.value.length - 1];
        if (typeof lastMessage.content === "string") {
          lastMessage.content += parsedData;
        } else {
          lastMessage.content.push(parsedData);
        }

        editMessage(messages.value.length - 1, {
          role: "assistant",
          content: lastMessage.content,
        });
      },
      async onopen(response: Response) {
        if (
          response.ok &&
          response.headers.get("content-type")?.includes("text/event-stream")
        ) {
          return;
        }
        throw new RetriableError();
      },
      onclose() {
        console.log("Stream closed");
        streamComplete.value = true;
        query.value = "";

        const finalText = ongoingStream.join("");
        if (finalText.trim()) {
          getTTS(finalText, messages.value.length - 1, "stream1");
        }
      },
      onerror(err: Error) {
        if (err instanceof RetriableError) {
          throw err;
        }
      },
    });*/
    console.log(settings.value)
    const stream = streamText({
      model: openai("groq/deepseek-r1-distill-llama-70b"),
      // model: openai(settings.value.apiModel),
      messages: messages.value.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: (typeof msg.content === "string" ? msg.content : "")
    })),
  })

  console.log(stream)
  let firstChunk = true
  for await (const text of stream.textStream) {

        const lastMessage = messages.value[messages.value.length - 1];
        if (typeof lastMessage.content === "string") {
          lastMessage.content += text;
        } else {
          lastMessage.content.push(text);
        }

        editMessage(messages.value.length - 1, {
          role: "assistant",
          content: lastMessage.content,
        });
  }
  console.log("Stream closed");
  streamComplete.value = true;
  query.value = "";

  const finalText = ongoingStream.join("");
  if (finalText.trim()) {
    getTTS(finalText, messages.value.length - 1, "stream1");
  }
  }
};

const fetchBildungsplan = async (query: string, top_n: number) => {
  try {
    const response = await fetch("/api/bildungsplan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        top_n: top_n,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as BildungsplanResponse;

    return data;
  } catch (error) {
    console.error("Error in bildungsplan API:", error);
  }
};

// WIKIPEDIA
const fetchWikipedia = async (
  text: string,
  collection: string,
  n: number,
) => {
  try {
    const response = await fetch("/api/wikipedia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        collection: collection,
        n: n,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as WikipediaResult[];

    return data;
  } catch (error) {
    console.error("Error in wikipedia API:", error);
  }
};

// PAPERS
const fetchPapers = async (query: string, limit: number) => {
  try {
    const response = await fetch("/api/papers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        limit: limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as PapersResponse;

    return data;
  } catch (error) {
    console.error("Error in papers API:", error);
  }
};
