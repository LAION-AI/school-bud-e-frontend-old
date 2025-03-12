import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const PYTHON_BASE_URL = Deno.env.get("PYTHON_BASE_URL");

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
  apiModel?: string
): Promise<string> {
  try {
    console.log("[PDF] Starting PDF transcription process...");
    
    // Try to get a markdown transcription
    const [markdown, error] = await fetchMarkdownForPDF(pdfBuffer, false, apiUrl, apiKey, apiModel);
    
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

/**
 * Searches through the messages and replaces all PDFs with Markdown.
 * If the message content is an array, it will be converted to a single string after conversion.
 * @param messages Chat messages uploaded to the server.
 * @returns An error if something went wrong, or null if successful.
 */
export default async function replacePDFWithMarkdownInMessages(
  messages: {
    role: string;
    content: string | {
      type: string;
      text?: string;
      image_url?: { url: string; detail?: string };
      pdf_url?: { url: string; size?: number };
    }[] | any;
    processedContent?: string | {
      type: string;
      text?: string;
      image_url?: { url: string; detail?: string };
      pdf_url?: { url: string; size?: number };
    }[] | any;
  }[]
): Promise<unknown | null> {
  console.log(`[PDF] Processing ${messages.length} messages`);
  
  for (const message of messages) {
    // Use processedContent if available, otherwise fall back to content
    const contentToProcess = message.processedContent !== undefined ? 'processedContent' : 'content';
    
    // Skip if message content is undefined
    if (!message[contentToProcess]) {
      console.log(`[PDF] Skipping message with undefined ${contentToProcess}`);
      continue;
    }
    
    if (Array.isArray(message[contentToProcess])) {
      console.log(`[PDF] Processing message with array ${contentToProcess} (${message[contentToProcess].length} items)`);
      
      for (let i = 0; i < message[contentToProcess].length; i++) {
        const item = message[contentToProcess][i];
        
        if (
          item &&
          typeof item === "object" &&
          item.type === "pdf_url" &&
          item.pdf_url?.url
        ) {
          try {
            console.log(`[PDF] Found PDF item at index ${i}, URL type: ${item.pdf_url.url.substring(0, 20)}...`);
            
            let pdfBuffer: Uint8Array;
            const url = item.pdf_url.url;
            
            // Log URL type for debugging
            if (url.startsWith("data:")) {
              console.log("[PDF] Processing data URL");
            } else if (url.startsWith("blob:")) {
              console.log("[PDF] Processing blob URL");
            } else if (url.startsWith("http")) {
              console.log("[PDF] Processing HTTP URL");
            } else {
              console.log(`[PDF] Unknown URL type: ${url.substring(0, 10)}...`);
            }

            try {
              // Fetch PDF content based on URL type
              if (url.startsWith("data:application/pdf;base64,")) {
                console.log("[PDF] Decoding base64 PDF data");
                try {
                  const base64Data = url.replace(/^data:application\/pdf;base64,/, "");
                  pdfBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
                  console.log(`[PDF] Base64 decoded, buffer size: ${pdfBuffer.length} bytes`);
                } catch (decodeError) {
                  console.error("[PDF] Base64 decode error:", decodeError);
                  throw new Error(`PDF decode error: ${decodeError}`);
                }
              } else if (url.startsWith("blob:")) {
                console.log(`[PDF] Attempting to fetch blob URL: ${url}`);
                try {
                  // For blob URLs, first try fetch with no-cors mode
                  let response: Response;
                  try {
                    console.log("[PDF] Trying fetch with credentials");
                    response = await fetch(url, { credentials: 'include' });
                  } catch (initialFetchError) {
                    console.log(`[PDF] Initial fetch failed: ${initialFetchError.message}, trying no-cors mode`);
                    response = await fetch(url, { mode: 'no-cors' });
                  }
                  
                  if (!response.ok) {
                    console.error(`[PDF] Blob fetch failed with status: ${response.status}`);
                    throw new Error(`Blob fetch failed: ${response.statusText}`);
                  }
                  
                  try {
                    console.log("[PDF] Blob fetch succeeded, getting blob");
                    const blob = await response.blob();
                    console.log(`[PDF] Got blob of type ${blob.type} and size ${blob.size}`);
                    
                    const arrayBuffer = await blob.arrayBuffer();
                    console.log(`[PDF] Converted blob to arrayBuffer of length ${arrayBuffer.byteLength}`);
                    
                    pdfBuffer = new Uint8Array(arrayBuffer);
                    console.log(`[PDF] Created Uint8Array of length ${pdfBuffer.length}`);
                  } catch (blobError) {
                    console.error(`[PDF] Error processing blob: ${blobError.message}`);
                    throw new Error(`Error processing blob: ${blobError.message}`);
                  }
                } catch (blobFetchError) {
                  console.error(`[PDF] Blob URL fetch error: ${blobFetchError.message}`);
                  
                  // Fallback - suggest client to convert blob to data URL before submitting
                  console.log("[PDF] Blob URL failed, adding specific error message");
                  throw new Error(`Blob URL can't be processed by server. Convert to data URL client-side.`);
                }
              } else {
                console.log(`[PDF] Fetching PDF from URL: ${url.substring(0, 30)}...`);
                try {
                  const response = await fetch(url);
                  if (!response.ok) {
                    console.error(`[PDF] Fetch failed with status: ${response.status}`);
                    throw new Error(`PDF fetch failed: ${response.statusText}`);
                  }
                  const arrayBuffer = await response.arrayBuffer();
                  pdfBuffer = new Uint8Array(arrayBuffer);
                  console.log(`[PDF] Fetch successful, buffer size: ${pdfBuffer.length} bytes`);
                } catch (fetchError) {
                  console.error("[PDF] Fetch error:", fetchError);
                  throw new Error(`Error fetching PDF: ${fetchError}`);
                }
              }
            } catch (urlProcessingError) {
              console.error("[PDF] URL processing error:", urlProcessingError);
              message[contentToProcess][i] = `[PDF processing failed: ${urlProcessingError.message}]`;
              continue;
            }
            
            try {
              console.log(`[PDF] Extracting text from PDF (${pdfBuffer.length} bytes)`);
              
              // Check if PDF needs to be truncated based on the flag
              const shouldTruncate = item.pdf_url.shouldTruncate === true;
              if (shouldTruncate) {
                console.log("[PDF] Large PDF detected, will truncate text output");
              }
              
              const markdown = await fetchMarkdownForPDF(pdfBuffer, shouldTruncate, url, null, null);
              // Replace the PDF item with the converted Markdown text in the processed content
              message[contentToProcess][i] = markdown[0] || "[PDF text extraction failed]";
              
              // Also store the transcription in the original PDF object for future reference
              if (markdown[0] && item.pdf_url) {
                item.pdf_url.transcription = markdown[0];
              }
              
              // If there was an error, add it as a comment
              if (markdown[1]) {
                console.error(`[PDF] Error processing PDF: ${markdown[1]}`);
                message[contentToProcess][i] += `\n\n<!-- PDF processing error: ${markdown[1]} -->`;
              }
            } catch (processingError) {
              console.error("PDF processing error:", processingError);
              message[contentToProcess][i] = "[PDF processing failed]";
            }
          } catch (e) {
            console.error(e);
            return e;
          }
        } else if (
          item &&
          typeof item === "object" &&
          item.type === "text" &&
          typeof item.text === "string"
        ) {
          // Replace text objects with their string content.
          message[contentToProcess][i] = item.text;
        }
        // If the item is already a string, leave it as is.
      }
      // Join all items into a single string.
      message[contentToProcess] = message[contentToProcess].join("\n");
    } else if (
      message[contentToProcess] &&
      typeof message[contentToProcess] === "object" &&
      message[contentToProcess] !== null
    ) {
      // Process content if it is a single object.
      if (message[contentToProcess].type === "pdf_url") {
        try {
          let pdfBuffer: Uint8Array;
          const url = message[contentToProcess].pdf_url.url;
          
          // Handle blob URLs by fetching the content
          if (url.startsWith('blob:')) {
            try {
              const response = await fetch(url);
              if (!response.ok) {
                message[contentToProcess] = "[PDF could not be downloaded]";
                return null;
              }
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();
              pdfBuffer = new Uint8Array(arrayBuffer);
            } catch (fetchError) {
              console.error("Error fetching blob URL:", fetchError);
              message[contentToProcess] = "[PDF could not be downloaded]";
              return null;
            }
          } else {
            // Handle base64 data URLs
            const base64 = url.replace(/^data:application\/pdf;base64,/, "");
            
            // Add a size check to prevent processing extremely large PDFs
            if (base64.length > 10000000) { // ~10MB limit for base64 processing
              message[contentToProcess] = "[Large PDF document - text extraction skipped]";
              return null;
            }
            
            try {
              pdfBuffer = decodeBase64(base64);
            } catch (decodeError) {
              console.error("PDF decode error:", decodeError);
              message[contentToProcess] = "[PDF could not be processed - decoding error]";
              return null;
            }
          }
          
          try {
            console.log(`[PDF] Extracting text from PDF (${pdfBuffer.length} bytes)`);
            
            // Check if PDF needs to be truncated based on the flag
            const shouldTruncate = message[contentToProcess].pdf_url.shouldTruncate === true;
            if (shouldTruncate) {
              console.log("[PDF] Large PDF detected, will truncate text output");
            }
            
            const markdown = await fetchMarkdownForPDF(pdfBuffer, shouldTruncate, url, null, null);
            // Replace the object with the converted Markdown text in the processed content
            message[contentToProcess] = markdown[0] || "[PDF text extraction failed]";
            
            // Also store the transcription in the original PDF object for future reference
            if (markdown[0] && message[contentToProcess].pdf_url) {
              message[contentToProcess].pdf_url.transcription = markdown[0];
            }
            
            // If there was an error, add it as a comment
            if (markdown[1]) {
              console.error(`[PDF] Error processing PDF: ${markdown[1]}`);
              message[contentToProcess] += `\n\n<!-- PDF processing error: ${markdown[1]} -->`;
            }
          } catch (processingError) {
            console.error("PDF processing error:", processingError);
            message[contentToProcess] = "[PDF processing failed]";
          }
        } catch (e) {
          console.error(e);
          return e;
        }
      } else if (
        message[contentToProcess].type === "text" &&
        typeof message[contentToProcess].content === "string"
      ) {
        // If it's a text object, use its string content.
        message[contentToProcess] = message[contentToProcess].content;
      }
    }
  }
  return null;
}

async function fetchMarkdownForPDF(
  pdf: Uint8Array, 
  shouldTruncate = false, 
  apiUrl?: string, 
  apiKey?: string, 
  apiModel?: string
): Promise<[string | null, string | null]> {
  console.log(`[PDF] Attempting to fetch markdown for PDF (${pdf.length} bytes, truncate=${shouldTruncate})`);
  
  const MAX_RETRIES = 3;
  const PYTHON_BASE_URL = Deno.env.get("PYTHON_BASE_URL");

  if (!PYTHON_BASE_URL) {
    console.error("[PDF] PYTHON_BASE_URL environment variable not set");
    return [null, "PYTHON_BASE_URL environment variable not set"];
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[PDF] Sending ${pdf.length} bytes to PDF-to-Markdown service (attempt ${attempt}/3)`);
      
      // Make sure the URL is correct - it should be the AI tasks server
      const pdfToMarkdownUrl = `${PYTHON_BASE_URL}/pdf_to_markdown/`;
      console.log(`[PDF] Using PDF-to-Markdown service URL: ${pdfToMarkdownUrl}`);
      
      let response;
      
      // If we have API parameters, send them as JSON
      if (apiUrl || apiKey || apiModel) {
        console.log(`[PDF] Using custom API configuration`);
        response = await fetch(pdfToMarkdownUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pdf_bytes: Array.from(pdf),
            api_url: apiUrl,
            api_key: apiKey,
            api_model: apiModel
          }),
        });
      } else {
        // Otherwise send the raw PDF data
        response = await fetch(pdfToMarkdownUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/pdf",
          },
          body: pdf,
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PDF] Service responded with error: ${response.status} ${response.statusText}`);
        console.error(`[PDF] Error details: ${errorText}`);
        throw new Error(`PDF conversion failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json() as { content: string };
      console.log('[PDF] Conversion successful, received response type:', typeof result);
      console.log('[PDF] Response keys:', Object.keys(result));
      console.log(`[PDF] Full response: ${JSON.stringify(result).substring(0, 500)}...`);
      
      // Check the structure of the response
      if (!result.content && result.content !== "") {
        console.warn('[PDF] Unexpected response format, missing \'content\' key:', result);
        return ["PDF content could not be extracted properly. Please try a different PDF file.", null];
      }
      
      let textContent = result.content;
      console.log('[PDF] Extracted text content length:', textContent?.length || 0);
      console.log('[PDF] First 200 chars of content:', textContent?.substring(0, 200));
      
      // Handle empty content case (server couldn't extract text)
      if (textContent === "") {
        console.warn('[PDF] Server returned empty content, PDF might be scanned/image-based or encrypted');
        return ["No text could be extracted from this PDF. It may be scanned, image-based, or encrypted.", null];
      }
      
      // Add warning if content is suspiciously short but not empty (likely image-heavy PDF)
      if (textContent.length < 200) {
        console.warn('[PDF] Server returned very little text content, PDF likely contains mostly images');
        textContent = `${textContent}\n\n*Note: This PDF appears to contain images which could not be extracted. Only text content is shown.*`;
      }
      
      // If truncation is needed, limit the text size
      if (shouldTruncate) {
        const MAX_TEXT_LENGTH = Number.POSITIVE_INFINITY; 
        console.log(`[PDF] Checking if truncation needed: ${textContent.length} chars vs max ${MAX_TEXT_LENGTH}`);
        
        if (textContent.length > MAX_TEXT_LENGTH) {
          console.log(`[PDF] Truncating output from ${textContent.length} chars to max ${MAX_TEXT_LENGTH}`);
          // Truncate but preserve entire paragraphs up to the limit when possible
          let truncatedText = textContent.substring(0, MAX_TEXT_LENGTH);
          // Try to find the last paragraph break to make a clean cut
          const lastBreak = truncatedText.lastIndexOf('\n\n');
          if (lastBreak > MAX_TEXT_LENGTH * 0.8) { // Only use paragraph break if it's not too far back
            truncatedText = truncatedText.substring(0, lastBreak);
          }
          textContent = `${truncatedText}\n\n[...Content truncated due to size...]`;
        }
      }
      
      // Return text content
      return [textContent, null];
    } catch (error: unknown) {
      console.error(`[PDF] Attempt ${attempt}/3 failed:`, error);
      if (attempt < MAX_RETRIES) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.error('[PDF] All conversion attempts failed:');
  return [null, "Failed to convert PDF after multiple attempts"];
}
