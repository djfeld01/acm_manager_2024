"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type InquiryRow = {
  id: number;
  datePlaced: string | null;
  inquiryType: string | null;
  callType: string | null;
  source: string | null;
  marketingDesc: string | null;
  quotedRate: number | null;
  rentalType: string | null;
  leaseDate: string | null;
  cancelDate: string | null;
  comment: string | null;
};

type SortKey = keyof InquiryRow;
type SortDir = "asc" | "desc";

function fmt$(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(s));
}

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "datePlaced", label: "Date Placed" },
  { key: "inquiryType", label: "Type" },
  { key: "callType", label: "Call Type" },
  { key: "source", label: "Source" },
  { key: "marketingDesc", label: "Marketing Desc" },
  { key: "rentalType", label: "Unit Type" },
  { key: "quotedRate", label: "Quoted Rate", align: "right" },
  { key: "leaseDate", label: "Leased" },
  { key: "cancelDate", label: "Cancelled" },
];

export function InquiryTable({ rows }: { rows: InquiryRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("datePlaced");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      COLUMNS.some((col) => {
        const val = r[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter inquiries…"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {filtered.length} / {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-2.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-primary">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-muted-foreground">
                  No inquiries found
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(row.datePlaced)}</td>
                  <td className="px-4 py-2.5">{row.inquiryType ?? "—"}</td>
                  <td className="px-4 py-2.5">{row.callType ?? "—"}</td>
                  <td className="px-4 py-2.5">{row.source ?? "—"}</td>
                  <td className="px-4 py-2.5">{row.marketingDesc ?? "—"}</td>
                  <td className="px-4 py-2.5">{row.rentalType ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(row.quotedRate)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {row.leaseDate ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {fmtDate(row.leaseDate)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {row.cancelDate ? (
                      <span className="text-red-500 font-medium">
                        {fmtDate(row.cancelDate)}
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
