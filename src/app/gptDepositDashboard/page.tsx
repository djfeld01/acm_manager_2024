"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface Deposit {
  id: number;
  depositDate: string;
  amount: number;
}

interface MatchResult {
  siteDepositId: number;
  bankDepositId: number;
  matchType: "exact" | "fuzzy" | "manual";
  confidence: number;
}

export default function ReconciliationDashboard() {
  const [siteDeposits, setSiteDeposits] = useState<Deposit[]>([]);
  const [bankDeposits, setBankDeposits] = useState<Deposit[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  // Manual selection state
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    // Replace with your actual API fetch logic
    const fakeSite: Deposit[] = [
      { id: 1, depositDate: "2025-06-01", amount: 100 },
      { id: 2, depositDate: "2025-06-02", amount: 101 },
      { id: 3, depositDate: "2025-06-03", amount: 200 },
      { id: 4, depositDate: "2025-06-04", amount: 50 },
    ];
    const fakeBank: Deposit[] = [
      { id: 11, depositDate: "2025-06-03", amount: 100 },
      { id: 12, depositDate: "2025-06-04", amount: 101.5 },
      { id: 13, depositDate: "2025-06-06", amount: 200 },
      { id: 14, depositDate: "2025-06-10", amount: 25 },
    ];
    setSiteDeposits(fakeSite);
    setBankDeposits(fakeBank);

    // Auto-match exact
    const usedBankIds = new Set<number>();
    const exactMatches = fakeSite.flatMap((site) => {
      const match = fakeBank.find(
        (bank) =>
          !usedBankIds.has(bank.id) &&
          bank.amount === site.amount &&
          Math.abs(
            new Date(bank.depositDate).getTime() -
              new Date(site.depositDate).getTime()
          ) <=
            1000 * 60 * 60 * 24 * 5 // within 5 days
      );
      if (match) {
        usedBankIds.add(match.id);
        return [
          {
            siteDepositId: site.id,
            bankDepositId: match.id,
            matchType: "exact" as const,
            confidence: 1.0,
          },
        ];
      }
      return [];
    });

    // Auto-match fuzzy
    const fuzzyMatches = fakeSite.flatMap((site) => {
      if (exactMatches.find((m) => m.siteDepositId === site.id)) return [];
      const candidates = fakeBank
        .filter(
          (bank) =>
            !usedBankIds.has(bank.id) &&
            Math.abs(bank.amount - site.amount) <= 5 &&
            Math.abs(
              new Date(bank.depositDate).getTime() -
                new Date(site.depositDate).getTime()
            ) <=
              1000 * 60 * 60 * 24 * 10 // within 10 days
        )
        .map((bank) => ({
          siteDepositId: site.id,
          bankDepositId: bank.id,
          matchType: "fuzzy" as const,
          confidence: 1 - Math.abs(bank.amount - site.amount) / 5,
        }))
        .sort((a, b) => b.confidence - a.confidence);

      if (candidates.length > 0) {
        usedBankIds.add(candidates[0].bankDepositId);
        return [candidates[0]];
      }
      return [];
    });

    setMatches([...exactMatches, ...fuzzyMatches]);
  }, []);

  // Calculate unmatched lists
  const matchedSiteIds = new Set(matches.map((m) => m.siteDepositId));
  const matchedBankIds = new Set(matches.map((m) => m.bankDepositId));

  const unmatchedSite = siteDeposits.filter((s) => !matchedSiteIds.has(s.id));
  const unmatchedBank = bankDeposits.filter((b) => !matchedBankIds.has(b.id));

  // Manual match handlers
  function toggleBankSelection(id: number) {
    setSelectedBankIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  function addManualMatch() {
    if (selectedSiteId === null || selectedBankIds.size === 0) return;
    const newMatches = [...matches];
    selectedBankIds.forEach((bankId) => {
      newMatches.push({
        siteDepositId: selectedSiteId,
        bankDepositId: bankId,
        matchType: "manual",
        confidence: 1,
      });
    });
    setMatches(newMatches);

    // Reset selections
    setSelectedSiteId(null);
    setSelectedBankIds(new Set());
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-2">Matched Deposits</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Deposit Date</TableHead>
                <TableHead>Site Amount</TableHead>
                <TableHead>Bank Deposit Date</TableHead>
                <TableHead>Bank Amount</TableHead>
                <TableHead>Match Type</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Discrepancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m, i) => {
                const siteDeposit = siteDeposits.find(
                  (s) => s.id === m.siteDepositId
                );
                const bankDeposit = bankDeposits.find(
                  (b) => b.id === m.bankDepositId
                );
                if (!siteDeposit || !bankDeposit) return null;

                const discrepancy = Math.abs(
                  siteDeposit.amount - bankDeposit.amount
                );
                const showDiscrepancy =
                  m.matchType !== "exact" && discrepancy > 0;

                return (
                  <TableRow key={`${m.siteDepositId}-${m.bankDepositId}-${i}`}>
                    <TableCell>{siteDeposit.depositDate}</TableCell>
                    <TableCell>${siteDeposit.amount.toFixed(2)}</TableCell>
                    <TableCell>{bankDeposit.depositDate}</TableCell>
                    <TableCell>${bankDeposit.amount.toFixed(2)}</TableCell>
                    <TableCell>{m.matchType}</TableCell>
                    <TableCell>{(m.confidence * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      {showDiscrepancy ? (
                        <span className="text-red-600 font-semibold">
                          ${discrepancy.toFixed(2)} discrepancy
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-2">Manual Match Review</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Unmatched Site Deposits</h3>
              <ul className="border rounded p-2 max-h-48 overflow-auto">
                {unmatchedSite.length === 0 && (
                  <li className="text-muted-foreground">None</li>
                )}
                {unmatchedSite.map((d) => (
                  <li
                    key={d.id}
                    className={`cursor-pointer p-1 rounded ${
                      d.id === selectedSiteId
                        ? "bg-blue-200 font-semibold"
                        : "hover:bg-blue-100"
                    }`}
                    onClick={() => setSelectedSiteId(d.id)}
                  >
                    {d.depositDate} — ${d.amount.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                Unmatched Bank Deposits (select one or more)
              </h3>
              <ul className="border rounded p-2 max-h-48 overflow-auto">
                {unmatchedBank.length === 0 && (
                  <li className="text-muted-foreground">None</li>
                )}
                {unmatchedBank.map((d) => (
                  <li
                    key={d.id}
                    className={`cursor-pointer p-1 rounded ${
                      selectedBankIds.has(d.id)
                        ? "bg-green-200 font-semibold"
                        : "hover:bg-green-100"
                    }`}
                    onClick={() => toggleBankSelection(d.id)}
                  >
                    {d.depositDate} — ${d.amount.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            className="mt-3"
            onClick={addManualMatch}
            disabled={selectedSiteId === null || selectedBankIds.size === 0}
          >
            Create Manual Match
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
