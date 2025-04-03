import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { IconSettings } from "@tabler/icons-preact";

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
	lang = "en",
}: {
	lang?: string;
}) {
	const [userData, setUserData] = useState<UserData>(() => {
		if (!IS_BROWSER) return {};

		const storedData = localStorage.getItem("userData");
		return storedData ? JSON.parse(storedData) : {};
	});

	return (
		<div class="border-t pt-2">
			<a
				href="/settings"
				class="p-2 rounded hover:bg-blue-100 transition-colors flex items-center gap-2"
				aria-label="Open settings page"
				title={lang === "de" ? "Einstellungen öffnen" : "Open settings"}
				data-tour="open-settings-button"
			>
				<IconSettings />
				Settings
			</a>
		</div>
	);
}
