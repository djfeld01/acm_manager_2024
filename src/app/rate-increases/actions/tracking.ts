"use server";
import { db } from "@/db";
import { rateIncreaseBatch, rateIncreaseBatchItem } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { assertAccess } from "../_lib/server/guard";
import { loadBatchOutcome, type BatchOutcomeResult } from "../_lib/server/outcomeData";
import { dayNum } from "../_lib/analytics";
import { SCHEDULE } from "../_lib/config";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

async function finalBatch(sitelinkId: string, id: number) {
  const [b] = await db
    .select()
    .from(rateIncreaseBatch)
    .where(and(eq(rateIncreaseBatch.id, id), eq(rateIncreaseBatch.sitelinkId, sitelinkId)))
    .limit(1);
  if (!b) throw new Error("Batch not found");
  if (b.status !== "final") throw new Error("Finalize the batch before recording notice dates");
  return b;
}

/** Record when the increase was decided and when tenants were told. The
 *  notice must be at least the required number of days before it takes effect. */
export async function setBatchDates(
  sitelinkId: string,
  id: number,
  dates: { decisionDate: string | null; noticeDate: string | null }
): Promise<void> {
  await assertAccess(sitelinkId);
  const b = await finalBatch(sitelinkId, id);
  const { decisionDate, noticeDate } = dates;
  for (const d of [decisionDate, noticeDate]) {
    if (d !== null && !ISO.test(d)) throw new Error("Dates must be valid dates");
  }
  if (noticeDate) {
    const lead = dayNum(b.effectiveDate) - dayNum(noticeDate);
    if (lead < SCHEDULE.noticeDays) {
      throw new Error(
        `Notice must go out at least ${SCHEDULE.noticeDays} days before ${b.effectiveDate} — that is ${lead} days.`
      );
    }
  }
  if (decisionDate && noticeDate && decisionDate > noticeDate) {
    throw new Error("The decision date can't be after the notice date");
  }
  await db
    .update(rateIncreaseBatch)
    .set({ decisionDate, noticeDate, updatedAt: new Date() })
    .where(eq(rateIncreaseBatch.id, id));
}

export async function getBatchOutcome(sitelinkId: string, id: number): Promise<BatchOutcomeResult> {
  await assertAccess(sitelinkId);
  const b = await finalBatch(sitelinkId, id);
  const items = await db.select().from(rateIncreaseBatchItem).where(eq(rateIncreaseBatchItem.batchId, id));
  return loadBatchOutcome(b, items);
}
