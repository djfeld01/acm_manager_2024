import * as cheerio from "cheerio";
import { fetchHtml } from "./fetchHtml";
import type { ParsedUnit } from "./types";

// data-gtmdata JSON blob shape from Public Storage's HTML
interface GtmData {
  dimension?: string; // e.g. "10'x10'" or "10'x10'x10'"
  listprice?: number | string; // rack/street rate
  saleprice?: number | string; // web/promotional rate
  category?: string; // unit feature category
  promotion?: string; // promotion description if any
}

// Regex to extract width x depth from dimension strings like "10'x10'" or "10'x10'x8'"
const DIM_RE = /(\d+(?:\.\d+)?)['"]?\s*x\s*(\d+(?:\.\d+)?)/i;

// Public Storage uses Salesforce Commerce Cloud (Demandware). The facility page
// itself returns a <wainclude> stub; the unit data lives in a separate
// Stores-Details endpoint. We extract the facility ID (pid) from the URL,
// then fetch the Stores-Details page which contains the rendered unit HTML.
function buildStoresDetailsUrl(facilityUrl: string): string {
  // URL pattern: /self-storage-{state}-{city}/{id}.html
  const pidMatch = facilityUrl.match(/\/(\d+)\.html/);
  if (!pidMatch) return facilityUrl; // fall back to original URL
  const pid = encodeURIComponent(`${pidMatch[1]}.html`);
  return `https://www.publicstorage.com/on/demandware.store/Sites-publicstorage-Site/default/Stores-Details?pid=${pid}&showUnits=&isMobile=false&isAuthenticated=false&ABPageEnabled=false`;
}

export async function scrapePublicStorage(url: string): Promise<ParsedUnit[]> {
  const targetUrl = buildStoresDetailsUrl(url);
  const html = await fetchHtml(targetUrl);
  const $ = cheerio.load(html);

  const units: ParsedUnit[] = [];

  $("button[data-gtmdata]").each((_, el) => {
    const raw = $(el).attr("data-gtmdata");
    if (!raw) return;

    let data: GtmData;
    try {
      data = JSON.parse(raw);
    } catch {
      return; // skip malformed entries
    }

    const dimMatch = data.dimension?.match(DIM_RE);
    if (!dimMatch) return;

    const width = parseFloat(dimMatch[1]);
    const depth = parseFloat(dimMatch[2]);
    const unitSize = `${width}x${depth}`;

    const streetRate = data.listprice ? parseFloat(String(data.listprice)) : null;
    const webRate = data.saleprice ? parseFloat(String(data.saleprice)) : null;

    units.push({
      unitSize,
      unitType: data.category ?? null,
      width,
      depth,
      streetRate,
      webRate,
      promotion: data.promotion ?? null,
      // Public Storage only shows available units on the pricing page
      availability: "AVAILABLE",
    });
  });

  return units;
}
