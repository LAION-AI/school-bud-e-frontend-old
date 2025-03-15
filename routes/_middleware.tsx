import type { FreshContext } from "$fresh/server.ts";
import { trackPageView } from "../utils/umami.ts";

export async function handler(req: Request, ctx: FreshContext) {
    trackPageView(req);
    console.log(ctx.destination);
    console.log(req.url);
    const resp = await ctx.next();
    return resp;
  }