import { Head } from "$fresh/runtime.ts";
import type { Handlers, PageProps } from "$fresh/server.ts";
import ChatIsland from "../../islands/ChatIsland.tsx";

export const handler: Handlers = {
    GET(_, ctx) {
        const { id } = ctx.params;
        // Validate that the chat exists or is a valid new chat ID
        if (!/^\d+$/.test(id) && id !== "new") {
            return new Response("Invalid chat ID", { status: 400 });
        }
        return ctx.render({ id });
    },
};

export default function ChatPage({ params }: PageProps) {
    const { id } = params;

    return (
        <>
            <Head>
                <title>Chat {id} - School Bud-E</title>
            </Head>
            <ChatIsland key={id} lang="en" id={id} />
        </>
    );
}
