import { useSignal } from "@preact/signals";
import { IconDownload, IconMessageCircle, IconX } from "@tabler/icons-preact";
import { useState } from "preact/hooks";
import { chats } from "../../components/chat/store.ts";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SidebarLink from "./SidebarLink.tsx";
import translations from "./sidebar.translations.json" with { type: "json" };

interface ChatListProps {
	isCollapsed: boolean;
	currentChatSuffix: string;
	onDownloadChat: () => void;
	onDeleteChat: (suffix: string) => void;
	translations: (typeof translations)[keyof typeof translations];
}

export default function ChatList({
	isCollapsed,
	currentChatSuffix,
	onDownloadChat,
	onDeleteChat,
	translations: t,
}: ChatListProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [activeSuffix, setActiveSuffix] = useState(currentChatSuffix);

	return (
		<CollapsibleSection
			icon={<IconMessageCircle size={20} />}
			title={t.navigation.chats}
			isCollapsed={isCollapsed}
			isExpanded={isExpanded}
			onToggle={() => setIsExpanded(!isExpanded)}
			routePattern={/^\/chat\/(\d+|new)$/}
			onRouteMatch={(match) => setActiveSuffix(match?.[1] || "")}
		>
			{[
				...Object.keys(chats.value)
					.filter((key) => key.startsWith("bude-chat-"))
					.sort((a, b) => {
						const numA = Number.parseInt(a.slice(10));
						const numB = Number.parseInt(b.slice(10));
						return numA - numB;
					})
					.map((key) => {
						const suffix = key.slice(10);
						return (
							<SidebarLink
								href={`/chat/${suffix}`}
								isActive={suffix === activeSuffix}
								className="flex items-center group"
								key={suffix}
							>
								<span className="flex-1 py-2">
									{isCollapsed
										? `#${Number.parseInt(suffix) + 1}`
										: `Chat ${Number.parseInt(suffix) + 1}`}
								</span>
								<button
									type="button"
									onClick={onDownloadChat}
									class="group-hover:text-gray-400 text-transparent p-2"
									aria-label={t.actions.downloadChat}
								>
									<IconDownload class="h-5 w-5" aria-hidden="true" />
								</button>
								<button
									type="button"
									onClick={() => onDeleteChat(suffix)}
									class="group-hover:text-gray-400 text-transparent p-2"
									aria-label={t.actions.deleteChat}
								>
									<IconX size={24} aria-hidden="true" />
								</button>
							</SidebarLink>
						);
					}),
				<SidebarLink
					key="new"
					href="/chat/new"
					isActive={"new" === activeSuffix}
					className="flex items-center group flex-1 py-2"
				>
					{isCollapsed ? "+" : t.actions.newChat}
				</SidebarLink>,
			]}
		</CollapsibleSection>
	);
}
