import { db } from "@/db";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MtdCollectionsChart, type MonthCollectionData } from "./MtdCollectionsChart";
import { MtdActivityChart, type MonthActivityData } from "./MtdActivityChart";

export async function MtdChartsSection({ sitelinkId }: { sitelinkId: string }) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const thirteenMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 12, 1);
  const thirteenMonthsAgoStr = thirteenMonthsAgo.toISOString().split("T")[0];
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Run all chart queries in parallel
  const [collectionsRows, activityRows, occupancyRows, goalRows] = await Promise.all([
    db.execute(sql`
      SELECT date, SUM(monthly_amount) AS monthly_amount
      FROM daily_management_payment_receipt
      WHERE facility_id = ${sitelinkId}
        AND date >= ${thirteenMonthsAgoStr}::date
      GROUP BY date
      ORDER BY date ASC
    `),
    db.execute(sql`
      SELECT date, "activityType", monthly_total
      FROM daily_management_activity
      WHERE facility_id = ${sitelinkId}
        AND "activityType" IN ('Move-Ins', 'Move-Outs')
        AND date >= ${thirteenMonthsAgoStr}::date
      ORDER BY date ASC
    `),
    db.execute(sql`
      SELECT date, unit_occupancy
      FROM daily_management_occupancy
      WHERE facility_id = ${sitelinkId}
        AND date >= ${thirteenMonthsAgoStr}::date
      ORDER BY date ASC
    `),
    db.execute(sql`
      SELECT month, rental_goal
      FROM monthly_goal
      WHERE sitelink_id = ${sitelinkId}
        AND month >= ${thirteenMonthsAgoStr}::date
    `),
  ]);

  // ── Collections chart ────────────────────────────────────────────────────
  // For each month: mtd = last record where day <= dayOfMonth, full = last record overall
  type MonthStat<T> = { mtd: T | null; full: T | null };

  function buildCollectionsStats(): Map<string, MonthStat<number>> {
    const map = new Map<string, MonthStat<number>>();
    for (const row of collectionsRows as Record<string, unknown>[]) {
      const d = new Date(String(row.date));
      const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const day = d.getUTCDate();
      const val = parseFloat(String(row.monthly_amount ?? "0"));
      const prev = map.get(monthStr) ?? { mtd: null, full: null };
      map.set(monthStr, {
        mtd: day <= dayOfMonth ? val : prev.mtd,
        full: val,
      });
    }
    return map;
  }

  const collStats = buildCollectionsStats();

  const collectionsDataUnsorted: MonthCollectionData[] = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isCurrentMonth = i === 0;
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = String(d.getFullYear()).slice(-2);
    const label = `${month} '${year}`;
    const stat = collStats.get(monthStr);
    return {
      monthLabel: label,
      mtdAmount: stat?.mtd ?? null,
      fullMonthTotal: isCurrentMonth ? null : (stat?.full ?? null),
      projectedTotal: null,
      isCurrentMonth,
    };
  });

  const priorColl = collectionsDataUnsorted.filter(
    (d) => !d.isCurrentMonth && d.mtdAmount != null && d.fullMonthTotal != null
  );
  const avgRemainder =
    priorColl.length > 0
      ? priorColl.reduce((sum, d) => sum + (d.fullMonthTotal! - d.mtdAmount!), 0) / priorColl.length
      : 0;

  const collectionsData: MonthCollectionData[] = collectionsDataUnsorted.map((d) =>
    d.isCurrentMonth && d.mtdAmount != null
      ? { ...d, projectedTotal: Math.round(d.mtdAmount + avgRemainder) }
      : d
  );

  // ── Activity chart ────────────────────────────────────────────────────────
  function buildActivityStats(actType: string): Map<string, MonthStat<number>> {
    const map = new Map<string, MonthStat<number>>();
    for (const row of (activityRows as Record<string, unknown>[]).filter(
      (r) => r.activityType === actType
    )) {
      const d = new Date(String(row.date));
      const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const day = d.getUTCDate();
      const val = parseInt(String(row.monthly_total ?? "0"), 10);
      const prev = map.get(monthStr) ?? { mtd: null, full: null };
      map.set(monthStr, {
        mtd: day <= dayOfMonth ? val : prev.mtd,
        full: val,
      });
    }
    return map;
  }

  function buildOccupancyStats(): Map<string, MonthStat<number>> {
    const map = new Map<string, MonthStat<number>>();
    for (const row of occupancyRows as Record<string, unknown>[]) {
      const d = new Date(String(row.date));
      const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const day = d.getUTCDate();
      const val = parseFloat(String(row.unit_occupancy ?? "0")) * 100;
      const prev = map.get(monthStr) ?? { mtd: null, full: null };
      map.set(monthStr, {
        mtd: day <= dayOfMonth ? val : prev.mtd,
        full: val,
      });
    }
    return map;
  }

  const moveInStats  = buildActivityStats("Move-Ins");
  const moveOutStats = buildActivityStats("Move-Outs");
  const occStats     = buildOccupancyStats();

  // Build rental goal map: monthStr -> rentalGoal
  const goalMap = new Map<string, number>();
  for (const row of goalRows as Record<string, unknown>[]) {
    const d = new Date(String(row.month));
    const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    goalMap.set(monthStr, parseInt(String(row.rental_goal ?? "0"), 10));
  }

  const activityDataUnsorted: (MonthActivityData & { _miMtd: number | null; _miFull: number | null; _moMtd: number | null; _moFull: number | null })[] = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isCurrentMonth = i === 0;
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = String(d.getFullYear()).slice(-2);
    const label = `${month} '${year}`;
    const mi  = moveInStats.get(monthStr);
    const mo  = moveOutStats.get(monthStr);
    const occ = occStats.get(monthStr);
    return {
      monthLabel: label,
      moveInMtd:    mi?.mtd  ?? null,
      moveInFull:   isCurrentMonth ? null : (mi?.full  ?? null),
      moveInProjected: null,
      moveOutMtd:   mo?.mtd  ?? null,
      moveOutFull:  isCurrentMonth ? null : (mo?.full  ?? null),
      moveOutProjected: null,
      occupancyMtd: occ?.mtd ?? null,
      occupancyEnd: isCurrentMonth ? null : (occ?.full ?? null),
      rentalGoal:   goalMap.get(monthStr) ?? null,
      isCurrentMonth,
      _miMtd: mi?.mtd ?? null,
      _miFull: isCurrentMonth ? null : (mi?.full ?? null),
      _moMtd: mo?.mtd ?? null,
      _moFull: isCurrentMonth ? null : (mo?.full ?? null),
    };
  });

  // Compute avg remainder for move-ins and move-outs (same logic as collections)
  const priorActivity = activityDataUnsorted.filter((d) => !d.isCurrentMonth);
  const avgMiRemainder =
    priorActivity.filter((d) => d._miMtd != null && d._miFull != null).length > 0
      ? priorActivity
          .filter((d) => d._miMtd != null && d._miFull != null)
          .reduce((sum, d) => sum + (d._miFull! - d._miMtd!), 0) /
        priorActivity.filter((d) => d._miMtd != null && d._miFull != null).length
      : 0;
  const avgMoRemainder =
    priorActivity.filter((d) => d._moMtd != null && d._moFull != null).length > 0
      ? priorActivity
          .filter((d) => d._moMtd != null && d._moFull != null)
          .reduce((sum, d) => sum + (d._moFull! - d._moMtd!), 0) /
        priorActivity.filter((d) => d._moMtd != null && d._moFull != null).length
      : 0;

  const activityData: MonthActivityData[] = activityDataUnsorted.map((d) => {
    if (d.isCurrentMonth) {
      return {
        ...d,
        moveInProjected: d.moveInMtd != null ? Math.round(d.moveInMtd + avgMiRemainder) : null,
        moveOutProjected: d.moveOutMtd != null ? Math.round(d.moveOutMtd + avgMoRemainder) : null,
      };
    }
    return d;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            MTD Collections — Current Month vs. Prior 12 Months
            <span className="ml-2 text-xs font-normal">
              (line = thru day {dayOfMonth} · bars = full month)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <MtdCollectionsChart data={collectionsData} dayOfMonth={dayOfMonth} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Activity — Current Month vs. Prior 12 Months
            <span className="ml-2 text-xs font-normal">
              (line = thru day {dayOfMonth} · bars = full month)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <MtdActivityChart data={activityData} dayOfMonth={dayOfMonth} />
        </CardContent>
      </Card>
    </div>
  );
}
