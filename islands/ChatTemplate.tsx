import { useEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import RightSidebar from "./RightSidebar.tsx";
import { Message } from "../components/Message.tsx";
import { autoScroll, messages } from "../components/chat/store.ts";
import ChatInput from "./chat/ChatInput.tsx";
import WelcomeBanner from "../components/WelcomeBanner.tsx";
import { startTour } from "../utils/tourGuide.ts";
import { isApiConfigured } from "../components/chat/store.ts";

interface AudioItem {
	audio: HTMLAudioElement;
	played: boolean;
}

type AudioFileDict = Record<number, Record<number, AudioItem>>;

interface ChatTemplateProps {
	messages: Message[];
	currentEditIndex: number;
	audioFileDict: AudioFileDict;
	onRefreshAction: (groupIndex: number) => void;
	onEditAction: (groupIndex: number) => void;
	children: JSX.Element | JSX.Element[];
	onStartTour?: () => void;
	onSpeakAtGroupIndexAction: (groupIndex: number) => void;
}

function downloadAudioFiles(items: {
	[key: string]: { audio: HTMLAudioElement };
}) {
	const timestamp = new Date().getTime();
	const nicelyFormattedTimestamp = new Date(timestamp)
		.toISOString()
		.slice(0, 19)
		.replace(/[-:]/g, "-");

	// If there's only one item, download it directly
	if (Object.keys(items).length === 1) {
		const singleAudio = Object.values(items)[0].audio;
		fetch(singleAudio.src)
			.then((response) => response.blob())
			.then((blob) => {
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `audio-${nicelyFormattedTimestamp}.mp3`;
				a.click();
				URL.revokeObjectURL(url);
			});
		return;
	}

	// For multiple items, download all MP3s first
	const mp3Promises = Object.values(items).map((item) =>
		fetch(item.audio.src).then((response) => response.blob()),
	);

	Promise.all(mp3Promises).then((blobs) => {
		// Combine all MP3 blobs into a single blob
		const combinedBlob = new Blob(blobs, { type: "audio/mp3" });

		// Create download link for combined file
		const url = URL.createObjectURL(combinedBlob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `audio-${nicelyFormattedTimestamp}.mp3`;
		a.click();
		URL.revokeObjectURL(url);
	});
}

function ChatTemplate({
	currentEditIndex,
	audioFileDict,
	onRefreshAction,
	onEditAction,
	children,
	onStartTour = () => startTour("basics"),
	onSpeakAtGroupIndexAction,
}: ChatTemplateProps) {
	const [sidebarData, setSidebarData] = useState<
		{
			type: string;
			results: any[];
		}[]
	>([]);
	const chatRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Try to parse JSON data from the last message if it's from the assistant
		if (messages.value.length > 0) {
			const lastMessage = messages.value[messages.value.length - 1];
			if (lastMessage.role === "assistant") {
				try {
					const content = Array.isArray(lastMessage.content)
						? lastMessage.content.join("")
						: lastMessage.content;

					// Find JSON substring between triple backticks
					const jsonMatch = content.match(/```(json)\n([\s\S]*?)\n```/);
					if (jsonMatch) {
						const jsonData = JSON.parse(jsonMatch[2]);
						if (
							jsonData.type === "webResults" ||
							jsonData.type === "graph" ||
							jsonData.type === "game"
						) {
							setSidebarData([jsonData]);
							return;
						}
					}
				} catch (error) {
					console.error("Error parsing JSON from AI response:", error);
				}
			}
		}
	}, [messages.value]);

	// 3. useEffect [messages]
	useEffect(() => {
		if (autoScroll.value && chatRef.current) {
			// Only proceed if we're not already scrolling
			const currentPosition = globalThis.innerHeight + globalThis.scrollY;
			const totalScrollHeight = chatRef.current.scrollHeight;

			// Only scroll if the deviation is more than 100 pixels
			if (totalScrollHeight - currentPosition > 500) {
				chatRef.current.scrollTo({
					top: totalScrollHeight,
					behavior: "smooth",
				});
			}
		}
	}, [messages.value, autoScroll.value, chatRef]);

	useEffect(() => {
		// Scroll to bottom on initial load and when autoScroll changes
		if (autoScroll.value && chatRef.current) {
			// Use requestAnimationFrame to ensure DOM is fully rendered
			requestAnimationFrame(() => {
				chatRef.current?.scrollTo({
					top: chatRef.current?.scrollHeight,
					behavior: "instant", // Use instant behavior for initial scroll
				});
			});
		}
	}, []); // Also run when autoScroll changes


	return (
		<div class="flex w-full">
			<div class="flex-grow flex flex-col min-h-full">
				<div
					class={
						messages.value?.length === 0
							? "bg-transparent"
							: "chat-history flex flex-col w-full overflow-auto flex-grow pt-20"
					}
					ref={chatRef}
				>
					<div class="h-full px-4 max-w-4xl mx-auto w-full">
						{messages.value?.map((item, groupIndex) => (
							<Message
								key={item.id}
								item={item}
								groupIndex={groupIndex}
								currentEditIndex={currentEditIndex}
								audioFileDict={audioFileDict}
								onEditAction={onEditAction}
								onRefreshAction={onRefreshAction}
								onSpeakAtGroupIndexAction={onSpeakAtGroupIndexAction}
								onDownloadAudio={downloadAudioFiles}
							/>
						))}
						{children}
					</div>
				</div>

				{!isApiConfigured.value && (
					<WelcomeBanner
						onStartTour={onStartTour}
					/>
				)}

				<ChatInput />
			</div>
			{sidebarData.length > 0 && <RightSidebar data={sidebarData} />}
		</div>
	);
}

export default ChatTemplate;
