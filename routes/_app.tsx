import type { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import Sidebar from "../islands/sidebar/index.tsx";
import FloatingChat from "../islands/chat/FloatingChat.tsx";

export default function App({ Component, url }: AppProps) {
	const isArticle = url.pathname.startsWith("/articles");

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
				<div class="h-screen flex">
					{isArticle ? (
						<Component />
					) : (
						<>
							<Sidebar
								currentChatSuffix=""
								onDownloadChat={handleDownloadChat}
								lang="en"
							/>
							<div class="flex-1">
								<Partial name="main-content">
									<Component />
								</Partial>
							</div>
							<FloatingChat />
						</>
					)}
				</div>
			</body>
		</html>
	);
}
