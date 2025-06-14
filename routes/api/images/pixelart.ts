import { FreshContext } from "fresh";
import { Handlers } from "fresh/compat";

interface PixelArtRequest {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  n?: number;
  apiUrl?: string;
  apiKey?: string;
}

interface TogetherAPIResponse {
  data: Array<{
    b64_json: string;
  }>;
}

const TOGETHER_API_URL = Deno.env.get("TOGETHER_API_URL") ||
  "https://api.together.xyz/v1/images/generations";
const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY") || "";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const handler: Handlers = {
  async POST(ctx: FreshContext) {
    const req = ctx.req;

    try {
      const requestData = await req.json() as PixelArtRequest;

      if (!requestData.prompt) {
        return new Response("Prompt is required", { status: 400 });
      }

      const apiUrl = requestData.apiUrl || TOGETHER_API_URL;
      const apiKey = requestData.apiKey || TOGETHER_API_KEY;

      if (!apiKey) {
        return new Response(
          "API key is required. Please set TOGETHER_API_KEY in environment or provide in request",
          { status: 400 },
        );
      }

      const requestBody = {
        model: "black-forest-labs/FLUX.1-schnell",
        prompt: requestData.prompt,
        width: requestData.width || 416,
        height: requestData.height || 416,
        steps: requestData.steps || 7,
        n: requestData.n || 1,
        response_format: "b64_json",
        update_at: new Date().toISOString(),
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Together API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: TogetherAPIResponse = await response.json();

      return new Response(
        JSON.stringify({
          images: data.data.map((item) => item.b64_json),
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error in pixelart API:", error);
      return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
