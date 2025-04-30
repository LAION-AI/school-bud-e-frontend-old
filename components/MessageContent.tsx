import { GraphLoadingState } from "./GraphLoadingState.tsx";
import { IconLoader2 } from "@tabler/icons-preact";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import katex from "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.mjs";

// Configure marked to handle LaTeX
const renderLatex = (text: string) => {
  // Handle inline math: $...$
  text = text.replace(/\$([^$]+)\$/g, (_match: string, math: string) => {
    try {
      return katex.renderToString(math, { displayMode: false });
    } catch (e) {
      console.error('KaTeX error:', e);
      return math;
    }
  });

  // Handle display math: $$...$$
  text = text.replace(/\$\$([^$]+)\$\$/g, (_match: string, math: string) => {
    try {
      return katex.renderToString(math, { displayMode: true });
    } catch (e) {
      console.error('KaTeX error:', e);
      return math;
    }
  });

  return marked(text);
};

// Define supported content types
type ContentType = "text" | "image_url" | "pdf_url";
type JsonBlockType = "json";
type BlockStatus = "loading" | "completed";

// Base content segment interface
interface BaseSegment {
  type: ContentType | JsonBlockType;
}

// Text segment interface
interface TextSegment extends BaseSegment {
  type: "text";
  content: string;
}

// JSON block segment interface
interface JsonBlockSegment extends BaseSegment {
  type: JsonBlockType;
  status: BlockStatus;
  code?: string; // Optional code field for game 
}

// Combined type for all possible segments
type GraphSegment = TextSegment | JsonBlockSegment;

// Props interface for the component
interface MessageContentProps {
  content: Message["content"];
}

// Content item interface for structured content
interface ContentItem {
  type: ContentType;
  text?: string;
  image_url?: { url: string };
}

interface Segment {
  type: "text" | "json" | "graph" | "webresult" | "game";
  status?: "loading" | "completed";
  content?: string;
  code?: string;
}

/**
 * Processes a string looking for a graph JSON block.
 * The returned segments will be:
 * - Plain text (with webresults blocks removed)
 * - A graph segment (with status "loading" if the closing marker hasn't been received,
 *   or "completed" if it has)
 * - (If complete) any text after the graph block.
 */
function processGraphSegments(
  types: ("graph" | "webresult" | "game" | "json")[],
  text: string
): Segment[] {
  const segments: Segment[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    let earliestIndex = -1;
    let matchedType: ('graph' | 'webresult' | ' game') | null = null;

    // Find the earliest occurrence of any type's opening marker
    for (const type of types) {
      const openMarker = `\`\`\`${type}`;
      const index = text.indexOf(openMarker, currentPosition);
      if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
        earliestIndex = index;
        matchedType = type;
      }
    }

    if (earliestIndex === -1) {
      // No more blocks found, add remaining text
      segments.push({ type: "text", content: text.substring(currentPosition) });
      break;
    }

    // Add text before the block
    if (earliestIndex > currentPosition) {
      segments.push({
        type: "text",
        content: text.substring(currentPosition, earliestIndex)
      });
    }

    const openMarker = `\`\`\`${matchedType}`;
    const closeMarker = "```";
    const closeIndex = text.indexOf(closeMarker, earliestIndex + openMarker.length);

    if (closeIndex === -1) {
      // Incomplete block: mark as loading
      segments.push({ type: matchedType || "text", status: "loading" });
      break; // Stop processing as we hide everything after
    } 

    if (matchedType === " game") {
      const code = text.substring(earliestIndex + openMarker.length, closeIndex);

      segments.push({ type: "game", status: "completed", code });
      currentPosition = closeIndex + closeMarker.length;
    } else {
      // Complete block: mark as completed
      segments.push({ type: matchedType || "text", status: "completed" });
      currentPosition = closeIndex + closeMarker.length;
    }
  }

  return segments;
}

export function MessageContent({ content }: MessageContentProps) {
  // For streaming, we assume the message content is being updated over time.
  // We want to process the content so that:
  // - If a graph marker is present without a closing marker,
  //   everything from the opening marker onward is hidden and a loading indicator is shown.
  // - If the graph block is complete, the placeholder shows the completed state.
  // - Webresults blocks are always hidden.
  //
  // We handle two types of content:
  // 1. A string or an array of strings (which we join together)
  // 2. An array of objects (with type "text" or "image_url")

  if (typeof content === "string" || (Array.isArray(content) && typeof content[0] === "string")) {
    // If content is a single string or an array of strings, join them.
    const fullText = typeof content === "string" ? content : content.join("");
    const segments = processGraphSegments(["json"], fullText);

    return (
      <span>
        {segments.map((seg, idx) => {
          if (seg.type === "text") {
            return (
              <span className="flex flex-col gap-4 leading-7" key={idx} dangerouslySetInnerHTML={{ __html: renderLatex(seg.content || '') }} />
            );
          } 
          if (seg.type === "json" || seg.type === "webresult" || seg.type === "game") {
            return (
              <GraphLoadingState
                key={idx}
                type={seg.type}
                isLoading={seg.status === "loading"}
                isComplete={seg.status === "completed"}
              />
            );
          }
          return null;
        })}
      </span>
    );
  }

  // Otherwise, assume content is an array of objects.
  return (
    <span>
      <div>
        {(content as {
          type: string;
          text: string;
          image_url: { url: string; transcription?: string };
          pdf_url?: { 
            url: string;
            size?: number;
            transcription?: string;
            isTranscribing?: boolean;
          };
        }[]).map((item, contentIndex) => {
          if (item.type === "text") {
            const segments = processGraphSegments(['graph', 'webresult', 'game'], item.text);
            return (
              <span key={contentIndex}>
                {segments.map((seg, idx) => {
                  if (seg.type === "text") {
                    return (
                      <span className="flex" key={idx} dangerouslySetInnerHTML={{ __html: renderLatex(seg.content || '') }} />
                    );
                  } 
                  if (["json", "webresult", "game"].includes(seg.type)) {
                    return (
                      <GraphLoadingState
                        key={idx}
                        isLoading={seg.status === "loading"}
                        isComplete={seg.status === "completed"}
                        type={"game"}
                      />
                    );
                  } return null;
                })}
              </span>
            );
          } 
          if (item.type === "image_url") {
            return (
              <img
                key={contentIndex}
                src={item.image_url.url}
                alt="User Upload"
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
            );
          } 
          if (item.type === "pdf_url" && item.pdf_url) {
            // Use a more reliable approach for rendering PDFs
            const pdfUrl = item.pdf_url.url;
            // Safely check for size property
            const isLarge = item.pdf_url.size !== undefined && item.pdf_url.size > 1000000;
            
            console.log("[MessageContent] Rendering PDF with URL type:", 
              pdfUrl?.substring(0, 30) + "...", 
              "Size:", item.pdf_url.size || "unknown");

            // Check if the PDF is being transcribed
            if (item.pdf_url.isTranscribing) {
              return (
                <div key={contentIndex} className="pdf-container w-full">
                  <div className="pdf-info text-sm text-gray-500 mb-2 flex items-center">
                    <IconLoader2 className="animate-spin mr-2" size={16} />
                    <span>Transcribing PDF... Please wait</span>
                  </div>
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-[600px] rounded-lg shadow-sm opacity-50"
                  >
                    <p>Your browser does not support PDFs. Please download the PDF to view it.</p>
                  </object>
                </div>
              );
            }

            // Check if we have a transcription
            if (item.pdf_url.transcription) {
              // Check if the transcription is an error message
              const isError = item.pdf_url.transcription.startsWith("Error:") || 
                              item.pdf_url.transcription.startsWith("Transcription failed:") ||
                              item.pdf_url.transcription.startsWith("Transcription error:");
              
              return (
                <div key={contentIndex} className="pdf-container w-full">
                  <div className={`pdf-info text-sm ${isError ? 'text-red-500' : 'text-gray-500'} mb-2`}>
                    {isError ? 'PDF Transcription Error' : 'PDF Document (Transcribed)'}
                  </div>
                  <div className={`pdf-transcription border ${isError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'} rounded-lg p-4 mb-3 max-h-[500px] overflow-y-auto`}>
                    <span className="flex" dangerouslySetInnerHTML={{ __html: renderLatex(item.pdf_url.transcription) }} />
                  </div>
                  {/* PDF viewer toggle button */}
                  <details className="pdf-viewer-toggle">
                    <summary className="cursor-pointer text-primary-600 hover:text-primary-800">
                      Show/Hide PDF Viewer
                    </summary>
                    <div className="mt-3">
                      <object
                        data={pdfUrl}
                        type="application/pdf"
                        className={`w-full h-[600px] rounded-lg shadow-sm ${isLarge ? 'large-pdf' : ''}`}
                      >
                        <p>Your browser does not support PDFs. Please download the PDF to view it.</p>
                      </object>
                      
                      {/* Download link */}
                      <a 
                        href={pdfUrl}
                        download="document.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-primary-500 hover:underline"
                      >
                        {isLarge ? "Download large PDF" : "Download PDF"}
                      </a>
                    </div>
                  </details>
                </div>
              );
            }
          }
          return null;
        })}
      </div>
    </span>
  );
}
