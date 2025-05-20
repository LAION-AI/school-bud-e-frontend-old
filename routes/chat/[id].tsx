import { Head } from "$fresh/runtime.ts";
import type { PageProps } from "$fresh/server.ts";
import { page } from "fresh";
import ChatIsland from "../../islands/ChatIsland.tsx";
import { define } from "../../utils.ts";

interface Data {
    id: string;
}

export const handler = define.handlers<Data>({
    GET(ctx) {
        const { id } = ctx.params;
        // Validate that the chat exists or is a valid new chat ID
        if (!/^\d+$/.test(id) && id !== "new") {
            return new Response("Invalid chat ID", { status: 400 });
        }
        return page({ id });
    },
});

export default function ChatPage({ params }: PageProps) {
    const { id } = params;
    const lang = "en";
    return (
        <>
            <Head>
                <title>Chat {id} - School Bud-E</title>
            </Head>
            <ChatIsland key={id} lang={lang} id={id} />
        </>
    );
}
