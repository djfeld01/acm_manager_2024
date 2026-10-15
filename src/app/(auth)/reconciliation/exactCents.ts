import { sql, type AnyColumn } from "drizzle-orm";

// daily_payment amounts are `real` (float4), and our connection sends float4
// with extra_float_digits = 0 — i.e. rounded to 6 significant digits. Anything
// over $10,000 loses its cents on the way out (25291.64 arrives as 25291.6),
// which made SiteLink totals a few cents off from the bank. The stored values
// are fine; widening to float8 before rounding to cents recovers them.
// Returned as a numeric string, which callers already parseFloat.
export function exactCents(column: AnyColumn) {
  return sql<string>`round(${column}::float8::numeric, 2)`;
}
