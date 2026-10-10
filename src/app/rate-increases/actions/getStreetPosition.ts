"use server";
import { assertAccess } from "../_lib/server/guard";
import { loadLatestSnapshot } from "../_lib/server/loadData";
import { streetRatePosition, type StreetPositionSegment } from "../_lib/analytics";

export interface StreetPositionResult {
  snapshotDate: string | null;
  overall: StreetPositionSegment | null;
  byType: StreetPositionSegment[];
  bySize: StreetPositionSegment[];
}

export async function getStreetPosition(sitelinkId: string): Promise<StreetPositionResult> {
  await assertAccess(sitelinkId);
  const snap = await loadLatestSnapshot(sitelinkId);
  if (!snap.date) return { snapshotDate: null, overall: null, byType: [], bySize: [] };
  const { overall, byType, bySize } = streetRatePosition(snap.rows);
  return { snapshotDate: snap.date, overall, byType, bySize };
}
