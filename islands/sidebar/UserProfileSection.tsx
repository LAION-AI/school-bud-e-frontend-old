import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface UserData {
	name?: string;
	email?: string;
	avatar?: string;
	preferences?: {
		language?: string;
		theme?: string;
	};
}

export default function UserProfileSection({ 
	isCollapsed,
	lang = "en"
}: { 
	isCollapsed: boolean;
	lang?: string;
}) {
	const [userData, setUserData] = useState<UserData>(() => {
		if (!IS_BROWSER) return {};
		
		const storedData = localStorage.getItem("userData");
		return storedData ? JSON.parse(storedData) : {};
	});

	const navigateToSettings = () => {
		// Navigate to the dedicated settings page
		window.location.href = "/settings";
	};

	return (
		<div class="border-t pt-2">
			<div class="flex items-center p-2 space-x-3">
				<div class="flex-shrink-0">
					<div class="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
						{userData.avatar ? (
							<img
								src={userData.avatar}
								alt="User avatar"
								class="w-full h-full object-cover"
							/>
						) : (
							<svg
								class="w-full h-full text-gray-300"
								fill="currentColor"
								viewBox="0 0 24 24"
								aria-label="Default user avatar"
								role="img"
							>
								<path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						)}
					</div>
				</div>
				<div class="flex-grow min-w-0">
					<div class="text-sm font-medium truncate">
						{userData.name || (lang === "de" ? "Benutzerprofil" : "User Profile")}
					</div>
					{userData.email && (
						<div class="text-xs text-gray-500 truncate">{userData.email}</div>
					)}
				</div>
				<button
					type="button"
					onClick={navigateToSettings}
					class="p-2 rounded hover:bg-blue-100 transition-colors"
					aria-label="Open settings page"
					title={lang === "de" ? "Einstellungen öffnen" : "Open settings"}
					data-tour="open-settings-button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						role="img"
						aria-label="Settings"
					>
						<circle cx="12" cy="12" r="3" />
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
					</svg>
				</button>
			</div>
		</div>
	);
} 