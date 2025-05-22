import { getApiKeys } from "../chat/(_utils)/apiKeys.ts";

/**
 * Directly transcribes a PDF buffer to markdown text.
 * This is a simpler interface for PDF transcription without message structure overhead.
 * @param pdfBuffer The PDF content as a Uint8Array
 * @param shouldTruncate Whether to truncate large PDFs
 * @returns The transcribed text or an error message
 */
export async function transcribePdf(
  pdfBuffer: Uint8Array,
  apiUrl?: string,
  apiKey?: string,
  apiModel?: string,
  shopApiKey?: string,
): Promise<string> {
  try {
    console.log("[PDF] Starting PDF transcription process...");

    // Try to get a markdown transcription
    const [markdown, error] = await fetchMarkdownForPDF(
      pdfBuffer,
      false,
      apiUrl,
      apiKey,
      apiModel,
      shopApiKey,
    );

    // Check if we got a valid response
    if (markdown) {
      console.log("[PDF] Successfully transcribed PDF to markdown");
      return markdown;
    }

    // Return the error if we have one
    if (error) {
      console.error("[PDF] Error transcribing PDF:", error);
      return `Error transcribing PDF: ${error}`;
    }

    // Otherwise return a generic error
    return "PDF transcription failed for unknown reasons";
  } catch (e) {
    console.error("[PDF] Exception in transcribePdf:", e);
    if (e instanceof Error) {
      return `Error transcribing PDF: ${e.message}`;
    }
    return "PDF transcription failed with an unexpected error";
  }
}

async function fetchMarkdownForPDF(
  pdf: Uint8Array,
  shouldTruncate = false,
  apiUrl?: string,
  apiKey?: string,
  apiModel?: string,
  shopApiKey?: string,
): Promise<[string | null, string | null]> {
  console.log(
    `[PDF] Attempting to fetch markdown for PDF (${pdf.length} bytes, truncate=${shouldTruncate})`,
  );
  console.debug({
    apiUrl,
    apiKey,
    apiModel,
    shopApiKey,
  });

  const MAX_RETRIES = 3;
  const PYTHON_BASE_URL = Deno.env.get("PYTHON_BASE_URL");

  if (!PYTHON_BASE_URL) {
    console.error("[PDF] PYTHON_BASE_URL environment variable not set");
    return [null, "PYTHON_BASE_URL environment variable not set"];
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[PDF] Sending ${pdf.length} bytes to PDF-to-Markdown service (attempt ${attempt}/3)`,
      );

      // Make sure the URL is correct - it should be the AI tasks server
      const pdfToMarkdownUrl = `${PYTHON_BASE_URL}/pdf_to_markdown/`;
      console.log(
        `[PDF] Using PDF-to-Markdown service URL: ${pdfToMarkdownUrl}`,
      );

      let response;

      if ((!apiUrl || !apiKey || !apiModel) && shopApiKey) {
        const data = await getApiKeys({
          messages: [],
          shopApiKey: shopApiKey || "",
          llmApiUrl: "",
          llmApiKey: "",
          llmApiModel: "",
          isImageInMessages: false,
          isCorrectionInLastMessage: false,
          vlmApiUrl: "",
          vlmApiKey: "",
          vlmApiModel: "",
          vlmCorrectionModel: "",
        }, "gemini-2.5-flash-online");
        console.debug("API KEYS", data);

        apiUrl = data.api_url;
        apiKey = data.api_key;
        apiModel = data.api_model;
      }

      // If we have API parameters, send them as JSON
      if (apiUrl || apiKey || apiModel) {
        console.log(`[PDF] Using custom API configuration`);
        response = await fetch(pdfToMarkdownUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: Array.from(pdf),
            apiUrl: apiUrl,
            apiKey: apiKey,
            apiModel: apiModel,
          }),
        });
      } else {
        return ["No API configuration provided", null];
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[PDF] Service responded with error: ${response.status} ${response.statusText}`,
        );
        console.error(`[PDF] Error details: ${errorText}`);
        throw new Error(
          `PDF conversion failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const result = await response.json() as { content: string };
      console.log(
        "[PDF] Conversion successful, received response type:",
        typeof result,
      );
      console.log("[PDF] Response keys:", Object.keys(result));
      console.log(
        `[PDF] Full response: ${JSON.stringify(result).substring(0, 500)}...`,
      );

      // Check the structure of the response
      if (!result.content && result.content !== "") {
        console.warn(
          "[PDF] Unexpected response format, missing 'content' key:",
          result,
        );
        return [
          "PDF content could not be extracted properly. Please try a different PDF file.",
          null,
        ];
      }

      let textContent = result.content;
      console.log(
        "[PDF] Extracted text content length:",
        textContent?.length || 0,
      );
      console.log(
        "[PDF] First 200 chars of content:",
        textContent?.substring(0, 200),
      );

      // Handle empty content case (server couldn't extract text)
      if (textContent === "") {
        console.warn(
          "[PDF] Server returned empty content, PDF might be scanned/image-based or encrypted",
        );
        return [
          "No text could be extracted from this PDF. It may be scanned, image-based, or encrypted.",
          null,
        ];
      }

      // Add warning if content is suspiciously short but not empty (likely image-heavy PDF)
      if (textContent.length < 200) {
        console.warn(
          "[PDF] Server returned very little text content, PDF likely contains mostly images",
        );
        textContent =
          `${textContent}\n\n*Note: This PDF appears to contain images which could not be extracted. Only text content is shown.*`;
      }

      // If truncation is needed, limit the text size
      if (shouldTruncate) {
        const MAX_TEXT_LENGTH = Number.POSITIVE_INFINITY;
        console.log(
          `[PDF] Checking if truncation needed: ${textContent.length} chars vs max ${MAX_TEXT_LENGTH}`,
        );

        if (textContent.length > MAX_TEXT_LENGTH) {
          console.log(
            `[PDF] Truncating output from ${textContent.length} chars to max ${MAX_TEXT_LENGTH}`,
          );
          // Truncate but preserve entire paragraphs up to the limit when possible
          let truncatedText = textContent.substring(0, MAX_TEXT_LENGTH);
          // Try to find the last paragraph break to make a clean cut
          const lastBreak = truncatedText.lastIndexOf("\n\n");
          if (lastBreak > MAX_TEXT_LENGTH * 0.8) { // Only use paragraph break if it's not too far back
            truncatedText = truncatedText.substring(0, lastBreak);
          }
          textContent =
            `${truncatedText}\n\n[...Content truncated due to size...]`;
        }
      }

      // Return text content
      return [textContent, null];
    } catch (error: unknown) {
      console.error(`[PDF] Attempt ${attempt}/3 failed:`, error);
      if (attempt < MAX_RETRIES) {
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.error("[PDF] All conversion attempts failed:");
  return [null, "Failed to convert PDF after multiple attempts"];
}
