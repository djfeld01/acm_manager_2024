import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const res = await await db.execute(
    sql`
    SELECT
      inquiry.sitelink_id,
      inquiry.source,
      DATE_TRUNC('month', inquiry.date_placed) AS month,
      COUNT(inquiry.date_placed) FILTER (WHERE inquiry.date_placed IS NOT NULL) AS leads_placed,
      COUNT(inquiry.converted_to_res_date) FILTER (WHERE inquiry.converted_to_res_date IS NOT NULL) AS reservations_placed,
      (
        COUNT(inquiry.date_placed) FILTER (WHERE inquiry.date_placed IS NOT NULL) +
        COUNT(inquiry.converted_to_res_date) FILTER (WHERE inquiry.converted_to_res_date IS NOT NULL)
      ) AS total_placed
    FROM inquiry
    GROUP BY
      inquiry.sitelink_id,
      inquiry.source,
      DATE_TRUNC('month', inquiry.date_placed)
    ORDER BY
      month,
      inquiry.sitelink_id,
      inquiry.source;
  `
  );

  const arrayResult = res.map((row) => [
    row.month,
    row.sitelink_id,
    row.source,
    row.leads_placed,
    row.reservations_placed,
    row.total_placed,
  ]);

  arrayResult.unshift([
    "Month",
    "SitelinkID",
    "Source",
    "Leads Placed",
    "Reservations Placed",
    "Total Placed",
  ]);
  return NextResponse.json({ length: res.length, res, arrayResult });
}
