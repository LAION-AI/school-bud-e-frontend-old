import { Handlers } from "$fresh/server.ts";
import { transcribePdf } from "./(_utils)/pdfToMarkdown.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const formData = await req.formData();
      const pdfFile = formData.get("file") as File;

      if (!pdfFile || pdfFile.type !== "application/pdf") {
        return new Response(JSON.stringify({ 
          error: "Invalid or missing PDF file" 
        }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      console.log("[Transcribe] Processing PDF file:", pdfFile.name, "Size:", pdfFile.size);
      
      // Read the file content
      const fileArrayBuffer = await pdfFile.arrayBuffer();
      const pdfBuffer = new Uint8Array(fileArrayBuffer);

      // Use the direct transcription function
      const transcription = await transcribePdf(pdfBuffer, pdfFile.size > 5000000);
      
      // Check if the transcription was successful (doesn't start with "Error" or "PDF transcription failed")
      if (!transcription.startsWith("Error") && !transcription.startsWith("PDF transcription failed")) {
        return new Response(JSON.stringify({
          transcription
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // If we got here, there was an error in the transcription
      return new Response(JSON.stringify({
        error: "PDF processing failed",
        details: transcription
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("[Transcribe] Error processing PDF:", error);
      return new Response(JSON.stringify({
        error: "PDF processing failed",
        details: error instanceof Error ? error.message : String(error)
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
}; 