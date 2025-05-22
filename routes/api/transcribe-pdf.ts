import { transcribePdf } from "./(_utils)/pdfToMarkdown.ts";
import { Handlers } from "fresh/compat";

export const handler: Handlers = {
  async POST(ctx) {
    const req = ctx.req;

    try {
      const formData = await req.formData();
      const pdfFile = formData.get("file") as File;
      const apiUrl = formData.get("apiUrl")?.toString() || undefined;
      const apiKey = formData.get("apiKey")?.toString() || undefined;
      const apiModel = formData.get("apiModel")?.toString() || undefined;
      const shopApiKey = formData.get("shopApiKey")?.toString() || undefined;
      console.log({
        apiUrl,
        apiKey,
        apiModel,
        shopApiKey,
      });

      if (!pdfFile || !pdfFile.type.includes("pdf")) {
        return new Response(
          JSON.stringify({
            error: "Invalid or missing PDF file",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      console.log(
        "[Transcribe] Processing PDF file:",
        pdfFile.name,
        "Size:",
        pdfFile.size,
      );

      // Read the file content
      const fileArrayBuffer = await pdfFile.arrayBuffer();

      // Convert to markdown and return the result
      const markdown = await transcribePdf(
        new Uint8Array(fileArrayBuffer),
        apiUrl,
        apiKey,
        apiModel,
        shopApiKey,
      );

      return new Response(JSON.stringify({ markdown }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[Transcribe] Error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to transcribe PDF";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
