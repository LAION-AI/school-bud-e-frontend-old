#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "https://deno.land/std@0.208.0/dotenv/load.ts";

await dev(import.meta.url, "./main.ts", config);
