import { Handlers, PageProps } from "fresh/compat";
import { Head } from "fresh/src/runtime/head.ts";
import StreamingTTSDemo from "../islands/StreamingTTSDemo.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    return ctx.render();
  },
};

export default function TTSDemoPage(props: PageProps) {
  return (
    <>
      <Head>
        <title>Streaming TTS Demo - Bud-E</title>
        <meta name="description" content="Demo of streaming Text-to-Speech functionality" />
      </Head>
      <div class="min-h-screen bg-gray-100 py-8">
        <StreamingTTSDemo />
      </div>
    </>
  );
} 