import { useSignal } from "@preact/signals";
import { isApiConfigured, lang, query, settings, addMessage } from "../../components/chat/store.ts";
import { chatIslandContent } from "../../internalization/content.ts";
import { useRef } from "preact/hooks";
import { startStream } from "../../components/chat/stream.ts";
import ImageUploadButton from "../core/buttons/ImageUploadButton.tsx";
import VoiceRecordButton from "../core/buttons/VoiceRecordButton.tsx";
import { resetTranscript } from "../../components/chat/speech.ts";

// Define available chat modes
interface ChatMode {
    id: string;
    name: string;
    description: string;
    icon: string;
    prompt?: string;
    hasSubmodes?: boolean;
}

const CHAT_MODES: ChatMode[] = [
    {
        id: 'chat',
        name: 'Chat',
        description: 'General conversation and assistance',
        icon: '💬',
    },
    {
        id: 'video-novel',
        name: 'Video Novel',
        description: 'Generate creative video novel content',
        icon: '🎬',
        prompt: 'Create a video novel scene about',
    },
    {
        id: 'test-generation',
        name: 'Test Generation',
        description: 'Create tests for educational content',
        icon: '📝',
        prompt: 'Generate a test about',
    },
    {
        id: 'graph-generation',
        name: 'Graph Generation',
        description: 'Visualize concepts as graphs',
        icon: '📊',
        prompt: 'Create a graph visualization for',
    },
    {
        id: 'search',
        name: 'Search',
        description: 'Search for information from various sources',
        icon: '🔍',
        prompt: 'Search for information about',
        hasSubmodes: true
    }
];

// Define search submodes
interface SearchSubMode {
    id: string;
    name: string;
    description: string;
    icon: string;
    prompt: string;
}

const SEARCH_SUBMODES: SearchSubMode[] = [
    {
        id: 'all',
        name: 'All Sources',
        description: 'Search across all available sources',
        icon: '🌎',
        prompt: 'Search for',
    },
    {
        id: 'web',
        name: 'Web Search',
        description: 'Search the web for information',
        icon: '🌐',
        prompt: 'Search the web for',
    },
    {
        id: 'wikipedia',
        name: 'Wikipedia',
        description: 'Search and summarize Wikipedia articles',
        icon: '📚',
        prompt: 'Find Wikipedia information about',
    },
    {
        id: 'papers',
        name: 'Academic Papers',
        description: 'Search academic papers and research',
        icon: '📄',
        prompt: 'Find academic papers on',
    },
    {
        id: 'images',
        name: 'Image Search',
        description: 'Search for images',
        icon: '🖼️',
        prompt: 'Find images of',
    },
    {
        id: 'news',
        name: 'News Search',
        description: 'Search for recent news',
        icon: '📰',
        prompt: 'Find recent news about',
    },
    {
        id: 'videos',
        name: 'Video Search',
        description: 'Search for videos',
        icon: '📹',
        prompt: 'Find videos about',
    }
];

function TypingIndicator() {
    return (
        <div className="flex items-center space-x-2 px-4 py-2">
            <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_.2s]" />
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_.4s]" />
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_.6s]" />
            </div>
            <span className="text-sm text-gray-500">AI is thinking...</span>
        </div>
    );
}

export default function ChatInput() {
    const files = useSignal<(Image | File)[]>([]);
    const isThinking = useSignal(false);
    const selectedMode = useSignal<string>('chat');
    const selectedSubMode = useSignal<string>('all'); // Default to 'all'
    const showModes = useSignal<boolean>(false);
    const showSubModes = useSignal<boolean>(false);
    const currentModeHasSubmodes = useSignal<boolean>(false);
    const keyboardFocusIndex = useSignal<number>(-1);
    const keyboardSubmodeFocusIndex = useSignal<number>(-1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const deleteImage = (event: MouseEvent | KeyboardEvent) => {
        const target = event.target as HTMLImageElement | HTMLDivElement;
        if ('src' in target) {
            const index = files.value.findIndex((item) => 
                'image_url' in item && item.image_url.url === target.src
            );
            if (index !== -1) {
                files.value.splice(index, 1);
            }
        } else {
            // Handle PDF deletion by index
            const index = Number.parseInt(target.getAttribute('data-index') || '-1', 10);
            if (index !== -1) {
                files.value.splice(index, 1);
            }
        }
    };

    const handleImagesUploaded = (newFiles: Image[]) => {
        files.value = [...files.value, ...newFiles];
    };

    const handleStartStream = async (text = "", transcription?: string) => {
        isThinking.value = true;
        try {
            await startStream(text, transcription, files.value);
        } catch (error: unknown) {
            // Format error message
            let errorMessage = "An unknown error occurred while processing your request.";
            
            if (error instanceof Error) {
                // Extract meaningful message from HTML response if present
                const htmlMatch = error.message.match(/<title>(.*?)<\/title>/);
                if (htmlMatch) {
                    errorMessage = htmlMatch[1];
                } else {
                    // Clean up the backend error message
                    const cleanMessage = error.message
                        .replace(/\*\*BACKEND ERROR\*\*\n?/g, '')
                        .replace(/Statuscode: \d+\n?/g, '')
                        .replace(/Message: /g, '')
                        .trim();
                    errorMessage = cleanMessage || error.message;
                }
            }
            
            // Add error message to chat
            addMessage({
                role: "assistant",
                content: `❌ **Error**: ${errorMessage}`
            });
        } finally {
            isThinking.value = false;
            // Clear the query (use the original clearing mechanism)
            query.value = "";
            // Focus the textarea after sending the message
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 0);
        }
    };

    const handleModeSelect = (mode: ChatMode) => {
        selectedMode.value = mode.id;
        
        // Check if the selected mode has submodes
        currentModeHasSubmodes.value = !!mode.hasSubmodes;
        
        // If mode has submodes, show the submodes panel
        if (mode.hasSubmodes) {
            showModes.value = false;
            showSubModes.value = true;
            keyboardSubmodeFocusIndex.value = 0;
        } else {
            showModes.value = false;
            showSubModes.value = false;
            
            // If mode has a prompt template, set it
            if (mode.prompt) {
                query.value = `${mode.prompt} `;
            }
        }
    };

    const handleSearchSubModeSelect = (submode: SearchSubMode) => {
        selectedSubMode.value = submode.id;
        showSubModes.value = false;
        query.value = `${submode.prompt} `;
    };

    const toggleModesPanel = () => {
        if (showSubModes.value) {
            showSubModes.value = false;
            return;
        }
        
        showModes.value = !showModes.value;
        if (showModes.value) {
            keyboardFocusIndex.value = 0;
        } else {
            keyboardFocusIndex.value = -1;
        }
    };

    // Keyboard navigation for mode tiles
    const handleModeKeyDown = (e: KeyboardEvent, modes: ChatMode[] | SearchSubMode[]) => {
        const focusArray = modes === CHAT_MODES ? keyboardFocusIndex : keyboardSubmodeFocusIndex;
        const totalItems = modes.length;
        const columns = modes === CHAT_MODES ? 3 : 2;
        
        switch (e.key) {
            case 'ArrowRight': {
                e.preventDefault();
                if (focusArray.value < totalItems - 1) {
                    focusArray.value++;
                }
                break;
            }
            case 'ArrowLeft': {
                e.preventDefault();
                if (focusArray.value > 0) {
                    focusArray.value--;
                }
                break;
            }
            case 'ArrowDown': {
                e.preventDefault();
                const nextDownIdx = focusArray.value + columns;
                if (nextDownIdx < totalItems) {
                    focusArray.value = nextDownIdx;
                }
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                const nextUpIdx = focusArray.value - columns;
                if (nextUpIdx >= 0) {
                    focusArray.value = nextUpIdx;
                }
                break;
            }
            case 'Enter':
            case ' ': {
                e.preventDefault();
                if (modes === CHAT_MODES && focusArray.value >= 0) {
                    handleModeSelect(CHAT_MODES[focusArray.value]);
                } else if (modes !== CHAT_MODES && focusArray.value >= 0) {
                    handleSearchSubModeSelect(SEARCH_SUBMODES[focusArray.value]);
                }
                break;
            }
            case 'Escape': {
                e.preventDefault();
                if (modes === CHAT_MODES) {
                    showModes.value = false;
                    keyboardFocusIndex.value = -1;
                } else {
                    showSubModes.value = false;
                    keyboardSubmodeFocusIndex.value = -1;
                }
                break;
            }
        }
    };

    // Get the current mode and submode objects
    const currentMode = CHAT_MODES.find(mode => mode.id === selectedMode.value) || CHAT_MODES[0];
    const currentSubMode = currentModeHasSubmodes.value ? 
        SEARCH_SUBMODES.find(submode => submode.id === selectedSubMode.value) || SEARCH_SUBMODES[0] : 
        undefined;

    return (
        <>
            <div class="max-w-xl w-full mx-auto relative">
                {/* Mode selection tiles */}
                {showModes.value && (
                    <div 
                        class="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-xl p-3 z-10 max-h-[400px] overflow-y-auto"
                        onKeyDown={(e) => handleModeKeyDown(e, CHAT_MODES)}
                        aria-label="Select a chat mode"
                    >
                        <h3 class="text-sm font-medium text-gray-700 mb-2">Select a mode</h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {CHAT_MODES.map((mode, index) => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => {
                                        handleModeSelect(mode);
                                        keyboardFocusIndex.value = index;
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            handleModeSelect(mode);
                                            keyboardFocusIndex.value = index;
                                        }
                                    }}
                                    class={`text-left p-3 rounded-lg border transition-colors ${
                                        keyboardFocusIndex.value === index 
                                            ? 'ring-2 ring-blue-500 ' 
                                            : ''
                                    }${
                                        selectedMode.value === mode.id
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                                    tabIndex={keyboardFocusIndex.value === index ? 0 : -1}
                                    aria-selected={selectedMode.value === mode.id}
                                >
                                    <div class="flex items-center gap-2">
                                        <span class="text-xl">{mode.icon}</span>
                                        <span class="font-medium">{mode.name}</span>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">{mode.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search submodes panel */}
                {showSubModes.value && (
                    <div 
                        class="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-xl p-3 z-10"
                        onKeyDown={(e) => handleModeKeyDown(e, SEARCH_SUBMODES)}
                        aria-label="Select a search type"
                    >
                        <h3 class="text-sm font-medium text-gray-700 mb-2">Select search type</h3>
                        <div class="grid grid-cols-2 gap-2">
                            {SEARCH_SUBMODES.map((submode, index) => (
                                <button
                                    key={submode.id}
                                    type="button"
                                    onClick={() => {
                                        handleSearchSubModeSelect(submode);
                                        keyboardSubmodeFocusIndex.value = index;
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            handleSearchSubModeSelect(submode);
                                            keyboardSubmodeFocusIndex.value = index;
                                        }
                                    }}
                                    class={`text-left p-3 rounded-lg border transition-colors ${
                                        keyboardSubmodeFocusIndex.value === index 
                                            ? 'ring-2 ring-blue-500 ' 
                                            : ''
                                    }${
                                        selectedSubMode.value === submode.id
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                                    tabIndex={keyboardSubmodeFocusIndex.value === index ? 0 : -1}
                                    aria-selected={selectedSubMode.value === submode.id}
                                >
                                    <div class="flex items-center gap-2">
                                        <span class="text-xl">{submode.icon}</span>
                                        <span class="font-medium">{submode.name}</span>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">{submode.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {files.value.length > 0 && (
                    <div class="w-full flex justify-center shadow">
                        <div class="p-2 flex flex-wrap max-w-xs gap-8">
                            {files.value.filter((item) => 'image_url' in item).map((image) => (
                                <button
                                    type="button"
                                    key={'image_url' in image ? image.image_url.url : ''}
                                    onClick={deleteImage}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            deleteImage(e);
                                        }
                                    }}
                                    class="w-32 h-32 relative group rounded-lg shadow-xl overflow-hidden cursor-pointer"
                                    aria-label="Click to remove image"
                                >
                                    <img
                                        src={'image_url' in image ? image.image_url.url : ''}
                                        alt="Uploaded content"
                                        class="w-full h-full object-cover"
                                    />
                                    <div class="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/50 flex items-center justify-center transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <title>Remove</title>
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                            {files.value.filter((item) => 'pdf_url' in item).map((pdf, index) => (
                                <button
                                    type="button"
                                    key={index.toString()}
                                    data-index={index.toString()}
                                    onClick={deleteImage}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            deleteImage(e);
                                        }
                                    }}
                                    class="w-32 h-32 relative group rounded-lg shadow-xl overflow-hidden cursor-pointer grid place-content-center bg-white"
                                    aria-label={`PDF document, click to remove`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="32" height="32" strokeWidth="2" aria-hidden="true"> 
                                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                        <path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" />
                                        <path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" />
                                        <path d="M17 18h2" />
                                        <path d="M20 15h-3v6" />
                                        <path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" />
                                    </svg>
                                    <div class="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/50 flex items-center justify-center transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <title>Remove</title>
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {isThinking.value && <TypingIndicator />}
                <div className="shadow-lg flex cursor-text flex-col rounded-xl border border-gray-300 px-4 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-colors bg-white mx-4 mb-4" data-tour="chat-input">
                    {/* Mode indicator */}
                    <div class="flex items-center py-1 mb-1">
                        <button 
                            type="button"
                            onClick={toggleModesPanel}
                            onKeyPress={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    toggleModesPanel();
                                }
                            }}
                            class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 rounded-full px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <span>{currentMode.icon}</span>
                            <span>{currentMode.name}</span>
                            {currentSubMode && (
                                <>
                                    <span className="text-gray-400 mx-1">›</span>
                                    <span>{currentSubMode.icon}</span>
                                    <span>{currentSubMode.name}</span>
                                </>
                            )}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    </div>

                    <textarea
                        ref={textareaRef}
                        disabled={!isApiConfigured.value || isThinking.value}
                        type="text"
                        value={query}
                        placeholder={currentSubMode 
                            ? currentSubMode.prompt + " " + chatIslandContent[lang.value].placeholderText
                            : currentMode.prompt 
                              ? currentMode.prompt + " " + chatIslandContent[lang.value].placeholderText
                              : chatIslandContent[lang.value].placeholderText
                        }
                        onInput={(e) => {
                            const textarea = e.currentTarget;
                            query.value = textarea.value;
                        }}
                        onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleStartStream();
                            }
                        }}
                        class="block min-h-10 max-h-24 w-full resize-none border-0 bg-transparent px-0 py-2 text-gray-800 placeholder:text-gray-500 focus-visible:outline-none message-input"
                        data-tour="chat-textarea"
                    />

                    <div class="flex items-center justify-between w-full border-t pt-2">
                        <div class="flex items-center space-x-2">
                            <button 
                                type="button" 
                                onClick={() => document.querySelector('.image-upload-button')?.click()}
                                class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                                title="Upload Image"
                                aria-label="Upload Image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <title>Upload Image Icon</title>
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => document.querySelector('.voice-record-button')?.click()} 
                                class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                                title="Voice Input"
                                aria-label="Voice Input"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <title>Voice Input Icon</title>
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" x2="12" y1="19" y2="22" />
                                </svg>
                            </button>
                            
                            <div class="hidden">
                                <ImageUploadButton
                                    onImagesUploaded={handleImagesUploaded}
                                    class="image-upload-button"
                                    data-tour="image-upload"
                                />

                                <VoiceRecordButton
                                    resetTranscript={resetTranscript.value}
                                    sttUrl={settings.value.sttUrl}
                                    sttKey={settings.value.sttKey}
                                    sttModel={settings.value.sttModel}
                                    onFinishRecording={(finalTranscript) => {
                                        handleStartStream("", finalTranscript);
                                    }}
                                    onInterimTranscript={(interimTranscript) => {
                                        query.value = `${query.value} ${interimTranscript}`;
                                    }}
                                    class="voice-record-button"
                                    data-tour="voice-record"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleStartStream()}
                            disabled={!query.value || !isApiConfigured.value || isThinking.value}
                            class={`p-2 rounded-full transition-colors flex items-center justify-center ${
                                !query.value || !isApiConfigured.value || isThinking.value
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                            data-tour="chat-submit"
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <title>Send Message Icon</title>
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}