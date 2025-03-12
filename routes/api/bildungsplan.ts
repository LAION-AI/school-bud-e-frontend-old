import { Handlers } from "$fresh/server.ts";

const BILDUNGSPLAN_API_URL = Deno.env.get("BILDUNGSPLAN_API_URL") || "http://213.173.96.19:8020/query";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const handler: Handlers = {
  async GET(req: Request) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("query");
      const top_n = Number.parseInt(url.searchParams.get("top_n") || "5", 10);
      const apiUrl = url.searchParams.get("apiUrl") || BILDUNGSPLAN_API_URL;

      if (!query) {
        throw new Error("Query parameter is required");
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          top_n,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as BildungsplanResponse;

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in bildungsplan API:", error);
      return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req: Request) {
    try {
      const payload = await req.json();
      const { query } = payload;
      const top_n = Number.parseInt(payload.top_n || "5", 10);
      const apiUrl = payload.apiUrl || BILDUNGSPLAN_API_URL;

      if (!query) {
        throw new Error("Query parameter is required");
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          top_n,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as BildungsplanResponse;

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in bildungsplan API:", error);
      return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
