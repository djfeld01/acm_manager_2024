import { sql, type AnyColumn } from "drizzle-orm";

// Money columns stored as `real` (float4) — daily_payment amounts among them —
// come back from our connection with extra_float_digits = 0, i.e. rounded to
// 6 significant digits. Anything over $10,000 loses its cents on the way out
// (25291.64 arrives as 25291.6). The stored values are fine; widening to
// float8 before rounding to cents recovers them.
// Returned as a numeric string, which callers parseFloat / Number().
export function exactCents(column: AnyColumn) {
  return sql<string>`round(${column}::float8::numeric, 2)`;
}

// Same, for a sum of float4 columns. Adding them as float4 in SQL would give
// a float4 result with the same 6-digit problem, so each term is widened first.
// Like plain `a + b`, the result is NULL if any column is NULL.
export function exactCentsSum(...columns: AnyColumn[]) {
  const terms = sql.join(
    columns.map((column) => sql`${column}::float8`),
    sql` + `
  );
  return sql<string>`round((${terms})::numeric, 2)`;
}
