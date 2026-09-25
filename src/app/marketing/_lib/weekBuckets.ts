import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Canonical list of Monday-start week labels ('YYYY-MM-DD'), most recent
 * first, for the current (possibly partial) week plus `weeksBack` prior
 * weeks. Computed entirely in Postgres (via generate_series) so it always
 * lines up with the `TO_CHAR(DATE_TRUNC('week', ...), 'YYYY-MM-DD')`
 * expressions used to group inquiry rows — the app server's local timezone
 * never enters into it.
 */
export async function getRecentWeekLabels(weeksBack: number): Promise<string[]> {
  const rows = await db.execute<{ week: string }>(sql`
    SELECT TO_CHAR(DATE_TRUNC('week', gs), 'YYYY-MM-DD') AS week
    FROM generate_series(
      DATE_TRUNC('week', NOW()) - (${weeksBack}::int * INTERVAL '1 week'),
      DATE_TRUNC('week', NOW()),
      INTERVAL '1 week'
    ) AS gs
    ORDER BY week DESC
  `);
  return rows.map((r) => r.week);
}

export function classifyTrend(
  current: number,
  trailingAvg: number
): "up" | "down" | "stable" {
  if (trailingAvg === 0) return current > 0 ? "up" : "stable";
  const pctChange = (current - trailingAvg) / trailingAvg;
  if (pctChange > 0.15) return "up";
  if (pctChange < -0.15) return "down";
  return "stable";
}

export interface Stats {
  mean: number;
  median: number;
  min: number;
  max: number;
}

/** Mean/median/min/max across a set of per-facility values (e.g. one number
 *  per facility for a given week). Used so "portfolio average" comparisons
 *  can be shown as mean or median, with the min-max spread as context — a
 *  single outlier facility can drag a mean around in a way a 16-facility
 *  portfolio's median won't. */
export function computeStats(values: number[]): Stats {
  if (values.length === 0) return { mean: 0, median: 0, min: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    mean: Math.round((sum / sorted.length) * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}
