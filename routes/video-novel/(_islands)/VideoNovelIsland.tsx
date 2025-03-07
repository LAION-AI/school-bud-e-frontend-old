import { useState, useEffect } from "preact/hooks";
import FloatingChat from "../../../islands/chat/FloatingChat.tsx";
import VideoPlayer from "./components/VideoPlayer.tsx";
import VideoControls from "./components/VideoControls.tsx";
import StoryLibrary from "./components/StoryLibrary.tsx";
import SettingsPanel from "./components/SettingsPanel.tsx";
import CreateStoryModal from "./components/CreateStoryModal.tsx";
import type { Story, FormData } from "./components/types.ts";
import { Button } from "../../../components/Button.tsx";

interface VideoNovelIslandProps {
	lang: string;
}

export default function VideoNovelIsland({ lang }: VideoNovelIslandProps) {
	// State for modal visibility and form data
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [logs, setLogs] = useState<string[]>([]);
	const [videoId, setVideoId] = useState<string | null>(null);
	const [stories, setStories] = useState<Story[]>([]);
	const [selectedStory, setSelectedStory] = useState<Story | null>(null);
	const [error, setError] = useState<{ message: string; stack?: string } | null>(null);
	const [formData, setFormData] = useState<FormData>({
		prompt: "",
		style: "realistic",
		customInstructions: "",
	});

	// Add a log function to track what's happening
	const addLog = (message: string) => {
		console.log(message);
		setLogs((prev) => [...prev, message]);
	};

	// Load saved stories from localStorage on mount
	useEffect(() => {
		const savedStories = localStorage.getItem("videoNovelStories");
		if (savedStories) {
			try {
				const parsedStories = JSON.parse(savedStories);
				// Convert string dates back to Date objects
				const storiesWithDates = parsedStories.map(
					(story: Record<string, unknown>) => ({
						...story,
						createdAt: new Date(story.createdAt as string),
					}),
				);
				setStories(storiesWithDates);
			} catch (e) {
				console.error("Error loading saved stories:", e);
			}
		}
	}, []);

	// Function to download and save an image
	const downloadImage = async (imageUrl: string): Promise<string> => {
		try {
			addLog(`Downloading image from: ${imageUrl}`);

			// Fetch the image
			const response = await fetch(imageUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to download image: ${response.status} ${response.statusText}`,
				);
			}

			// Convert to blob
			const blob = await response.blob();

			// Create a local URL for the blob
			const localUrl = URL.createObjectURL(blob);
			addLog(`Image downloaded and stored locally at: ${localUrl}`);

			return localUrl;
		} catch (error) {
			addLog(`Error downloading image: ${error}`);
			console.error("Error downloading image:", error);
			return imageUrl; // Fall back to the original URL if download fails
		}
	};

	// Function to save a new story
	const saveStory = async (id: string, previewImageUrl: string) => {
		try {
			// Download the image first
			const localImageUrl = await downloadImage(previewImageUrl);

			// Create a new story object
			const newStory: Story = {
				id,
				title: `${formData.prompt?.substring(0, 30)}...`,
				previewImage: localImageUrl,
				createdAt: new Date(),
			};

			// Add to stories state
			const updatedStories = [...stories, newStory];
			setStories(updatedStories);

			// Save to localStorage
			localStorage.setItem("videoNovelStories", JSON.stringify(updatedStories));

			// Select the new story
			setSelectedStory(newStory);

			addLog(`Story saved with ID: ${id}`);
		} catch (error) {
			addLog(`Error saving story: ${error}`);
			console.error("Error saving story:", error);
		}
	};

	// Handle form input changes
	const handleInputChange = (e: Event) => {
		const target = e.target as
			| HTMLInputElement
			| HTMLTextAreaElement
			| HTMLSelectElement;
		setFormData({
			...formData,
			[target.name]: target.value,
		});
	};

	// Handle story selection
	const selectStory = (story: Story) => {
		setSelectedStory(story);
		setVideoId(story.id);
		setPreviewImage(story.previewImage);
	};

	// Handle form submission
	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setIsGenerating(true);
		setLogs([]);
		setVideoId(null); // Reset videoId for new generation
		setPreviewImage(null); // Reset preview image
		setError(null); // Reset any previous errors
		addLog("Starting generation process...");

		try {
			addLog(
				`Sending request with prompt: ${formData.prompt?.substring(0, 30)}...`,
			);
			const response = await fetch("http://localhost:8083/api/generate/video", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt: formData.prompt,
					style: formData.style,
					customInstructions: formData.customInstructions,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Failed to generate video novel: ${response.status} ${response.statusText}. ${errorText}`,
				);
			}

			addLog("Response received, processing stream...");

			// Handle streaming response
			const reader = response.body?.getReader();
			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						addLog("Stream complete");

						// Save the story if we have a videoId and previewImage
						if (videoId && previewImage) {
							await saveStory(videoId, previewImage);
						}

						break;
					}

					// Process the chunks
					const chunk = new TextDecoder().decode(value);
					const lines = chunk.split("\n").filter((line) => line.trim());

					for (const line of lines) {
						try {
							const data = JSON.parse(line);
							addLog(data);

							// Handle different response types
							if (data.type === "videoId") {
								addLog(`Video ID received: ${data.data}`);
								setVideoId(data.data);
							} else if (data.type === "file") {
								addLog(`File data received: ${JSON.stringify(data.data)}`);

								// Check if data.data is a string (old format) or an object (new format)
								if (typeof data.data === "string") {
									// Old format - data.data is just the filename
									if (data.data.endsWith(".webp")) {
										// Use the stored videoId if available, or the videoId from the response
										const currentVideoId = videoId || data.videoId;

										if (!currentVideoId) {
											addLog("Warning: No videoId available for this file!");
										}

										// Construct the image URL
										const imageUrl = currentVideoId
											? `http://localhost:8083/segments/${currentVideoId}/${data.data}`
											: `http://localhost:8083/segments/${data.data}`;

										addLog(`Setting preview image to: ${imageUrl}`);
										setPreviewImage(imageUrl);
									}
								} else {
									// New format - data.data is an object with filename, video_id, and segment_number
									const fileData = data.data;
									if (fileData.filename.endsWith(".webp")) {
										// Use the video_id from the file data, or the videoId from the response, or fall back to the stored videoId
										const currentVideoId =
											fileData.video_id || data.videoId || videoId;

										if (!currentVideoId) {
											addLog("Warning: No videoId available for this file!");
										}

										// Construct the image URL using the server endpoint
										const imageUrl = `http://localhost:8083/segments/${currentVideoId}/${fileData.filename}`;

										addLog(`Setting preview image to: ${imageUrl}`);
										setPreviewImage(imageUrl);
									}
								}
							} else if (data.type === "status") {
								addLog(`Status update: ${data.data}`);
							} else if (data.type === "complete") {
								addLog("Generation complete");
								setIsGenerating(false);
								setIsModalOpen(false);
							}
						} catch (e) {
							addLog(`Error parsing JSON: ${e}`);
							console.error("Error parsing JSON:", e);
						}
					}
				}
			}
		} catch (error) {
			addLog(`Error: ${error}`);
			console.error("Error generating video novel:", error);
			// Set the error state with the caught error
			setError({
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			});
		} finally {
			setIsGenerating(false);
		}
	};

	// Function to close the modal and reset error
	const handleCloseModal = () => {
		setIsModalOpen(false);
		setError(null);
	};

	return (
		<>
			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* Video Novel Display Area */}
					<div className="lg:col-span-8 space-y-6">
						<VideoPlayer 
							previewImage={previewImage} 
							videoId={videoId} 
							logs={logs} 
							isGenerating={isGenerating} 
						/>
						
						<VideoControls onCreateNew={() => setIsModalOpen(true)} />
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-4 space-y-6">
						{/* Story Library */}
						<StoryLibrary 
							stories={stories} 
							selectedStory={selectedStory} 
							onSelectStory={selectStory} 
						/>

						{/* Settings Panel */}
						<SettingsPanel />
					</div>
				</div>
			</main>

			{/* Create New Modal */}
			<CreateStoryModal 
				isOpen={isModalOpen}
				isGenerating={isGenerating}
				formData={formData}
				onClose={handleCloseModal}
				onInputChange={handleInputChange}
				onSubmit={handleSubmit}
				error={error}
			/>
		</>
	);
}
