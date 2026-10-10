"use server";
import { assertAccess } from "../_lib/server/guard";
import { loadLatestSnapshot, loadStayInputs } from "../_lib/server/loadData";
import { buildDemandHealth } from "../_lib/server/demandData";
import { analyzeStays } from "../_lib/analytics";
import { OBSERVATION_START } from "../_lib/config";
import type { DemandHealth } from "../_lib/demand";

export interface DemandHealthResult {
  snapshotDate: string | null;
  health: DemandHealth | null;
}

export async function getDemandHealth(sitelinkId: string): Promise<DemandHealthResult> {
  await assertAccess(sitelinkId);
  const snap = await loadLatestSnapshot(sitelinkId);
  if (!snap.date) return { snapshotDate: null, health: null };
  const stays = await loadStayInputs(sitelinkId, snap.rows);
  const stay = analyzeStays(stays, { asOf: snap.date, windowStart: OBSERVATION_START });
  const today = new Date().toISOString().slice(0, 10);
  const health = await buildDemandHealth(sitelinkId, today, snap.rows, stay);
  return { snapshotDate: snap.date, health };
}
