import { Partial } from "$fresh/runtime.ts";
import type { AppProps } from "$fresh/server.ts";
import BottomNavigation from "../islands/navbar/BottomNavigation.tsx";
import Navbar from "../islands/navbar/index.tsx";
import Sidebar from "../islands/sidebar/index.tsx";
import AIFloatingButton from "../islands/AIFloatingButton.tsx";

export default function App({ Component, url }: AppProps) {
	const pathname = new URL(url.href).pathname;
	const isHomePage = pathname === "/" || pathname === "/index";
	const isPressPage = pathname === "/press";
	const isSignInPage = pathname === "/signin";

	const showSidebar = !isHomePage && !isPressPage && !isSignInPage;
	const showNavbar = !isSignInPage;
	const showBottomNav = !isHomePage && !isPressPage && !isSignInPage;

	const lang =
		url.searchParams.get("lang") !== undefined &&
		url.searchParams.get("lang") !== null
			? (url.searchParams.get("lang") as string)
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
				<link rel="stylesheet" href="/katex.min.css" />
			</head>
			<body>
				{!showSidebar ? (
					<div class="h-[calc(100dvh-4rem)] md:h-screen flex">
						<div class="flex flex-col flex-1">
							{showNavbar && <Navbar lang={lang} />}
							<div class="flex-1">
								<Component />
							</div>
						</div>
					</div>
				) : (
					<div class="h-[calc(100dvh-4rem)] md:h-screen flex" f-client-nav>
						<Partial name="sidebar">
							<Sidebar
								currentChatSuffix=""
								onDownloadChat={handleDownloadChat}
								lang={lang}
							/>
							<AIFloatingButton />
						</Partial>
						<Partial name="main-content">
							<div class="flex-1">
								<div class="pb-16 md:pb-0">
									<Component />
									{showBottomNav && <BottomNavigation lang={lang} />}
								</div>
							</div>
						</Partial>
					</div>
				)}
			</body>
		</html>
	);
}
