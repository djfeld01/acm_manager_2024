"use server";
import { assertAccess } from "../_lib/server/guard";
import { loadLatestSnapshot, loadSpecialMonths, loadStayInputs } from "../_lib/server/loadData";
import { buildDemandHealth } from "../_lib/server/demandData";
import { analyzeStays } from "../_lib/analytics";
import { normalizeSize } from "../_lib/unitTypes";
import { OBSERVATION_START } from "../_lib/config";
import type { BatchTenant } from "../_lib/batch";
import type { DemandStatus } from "../_lib/demand";

export interface SegmentContext {
  label: string;
  tenants: number;
  vacantUnits: number;
  status: DemandStatus | null;
  coverage: number | null;
  cushion: number | null;
  lowSample: boolean;
  /** Expected move-outs in the next 90 days with no increase. */
  expectedExits90: number;
  expectedMoveInsPerMonth: number;
  expectedMoveOutsPerMonth: number;
}

export interface BatchData {
  snapshotDate: string | null;
  tenants: BatchTenant[];
  overall: SegmentContext | null;
  byType: SegmentContext[];
  bySize: SegmentContext[];
}

/** Everything the batch builder needs, with no tenant names. */
export async function getBatchData(sitelinkId: string): Promise<BatchData> {
  await assertAccess(sitelinkId);
  const snap = await loadLatestSnapshot(sitelinkId);
  if (!snap.date) return { snapshotDate: null, tenants: [], overall: null, byType: [], bySize: [] };

  const [stays, specials] = await Promise.all([
    loadStayInputs(sitelinkId, snap.rows),
    loadSpecialMonths(sitelinkId, snap.rows),
  ]);
  const stay = analyzeStays(stays, {
    asOf: snap.date,
    windowStart: OBSERVATION_START,
    withTenantRisk: true,
  });
  const today = new Date().toISOString().slice(0, 10);
  const health = await buildDemandHealth(sitelinkId, today, snap.rows, stay);

  const tenants: BatchTenant[] = [];
  for (const r of snap.rows) {
    if (!r.isRented || !r.ledgerId) continue;
    const risk = stay.tenantRisk?.[r.ledgerId] ?? { d30: 0, d60: 0, d90: 0 };
    tenants.push({
      ledgerId: r.ledgerId,
      tenantId: r.tenantId,
      unitId: r.unitId,
      unitName: r.unitName,
      unitType: r.unitType,
      size: normalizeSize(r.size),
      rent: r.rent ?? 0,
      standardRate: r.standardRate ?? 0,
      rentLastChanged: r.rentLastChanged,
      leaseDate: r.leaseDate,
      specialMonths: specials.get(r.ledgerId) ?? null,
      schedRent: r.schedRent,
      schedRentStart: r.schedRentStart,
      schedOut: r.schedOut,
      chargeBalance: r.chargeBalance,
      exit30: risk.d30,
      exit60: risk.d60,
      exit90: risk.d90,
    });
  }

  const context = (
    demand: typeof health.byType,
    stayList: typeof stay.byType,
    keyOf: (t: BatchTenant) => string
  ): SegmentContext[] =>
    demand.map((d) => ({
      label: d.label,
      tenants: tenants.filter((t) => keyOf(t) === d.label).length,
      vacantUnits: d.vacantUnits,
      status: d.status,
      coverage: d.coverage,
      cushion: d.cushion,
      lowSample: d.lowSample,
      expectedExits90: stayList.find((s) => s.label === d.label)?.expectedMoveOuts.d90 ?? 0,
      expectedMoveInsPerMonth: d.expectedMoveInsPerMonth,
      expectedMoveOutsPerMonth: d.expectedMoveOutsPerMonth,
    }));

  return {
    snapshotDate: snap.date,
    tenants,
    overall: {
      label: "All",
      tenants: tenants.length,
      vacantUnits: health.overall.vacantUnits,
      status: health.overall.status,
      coverage: health.overall.coverage,
      cushion: health.overall.cushion,
      lowSample: health.overall.lowSample,
      expectedExits90: stay.overall.expectedMoveOuts.d90,
      expectedMoveInsPerMonth: health.overall.expectedMoveInsPerMonth,
      expectedMoveOutsPerMonth: health.overall.expectedMoveOutsPerMonth,
    },
    byType: context(health.byType, stay.byType, (t) => t.unitType),
    bySize: context(health.bySize, stay.bySize, (t) => t.size),
  };
}
