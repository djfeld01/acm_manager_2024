// A facility has one monthly_reconciliation row per bank account, but the UI
// treats a facility's month as a single reconciliation. Status actions now
// update every row for the facility/month, but older rows drifted apart (only
// one row was ever updated), so pick a representative consistently: the most
// advanced status wins, then the lowest id for stability.
const STATUS_RANK: Record<string, number> = {
  completed: 3,
  pending_review: 2,
  in_progress: 1,
  rejected: 0,
};

export function pickFacilityReconciliation<
  T extends { reconciliationId: number; status: string },
>(rows: T[]): T | null {
  let best: T | null = null;
  for (const r of rows) {
    if (
      !best ||
      (STATUS_RANK[r.status] ?? -1) > (STATUS_RANK[best.status] ?? -1) ||
      ((STATUS_RANK[r.status] ?? -1) === (STATUS_RANK[best.status] ?? -1) &&
        r.reconciliationId < best.reconciliationId)
    ) {
      best = r;
    }
  }
  return best;
}
