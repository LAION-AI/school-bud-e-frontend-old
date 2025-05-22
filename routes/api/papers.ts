import { FreshContext } from "fresh";
import { Handlers } from "fresh/compat";

const PAPERS_API_URL = Deno.env.get("PAPERS_API_URL") ||
  "https://api.ask.orkg.org/index/search";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const handler: Handlers = {
  async GET(ctx: FreshContext) {
    const req = ctx.req;

    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("query");
      const limit = Number.parseInt(url.searchParams.get("limit") || "5", 10);
      const apiUrl = url.searchParams.get("apiUrl") || PAPERS_API_URL;

      if (!query) {
        throw new Error("Query parameter is required");
      }

      const response = await fetch(
        `${apiUrl}?query=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in papers API:", error);
      return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(ctx: FreshContext) {
    const req = ctx.req;

    try {
      const payload = await req.json();
      const { query } = payload;
      const limit = Number.parseInt(payload.limit || "5", 10);
      const apiUrl = payload.apiUrl || PAPERS_API_URL;

      if (!query) {
        throw new Error("Query parameter is required");
      }

      const response = await fetch(
        `${apiUrl}?query=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.payload) {
        throw new Error("Invalid response from papers API");
      }

      data.payload.items = data.payload.items.filter((item: PapersItem) => {
        return item.abstract && item.title && item.doi && item.date_published;
      });

      data.payload.items = data.payload.items.slice(0, limit);

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in papers API:", error);
      return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
