import { useSignal } from "@preact/signals";
import { query } from "../../components/chat/store.ts";

// Define available chat modes
export interface ChatMode {
    id: string;
    name: string;
    description: string;
    icon: string;
    prompt?: string;
    hasSubmodes?: boolean;
}

// Define search submodes
export interface SearchSubMode {
    id: string;
    name: string;
    description: string;
    icon: string;
    prompt: string;
}

export const CHAT_MODES: ChatMode[] = [
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

export const SEARCH_SUBMODES: SearchSubMode[] = [
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

export interface ChatModeSelectorProps {
    onModeSelect: (mode: ChatMode) => void;
    onSubModeSelect: (submode: SearchSubMode) => void;
    selectedMode: string;
    selectedSubMode: string;
}

export default function ChatModeSelector(props: ChatModeSelectorProps) {
    const showModes = useSignal<boolean>(false);
    const showSubModes = useSignal<boolean>(false);
    const currentModeHasSubmodes = useSignal<boolean>(false);
    const keyboardFocusIndex = useSignal<number>(-1);
    const keyboardSubmodeFocusIndex = useSignal<number>(-1);

    const handleModeSelect = (mode: ChatMode) => {
        props.onModeSelect(mode);
        
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
        props.onSubModeSelect(submode);
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
    const currentMode = CHAT_MODES.find(mode => mode.id === props.selectedMode) || CHAT_MODES[0];
    const currentSubMode = currentModeHasSubmodes.value ? 
        SEARCH_SUBMODES.find(submode => submode.id === props.selectedSubMode) || SEARCH_SUBMODES[0] : 
        undefined;

    return (
        <div class="relative">
            {/* Mode selection tiles */}
            {showModes.value && (
                <div 
                    class="bottom-full mb-2 w-full bg-white rounded-lg shadow-xl p-3 z-10 max-h-[400px] overflow-y-auto"
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
                                    props.selectedMode === mode.id
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                                tabIndex={keyboardFocusIndex.value === index ? 0 : -1}
                                aria-selected={props.selectedMode === mode.id}
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
                                    props.selectedSubMode === submode.id
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                                tabIndex={keyboardSubmodeFocusIndex.value === index ? 0 : -1}
                                aria-selected={props.selectedSubMode === submode.id}
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

            {/* Mode indicator button */}
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
        </div>
    );
} 