/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import { trackPageView } from "./utils/umami.ts";

// Your regular console.logs will now be captured
console.log("Server started successfully");
console.error("Database connection failed");

// Add middleware to track pageviews
config.middleware = [
  async (req, ctx, next) => {
    // Start tracking in background
    trackPageView(req);
    // Continue with request
    return await next();
  },
];

await start(manifest, config);
