import { useSignal } from "@preact/signals";
import {
	isApiConfigured,
	lang,
	query,
	settings,
	addMessage,
} from "../../components/chat/store.ts";
import { chatIslandContent } from "../../internalization/content.ts";
import { useRef } from "preact/hooks";
import { startStream } from "../../components/chat/stream.ts";
import ImageUploadButton from "../core/buttons/ImageUploadButton.tsx";
import VoiceRecordButton from "../core/buttons/VoiceRecordButton.tsx";
import { resetTranscript } from "../../components/chat/speech.ts";
import { IconPdf, IconSend, IconX, IconLoader2 } from "@tabler/icons-preact";
import ChatModeSelector, {
	type ChatMode,
	type SearchSubMode,
	CHAT_MODES,
	SEARCH_SUBMODES,
} from "./ChatModeSelector.tsx";

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
	const isTranscribing = useSignal(false);
	const selectedMode = useSignal<string>("chat");
	const selectedSubMode = useSignal<string>("all"); // Default to 'all'
	const currentModeHasSubmodes = useSignal<boolean>(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const deleteImage = (event: MouseEvent | KeyboardEvent) => {
		const target = event.currentTarget as HTMLElement;
		const index = target.dataset.index;
		if (index) {
			const indexNum = Number.parseInt(index, 10);
			files.value = files.value.filter((_, i) => i !== indexNum);
		}
	};

	const handleImagesUploaded = (newFiles: Image[]) => {
		// Make a deep copy of the files to ensure we preserve all properties
		const filesCopy = JSON.parse(JSON.stringify(newFiles));
		
		// Process each file to ensure blob URLs are converted to data URLs
		// This solves the server-side PDF processing issues
		console.log("[ChatInput] Processing uploaded files:", filesCopy.length);
		
		for (const file of filesCopy) {
			// Check if it's a PDF
			if (file.pdf_url?.url) {
				// Check if this is a large PDF that might cause API issues
				if (file.pdf_url.size && file.pdf_url.size > 5000000) {
					console.log(`[ChatInput] Large PDF detected (${file.pdf_url.size} bytes), marked for truncation`);
				}
				
				// Warn if it's a blob URL which will fail server-side
				if (file.pdf_url.url.startsWith('blob:')) {
					console.log("[ChatInput] Found blob URL PDF - may fail on server");
				}

				console.log(`[ChatInput] PDF URL: ${file.pdf_url.url.substring(0, 50)}...`);
			}
			
			if (file.image_url?.url) {
				console.log(`[ChatInput] Image URL: ${file.image_url.url.substring(0, 50)}...`);
			}
		}
		
		// If this is an update to an existing PDF (transcription completed), 
		// find and update the existing file instead of adding a new one
		const updatedFiles = [...files.value];
		
		for (const newFile of filesCopy) {
			if (newFile.type === "pdf_url" && newFile.pdf_url) {
				// Check if this PDF is already in our files array (by URL)
				const existingIndex = updatedFiles.findIndex(
					f => f.type === "pdf_url" && 
					"pdf_url" in f && 
					f.pdf_url?.url === newFile.pdf_url?.url
				);
				
				if (existingIndex >= 0) {
					// Update the existing file with new properties
					updatedFiles[existingIndex] = newFile;
				} else {
					// This is a new file, add it
					updatedFiles.push(newFile);
				}
			} else {
				// For non-PDF files, just add them
				updatedFiles.push(newFile);
			}
		}
		
		// Update the files array
		files.value = updatedFiles;
		console.log("[ChatInput] Updated files count:", files.value.length);
	};

	const handleDisableSendButton = (disabled: boolean) => {
		isTranscribing.value = disabled;
	};

	const handleStartStream = async (text = "", transcription?: string) => {
		isThinking.value = true;
		const combinedText = `${text || ""} ${transcription || ""}`.trim();
		
		// Check if there are any PDFs still being transcribed
		const hasPendingTranscriptions = files.value.some(
			file => "pdf_url" in file && file.pdf_url?.isTranscribing
		);
		
		if (hasPendingTranscriptions) {
			// Add error message to chat
			addMessage({
				role: "assistant",
				content: "❌ Please wait for all PDF transcriptions to complete before sending your message.",
			});
			isThinking.value = false;
			return;
		}
		
		try {
			await startStream(combinedText, undefined, files.value);
		} catch (error: unknown) {
			// Format error message
			let errorMessage =
				"An unknown error occurred while processing your request.";
			console.error(error);

			if (error instanceof Error) {
				// Extract meaningful message from HTML response if present
				const htmlMatch = error.message.match(/<title>(.*?)<\/title>/);
				if (htmlMatch) {
					errorMessage = htmlMatch[1];
				} else {
					// Clean up the backend error message
					const cleanMessage = error.message
						.replace(/\*\*BACKEND ERROR\*\*\n?/g, "")
						.replace(/Statuscode: \d+\n?/g, "")
						.replace(/Message: /g, "")
						.trim();
					errorMessage = cleanMessage || error.message;
				}
			}
			// Add error message to chat
			addMessage({
				role: "assistant",
				content: `❌ **Error**: ${errorMessage}`,
			});
		} finally {
			isThinking.value = false;
			// Clear the query (use the original clearing mechanism)
			query.value = "";
			// Clear the files array after sending
			files.value = [];
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
	};

	const handleSearchSubModeSelect = (submode: SearchSubMode) => {
		selectedSubMode.value = submode.id;
	};

	// Get the current mode for placeholder text
	const getCurrentModePlaceholder = () => {
		// Use ChatModeSelector's exported functions to get current mode
		const currentMode = selectedMode.value;
		const currentSubMode = currentModeHasSubmodes.value
			? selectedSubMode.value
			: undefined;

		// Get placeholder text based on mode
		let placeholder = chatIslandContent[lang.value].placeholderText;

		if (currentModeHasSubmodes.value && currentSubMode) {
			// Find the search submode prompt
			const submode = SEARCH_SUBMODES.find((sm) => sm.id === currentSubMode);
			if (submode?.prompt) {
				placeholder = `${submode.prompt} ${placeholder}`;
			}
		} else {
			// Find the mode prompt
			const mode = CHAT_MODES.find((m) => m.id === currentMode);
			if (mode?.prompt) {
				placeholder = `${mode.prompt} ${placeholder}`;
			}
		}

		return placeholder;
	};

	return (
		<>
			<div class="max-w-xl w-full mx-auto relative">
				{files.value.length > 0 && (
					<div class="flex justify-center">
						<div class="p-2 flex flex-wrap max-w-xs gap-8">
							{files.value
								.filter((item) => "image_url" in item)
								.map((image) => (
									<button
										type="button"
										key={"image_url" in image ? image.image_url.url : ""}
										onClick={deleteImage}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												deleteImage(e);
											}
										}}
										class="w-32 h-32 group rounded-lg shadow-xl overflow-hidden cursor-pointer"
										aria-label="Click to remove image"
									>
										<img
											src={"image_url" in image ? image.image_url.url : ""}
											alt="Uploaded content"
											class="w-full h-full object-cover"
										/>
										<div class="bg-red-500/0 group-hover:bg-red-500/50 flex items-center justify-center transition-colors">
											<IconX />
										</div>
									</button>
								))}
							{files.value
								.filter((item) => "pdf_url" in item)
								.map((pdf, index) => {
									const isPdfTranscribing = "pdf_url" in pdf && pdf.pdf_url?.isTranscribing === true;
									
									return (
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
											class={`w-32 h-32 relative group rounded-lg shadow-xl overflow-hidden cursor-pointer grid place-content-center bg-white ${isPdfTranscribing ? 'ring-2 ring-blue-500' : ''}`}
											aria-label="PDF document, click to remove"
										>
											<IconPdf />
											{isPdfTranscribing && (
												<div class="absolute inset-0 bg-white/70 flex items-center justify-center">
													<div class="flex flex-col items-center">
														<IconLoader2 class="animate-spin text-blue-500 mb-1" size={28} />
														<span class="text-xs text-blue-600 text-center">Transcribing...</span>
													</div>
												</div>
											)}
											<div class="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/50 flex items-center justify-center transition-colors">
												<IconX />
											</div>
										</button>
									);
								})}
						</div>
					</div>
				)}
				{isThinking.value && <TypingIndicator />}
				<div
					className={`flex cursor-text flex-col rounded-xl px-4 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-colors bg-white mx-4 mb-4 ${isApiConfigured.value ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'}`}
					data-tour="chat-input"
				>

					<textarea
						ref={textareaRef}
						disabled={!isApiConfigured.value || isThinking.value}
						value={query}
						placeholder={getCurrentModePlaceholder()}
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
						class="block min-h-10 max-h-24 w-full resize-none border-0 bg-transparent px-0 py-2 text-gray-800 placeholder:text-gray-400 focus-visible:outline-none message-input"
						data-tour="chat-textarea"
					/>

					<div class="flex items-center justify-between w-full">
						<div class="flex items-center gap-x-1">
							<ImageUploadButton
								onImagesUploaded={handleImagesUploaded}
								disableSendButton={handleDisableSendButton}
								apiUrl={settings.value.apiUrl}
								apiKey={settings.value.apiKey}
								apiModel={settings.value.apiModel}
								shopApiKey={settings.value.universalApiKey}
								class="image-upload-button"
								data-tour="image-upload"
							/>

							<VoiceRecordButton
								resetTranscript={resetTranscript.value}
								onFinishRecording={handleStartStream}
								onInterimTranscript={(interimTranscript) => {
									query.value = `${query.value} ${interimTranscript}`;
								}}
								data-tour="voice-record"
							/>
							{/* Mode selector component */}
							<ChatModeSelector
								selectedMode={selectedMode.value}
								selectedSubMode={selectedSubMode.value}
								onModeSelect={handleModeSelect}
								onSubModeSelect={handleSearchSubModeSelect}
							/>
						</div>

						<button
							type="form"
							onClick={() => handleStartStream()}
							disabled={
								!query.value || 
								!isApiConfigured.value || 
								isThinking.value || 
								isTranscribing.value ||
								files.value.some(file => "pdf_url" in file && file.pdf_url?.isTranscribing)
							}
							class="p-2 rounded-full transition-colors flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-blue-500 text-white hover:bg-blue-600"
							data-tour="chat-submit"
							aria-label="Send message"
						>
							<IconSend />
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
