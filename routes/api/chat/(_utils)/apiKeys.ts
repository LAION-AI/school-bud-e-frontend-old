import { deductInputTokens } from "./shop.ts";

const API_URL = Deno.env.get("LLM_URL") || "";
const API_KEY = Deno.env.get("LLM_KEY") || "";
const API_MODEL = Deno.env.get("LLM_MODEL") || "";
const API_IMAGE_URL = Deno.env.get("VLM_URL") || "";
const API_IMAGE_KEY = Deno.env.get("VLM_KEY") || "";
const API_IMAGE_MODEL = Deno.env.get("VLM_MODEL") || "";
const API_IMAGE_CORRECTION_MODEL = Deno.env.get("VLM_CORRECTION_MODEL") || "";

export type ChatMessage = {
  role: string;
  content: string | (string | { type: string; text?: string })[];
};

export interface ApiKeysParams {
  messages: ChatMessage[];
  isImageInMessages: boolean;
  isCorrectionInLastMessage: boolean;
  universalApiKey: string;
  universalShopApiKey: string;
  llmApiUrl: string;
  llmApiKey: string;
  llmApiModel: string;
  vlmApiUrl: string;
  vlmApiKey: string;
  vlmApiModel: string;
  vlmCorrectionModel: string;
}

export async function getApiKeys(params: ApiKeysParams): Promise<{ api_url: string; api_key: string; api_model: string }> {
  const {
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
  } = params;

  let api_url = "";
  let api_key = "";
  let api_model = "";

  if (isImageInMessages) {
    api_url = "";
    api_key = "";
    api_model = "";
  }
  if (isCorrectionInLastMessage) {
    api_model = "";
  }

  if (universalApiKey?.startsWith("sbe-")) {
    api_url = llmApiUrl !== "" ? llmApiUrl : API_URL;
    api_key = llmApiKey !== "" ? llmApiKey : API_KEY;
    api_model = llmApiModel !== "" ? llmApiModel : API_MODEL;
    if (isImageInMessages) {
      api_url = vlmApiUrl !== "" ? vlmApiUrl : API_IMAGE_URL;
      api_key = vlmApiKey !== "" ? vlmApiKey : API_IMAGE_KEY;
      api_model = vlmApiModel !== "" ? vlmApiModel : API_IMAGE_MODEL;
    }
    if (isCorrectionInLastMessage) {
      api_model = vlmCorrectionModel !== "" ? vlmCorrectionModel : API_IMAGE_CORRECTION_MODEL;
    }
  } else if (universalShopApiKey) {
    type CastMessage = { role: string; content: string | (string | { type: "image_url"; image_url: { url: string; detail: string }; preview: string })[] };
    const castMessages = messages as unknown as CastMessage[];
    const { endpoint, apiKey, model } = await deductInputTokens(castMessages, universalShopApiKey);
    api_url = endpoint;
    api_key = apiKey;
    api_model = model;
    if (isImageInMessages) {
      api_url = vlmApiUrl !== "" ? vlmApiUrl : API_IMAGE_URL;
      api_key = vlmApiKey !== "" ? vlmApiKey : API_IMAGE_KEY;
      api_model = vlmApiModel !== "" ? vlmApiModel : API_IMAGE_MODEL;
    }
  } else {
    api_url = llmApiUrl !== "" ? llmApiUrl : "";
    api_key = llmApiKey !== "" ? llmApiKey : "";
    api_model = llmApiModel !== "" ? llmApiModel : "";
    if (isImageInMessages) {
      api_url = vlmApiUrl !== "" ? vlmApiUrl : "";
      api_key = vlmApiKey !== "" ? vlmApiKey : "";
      api_model = vlmApiModel !== "" ? vlmApiModel : "";
    }
  }
  return { api_url, api_key, api_model };
} 