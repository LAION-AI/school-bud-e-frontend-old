import { deductInputTokens } from "./shop.ts";

export type ChatMessage = {
  role: string;
  content: string | (string | { type: string; text?: string })[];
};

export interface ApiKeysParams {
  messages: ChatMessage[];
  isImageInMessages: boolean;
  isCorrectionInLastMessage: boolean;
  shopApiKey: string;
  llmApiUrl: string;
  llmApiKey: string;
  llmApiModel: string;
  vlmApiUrl: string;
  vlmApiKey: string;
  vlmApiModel: string;
  vlmCorrectionModel: string;
}

export async function getApiKeys(
  params: ApiKeysParams,
  aiModel = "gemini-1.5-flash",
): Promise<{ api_url: string; api_key: string; api_model: string }> {
  const {
    messages,
    isImageInMessages,
    shopApiKey,
    llmApiUrl,
    llmApiKey,
    llmApiModel,
    vlmApiUrl,
    vlmApiKey,
    vlmApiModel,
  } = params;

  if (shopApiKey) {
    if (isImageInMessages) {
      aiModel = vlmApiModel;
    }
    console.debug({
      messages,
      aiModel,
    });
    const { api_url, api_key, api_model } = await getApiKeysFromShop(
      messages,
      shopApiKey,
      aiModel,
    );
    console.debug("API URL", api_url);

    console.log("API URL", api_url);
    console.log("API KEY", api_key);
    console.log("API MODEL", api_model);

    return { api_url, api_key, api_model };
  }
  let api_url = llmApiUrl;
  let api_key = llmApiKey;
  let api_model = llmApiModel;

  if (isImageInMessages) {
    api_url = vlmApiUrl;
    api_key = vlmApiKey;
    api_model = vlmApiModel;
  }
  return { api_url, api_key, api_model };
}

async function getApiKeysFromShop(
  messages: Message[],
  shopApiKey: string,
  aiModel = "gemini-1.5-flash",
): Promise<{ api_url: string; api_key: string; api_model: string }> {
  const { endpoint, apiKey, model } = await deductInputTokens(
    messages,
    shopApiKey,
    aiModel,
  );
  return { api_url: endpoint, api_key: apiKey, api_model: model };
}
