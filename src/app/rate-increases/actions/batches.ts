"use server";
import { db } from "@/db";
import { rateIncreaseBatch, rateIncreaseBatchItem } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/utils";
import { assertAccess } from "../_lib/server/guard";
import { loadLatestSnapshot } from "../_lib/server/loadData";
import { normalizeSize } from "../_lib/unitTypes";
import { dayNum } from "../_lib/analytics";
import { SCHEDULE } from "../_lib/config";
import type { BatchRules } from "../_lib/batch";

export interface BatchListItem {
  id: number;
  name: string;
  status: "draft" | "final";
  effectiveDate: string;
  snapshotDate: string;
  decisionDate: string | null;
  noticeDate: string | null;
  tenants: number;
  monthlyGain: number;
  updatedAt: string;
}

export interface BatchItemInput {
  ledgerId: string;
  newRent: number;
  specialMonths: number | null;
  baselineExit90: number | null;
}

export interface SaveBatchInput {
  /** Omit to create a new batch. */
  id?: number;
  name: string;
  effectiveDate: string;
  snapshotDate: string;
  rules: BatchRules;
  notes?: string;
  items: BatchItemInput[];
}

export interface BatchDetail {
  id: number;
  name: string;
  status: "draft" | "final";
  effectiveDate: string;
  snapshotDate: string;
  rules: BatchRules;
  notes: string | null;
  items: {
    ledgerId: string;
    tenantId: string | null;
    unitId: string;
    unitName: string | null;
    unitType: string;
    size: string | null;
    oldRent: number;
    newRent: number;
    standardRate: number | null;
    specialMonths: number | null;
    rentLastChanged: string | null;
    leaseDate: string | null;
    baselineExit90: number | null;
  }[];
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function listBatches(sitelinkId: string): Promise<BatchListItem[]> {
  await assertAccess(sitelinkId);
  const rows = await db
    .select({
      id: rateIncreaseBatch.id,
      name: rateIncreaseBatch.name,
      status: rateIncreaseBatch.status,
      effectiveDate: rateIncreaseBatch.effectiveDate,
      snapshotDate: rateIncreaseBatch.snapshotDate,
      decisionDate: rateIncreaseBatch.decisionDate,
      noticeDate: rateIncreaseBatch.noticeDate,
      updatedAt: rateIncreaseBatch.updatedAt,
      tenants: sql<number>`count(${rateIncreaseBatchItem.id})::int`,
      gain: sql<number>`coalesce(sum(${rateIncreaseBatchItem.newRent} - ${rateIncreaseBatchItem.oldRent}), 0)::float`,
    })
    .from(rateIncreaseBatch)
    .leftJoin(rateIncreaseBatchItem, eq(rateIncreaseBatchItem.batchId, rateIncreaseBatch.id))
    .where(eq(rateIncreaseBatch.sitelinkId, sitelinkId))
    .groupBy(rateIncreaseBatch.id)
    .orderBy(desc(rateIncreaseBatch.effectiveDate), desc(rateIncreaseBatch.id));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status as "draft" | "final",
    effectiveDate: r.effectiveDate,
    snapshotDate: r.snapshotDate,
    decisionDate: r.decisionDate,
    noticeDate: r.noticeDate,
    tenants: r.tenants,
    monthlyGain: r.gain,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

async function ownBatch(sitelinkId: string, id: number) {
  const [b] = await db
    .select()
    .from(rateIncreaseBatch)
    .where(and(eq(rateIncreaseBatch.id, id), eq(rateIncreaseBatch.sitelinkId, sitelinkId)))
    .limit(1);
  if (!b) throw new Error("Batch not found");
  return b;
}

export async function getBatch(sitelinkId: string, id: number): Promise<BatchDetail> {
  await assertAccess(sitelinkId);
  const b = await ownBatch(sitelinkId, id);
  const items = await db
    .select()
    .from(rateIncreaseBatchItem)
    .where(eq(rateIncreaseBatchItem.batchId, id));
  return {
    id: b.id,
    name: b.name,
    status: b.status as "draft" | "final",
    effectiveDate: b.effectiveDate,
    snapshotDate: b.snapshotDate,
    rules: b.rules as BatchRules,
    notes: b.notes,
    items: items.map((i) => ({
      ledgerId: i.ledgerId,
      tenantId: i.tenantId,
      unitId: i.unitId,
      unitName: i.unitName,
      unitType: i.unitType,
      size: i.size,
      oldRent: i.oldRent,
      newRent: i.newRent,
      standardRate: i.standardRate,
      specialMonths: i.specialMonths,
      rentLastChanged: i.rentLastChanged,
      leaseDate: i.leaseDate,
      baselineExit90: i.baselineExit90,
    })),
  };
}

/** Create or update a draft. Unit details come from the stored rent roll,
 *  not from the browser, and every line is checked against it. */
export async function saveBatch(sitelinkId: string, input: SaveBatchInput): Promise<{ id: number }> {
  await assertAccess(sitelinkId);
  const user = await getCurrentUser();

  const name = input.name.trim();
  if (!name) throw new Error("Give the batch a name");
  if (!ISO.test(input.effectiveDate)) throw new Error("Effective date is not a valid date");
  if (!input.items.length) throw new Error("A batch needs at least one tenant");

  const snap = await loadLatestSnapshot(sitelinkId);
  if (!snap.date) throw new Error("No rent roll uploaded");
  if (snap.date !== input.snapshotDate) {
    throw new Error(
      `A newer rent roll (${snap.date}) was uploaded since this batch was built — reload and rebuild it.`
    );
  }
  const byLedger = new Map(snap.rows.filter((r) => r.ledgerId).map((r) => [r.ledgerId!, r]));

  const seen = new Set<string>();
  const lines = input.items.map((it) => {
    if (seen.has(it.ledgerId)) throw new Error(`Tenant ${it.ledgerId} is in the batch twice`);
    seen.add(it.ledgerId);
    const row = byLedger.get(it.ledgerId);
    if (!row || !row.isRented) throw new Error(`Ledger ${it.ledgerId} is not a current tenant in the rent roll`);
    const old = row.rent ?? 0;
    if (!Number.isFinite(it.newRent) || it.newRent <= old) {
      throw new Error(`Unit ${row.unitName}: new rent must be higher than the current ${old}`);
    }
    if (it.newRent > old * 2) throw new Error(`Unit ${row.unitName}: new rent is more than double the current rent`);
    return {
      ledgerId: it.ledgerId,
      tenantId: row.tenantId,
      unitId: row.unitId,
      unitName: row.unitName,
      unitType: row.unitType,
      size: normalizeSize(row.size),
      oldRent: old,
      newRent: Math.round(it.newRent),
      standardRate: row.standardRate,
      specialMonths: it.specialMonths,
      rentLastChanged: row.rentLastChanged,
      leaseDate: row.leaseDate,
      baselineExit90: it.baselineExit90,
    };
  });

  return db.transaction(async (tx) => {
    let id = input.id;
    if (id) {
      const [existing] = await tx
        .select({ status: rateIncreaseBatch.status })
        .from(rateIncreaseBatch)
        .where(and(eq(rateIncreaseBatch.id, id), eq(rateIncreaseBatch.sitelinkId, sitelinkId)))
        .limit(1);
      if (!existing) throw new Error("Batch not found");
      if (existing.status !== "draft") throw new Error("A finalized batch can't be edited");
      await tx
        .update(rateIncreaseBatch)
        .set({
          name,
          effectiveDate: input.effectiveDate,
          snapshotDate: snap.date!,
          rules: input.rules,
          notes: input.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(rateIncreaseBatch.id, id));
      await tx.delete(rateIncreaseBatchItem).where(eq(rateIncreaseBatchItem.batchId, id));
    } else {
      const [created] = await tx
        .insert(rateIncreaseBatch)
        .values({
          sitelinkId,
          name,
          effectiveDate: input.effectiveDate,
          snapshotDate: snap.date!,
          rules: input.rules,
          notes: input.notes ?? null,
          createdBy: user?.email ?? null,
        })
        .returning({ id: rateIncreaseBatch.id });
      id = created.id;
    }
    for (let i = 0; i < lines.length; i += 400) {
      await tx
        .insert(rateIncreaseBatchItem)
        .values(lines.slice(i, i + 400).map((l) => ({ ...l, batchId: id! })));
    }
    return { id: id! };
  });
}

/** Lock a draft as the decision of record. The effective date must leave
 *  the required notice period from today. */
export async function finalizeBatch(sitelinkId: string, id: number): Promise<void> {
  await assertAccess(sitelinkId);
  const b = await ownBatch(sitelinkId, id);
  if (b.status !== "draft") throw new Error("This batch is already finalized");
  const today = new Date().toISOString().slice(0, 10);
  const lead = dayNum(b.effectiveDate) - dayNum(today);
  if (lead < SCHEDULE.noticeDays) {
    throw new Error(
      `The effective date is only ${lead} days away; ${SCHEDULE.noticeDays} days' notice is required. Move the effective date out.`
    );
  }
  await db
    .update(rateIncreaseBatch)
    .set({ status: "final", finalizedAt: new Date(), updatedAt: new Date() })
    .where(eq(rateIncreaseBatch.id, id));
}

export async function deleteBatch(sitelinkId: string, id: number): Promise<void> {
  await assertAccess(sitelinkId);
  const b = await ownBatch(sitelinkId, id);
  if (b.status !== "draft") throw new Error("Only drafts can be deleted");
  await db.delete(rateIncreaseBatch).where(eq(rateIncreaseBatch.id, id));
}
