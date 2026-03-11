import { auth } from "@/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { unstable_cache } from "next/cache";

const getTodayRentals = unstable_cache(
  async () => {
    const rows = await db.execute(sql`
      SELECT DISTINCT ON (facility_id)
        facility_id,
        daily_total
      FROM daily_management_activity
      WHERE "activityType" = 'Move-Ins'
      ORDER BY facility_id, date DESC
    `);
    const map: Record<string, number> = {};
    for (const row of rows) {
      map[String(row.facility_id)] = Number(row.daily_total ?? 0);
    }
    return map;
  },
  ["banner-today-rentals"],
  { revalidate: 1800 } // 30 minutes
);

export async function LocationRentalsBanner({
  currentSitelinkId,
}: {
  currentSitelinkId?: string;
}) {
  const session = await auth();
  if (!session?.user?.userDetailId) return null;

  const userId = session.user.userDetailId;

  // Fetch facilities the user has access to, sorted by state → area manager → facility name
  const rows = await db.execute(sql`
    SELECT
      sf.sitelink_id,
      sf.facility_abbreviation,
      sf.state,
      sf.facility_name,
      ud.last_name AS area_manager_last_name
    FROM user_to_facilities utf
    INNER JOIN storage_facility sf ON sf.sitelink_id = utf.storage_facility_id
    LEFT JOIN user_detail ud ON ud.id = sf.area_manager_id
    WHERE utf.user_id = ${userId}
      AND sf.current_client = true
    ORDER BY sf.state, ud.last_name NULLS LAST, sf.facility_name
  `);

  if (rows.length === 0) return null;

  const rentalMap = await getTodayRentals();

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-2">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(rows as Record<string, unknown>[]).flatMap((loc, i, arr) => {
          const id = String(loc.sitelink_id);
          const count = rentalMap[id] ?? 0;
          const isActive = id === currentSitelinkId;
          const prev = arr[i - 1] as Record<string, unknown> | undefined;
          const stateChanged = !!prev && prev.state !== loc.state;
          const managerChanged =
            !stateChanged &&
            !!prev &&
            (prev.area_manager_last_name ?? null) !==
              (loc.area_manager_last_name ?? null);

          const card = (
            <Link
              key={id}
              href={`/location/${id}`}
              className={cn(
                "flex-shrink-0 flex flex-col items-center px-3 py-1 rounded-md border text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : count > 0
                  ? "bg-red-50 border-red-200 hover:bg-red-100 text-foreground dark:bg-red-950/40 dark:border-red-800 dark:hover:bg-red-900/50"
                  : "border-border hover:bg-muted text-foreground",
              )}
            >
              <span className="font-semibold">{String(loc.facility_abbreviation)}</span>
              <span className="tabular-nums text-muted-foreground">
                {count} today
              </span>
            </Link>
          );

          if (stateChanged) {
            return [
              <div key={`sep-${id}`} className="w-px self-stretch bg-border flex-shrink-0 mx-1" />,
              card,
            ];
          }
          if (managerChanged) {
            return [
              <div key={`sep-${id}`} className="w-px self-stretch bg-border/40 flex-shrink-0 mx-1" />,
              card,
            ];
          }
          return [card];
        })}
      </div>
    </div>
  );
}
