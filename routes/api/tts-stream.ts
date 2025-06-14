import { Buffer } from "npm:buffer";
import { deductInputTokens } from "./chat/(_utils)/shop.ts";
import { Handlers } from "fresh/compat";

const TTS_KEY = Deno.env.get("TTS_KEY") || "";
const TTS_URL = Deno.env.get("TTS_URL") || "";
const TTS_MODEL = Deno.env.get("TTS_MODEL") || "";

// Utility function to split text into chunks for streaming
function splitTextIntoChunks(text: string, maxChunkSize: number = 250): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + ".");
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + ".");
  }

  return chunks;
}

// Function to generate TTS for a single chunk
async function generateTTSChunk(
  text: string,
  ttsUrl: string,
  ttsKey: string,
  ttsModel: string,
  shopApiKey?: string,
): Promise<Buffer | null> {
  // Clean text similar to the original implementation
  const boldTextRegex = /\*\*(.*?)\*\*/g;
  text = String(text).replace(boldTextRegex, "$1");
  
  text = text.toLowerCase();
  text = text.replace(/mit /g, "mitt ");
  text = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const buddyRegex = /bud-e/gi;
  text = text.replace(buddyRegex, "buddy");

  let useThisTtsUrl = ttsUrl !== "" ? ttsUrl : TTS_URL;
  let useThisTtsKey = ttsKey !== "" ? ttsKey : TTS_KEY;
  let useThisTtsModel = ttsModel !== "" ? ttsModel : TTS_MODEL;

  if (shopApiKey) {
    const { endpoint, apiKey, model } = await deductInputTokens(
      [{ role: "user", content: text }],
      shopApiKey,
      "de-de-Chirp3-HD-Leda",
    );
    useThisTtsUrl = endpoint;
    useThisTtsKey = apiKey;
    useThisTtsModel = "de-de-Chirp3-HD-Leda";
  }

  try {
    switch (useThisTtsModel) {
      case "aura-helios-en": {
        const response = await fetch(useThisTtsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "Authorization": `Token ${useThisTtsKey}`,
          },
          body: text,
        });
        if (response.ok) {
          const audioData = await response.arrayBuffer();
          return Buffer.from(audioData);
        }
        break;
      }
      case "de-de-Chirp3-HD-Leda": {
        const googleApiKey = useThisTtsKey;
        const voiceName = "de-de-Chirp3-HD-Leda";
        const languageCode = voiceName.split("-").slice(0, 2).join("-");
        
        const googleTtsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`;
        
        const requestBody = {
          input: { text: text },
          voice: {
            languageCode: languageCode,
            name: voiceName,
          },
          audioConfig: {
            audioEncoding: "MP3",
          },
        };

        const response = await fetch(googleTtsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.audioContent) {
            return Buffer.from(responseData.audioContent, "base64");
          }
        }
        break;
      }
      default: {
        const response = await fetch(useThisTtsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${useThisTtsKey}`,
          },
          body: JSON.stringify({
            model: useThisTtsModel,
            input: text,
            voice: "Fritz-PlayAI",
            response_format: "mp3",
          }),
        });

        if (response.ok) {
          const audioData = await response.arrayBuffer();
          return Buffer.from(audioData);
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Error generating TTS chunk: ${error}`);
  }
  return null;
}

export const handler: Handlers = {
  async POST(ctx) {
    const req = ctx.req;
    const { text, textPosition, ttsUrl, ttsKey, ttsModel, shopApiKey } =
      await req.json();

    if (!text) {
      return new Response("No text provided", { status: 400 });
    }

    // Split text into manageable chunks
    const chunks = splitTextIntoChunks(text);
    
    // Create a readable stream for streaming audio chunks
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.substring(0, 50)}...`);
            
            const audioData = await generateTTSChunk(
              chunk,
              ttsUrl || "",
              ttsKey || "",
              ttsModel || "",
              shopApiKey,
            );

            if (audioData) {
              // Send chunk metadata and audio data
              const chunkData = JSON.stringify({
                chunkIndex: i,
                totalChunks: chunks.length,
                text: chunk,
                audioSize: audioData.length,
              }) + "\n";
              
              // Send metadata first
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                type: "metadata",
                chunkIndex: i,
                totalChunks: chunks.length,
                text: chunk,
                audioSize: audioData.length,
              })}\n\n`));
              
              // Then send the actual audio data
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                type: "audio",
                chunkIndex: i,
                audioData: Array.from(audioData),
              })}\n\n`));
            } else {
              // Send error for this chunk
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                type: "error",
                chunkIndex: i,
                message: "Failed to generate audio for this chunk",
              })}\n\n`));
            }
          }
          
          // Send completion signal
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: "complete",
            totalChunks: chunks.length,
          })}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: "error",
            message: error.message,
          })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  },
}; 