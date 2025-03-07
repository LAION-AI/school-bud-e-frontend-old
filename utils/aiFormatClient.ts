import { settings } from "../components/chat/store.ts";
import type {
  BaseFormat,
  FlashcardsJson,
  GameJson,
  GraphJson,
  SupportedFormat,
  WebResultJson,
} from "../types/formats.ts";
import {
  extractFlashcardsData,
  extractFormattedData,
  extractGameData,
  extractGraphData,
  extractWebResultData,
  type FormatExtractionResult,
} from "./formatParser.ts";

/**
 * Options for AI format requests
 */
export interface AIFormatRequestOptions {
  lang?: string;
  throwOnError?: boolean;
  showLoadingState?: boolean;
  universalApiKey?: string;
  universalShopApiKey?: string;
  systemPrompt?: string;
}

/**
 * Message structure for chat API
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * States for the AI response loading process
 */
export type AIResponseState = "idle" | "loading" | "success" | "error";

/**
 * Base result interface for AI format request
 */
export interface AIFormatResult<T extends SupportedFormat = SupportedFormat> {
  state: AIResponseState;
  fullResponse: string;
  format?: T;
  error?: string;
}

/**
 * Default options for AI format requests
 */
const DEFAULT_OPTIONS: AIFormatRequestOptions = {
  lang: "en",
  throwOnError: false,
  showLoadingState: true,
};

/**
 * Makes a request to the AI chat API and extracts formatted data from the response
 *
 * @param messages The messages to send to the AI
 * @param expectedType The expected format type
 * @param options Options for the request
 * @returns A promise that resolves to the result of the request
 */
export async function requestAIFormat<
  T extends SupportedFormat = SupportedFormat,
>(
  messages: ChatMessage[],
  expectedType?: string,
  options: AIFormatRequestOptions = {},
): Promise<AIFormatResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create initial state
  let result: AIFormatResult<T> = {
    state: "loading",
    fullResponse: "",
  };

  try {
    // Prepare request payload
    const payload = {
      messages,
      lang: opts.lang || "en",
      model: settings.value.apiModel || "",
      universalApiKey: settings.value.universalApiKey || "",
      llmApiUrl: settings.value.apiUrl || "",
      llmApiKey: settings.value.apiKey || "",
      llmApiModel: settings.value.apiModel || "",
      systemPrompt: settings.value.systemPrompt || "",
      vlmApiUrl: settings.value.vlmUrl || "",
      vlmApiKey: settings.value.vlmKey || "",
      vlmApiModel: settings.value.vlmModel || "",
      vlmCorrectionModel: settings.value.vlmCorrectionModel || "",
      stream: false,
    };

    // Make the API call
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    // Process the streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let fullText = "";

    // Read the streaming response chunks
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data:") && line !== "data: [DONE]") {
          try {
            const contentData = JSON.parse(line.substring(5));
            fullText += contentData;
            console.log("fullText", fullText);
          } catch (error) {
            console.error("Error parsing stream chunk:", error);
          }
        }
      }
    }

    console.log("fullText", fullText);

    // Once we have the full response, extract the formatted data
    const extractionResult = expectedType
      ? extractFormattedData<T>(fullText, {
        throwOnError: opts.throwOnError,
        expectedType,
      })
      : extractFormattedData<T>(fullText, { throwOnError: opts.throwOnError });

    if (extractionResult.success && extractionResult.format) {
      result = {
        state: "success",
        fullResponse: fullText,
        format: extractionResult.format,
      };
    } else {
      result = {
        state: "error",
        fullResponse: fullText,
        error: extractionResult.error ||
          "Unknown error extracting formatted data",
      };
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result = {
      state: "error",
      fullResponse: result.fullResponse,
      error: errorMessage,
    };

    if (opts.throwOnError) {
      throw error;
    }

    return result;
  }
}

/**
 * Helper function to request a Graph format from the AI
 */
export async function requestGraphFormat(
  messages: ChatMessage[],
  options: AIFormatRequestOptions = {},
): Promise<AIFormatResult<GraphJson>> {
  return requestAIFormat<GraphJson>(messages, "graph", options);
}

/**
 * Helper function to request a WebResult format from the AI
 */
export async function requestWebResultFormat(
  messages: ChatMessage[],
  options: AIFormatRequestOptions = {},
): Promise<AIFormatResult<WebResultJson>> {
  return requestAIFormat<WebResultJson>(messages, "webresult", options);
}

/**
 * Helper function to request a Flashcards format from the AI
 */
export async function requestFlashcardsFormat(
  messages: ChatMessage[],
  options: AIFormatRequestOptions = {},
): Promise<AIFormatResult<FlashcardsJson>> {
  return requestAIFormat<FlashcardsJson>(messages, "flashcards", options);
}

/**
 * Helper function to request a Game format from the AI
 */
export async function requestGameFormat(
  messages: ChatMessage[],
  options: AIFormatRequestOptions = {},
): Promise<AIFormatResult<GameJson>> {
  return requestAIFormat<GameJson>(messages, "game", options);
}

/**
 * Creates a prompt message with instructions to return a specific format
 */
export function createFormatPrompt(
  query: string,
  formatType: string,
): ChatMessage {
  // Get relevant format template information
  const formatTemplate = {
    graph: {
      prompt:
        "Create a graph representation of the following information. Return the result in a graph JSON format.",
      context:
        "The graph should have items with connections between related concepts.",
    },
    webresult: {
      prompt:
        "Find and summarize web results for the following query. Return the results in a webresult JSON format.",
      context: "Include the URL, title, and a brief snippet for each result.",
    },
    flashcards: {
      prompt:
        "Create flashcards for the following information. Return the results in a flashcards JSON format.",
      context:
        "Each flashcard should have a front (question) and back (answer) side.",
    },
    game: {
      prompt:
        "Create an educational game based on the following information. Return the results in a game JSON format.",
      context:
        "The game should include the topic, description, explanation, and code for a simple interactive game.",
    },
  }[formatType] || {
    prompt:
      `Create a response in the ${formatType} format for the following information.`,
    context: "Make sure to follow the specified format structure.",
  };

  return {
    role: "user",
    content:
      `${formatTemplate.prompt} ${formatTemplate.context}\n\nQuery: ${query}`,
  };
}
