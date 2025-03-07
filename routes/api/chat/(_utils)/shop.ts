import tiktoken from "tiktoken";
const SHOP_API_URL = "http://localhost:3000";

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
        model: "gemini-1.5-flash",
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

  const tokensPerMessage = 3; // Base tokens per message
  const tokensPerName = 1; // Additional token if 'name' property exists
  let totalTokens = 0;

  for (const message of messages) {
    totalTokens += tokensPerMessage;
    if ("content" in message) {
      totalTokens += encoder.encode(message.content).length;
    }
    if ("role" in message) {
      totalTokens += encoder.encode(message.role).length;
    }
    if ("name" in message && typeof message.name === "string") {
      totalTokens += encoder.encode(message.name).length;
      totalTokens += tokensPerName;
    }
  }
  totalTokens += 3; // Every reply is primed with <|start|>assistant<|message|>
  return totalTokens;
}
