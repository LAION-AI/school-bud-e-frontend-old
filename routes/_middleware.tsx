import type { FreshContext } from "$fresh/server.ts";
import { trackPageView } from "../utils/umami.ts";

export async function handler(req: Request, ctx: FreshContext) {
    console.log("middleware");
    await trackPageView(req);
    const resp = await ctx.next();
    return resp;
  }