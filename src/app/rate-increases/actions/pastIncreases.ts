"use server";
import { assertOwnerOrAdmin } from "../_lib/server/guard";
import {
  loadPastIncreases,
  loadWaveEvidence,
  storeReport,
  type PastIncreasesData,
  type SaveReportInput,
  type SaveReportResult,
} from "../_lib/server/pastIncreasesData";
import type { PooledEvidence } from "../_lib/waves";

export type { PastIncreasesData, SaveReportInput, SaveReportResult, ImportSummary, WaveGroup } from "../_lib/server/pastIncreasesData";

/** Store one parsed report. Re-uploading is safe: a row is only replaced by a
 *  report run on the same day or later, so an older file can't overwrite newer data. */
export async function saveIncreaseReport(input: SaveReportInput): Promise<SaveReportResult> {
  await assertOwnerOrAdmin();
  return storeReport(input);
}

export async function getPastIncreases(): Promise<PastIncreasesData> {
  await assertOwnerOrAdmin();
  return loadPastIncreases();
}

/** Just the pooled finding, for the Batch Builder's what-if. */
export async function getWaveEvidence(): Promise<PooledEvidence | null> {
  await assertOwnerOrAdmin();
  return loadWaveEvidence();
}
