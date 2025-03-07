import type { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import Sidebar from "../islands/sidebar/index.tsx";
import FloatingChat from "../islands/chat/FloatingChat.tsx";
import AIVoiceButton from "../islands/AIVoiceButton.tsx";
import Navbar from "../islands/navbar/index.tsx";

export default function App({ Component, url }: AppProps) {
	const noSidebar =
		(url.searchParams.get("lang") as string) !== undefined &&
		url.searchParams.get("lang") !== null
			? url.searchParams.get("lang")
			: "de";

	const handleDownloadChat = () => {
		console.log("Download chat not yet implemented");
	};

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>School Bud-E</title>
				<link rel="stylesheet" href="/styles.css" />
			</head>
			<body f-client-nav>
				<div class="h-screen flex flex-col">
					{noSidebar ? (
						<>
							<Navbar lang={noSidebar} />
							<Partial name="main-content">
								<div class="flex-1">
									<Component />
								</div>
							</Partial>
						</>
					) : (
						<>
							<Sidebar
								currentChatSuffix=""
								onDownloadChat={handleDownloadChat}
								lang="en"
							/>
							<div class="flex-1 overflow-hidden">
								<Partial name="main-content">
									<Component />
								</Partial>
							</div>
							<FloatingChat />
							<AIVoiceButton />
						</>
					)}
				</div>
			</body>
		</html>
	);
}
