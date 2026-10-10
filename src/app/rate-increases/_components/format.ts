export const fmtMoney = (n: number | null | undefined, digits = 0) =>
  n == null || Number.isNaN(n)
    ? "—"
    : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtPct = (n: number | null | undefined, digits = 0) =>
  n == null || Number.isNaN(n) ? "—" : `${(n * 100).toFixed(digits)}%`;

export const fmtNum = (n: number | null | undefined, digits = 0) =>
  n == null || Number.isNaN(n) ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const daysToMonths = (d: number | null | undefined) => (d == null ? null : d / 30.44);
