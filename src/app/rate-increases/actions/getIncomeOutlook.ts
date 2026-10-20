"use server";
import { assertAccess } from "../_lib/server/guard";
import { loadOutlook, type OutlookPayload } from "../_lib/server/outlookData";
import type { StreetBasis } from "../_lib/street";

export type { OutlookPayload } from "../_lib/server/outlookData";

/** A store's projected rental income over the coming months, with a range. */
export async function getIncomeOutlook(
  sitelinkId: string,
  opts: { basis: StreetBasis; horizon: number; batchId: number | null; upliftPct: number }
): Promise<OutlookPayload | null> {
  await assertAccess(sitelinkId);
  const horizon = Math.round(opts.horizon);
  if (!(horizon >= 3 && horizon <= 36)) throw new Error("Pick a horizon between 3 and 36 months");
  if (!(opts.upliftPct >= 0 && opts.upliftPct <= 300)) throw new Error("The extra move-out chance must be between 0% and 300%");
  if (opts.batchId !== null && !Number.isInteger(opts.batchId)) throw new Error("Unknown batch");
  return loadOutlook(sitelinkId, { ...opts, horizon });
}
