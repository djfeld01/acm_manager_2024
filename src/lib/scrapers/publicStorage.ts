import * as cheerio from "cheerio";
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

export async function scrapePublicStorage(url: string): Promise<ParsedUnit[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const html = await response.text();
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
