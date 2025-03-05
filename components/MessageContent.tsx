import { renderTextWithLinksAndBold } from "../routes/api/(_utils)/textUtils.tsx";
import { GraphLoadingState } from "./GraphLoadingState.tsx";

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


/**
 * Processes a string looking for a graph JSON block.
 * The returned segments will be:
 * - Plain text (with webresults blocks removed)
 * - A graph segment (with status "loading" if the closing marker hasn't been received,
 *   or "completed" if it has)
 * - (If complete) any text after the graph block.
 */
function processGraphSegments(types: ('graph' | 'webresult' | ' game')[], text: string): GraphSegment[] {
  const segments: GraphSegment[] = [];
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
      segments.push({ type: matchedType, status: "loading" });
      break; // Stop processing as we hide everything after
    } 

    if (matchedType === " game") {
      const code = text.substring(earliestIndex + openMarker.length, closeIndex);

      segments.push({ type: " game", status: "completed", code });
      currentPosition = closeIndex + closeMarker.length;
    } else {

      // Complete block: mark as completed
      segments.push({ type: matchedType, status: "completed" });
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
              <span key={idx}>
                {renderTextWithLinksAndBold(seg.content)}
              </span>
            );
          } 
          if (seg.type === "json" || seg.type === "webresult" || seg.type === " game") {
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
          image_url: { url: string };
          pdf_url?: { url: string };
        }[]).map((item, contentIndex) => {
          if (item.type === "text") {
            const segments = processGraphSegments(['graph', 'webresult', 'game'], item.text);
            return (
              <span key={contentIndex}>
                {segments.map((seg, idx) => {
                  if (seg.type === "text") {
                    return (
                      <span key={idx}>
                        {renderTextWithLinksAndBold(seg.content)}
                      </span>
                    );
                  } else if (["json", "webresult", "game"].includes(seg.type)) {
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
          } else if (item.type === "image_url") {
            return (
              <img
                key={contentIndex}
                src={item.image_url.url}
                alt="User uploaded image"
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
            );
          } else if (item.type === "pdf_url") {
            return (
              <object
                key={contentIndex}
                data={item.pdf_url.url}
                type="application/pdf"
                className="w-full h-[600px] rounded-lg shadow-sm"
              >
                <p>Your browser does not support PDFs. Please download the PDF to view it.</p>
              </object>
            );
          }
          return null;
        })}
      </div>
    </span>
  );
}
