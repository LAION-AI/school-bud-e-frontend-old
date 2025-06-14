// @ts-ignore
import { getApiKeys } from "../../api/chat/(_utils)/apiKeys.ts";
import { extractPresentationData } from "../../../utils/formatParser.ts";
import { z } from "zod";
import { formatTemplates } from "../../../types/formats.ts";
import { Handlers } from "fresh/compat";

// Schema for validating the request
const PresentationRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  universalApiKey: z.string().optional(),
  apiKey: z.string().optional(),
  apiUrl: z.string().optional(),
  apiModel: z.string().optional(),
  vlmUrl: z.string().optional(),
  vlmKey: z.string().optional(),
  vlmModel: z.string().optional(),
  vlmCorrectionModel: z.string().optional(),
  ttsUrl: z.string().optional(),
  ttsKey: z.string().optional(),
  ttsModel: z.string().optional(),
  sttUrl: z.string().optional(),
  sttKey: z.string().optional(),
  sttModel: z.string().optional(),
});

// Schema for validating the presentation data
const SlideSchema = z.object({
  title: z.string(),
  content: z.array(z.string()),
  imageUrl: z.string().optional().nullable(),
  notes: z.string().optional(),
});

const PresentationSchema = z.object({
  type: z.literal("presentation"),
  title: z.string(),
  slides: z.array(SlideSchema),
});

export const handler: Handlers = {
  async POST(ctx) {
    const req = ctx.req;

    try {
      // Parse and validate the request body
      const body = await req.json();
      const validationResult = PresentationRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Invalid request: ${validationResult.error.message}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const data = validationResult.data;

      // Get API keys
      const apiKey = data.universalApiKey || data.apiKey;
      const apiUrl = data.apiUrl || "https://api.openai.com/v1";
      const apiModel = data.apiModel || "gpt-4o";

      if (!apiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "API key is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Create a ReadableStream to stream the response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Construct the prompt for the LLM
            const prompt =
              `Create a PowerPoint presentation about "${data.topic}". 
            
The presentation should follow this format:
${formatTemplates.presentation}

The presentation should include:
1. A title slide with an engaging title
2. 5-8 content slides with bullet points
3. Suggestions for images that could be included in each slide

Return a well-structured JSON object following the format above. The presentation should be informative, engaging, and suitable for a general audience.`;

            // Call the LLM API
            const response = await fetch(`${apiUrl}/v1/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: apiModel,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful assistant that creates well-structured PowerPoint presentations. You always respond with valid JSON in the requested format.",
                  },
                  {
                    role: "user",
                    content: prompt,
                  },
                ],
                stream: true,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `API request failed: ${response.status} ${errorText}`,
              );
            }

            // Process the streaming response
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error("Failed to get response reader");
            }

            let accumulatedData = "";
            let presentationData = null;

            // Process the stream chunks
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Convert the chunk to text
              const chunk = new TextDecoder().decode(value);

              // Parse the SSE format
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.substring(6);
                  if (data === "[DONE]") continue;

                  try {
                    const parsedData = JSON.parse(data);
                    const content = parsedData.choices[0]?.delta?.content || "";
                    accumulatedData += content;

                    // Stream the accumulated data to the client
                    controller.enqueue(new TextEncoder().encode(content));
                  } catch (e) {
                    console.error("Error parsing SSE data:", e);
                  }
                }
              }
            }

            // Extract the presentation data from the accumulated response
            try {
              presentationData = extractPresentationData(accumulatedData);

              // Validate the presentation data
              const validationResult = PresentationSchema.safeParse(
                presentationData,
              );
              if (!validationResult.success) {
                throw new Error(
                  `Invalid presentation data: ${validationResult.error.message}`,
                );
              }

              // Generate a unique ID for the presentation
              const id = crypto.randomUUID();

              // Construct the final response
              const finalResponse = {
                success: true,
                presentationData,
                previewUrl: `/presentations/preview?id=${id}`,
              };

              // Send the final response
              controller.enqueue(
                new TextEncoder().encode(
                  `\n\n${JSON.stringify(finalResponse)}`,
                ),
              );
            } catch (e: unknown) {
              console.error("Error extracting presentation data:", e);
              const errorMessage = e instanceof Error
                ? e.message
                : "Unknown error";
              throw new Error(
                `Failed to extract presentation data: ${errorMessage}`,
              );
            }

            // Close the stream
            controller.close();
          } catch (error) {
            // Handle errors
            const errorMessage = error instanceof Error
              ? error.message
              : "An unknown error occurred";
            controller.enqueue(new TextEncoder().encode(JSON.stringify({
              success: false,
              error: errorMessage,
            })));
            controller.close();
          }
        },
      });

      // Return the streaming response
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      // Handle any unexpected errors
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error
            ? error.message
            : "An unknown error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
