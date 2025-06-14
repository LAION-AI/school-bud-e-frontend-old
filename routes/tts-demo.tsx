import StreamingTTSDemo from "../islands/StreamingTTSDemo.tsx";
import { FreshContext } from "fresh";

export default function TTSDemoPage(ctx: FreshContext) {
  const req = ctx.req;
  const url = new URL(req.url);
  const lang = (url.searchParams.get("lang") as string !== undefined &&
      url.searchParams.get("lang") !== null
    ? url.searchParams.get("lang")
    : "de") as string;
  return (
    <>
      <div class="min-h-screen bg-gray-100 py-8">
        <StreamingTTSDemo />
      </div>
    </>
  );
} 