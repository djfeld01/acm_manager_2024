"use server";
import { db } from "@/db";
import { rentRollSnapshot } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { assertAccess } from "../_lib/server/guard";
import type { RentRollRow } from "../_lib/parseRentRoll";

export interface SaveSnapshotResult {
  snapshotDate: string;
  saved: number;
  replaced: number;
  rented: number;
}

const CHUNK = 400;

/**
 * Stores one rent roll snapshot. Uploading the same facility+date again
 * replaces that day's rows (so re-exports and retries are safe).
 */
export async function saveRentRollSnapshot(
  sitelinkId: string,
  snapshotDate: string,
  rows: RentRollRow[]
): Promise<SaveSnapshotResult> {
  await assertAccess(sitelinkId);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) throw new Error("Snapshot date must be YYYY-MM-DD");
  const today = new Date().toISOString().slice(0, 10);
  if (snapshotDate > today || snapshotDate < "2020-01-01") throw new Error("Snapshot date is out of range");
  if (!rows.length) throw new Error("No units found for this facility in the file");
  if (rows.some((r) => r.sitelinkId !== sitelinkId)) throw new Error("File contains units from another facility");

  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.unitId)) throw new Error(`Duplicate unit in file: ${r.unitId}`);
    seen.add(r.unitId);
  }

  return db.transaction(async (tx) => {
    const existing = await tx
      .delete(rentRollSnapshot)
      .where(and(eq(rentRollSnapshot.sitelinkId, sitelinkId), eq(rentRollSnapshot.snapshotDate, snapshotDate)))
      .returning({ id: rentRollSnapshot.id });

    for (let i = 0; i < rows.length; i += CHUNK) {
      await tx.insert(rentRollSnapshot).values(
        rows.slice(i, i + CHUNK).map((r) => ({
          sitelinkId,
          snapshotDate,
          unitId: r.unitId,
          unitName: r.unitName,
          ledgerId: r.ledgerId,
          tenantId: r.tenantId,
          unitType: r.unitType,
          rawUnitType: r.rawUnitType,
          size: r.size,
          area: r.area,
          isRentable: r.isRentable,
          isRented: r.isRented,
          rent: r.rent,
          standardRate: r.standardRate,
          webRate: r.webRate,
          pushRate: r.pushRate,
          pushRateAtMoveIn: r.pushRateAtMoveIn,
          rentLastChanged: r.rentLastChanged,
          leaseDate: r.leaseDate,
          paidThru: r.paidThru,
          schedRentStart: r.schedRentStart,
          schedRent: r.schedRent,
          schedOut: r.schedOut,
          chargeBalance: r.chargeBalance,
          daysVacant: r.daysVacant,
        }))
      );
    }

    return {
      snapshotDate,
      saved: rows.length,
      replaced: existing.length,
      rented: rows.filter((r) => r.isRented).length,
    };
  });
}
