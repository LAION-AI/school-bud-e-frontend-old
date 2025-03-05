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
import { IconPdf, IconSend, IconX } from "@tabler/icons-preact";
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
	const selectedMode = useSignal<string>("chat");
	const selectedSubMode = useSignal<string>("all"); // Default to 'all'
	const currentModeHasSubmodes = useSignal<boolean>(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const deleteImage = (event: MouseEvent | KeyboardEvent) => {
		const target = event.target as HTMLImageElement | HTMLDivElement;
		if ("src" in target) {
			const index = files.value.findIndex(
				(item) => "image_url" in item && item.image_url.url === target.src,
			);
			if (index !== -1) {
				files.value.splice(index, 1);
			}
		} else {
			// Handle PDF deletion by index
			const index = Number.parseInt(
				target.getAttribute("data-index") || "-1",
				10,
			);
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
		const combinedText = `${text || ""} ${transcription || ""}`.trim();
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
					<div class="w-full flex justify-center shadow">
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
										class="w-32 h-32 relative group rounded-lg shadow-xl overflow-hidden cursor-pointer"
										aria-label="Click to remove image"
									>
										<img
											src={"image_url" in image ? image.image_url.url : ""}
											alt="Uploaded content"
											class="w-full h-full object-cover"
										/>
										<div class="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/50 flex items-center justify-center transition-colors">
											<IconX />
										</div>
									</button>
								))}
							{files.value
								.filter((item) => "pdf_url" in item)
								.map((pdf, index) => (
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
										aria-label="PDF document, click to remove"
									>
										<IconPdf />
										<div class="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/50 flex items-center justify-center transition-colors">
											<IconX />
										</div>
									</button>
								))}
						</div>
					</div>
				)}
				{isThinking.value && <TypingIndicator />}
				<div
					className="flex cursor-text flex-col rounded-xl border border-gray-300 px-4 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-colors bg-white mx-4 mb-4"
					data-tour="chat-input"
				>
					{/* Mode selector component */}
					<ChatModeSelector
						selectedMode={selectedMode.value}
						selectedSubMode={selectedSubMode.value}
						onModeSelect={handleModeSelect}
						onSubModeSelect={handleSearchSubModeSelect}
					/>

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
						class="block min-h-10 max-h-24 w-full resize-none border-0 bg-transparent px-0 py-2 text-gray-800 placeholder:text-gray-500 focus-visible:outline-none message-input"
						data-tour="chat-textarea"
					/>

					<div class="flex items-center justify-between w-full border-t pt-2">
						<div class="flex items-center gap-x-1">
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
								onFinishRecording={handleStartStream}
								onInterimTranscript={(interimTranscript) => {
									query.value = `${query.value} ${interimTranscript}`;
								}}
								data-tour="voice-record"
							/>
						</div>

						<button
							type="button"
							onClick={() => handleStartStream()}
							disabled={
								!query.value || !isApiConfigured.value || isThinking.value
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
