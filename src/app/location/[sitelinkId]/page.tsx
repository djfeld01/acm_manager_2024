import { getLocationDetailData } from "@/lib/controllers/facilityController";
import { db } from "@/db";
import { dailyManagementPaymentReceipt } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MtdCollectionsChart, type MonthCollectionData } from "./_components/MtdCollectionsChart";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt$(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function delta(current: number | null | undefined, prev: number | null | undefined) {
  if (current == null || prev == null) return null;
  return current - prev;
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  const pctVal = (value * 100).toFixed(1);
  if (Math.abs(value) < 0.0001)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        flat
      </span>
    );
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <TrendingUp className="h-3 w-3" />+{pctVal}pp
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-red-500 font-medium">
      <TrendingDown className="h-3 w-3" />
      {pctVal}pp
    </span>
  );
}

function UnitDeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        flat
      </span>
    );
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <TrendingUp className="h-3 w-3" />+{value} units
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-red-500 font-medium">
      <TrendingDown className="h-3 w-3" />
      {value} units
    </span>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-2 mt-1">
      <div
        className="bg-primary h-2 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function formatLogonDate(dt: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dt));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ sitelinkId: string }>;
}) {
  const sitelinkId = (await params).sitelinkId;
  const {
    facility,
    latestOccupancy,
    sevenDayOccupancy,
    thirtyDayOccupancy,
    activityData,
    latestActivityDate,
    receivableData,
    latestReceivableDate,
    latestLogons,
    monthlyRentals,
    rentalGoal,
    collectionsGoal,
    retailGoal,
    mtdCollections,
    mtdCollectionsDate,
  } = await getLocationDetailData(sitelinkId);

  const lastLogon = latestLogons[0];

  // ── MTD Collections Chart data ────────────────────────────────────────────
  const today = new Date();
  const dayOfMonth = today.getDate();
  // Start of 12 months ago (so we get current month + 12 prior = 13 total)
  const thirteenMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 12, 1);
  const thirteenMonthsAgoStr = thirteenMonthsAgo.toISOString().split("T")[0];

  // MTD as of day X for each of the 13 months:
  // For each month, find the max date where day-of-month <= dayOfMonth,
  // then sum monthlyAmount for that date.
  const mtdRows = await db.execute(sql`
    SELECT
      DATE_TRUNC('month', date)::date AS month,
      SUM(monthly_amount) AS mtd_amount
    FROM daily_management_payment_receipt
    WHERE facility_id = ${sitelinkId}
      AND date IN (
        SELECT MAX(date)
        FROM daily_management_payment_receipt
        WHERE facility_id = ${sitelinkId}
          AND EXTRACT(DAY FROM date) <= ${dayOfMonth}
          AND date >= ${thirteenMonthsAgoStr}::date
        GROUP BY DATE_TRUNC('month', date)
      )
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month
  `);

  // Full month totals for completed months (last day of each past month):
  const fullMonthRows = await db.execute(sql`
    SELECT
      DATE_TRUNC('month', date)::date AS month,
      SUM(monthly_amount) AS full_amount
    FROM daily_management_payment_receipt
    WHERE facility_id = ${sitelinkId}
      AND date IN (
        SELECT MAX(date)
        FROM daily_management_payment_receipt
        WHERE facility_id = ${sitelinkId}
          AND date >= ${thirteenMonthsAgoStr}::date
          AND date < DATE_TRUNC('month', NOW())::date
        GROUP BY DATE_TRUNC('month', date)
      )
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month
  `);

  // Build a map of full-month totals keyed by month string
  const fullMonthMap = new Map<string, number>();
  for (const row of fullMonthRows) {
    const monthStr = String(row.month).slice(0, 7); // "YYYY-MM"
    fullMonthMap.set(monthStr, parseFloat(String(row.full_amount ?? "0")));
  }

  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const chartData: MonthCollectionData[] = (mtdRows as Record<string, unknown>[]).map((row) => {
    const monthDate = new Date(String(row.month));
    const monthStr = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const isCurrentMonth = monthStr === currentMonthStr;
    const label = monthDate.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
    return {
      monthLabel: label,
      mtdAmount: parseFloat(String(row.mtd_amount ?? "0")),
      fullMonthTotal: isCurrentMonth ? null : (fullMonthMap.get(monthStr) ?? null),
      isCurrentMonth,
    };
  });

  // Unit count deltas (integer: how many more/fewer units occupied vs. N days ago)
  const unitCountDelta7 =
    latestOccupancy?.occupiedUnits != null && sevenDayOccupancy?.occupiedUnits != null
      ? Math.round(latestOccupancy.occupiedUnits - sevenDayOccupancy.occupiedUnits)
      : null;
  const unitCountDelta30 =
    latestOccupancy?.occupiedUnits != null && thirtyDayOccupancy?.occupiedUnits != null
      ? Math.round(latestOccupancy.occupiedUnits - thirtyDayOccupancy.occupiedUnits)
      : null;

  const finOccDelta7 = delta(latestOccupancy?.financialOccupancy, sevenDayOccupancy?.financialOccupancy);
  const finOccDelta30 = delta(latestOccupancy?.financialOccupancy, thirtyDayOccupancy?.financialOccupancy);

  const totalReceivable = receivableData.reduce((sum, r) => sum + (r.delinquentTotal ?? 0), 0);
  const totalDelinquentUnits = receivableData.reduce((sum, r) => sum + (r.delinquentUnits ?? 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{facility?.facilityName}</h1>
            <p className="text-primary-foreground/80 mt-0.5">
              {facility?.streetAddress}, {facility?.city}, {facility?.state}
            </p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-primary-foreground/80">
              {facility?.phoneNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {facility.phoneNumber}
                </span>
              )}
              {facility?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {facility.email}
                </span>
              )}
            </div>
          </div>
          {lastLogon && (
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80 bg-primary-foreground/10 rounded-md px-3 py-2 self-start">
              <Clock className="h-4 w-4 shrink-0" />
              <div>
                <div className="text-primary-foreground font-medium">
                  {lastLogon.firstName} {lastLogon.lastName}
                </div>
                <div>{formatLogonDate(lastLogon.logonDate)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Occupancy Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Unit Occupancy */}
        <Card>
          <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              Unit Occupancy
              <InfoTooltip content="Percentage of rentable units currently occupied (occupied ÷ total units). The 7-day and 30-day changes compare today's rate to those points in time." />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-primary">
              {pct(latestOccupancy?.unitOccupancy)}
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">7-day change</span>
                <UnitDeltaBadge value={unitCountDelta7} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">30-day change</span>
                <UnitDeltaBadge value={unitCountDelta30} />
              </div>
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-muted-foreground">Occupied / Total</span>
                <span className="font-medium">
                  {latestOccupancy?.occupiedUnits?.toFixed(0) ?? "—"} /{" "}
                  {latestOccupancy?.totalUnits?.toFixed(0) ?? "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Occupancy */}
        <Card>
          <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              Financial Occupancy
              <InfoTooltip content="Measures how much of the facility's potential rental income is being collected. Higher than unit occupancy means smaller/cheaper units are rented; lower means larger/pricier units are vacant." />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-primary">
              {pct(latestOccupancy?.financialOccupancy)}
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">7-day change</span>
                <DeltaBadge value={finOccDelta7} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">30-day change</span>
                <DeltaBadge value={finOccDelta30} />
              </div>
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-muted-foreground">Sq Ft Occ</span>
                <span className="font-medium">
                  {pct(latestOccupancy?.squareFootageOccupancy)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rent Revenue */}
        <Card>
          <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              MTD Collections
              <InfoTooltip content="Month-to-date payments collected at this facility, summed from SiteLink's daily payment receipt report. Potential rent is the theoretical maximum if every unit were rented at full street rate." />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-primary">
              {fmt$(mtdCollections || null)}
            </div>
            {mtdCollectionsDate && (
              <div className="text-xs text-muted-foreground mt-0.5">as of {mtdCollectionsDate}</div>
            )}
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Potential rent</span>
                <span className="font-medium">{fmt$(latestOccupancy?.rentPotential ?? null)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rent actual</span>
                <span className="font-medium">{fmt$(latestOccupancy?.rentActual ?? null)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Activity + Goals ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Table — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                Activity
                <InfoTooltip content="Move-in, move-out, and other tenant activity counts from SiteLink's daily management report. Today shows the most recent day on record; MTD and YTD are cumulative totals for the month and year." />
              </CardTitle>
              {latestActivityDate && (
                <span className="text-xs text-muted-foreground">
                  as of {latestActivityDate}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            {activityData.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Today
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      MTD
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      YTD
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activityData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium">{row.activityType}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {row.dailyTotal}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {row.monthlyTotal}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {row.yearlyTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals — 1/3 width */}
        <Card>
          <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              Monthly Goals
              <InfoTooltip content="Targets set for the current calendar month. Rental goal = target new move-ins. Collections goal = target delinquent dollars collected. Retail goal = target merchandise/sundry sales." />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            {/* Rental Goal */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">Rentals</span>
                <span className="tabular-nums text-muted-foreground">
                  {monthlyRentals} / {rentalGoal}
                </span>
              </div>
              <ProgressBar value={monthlyRentals} max={rentalGoal} />
              <div className="text-xs text-muted-foreground mt-1">
                {rentalGoal > 0
                  ? `${((monthlyRentals / rentalGoal) * 100).toFixed(0)}% of goal`
                  : "No goal set"}
              </div>
            </div>

            {/* Collections Goal */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">Collections</span>
                <span className="tabular-nums text-muted-foreground">
                  {fmt$(collectionsGoal)} goal
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {fmt$(totalReceivable)} delinquent
              </div>
            </div>

            {/* Retail Goal */}
            {retailGoal > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">Retail</span>
                  <span className="tabular-nums text-muted-foreground">
                    {fmt$(retailGoal)} goal
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── MTD Collections Chart ─────────────────────────────────────────── */}
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
          <MtdCollectionsChart data={chartData} dayOfMonth={dayOfMonth} />
        </CardContent>
      </Card>

      {/* ── Receivables + Logons ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Receivables Aging */}
        <Card>
          <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                Receivables Aging
                <InfoTooltip content="Unpaid tenant balances grouped by how many days past due, sourced from SiteLink's daily receivables report. Earlier buckets (0–10 days) are often tenants still within their grace period." />
              </CardTitle>
              {latestReceivableDate && (
                <span className="text-xs text-muted-foreground">
                  as of {latestReceivableDate}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            {receivableData.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Period
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Units
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receivableData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {row.lowerDayRange}–{row.upperDayRange} days
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {fmt$(row.delinquentTotal)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {row.delinquentUnits?.toFixed(0) ?? "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="px-4 py-2.5">Total</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {fmt$(totalReceivable)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {totalDelinquentUnits.toFixed(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No receivables data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Logons */}
        <Card>
          <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              Recent Logons
              <InfoTooltip content="The last 8 times an employee logged into SiteLink at this facility, most recent first. Computer name is the workstation they logged in from." />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            {latestLogons.length > 0 ? (
              <ul className="divide-y">
                {latestLogons.map((logon, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {logon.firstName?.[0]}
                      {logon.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {logon.firstName} {logon.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatLogonDate(logon.logonDate)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {logon.computerName}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No logon data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
