import { FreshContext } from "fresh";
import { Handlers } from "fresh/compat";

export const handler: Handlers = {
  async GET(ctx: FreshContext) {
    const req = ctx.req;
    const url = new URL(req.url);
    const scriptPath = new URL(
      "../../static/audio-button.min.js",
      import.meta.url,
    );
    const script = await Deno.readTextFile(scriptPath);

    // Check if client supports Brotli compression
    const acceptEncoding = req.headers.get("accept-encoding") || "";
    const supportsBrotli = acceptEncoding.includes("br");

    // Set appropriate headers for JavaScript content
    const headers = new Headers({
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    });

    if (supportsBrotli) {
      const brotliPath = new URL(
        "../../static/audio-button.min.js.br",
        import.meta.url,
      );
      const brotliScript = await Deno.readTextFile(brotliPath);
      headers.set("Content-Encoding", "br");
      return new Response(brotliScript, { headers });
    }

    // Return the minified script content
    return new Response(script, { headers });
  },
};
