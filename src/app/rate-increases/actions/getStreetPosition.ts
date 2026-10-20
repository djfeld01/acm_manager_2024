"use server";
import { assertAccess } from "../_lib/server/guard";
import { loadLatestSnapshot } from "../_lib/server/loadData";
import { withStreetRate, type StreetBasis } from "../_lib/street";
import { streetRatePosition, type StreetPositionSegment } from "../_lib/analytics";

export interface StreetPositionResult {
  snapshotDate: string | null;
  overall: StreetPositionSegment | null;
  byType: StreetPositionSegment[];
  bySize: StreetPositionSegment[];
}

export async function getStreetPosition(sitelinkId: string, basis: StreetBasis = "standard"): Promise<StreetPositionResult> {
  await assertAccess(sitelinkId);
  const snap = await loadLatestSnapshot(sitelinkId);
  if (!snap.date) return { snapshotDate: null, overall: null, byType: [], bySize: [] };
  const { overall, byType, bySize } = streetRatePosition(withStreetRate(snap.rows, basis));
  return { snapshotDate: snap.date, overall, byType, bySize };
}
