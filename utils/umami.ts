const UMAMI_URL = Deno.env.get("UMAMI_URL") || "http://umami:3000";

export async function trackPageView(req: Request) {
  try {
    const url = new URL(req.url);

    const data = {
      payload: {
        hostname: url.hostname,
        language: "",
        referrer: req.headers.get("referer") || "",
        screen: "1920x1080",
        title: document.title,
        url: url.toString(),
        website: '6f5f48af-a00c-42f7-9796-677e299e04c1',
        name: 'pageview',
      },
      type: 'event',
    };
    console.log({data});

    // Fire and forget - don't await
    await fetch(`${UMAMI_URL}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": req.headers.get("User-Agent") || "" },
      body: JSON.stringify(data),
    }).catch((e) => {
      console.error("Failed to track page view", e);
    }).then((res) => {
      console.log("Tracked page view", res);
    });
  } catch (e){
    console.error("Failed to track page view", e);
    // Silently fail if tracking fails
  }
}
