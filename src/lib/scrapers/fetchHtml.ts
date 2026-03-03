/**
 * Fetches rendered HTML for a URL, routing through ScrapingBee when configured.
 *
 * ScrapingBee handles bot protection (PerimeterX, Incapsula, Cloudflare) and
 * renders JavaScript. Set SCRAPINGBEE_API_KEY in your environment to enable it.
 *
 * Free tier: 1,000 credits at https://www.scrapingbee.com
 * Each request costs 1 credit (standard) or 5 credits (with JS rendering).
 * For storage REIT sites, use render_js=false — pricing data is server-rendered
 * or embedded in __NEXT_DATA__; we just need to bypass the bot challenge.
 */
export async function fetchHtml(url: string): Promise<string> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  if (apiKey) {
    const params = new URLSearchParams({
      api_key: apiKey,
      url,
      render_js: "false", // data is server-rendered; saves credits vs JS mode
      premium_proxy: "true", // residential proxy — bypasses PerimeterX + Incapsula
    });
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ScrapingBee ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.text();
  }

  // No API key — direct fetch. Works for unprotected sites; blocked by REIT bot protection.
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}
