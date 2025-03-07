import type { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import Sidebar from "../islands/sidebar/index.tsx";
import FloatingChat from "../islands/chat/FloatingChat.tsx";
import AIVoiceButton from "../islands/AIVoiceButton.tsx";
import Navbar from "../islands/navbar/index.tsx";

export default function App({ Component, url }: AppProps) {
	const pathname = new URL(url.href).pathname;
	const isHomePage = pathname === "/" || pathname === "/index";
	const isPressPage = pathname === "/press";
	const isSignInPage = pathname === "/signin";
	
	const showSidebar = !isHomePage && !isPressPage && !isSignInPage && !isSignUpPage;
	const showNavbar = !isSignInPage;
	
	const lang = 
		url.searchParams.get("lang") !== undefined &&
		url.searchParams.get("lang") !== null
			? url.searchParams.get("lang") as string
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
				<div class="h-screen flex">
					{!showSidebar ? (
						<>
						<div class="flex flex-col flex-1">
							<Partial name="main-content">
							{showNavbar && <Navbar lang={lang} />}
								<div class="flex-1">
									<Component />
								</div>
							</Partial>
						</div>
						</>
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
							<AIVoiceButton />
						</>
					)}
				</div>
			</body>
		</html>
	);
}
