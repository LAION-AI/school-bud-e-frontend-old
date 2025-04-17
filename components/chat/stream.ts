import { signal } from "@preact/signals";
import {
    addMessage,
    editMessage,
    lang,
    messages,
    query,
    settings,
} from "./store.ts";
import { chatIslandContent } from "../../internalization/content.ts";
import { getTTS, resetTranscript } from "./speech.ts";
import {
    type EventSourceMessage,
    fetchEventSource,
} from "https://esm.sh/@microsoft/fetch-event-source@2.0.1";

class RetriableError extends Error {}
class FatalError extends Error {}

const streamComplete = signal(true);

export const startStream = async (
    transcript: string,
    prevMessages?: Message[],
    images?: Image[],
) => {
    console.log(settings.value);
    // if currentEditIndex is set, we are editing a message instead of starting the stream
    // except if the currentEditIndex is the last user message, then we do start the stream

    // pause all ongoing audio files first
    // stopAndResetAudio();
    // setAudioFileDict({ ...audioFileDict });

    const ongoingStream: string[] = [];
    let currentAudioIndex = 1;
    let ttsFromFirstSentence = false;
    if (streamComplete.value) {
        streamComplete.value = false;
        resetTranscript.value++;

        const currentQuery = (transcript) ? transcript : query.value;
        let previousMessages = prevMessages || messages.value;

        previousMessages = previousMessages.map((msg) => {
            if (typeof msg.content === "string") {
                return msg;
            }
            if (typeof msg.content[0] === "string") {
                return { "role": msg.role, "content": msg.content.join("") };
            }
            return msg;
        });

        const messagesToSend: Message[] = [];
        const queryWithImages = [];
        if (images && images?.length !== 0) {
            console.log("[Stream] Handling message with files:", images.length);
            
            // Create a properly structured message with text content
            const textContent = { 
              role: "user", 
              content: [{ type: "text", text: currentQuery }]
            };
            
            // Add the text message first
            queryWithImages.push(textContent);
            
            // Process image objects
            console.log("[Stream] Images to process:", images);
            
            // Create a single message with multiple content items including text and images/PDFs
            const mediaContent: any[] = [];
            mediaContent.push({ type: "text", text: currentQuery });
            
            // Add each image/PDF as a content item
            for (const img of images) {
                console.log(`[Stream] Processing file object: ${JSON.stringify(img).substring(0, 100)}...`);
                
                // Check for in-progress transcriptions - these should not be sent
                if (img.type === "pdf_url" && img.pdf_url?.isTranscribing) {
                    console.warn("[Stream] Skipping PDF that is still being transcribed");
                    continue;
                }
                
                if (img.type === "image_url" && img.image_url) {
                    mediaContent.push({
                        type: "image_url",
                        image_url: {
                            url: img.image_url.url,
                            detail: img.image_url.detail || "high",
                            transcription: img.image_url.transcription
                        }
                    });
                } 
                else if (img.type === "pdf_url" && img.pdf_url) {
                    // For PDFs, don't send the PDF URL to the server
                    // Instead, just send the transcription as text
                    if (img.pdf_url.transcription) {
                        console.log("[Stream] Using PDF transcription instead of sending PDF URL");
                        
                        // Add the transcription as text
                        mediaContent.push({
                            type: "text",
                            text: `\`\`\`pdf_transcription\n\n${img.pdf_url.transcription}\n\`\`\``
                        });
                    } else {
                        console.warn("[Stream] PDF has no transcription, skipping");
                    }
                }
            }
            
            // Add a single message with all content items
            messagesToSend.push({ 
                role: "user", 
                content: mediaContent 
            });
            
            console.log("[Stream] Final message structure:", `${JSON.stringify(messagesToSend).substring(0, 100)}...`);
        } else {
            messagesToSend.push({ role: "user", "content": currentQuery });
        }

        for (const message of messagesToSend) {
            addMessage(message);
        }

        query.value = "";

        // check if the last message has #bildungsplan in the content (case insensitive)
        // #bildungsplan: wofür braucht man eigentlich trigonometrie:5
        const isBildungsplanInLastMessage = currentQuery.toLowerCase()
            .includes(
                "#bildungsplan",
            );

        const isWikipediaInLastMessage = currentQuery.toLowerCase().includes(
            "#wikipedia",
        );

        const isPapersInLastMessage = currentQuery.toLowerCase().includes(
            "#papers",
        );

        if (isWikipediaInLastMessage) {
            let collection = lang.peek() === "en"
                ? "English-ConcatX-Abstract"
                : "German-ConcatX-Abstract";
            if (currentQuery.toLowerCase().includes("#wikipedia_de")) {
                collection = "German-ConcatX-Abstract";
            }
            if (currentQuery.toLowerCase().includes("#wikipedia_en")) {
                collection = "English-ConcatX-Abstract";
            }

            const currentQuerrySplit = currentQuery.split(":");
            const query = currentQuerrySplit[1].trim();
            let n = 5;
            if (currentQuerrySplit.length > 2) {
                n = Number.parseInt(currentQuery.split(":")[2].trim(), 10);
            }

            const res = await fetchWikipedia(query, collection, n);

            // console.log("[API] wikipedia response", res);

            const beautifulWikipedia = res?.map(
                (result: WikipediaResult, index: number) => {
                    const content = Object.values(result)[0];
                    return `\`\`\`webresultjson
{
  "type": "webResults",
  "results": [
    {
      "url": "string",
      "title": "string",
      "description": "string",
    }
  ]
}
            endwebresultjson\`\`\`
            **${chatIslandContent[lang.value].result} ${index + 1} ${
                        chatIslandContent[lang.value].of
                    } ${res?.length}**\n**${
                        chatIslandContent[lang.value].wikipediaTitle
                    }**: ${content.Title}\n**${
                        chatIslandContent[lang.value].wikipediaURL
                    }**: ${content.URL}\n**${
                        chatIslandContent[lang.value].wikipediaContent
                    }**: ${content["Concat Abstract"]}\n**${
                        chatIslandContent[lang.value].wikipediaScore
                    }**: ${content.score}\n`;
                },
            ).join("\n\n");

            addMessage({ role: "assistant", content: [beautifulWikipedia] });
            streamComplete.value = true;
            // query.value = ("");
            return;
        }

        if (isPapersInLastMessage) {
            const currentQuerrySplit = currentQuery.split(":");
            const query = currentQuerrySplit[1].trim();
            let limit = 5;
            if (currentQuerrySplit.length > 2) {
                limit = Number.parseInt(currentQuery.split(":")[2].trim(), 10);
            }

            const response = await fetchPapers(query, limit);

            // console.log("[API] papers response", response);

            const beautifulPapers = response?.payload.items.map(
                (result: PapersItem, index: number) => {
                    return `**${chatIslandContent[lang.value].result} ${
                        index + 1
                    } ${chatIslandContent[lang.value].of} ${
                        response?.payload.items.length
                    }**\n**${
                        chatIslandContent[lang.value].papersDOI
                    }**: ${result.doi}\n**${
                        chatIslandContent[lang.value].papersDate
                    }**: ${result.date_published.substring(0, 10)}\n**${
                        chatIslandContent[lang.value].papersSubjects
                    }**: ${result.subjects.join(", ")}\n**${
                        chatIslandContent[lang.value].papersTitle
                    }**: ${result.title}\n**${
                        chatIslandContent[lang.value].papersAuthors
                    }**: ${result.authors.join(", ")}\n**${
                        chatIslandContent[lang.value].papersAbstract
                    }**: ${result.abstract}\n`;
                },
            ).join("\n\n");

            addMessage({ role: "assistant", content: [beautifulPapers] });

            streamComplete.value = true;
            // query.value = ("");
            return;
        }

        if (isBildungsplanInLastMessage) {
            const currentQuerrySplit = currentQuery.split(":");
            const query = currentQuerrySplit[1].trim();
            let top_n = 5;
            if (currentQuerrySplit.length > 2) {
                top_n = Number.parseInt(currentQuery.split(":")[2].trim(), 10);
            }

            // console.log("query", query);
            // console.log("top_n", top_n);

            const res = await fetchBildungsplan(query, top_n);

            // console.log("[API] bildungsplan response", res);
            const beautifulBildungsplan = res?.results.map((result, index) => {
                return `**${chatIslandContent[lang.value].result} ${
                    index + 1
                } ${chatIslandContent[lang.value].of} ${
                    res?.results.length
                }**\n${result.text}\n\n**Score**: ${result.score}`;
            }).join("\n\n");

            addMessage({ role: "assistant", content: [beautifulBildungsplan] });
            streamComplete.value = true;
            // query.value = ("");
            return;
        }

        await fetchEventSource("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                lang: lang.value,
                messages: [...previousMessages, ...messagesToSend],
                universalApiKey: settings.value.universalApiKey,
                llmApiUrl: settings.value.apiUrl,
                llmApiKey: settings.value.apiKey,
                llmApiModel: settings.value.apiModel,
                vlmApiUrl: settings.value.vlmUrl,
                vlmApiKey: settings.value.vlmKey,
                vlmApiModel: settings.value.vlmModel,
                vlmCorrectionModel: settings.value.vlmCorrectionModel,
                systemPrompt: settings.value.systemPrompt,
            }),
            onmessage(ev: EventSourceMessage) {
                
                const parsedData = JSON.parse(ev.data);
                console.debug("parsedData", parsedData);

                ongoingStream.push(parsedData);
                if (ttsFromFirstSentence === false) {
                    const combinedText = ongoingStream.join("");
                    // Find last occurrence of .!? that's not after a digit
                    const match = combinedText.match(/(?<!\d)[.!?][^.!?]*$/);

                    if (match && combinedText.length > 20) {
                        const splitIndex = match.index ?? 0 + 1; // Include the punctuation
                        const textToSpeak = combinedText.slice(0, splitIndex);
                        const remaining = combinedText.slice(splitIndex);

                        if (textToSpeak.trim() !== "") {
                            getTTS(
                                textToSpeak,
                                messages.value.length - 1,
                                `stream${currentAudioIndex}`,
                            );

                            currentAudioIndex++;
                            ongoingStream.length = 0; // Clear array
                            if (remaining.trim()) {
                                ongoingStream.push(remaining); // Push remaining text
                            }
                            ttsFromFirstSentence = true;
                        }
                    }
                } else {
                    // check for \n\n in the parsedData, e.g., ' \n\n', or '\n\n ' etc.
                    const combinedText = ongoingStream.join("");
                    if (
                        /\n\n/.test(combinedText.slice(5)) &&
                        combinedText.length > 15
                    ) {
                        const paragraphSplit = combinedText.split(/\n\n/);
                        // console.warn("paragraphSplit", paragraphSplit)
                        const textToSpeak = paragraphSplit.slice(0, -1).join(
                            "\n\n",
                        );

                        const remaining =
                            paragraphSplit[paragraphSplit.length - 1];

                        getTTS(
                            textToSpeak,
                            messages.value.length - 1,
                            `stream${currentAudioIndex}`,
                        );

                        currentAudioIndex++;
                        ongoingStream.length = 0;
                        if (remaining.trim()) {
                            ongoingStream.push(remaining);
                        }
                    }
                }

                const lastMessage = messages.value[messages.value.length - 1];
                (lastMessage.content as string[]).push(parsedData);

                editMessage(messages.value.length - 1, {
                    role: "assistant",
                    content: lastMessage.content,
                });
            },
            async onopen(response: Response) {
                const prevMessagesRoundTwo = messages.value;
                prevMessagesRoundTwo.push({
                    "role": "assistant",
                    "content": [],
                });
                if (response.ok) {
                    return; // everything's good
                }
                if (response.status !== 200) {
                    // client-side errors are usually non-retriable:
                    const errorText = await response.text();
                    throw new FatalError(
                        `**BACKEND ERROR**\nStatuscode: ${response.status}\nMessage: ${errorText}`,
                    );
                }
                throw new RetriableError();
            },
            onerror(err: FatalError) {
                streamComplete.value = true;
                /// add err.message to messages
                // appendToMessage(messages.value.length - 1, err.message);
                throw err;
            },
            onclose() {
                console.log("Stream closed");
                streamComplete.value = true;
                query.value = "";
                getTTS(
                    ongoingStream.join(""),
                    messages.value.length - 1,
                    `stream${currentAudioIndex}`,
                );
                console.log("ONGOING STREAM: ", ongoingStream);
            },
        });
    }
};

const fetchBildungsplan = async (query: string, top_n: number) => {
    try {
        const response = await fetch("/api/bildungsplan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: query,
                top_n: top_n,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as BildungsplanResponse;

        return data;
    } catch (error) {
        console.error("Error in bildungsplan API:", error);
    }
};

// WIKIPEDIA
const fetchWikipedia = async (
    text: string,
    collection: string,
    n: number,
) => {
    try {
        const response = await fetch("/api/wikipedia", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: text,
                collection: collection,
                n: n,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as WikipediaResult[];

        return data;
    } catch (error) {
        console.error("Error in wikipedia API:", error);
    }
};

// PAPERS
const fetchPapers = async (query: string, limit: number) => {
    try {
        const response = await fetch("/api/papers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: query,
                limit: limit,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as PapersResponse;

        return data;
    } catch (error) {
        console.error("Error in papers API:", error);
    }
};
