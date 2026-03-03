import { NextRequest, NextResponse } from "next/server";
import { scrapeAllEnabled, scrapeCompetitor } from "@/lib/scrapers";

// Protect this endpoint with a shared secret so it can be called
// from Vercel Cron or an external scheduler without a user session.
// Set SCRAPE_SECRET in your .env.local / Vercel env vars.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SCRAPE_SECRET;
  if (!secret) return false; // refuse if secret not configured

  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// POST /api/scrape
// Body (optional): { competitorId: number }
// If competitorId is provided, scrapes only that competitor.
// Otherwise scrapes all enabled competitors.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let competitorId: number | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.competitorId === "number") {
      competitorId = body.competitorId;
    }
  } catch {
    // no body is fine
  }

  const results = competitorId
    ? [await scrapeCompetitor(competitorId)]
    : await scrapeAllEnabled();

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
    succeeded,
    failed,
    results,
  });
}
