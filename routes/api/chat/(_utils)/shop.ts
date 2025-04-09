import tiktoken from "tiktoken";
const SHOP_API_URL = Deno.env.get("SHOP_API_URL") || "http://localhost:3000";

/**
 * Shop API Communication Module
 * 
 * Handles all interactions with the shop API service, including:
 * - Token usage tracking and deduction
 * 
 * The shop API provides centralized services for managing
 * billing, and resource usage.
 */

export async function deductOutputTokens(
  response: string,
  universalShopApiKey: string,
) {
  const encoder = await tiktoken.get_encoding("cl100k_base");
  const tokens = encoder.encode(response).length;
  console.log("tokens", tokens);
  try {
    const res = await fetch(
      `${SHOP_API_URL}/token-usage/deduct-output-token-usage`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: universalShopApiKey,
        tokens: tokens,
        model: "gemini-1.5-flash",
      }),
    },
    );
  } catch (error) {
    console.error("Error deducting output tokens:", error);
  }
}

export async function deductInputTokens(
  messages: Message[],
  universalShopApiKey: string,
  model = "gemini-1.5-flash"
) {
  const tokens = await countTokens(messages);
  const response = await fetch(
    `${SHOP_API_URL}/token-usage/deduct-input-token-usage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: universalShopApiKey,
        tokens: tokens,
        model: model,
      }),
    },
  );

  const data = await response.json();

  return {
    endpoint: data.endpoint,
    apiKey: data.apiKey,
    model: data.model,
  };
}

async function countTokens(messages: Message[]) {
  const encoder = await tiktoken.get_encoding("cl100k_base");

  const tokensPerMessage = 3;
  const tokensPerName = 1;
  let totalTokens = 0;

  for (const message of messages) {
    totalTokens += tokensPerMessage;
    if ("content" in message) {
      if (typeof message.content === "string") {
        totalTokens += encoder.encode(message.content).length;
      } else if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (typeof item === 'object' && item !== null) {
            if (item.type === 'text' && item.text) {
              totalTokens += encoder.encode(item.text).length;
            } else if (item.type === 'image_url' && item.image_url?.url) {
              totalTokens += encoder.encode(item.image_url.url).length;
            } else if (item.type === 'pdf_url' && item.pdf_url?.url) {
              totalTokens += encoder.encode(item.pdf_url.url).length;
            }
          }
        }
      }
    }
    if ("role" in message) {
      totalTokens += encoder.encode(message.role).length;
    }
    if ("name" in message && typeof message.name === "string") {
      totalTokens += encoder.encode(message.name).length;
      totalTokens += tokensPerName;
    }
  }
  totalTokens += 3;
  return totalTokens;
}
