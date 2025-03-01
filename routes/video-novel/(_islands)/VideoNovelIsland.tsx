import { useState, useEffect } from "preact/hooks";
import FloatingChat from "../../../components/chat/FloatingChat.tsx";
import { Button } from "../../../components/Button.tsx";

interface VideoNovelIslandProps {
	lang: string;
}

interface Story {
	id: string;
	title: string;
	previewImage: string;
	createdAt: Date;
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
	const [formData, setFormData] = useState({
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
				title: `${formData.prompt.substring(0, 30)}...`,
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
		addLog("Starting generation process...");

		try {
			addLog(
				`Sending request with prompt: ${formData.prompt.substring(0, 30)}...`,
			);
			const response = await fetch("/api/generate/video", {
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
				throw new Error(
					`Failed to generate video novel: ${response.status} ${response.statusText}`,
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
					addLog(`Received chunk: ${chunk.substring(0, 100)}...`);
					const lines = chunk.split("\n").filter((line) => line.trim());

					for (const line of lines) {
						try {
							const data = JSON.parse(line);
							addLog(`Parsed JSON: ${JSON.stringify(data)}`);

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
											? `/segments/${currentVideoId}/${data.data}`
											: `/segments/${data.data}`;

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
										const imageUrl = `/segments/${currentVideoId}/${fileData.filename}`;

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
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<>
			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* Video Novel Display Area */}
					<div className="lg:col-span-8 space-y-6">
						<div
							className="aspect-video bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 relative"
							style={{
								backgroundImage: previewImage
									? `url('${previewImage}')`
									: "url('/lines.svg')",
								backgroundPosition: "center",
								backgroundSize: "contain",
								backgroundRepeat: "no-repeat",
							}}
						>
							{/* Video novel content will be displayed here */}
							{logs.length > 0 && isGenerating && (
								<div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 max-h-32 overflow-y-auto text-xs">
									{logs.map((log, index) => (
										<div
											key={`log-${index}-${log.substring(0, 10)}`}
											className="text-gray-300"
										>
											{log}
										</div>
									))}
								</div>
							)}
						</div>

						{/* Debug info */}
						{videoId && (
							<div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-2 border border-gray-700 text-xs">
								<p>Current Video ID: {videoId}</p>
								{previewImage && <p>Current Image: {previewImage}</p>}
							</div>
						)}

						{/* Controls */}
						<div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
							<div className="flex flex-wrap gap-3">
								<Button
									type="button"
									className="bg-green-500 hover:bg-green-600 transition-colors px-5 py-2 rounded-md font-medium flex items-center gap-2"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<title>Play icon</title>
										<polygon points="5 3 19 12 5 21 5 3" />
									</svg>
									Play
								</Button>
								<Button
									type="button"
									className="bg-gray-700 hover:bg-gray-600 transition-colors px-5 py-2 rounded-md font-medium flex items-center gap-2"
									onClick={() => setIsModalOpen(true)}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<title>Create icon</title>
										<path d="M12 5v14" />
										<path d="M5 12h14" />
									</svg>
									Create New
								</Button>
								<Button
									type="button"
									className="bg-gray-700 hover:bg-gray-600 transition-colors px-5 py-2 rounded-md font-medium flex items-center gap-2"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<title>Edit icon</title>
										<path d="M12 20h9" />
										<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
									</svg>
									Edit
								</Button>
								<Button
									type="button"
									className="bg-gray-700 hover:bg-gray-600 transition-colors px-5 py-2 rounded-md font-medium flex items-center gap-2"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<title>Save icon</title>
										<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
										<polyline points="7 10 12 15 17 10" />
										<line x1="12" y1="15" x2="12" y2="3" />
									</svg>
									Save
								</Button>
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-4 space-y-6">
						{/* Story Library */}
						<div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
							<h2 className="text-xl font-bold mb-4">Your Stories</h2>
							<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
								{stories.length > 0 ? (
									stories.map((story) => (
										<button
											key={story.id}
											type="button"
											className={`${selectedStory?.id === story.id ? "bg-gray-700" : "bg-gray-700/50 hover:bg-gray-700"} transition-colors p-3 rounded-lg cursor-pointer border border-gray-600 flex items-center gap-3 w-full text-left`}
											onClick={() => selectStory(story)}
											aria-pressed={selectedStory?.id === story.id}
										>
											<div
												className="w-16 h-16 bg-gray-600 rounded-md flex-shrink-0 bg-cover bg-center"
												style={{
													backgroundImage: `url('${story.previewImage}')`,
												}}
											/>
											<div>
												<h3 className="font-medium">{story.title}</h3>
												<p className="text-sm text-gray-300">
													Created {story.createdAt.toLocaleDateString()}
												</p>
											</div>
										</button>
									))
								) : (
									<div className="text-center py-8 text-gray-400">
										<p>No stories yet</p>
										<p className="text-sm mt-2">
											Create your first story to see it here
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Quick Settings */}
						<div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
							<h2 className="text-xl font-bold mb-4">Settings</h2>
							<div className="space-y-4">
								<div>
									<label
										htmlFor="volume-control"
										className="block text-sm font-medium mb-1"
									>
										Audio Volume
									</label>
									<input
										id="volume-control"
										type="range"
										className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
									/>
								</div>
								<div>
									<label
										htmlFor="text-speed"
										className="block text-sm font-medium mb-1"
									>
										Text Speed
									</label>
									<select
										id="text-speed"
										className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
									>
										<option>Slow</option>
										<option>Medium</option>
										<option>Fast</option>
									</select>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Auto-Play</span>
									<label className="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" value="" className="sr-only peer" />
										<div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			{/* Create New Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-2xl font-bold">Create New Video Novel</h2>
								<button
									type="button"
									className="text-gray-400 hover:text-white"
									onClick={() => setIsModalOpen(false)}
									aria-label="Close modal"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<title>Close icon</title>
										<line x1="18" y1="6" x2="6" y2="18" />
										<line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								</button>
							</div>

							<form onSubmit={handleSubmit}>
								<div className="space-y-5">
									<div>
										<label
											htmlFor="prompt"
											className="block text-sm font-medium mb-1"
										>
											Story Prompt
										</label>
										<textarea
											id="prompt"
											name="prompt"
											rows={4}
											className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
											placeholder="Describe the story you want to create..."
											value={formData.prompt}
											onChange={handleInputChange}
											required
										/>
									</div>

									<div>
										<label
											htmlFor="style"
											className="block text-sm font-medium mb-1"
										>
											Visual Style
										</label>
										<select
											id="style"
											name="style"
											className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
											value={formData.style}
											onChange={handleInputChange}
										>
											<option value="realistic">Realistic</option>
											<option value="anime">Anime</option>
											<option value="cartoon">Cartoon</option>
											<option value="watercolor">Watercolor</option>
											<option value="oil-painting">Oil Painting</option>
										</select>
									</div>

									<div>
										<label
											htmlFor="customInstructions"
											className="block text-sm font-medium mb-1"
										>
											Custom Instructions (Optional)
										</label>
										<textarea
											id="customInstructions"
											name="customInstructions"
											rows={3}
											className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
											placeholder="Add any specific instructions for the AI..."
											value={formData.customInstructions}
											onChange={handleInputChange}
										/>
									</div>

									<div className="pt-4 flex justify-end space-x-3">
										<Button
											type="button"
											className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
											onClick={() => setIsModalOpen(false)}
										>
											Cancel
										</Button>
										<Button
											type="submit"
											className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md flex items-center gap-2"
											disabled={isGenerating}
										>
											{isGenerating ? (
												<>
													<svg
														className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														aria-hidden="true"
													>
														<title>Loading spinner</title>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														/>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														/>
													</svg>
													Generating...
												</>
											) : (
												<>Generate</>
											)}
										</Button>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			<FloatingChat />
		</>
	);
}
