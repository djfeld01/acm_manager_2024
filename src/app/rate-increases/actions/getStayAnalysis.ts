"use server";
import { assertAccess } from "../_lib/server/guard";
import { loadLatestSnapshot, loadStayInputs } from "../_lib/server/loadData";
import { analyzeStays, type StayAnalysis } from "../_lib/analytics";
import { OBSERVATION_START } from "../_lib/config";

export interface StayAnalysisResult {
  snapshotDate: string | null;
  analysis: StayAnalysis | null;
}

export async function getStayAnalysis(sitelinkId: string): Promise<StayAnalysisResult> {
  await assertAccess(sitelinkId);
  const snap = await loadLatestSnapshot(sitelinkId);
  if (!snap.date) return { snapshotDate: null, analysis: null };
  const stays = await loadStayInputs(sitelinkId, snap.rows);
  return {
    snapshotDate: snap.date,
    analysis: analyzeStays(stays, { asOf: snap.date, windowStart: OBSERVATION_START }),
  };
}
