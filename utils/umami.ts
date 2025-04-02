const UMAMI_URL = Deno.env.get("UMAMI_URL") || "http://umami:3000";

export async function trackPageView(req: Request) {
  try {
    const url = new URL(req.url);
    const data = {
      type: "pageview",
      url: url.toString(),
      referrer: req.headers.get("referer") || "",
      website_id: "1", // Replace with your website_id from Umami
      hostname: url.hostname,
    };

    // Fire and forget - don't await
    await fetch(`${UMAMI_URL}/api/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((e) => {
      console.error("Failed to track page view", e);
    }).then((res) => {
      console.log("Tracked page view", res);
    });
  } catch {
    //console.error("Failed to track page view");
    // Silently fail if tracking fails
  }
}
