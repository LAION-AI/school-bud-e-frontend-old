import { FreshContext } from "fresh";
import { getApiKeys } from "./chat/(_utils)/apiKeys.ts";
import { deductInputTokens, deductOutputTokens } from "./chat/(_utils)/shop.ts";

const AI_SERVER_URL = Deno.env.get("AI_SERVER_URL") || "http://localhost:8083";

export const handler = {
  async POST(ctx: FreshContext) {
    const req = ctx.req;

    try {
      const formData = await req.formData();
      const pdfFile = formData.get("pdf") as File;
      
      if (!pdfFile) {
        return new Response(JSON.stringify({ error: "No PDF file provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get credentials from formData (same pattern as chat)
      const shopApiKey = formData.get("shopApiKey") as string || "";
      const llmApiUrl = formData.get("llmApiUrl") as string || Deno.env.get("OPENAI_BASE_URL") || "http://localhost:11434/v1/chat/completions";
      const llmApiKey = formData.get("llmApiKey") as string || Deno.env.get("OPENAI_API_KEY") || "ollama";
      const llmApiModel = formData.get("llmApiModel") as string || Deno.env.get("LLM_MODEL") || "llama3.2:3b";
      
      // For task review, we don't need VLM since we're processing PDF server-side
      const vlmApiUrl = llmApiUrl;
      const vlmApiKey = llmApiKey; 
      const vlmApiModel = llmApiModel;
      const vlmCorrectionModel = llmApiModel;

      // Convert PDF to bytes array
      const pdfArrayBuffer = await pdfFile.arrayBuffer();
      const pdfBytes = Array.from(new Uint8Array(pdfArrayBuffer));

      // Create a mock message for API key resolution (task review context)
      const mockMessages = [{
        role: "system",
        content: "Analyzing PDF assignment for task review"
      }];

      // Get API configuration using the same pattern as chat
      const { api_url, api_key, api_model } = await getApiKeys({
        messages: mockMessages,
        isImageInMessages: false, // PDF processing happens server-side
        isCorrectionInLastMessage: false,
        shopApiKey,
        llmApiUrl,
        llmApiKey,
        llmApiModel,
        vlmApiUrl,
        vlmApiKey,
        vlmApiModel,
        vlmCorrectionModel,
      });

      console.debug("[Task Review] Using API:", { api_url, api_model });

      // Deduct input tokens if using shop API
      if (shopApiKey) {
        try {
          await deductInputTokens(mockMessages, shopApiKey, api_model);
        } catch (error) {
          console.error("[Task Review] Failed to deduct input tokens:", error);
        }
      }

      // Prepare request to AI server
      const aiRequest = {
        base_url: api_url,
        api_key: api_key,
        llm_model: api_model,
        pdf_bytes: pdfBytes,
      };

      // Call AI server
      const aiResponse = await fetch(`${AI_SERVER_URL}/api/v1/task-review/analyze-assignment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiRequest),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI server error:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to analyze assignment", details: errorText }), 
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const analysisResult = await aiResponse.json();
      
      // Deduct output tokens if using shop API
      if (shopApiKey && analysisResult) {
        try {
          await deductOutputTokens(JSON.stringify(analysisResult), shopApiKey);
        } catch (error) {
          console.error("[Task Review] Failed to deduct output tokens:", error);
        }
      }
      
      return new Response(JSON.stringify(analysisResult), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Task review error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Internal server error", 
          details: error instanceof Error ? error.message : String(error)
        }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
}; 