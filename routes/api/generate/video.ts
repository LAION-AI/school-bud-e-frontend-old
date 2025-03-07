import type { Handlers } from "$fresh/server.ts";

interface GenerateVideoRequest {
  prompt: string;
  style?: string;
  customInstructions?: string;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      const body: GenerateVideoRequest = await req.json();
      
      if (!body.prompt) {
        return new Response(JSON.stringify({ error: "Prompt is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      console.log("Sending request to AI tasks server:", {
        prompt: body.prompt,
        style: body.style || "realistic",
        customInstructions: body.customInstructions || ""
      });
      
      // Forward the request to the AI tasks server
      const response = await fetch("http://localhost:8083/generate_video/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: body.prompt,
          style: body.style || "realistic",
          customInstructions: body.customInstructions || ""
        })
      });
      
      if (!response.ok) {
        console.error("AI tasks server returned error:", response.status, response.statusText);
        return new Response(JSON.stringify({ error: `AI tasks server error: ${response.status} ${response.statusText}` }), {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Create a streaming response
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      
      // Process the streaming response from the AI tasks server
      const responseBody = response.body;
      if (responseBody) {
        (async () => {
          try {
            const reader = responseBody.getReader();
            let videoId = null;
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Process the chunk to ensure videoId is included in all file messages
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split("\n").filter(line => line.trim());
              
              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  
                  // Store videoId when it's received
                  if (data.type === "videoId") {
                    videoId = data.data;
                    console.log("Received videoId:", videoId);
                  }
                  
                  // Add videoId to file messages if missing
                  if (data.type === "file" && !data.videoId && videoId) {
                    data.videoId = videoId;
                    console.log("Added videoId to file message:", data);
                    await writer.write(new TextEncoder().encode(`${JSON.stringify(data)}\n`));
                  } else {
                    // Forward the original message
                    await writer.write(new TextEncoder().encode(`${line}\n`));
                  }
                } catch (e) {
                  console.error("Error processing JSON in stream:", e);
                  await writer.write(new TextEncoder().encode(`${line}\n`));
                }
              }
            }
          } catch (error) {
            console.error("Error processing stream:", error);
          } finally {
            writer.close();
          }
        })();
      } else {
        // If there's no response body, close the writer immediately
        writer.close();
      }
      
      return new Response(readable, {
        headers: {
          "Content-Type": "application/json",
          "Transfer-Encoding": "chunked"
        }
      });
    } catch (error) {
      console.error("Error generating video:", error);
      return new Response(JSON.stringify({ error: "Failed to generate video" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
}; 