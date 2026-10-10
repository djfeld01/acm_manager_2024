import { db } from "@/db";
import { rateIncreaseBatch, rateIncreaseBatchItem, rentRollSnapshot, tenantActivities } from "@/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { buildExitModel } from "../analytics";
import {
  computeOutcome,
  computeRealization,
  truncateStays,
  type CohortMember,
  type Outcome,
  type Realization,
} from "../cohort";
import { OBSERVATION_START } from "../config";
import { normalizeSize } from "../unitTypes";
import { loadLatestSnapshot, loadStayInputs } from "./loadData";

export interface BatchOutcomeResult {
  dataThrough: string;
  latestSnapshotDate: string | null;
  outcome: Outcome | null;
  realization: Realization | null;
  /** Why the outcome could not be worked out, when it could not. */
  note: string | null;
}

type BatchRow = typeof rateIncreaseBatch.$inferSelect;
type ItemRow = typeof rateIncreaseBatchItem.$inferSelect;

/**
 * How a finalized, noticed batch is doing: exits since the notice date vs the
 * baseline fit on what was known that day and vs matched tenants who were not
 * raised, plus whether the new rents landed. No names — IDs and rents only.
 */
export async function loadBatchOutcome(batch: BatchRow, items: ItemRow[]): Promise<BatchOutcomeResult> {
  const sitelinkId = batch.sitelinkId;
  const today = new Date().toISOString().slice(0, 10);

  const [{ last }] = await db
    .select({ last: sql<string | null>`max(${tenantActivities.date})::date::text` })
    .from(tenantActivities)
    .where(eq(tenantActivities.facilityId, sitelinkId));
  const dataThrough = last && last < today ? last : today;

  const latest = await loadLatestSnapshot(sitelinkId);
  const realization =
    latest.date && items.length
      ? computeRealization(
          items.map((i) => ({ ledgerId: i.ledgerId, unitId: i.unitId, oldRent: i.oldRent, newRent: i.newRent })),
          latest.rows.map((r) => ({ unitId: r.unitId, ledgerId: r.ledgerId, isRented: r.isRented, rent: r.rent })),
          latest.date,
          batch.effectiveDate
        )
      : null;

  const base = { dataThrough, latestSnapshotDate: latest.date, realization };
  if (!batch.noticeDate) {
    return { ...base, outcome: null, note: "Record the date tenants were notified to start tracking." };
  }
  if (batch.noticeDate > dataThrough) {
    return { ...base, outcome: null, note: "Tracking starts on the notice date." };
  }
  if (batch.noticeDate <= OBSERVATION_START) {
    return { ...base, outcome: null, note: "The notice date is before our move-out records begin." };
  }

  // Control pool: the rent roll the batch was built from, minus anyone in any
  // finalized batch, anyone with a pending change or move-out, and anyone whose
  // rent has since changed for another reason.
  const poolRows = await db
    .select()
    .from(rentRollSnapshot)
    .where(and(eq(rentRollSnapshot.sitelinkId, sitelinkId), eq(rentRollSnapshot.snapshotDate, batch.snapshotDate)));
  const finalLedgers = new Set(
    (
      await db
        .select({ ledgerId: rateIncreaseBatchItem.ledgerId })
        .from(rateIncreaseBatchItem)
        .innerJoin(rateIncreaseBatch, eq(rateIncreaseBatch.id, rateIncreaseBatchItem.batchId))
        .where(and(eq(rateIncreaseBatch.sitelinkId, sitelinkId), eq(rateIncreaseBatch.status, "final")))
    ).map((r) => r.ledgerId)
  );
  const changedSince = new Set(
    latest.rows
      .filter((r) => r.ledgerId && r.rentLastChanged && r.rentLastChanged > batch.snapshotDate)
      .map((r) => r.ledgerId!)
  );
  const controls: CohortMember[] = poolRows
    .filter(
      (r) =>
        r.isRented &&
        r.ledgerId &&
        r.tenantId &&
        !finalLedgers.has(r.ledgerId) &&
        !changedSince.has(r.ledgerId) &&
        !r.schedRentStart &&
        !r.schedOut &&
        (r.rent ?? 0) > 0
    )
    .map((r) => ({
      ledgerId: r.ledgerId!,
      tenantId: r.tenantId,
      unitName: r.unitName,
      unitType: r.unitType,
      size: normalizeSize(r.size),
      leaseDate: r.leaseDate,
      rent: r.rent ?? 0,
      standardRate: r.standardRate,
    }));

  const members: CohortMember[] = items.map((i) => ({
    ledgerId: i.ledgerId,
    tenantId: i.tenantId,
    unitName: i.unitName,
    unitType: i.unitType,
    size: normalizeSize(i.size),
    leaseDate: i.leaseDate,
    rent: i.oldRent,
    standardRate: i.standardRate,
  }));

  const tenantIds = Array.from(
    new Set([...members, ...controls].map((m) => Number(m.tenantId)).filter((t) => Number.isFinite(t)))
  );
  const exitRows = tenantIds.length
    ? await db
        .select({ tenant: tenantActivities.tenantSitelinkId, unit: tenantActivities.unitName, date: tenantActivities.date })
        .from(tenantActivities)
        .where(
          and(
            eq(tenantActivities.facilityId, sitelinkId),
            sql`${tenantActivities.activityType} = 'MoveOut'`,
            gte(tenantActivities.date, new Date(batch.snapshotDate)),
            inArray(tenantActivities.tenantSitelinkId, tenantIds)
          )
        )
    : [];

  const stays = truncateStays(await loadStayInputs(sitelinkId, latest.rows), batch.noticeDate);
  const model = buildExitModel(stays, { asOf: batch.noticeDate, windowStart: OBSERVATION_START });

  const outcome = computeOutcome({
    noticeDate: batch.noticeDate,
    effectiveDate: batch.effectiveDate,
    dataThrough,
    snapshotDate: batch.snapshotDate,
    batch: members,
    controls,
    exits: exitRows.map((e) => ({ tenantId: String(e.tenant), unitName: e.unit, date: e.date.toISOString().slice(0, 10) })),
    model,
  });
  return { ...base, outcome, note: null };
}
