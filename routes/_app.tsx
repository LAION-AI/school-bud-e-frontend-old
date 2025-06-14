import { type PageProps } from "fresh";
import { Partial } from "fresh/runtime";

export default function App({ Component }: PageProps) {
  const chatSignalingServerUrl = Deno.env.get("CHAT_SIGNALING_SERVER_URL") || "ws://192.168.178.40:1234";
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="chat-signaling-server-url" content={chatSignalingServerUrl} />
        <title>School Bud-E</title>
        <link rel="stylesheet" href="/output.css" />
        <link rel="stylesheet" href="/katex.min.css" />
      </head>
      <body f-client-nav>
        <Partial name="content">
          <Component />
        </Partial>
      </body>
    </html>
  );
}
