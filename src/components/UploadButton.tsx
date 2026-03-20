"use client";

import { addBankTransactions } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { parseBankDownloads, ParsedBankFile } from "@/lib/parseBankDownloads";
import { ArrowBigUp, CheckCircle2, AlertCircle, FileX } from "lucide-react";
import React from "react";

type FileResult = {
  fileName: string;
  accountNumber: string; // last 4 digits
  parsed: number;        // deposits found in file
  inserted: number | null;
  error: string | null;
};

function UploadButton() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [results, setResults] = React.useState<FileResult[] | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    setResults(null);
    const files = e.target.files;

    if (!files || files.length === 0) {
      setIsUploading(false);
      return;
    }

    try {
      const fileNames = Array.from(files).map((f) => f.name);
      const parsed: ParsedBankFile[] = await parseBankDownloads(files);
      const rawResults = await addBankTransactions(parsed);

      const fileResults: FileResult[] = parsed.map((file, i) => {
        const raw = rawResults[i];
        const last4 = file.accountNumber.slice(-4);
        if (typeof raw === "string") {
          return {
            fileName: fileNames[i] ?? "unknown",
            accountNumber: last4,
            parsed: file.deposits.length,
            inserted: null,
            error: raw === "transactions empty" ? "No deposits found in file" : raw,
          };
        }
        return {
          fileName: fileNames[i] ?? "unknown",
          accountNumber: last4,
          parsed: file.deposits.length,
          inserted: raw.length,
          error: null,
        };
      });

      setResults(fileResults);
    } catch (error) {
      console.error("Error uploading files:", error);
      setResults([
        {
          fileName: "unknown",
          accountNumber: "—",
          parsed: 0,
          inserted: null,
          error: error instanceof Error ? error.message : "Upload failed",
        },
      ]);
    } finally {
      setIsUploading(false);
      // Reset the file input so the same file can be re-uploaded if needed
      e.target.value = "";
    }
  };

  const totalInserted = results?.reduce((s, r) => s + (r.inserted ?? 0), 0) ?? 0;
  const hasErrors = results?.some((r) => r.error !== null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {isUploading ? (
          <Button disabled>
            <ArrowBigUp className="mr-2 h-4 w-4 animate-spin" />
            Uploading…
          </Button>
        ) : (
          <>
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <ArrowBigUp className="mr-2 h-4 w-4" />
              Upload Bank Downloads
            </Button>
            <input
              type="file"
              accept=".qbo"
              multiple
              onChange={handleFileUpload}
              id="file-upload"
              style={{ display: "none" }}
            />
          </>
        )}

        {/* Summary badge shown after upload */}
        {results && !isUploading && (
          hasErrors ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-destructive font-medium">
              <AlertCircle className="h-4 w-4" />
              {hasErrors && results.every((r) => r.error)
                ? "All files failed"
                : "Some files had errors"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {totalInserted === 0
                ? "No new transactions (already uploaded?)"
                : `${totalInserted} new transaction${totalInserted !== 1 ? "s" : ""} added`}
            </span>
          )
        )}
      </div>

      {/* Per-file breakdown */}
      {results && results.length > 0 && (
        <div className="border rounded-lg overflow-hidden text-sm max-w-2xl">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/60 border-b">
                <th className="text-left p-2.5 font-medium text-muted-foreground">File</th>
                <th className="text-left p-2.5 font-medium text-muted-foreground">Account (last 4)</th>
                <th className="text-right p-2.5 font-medium text-muted-foreground">In File</th>
                <th className="text-right p-2.5 font-medium text-muted-foreground">New</th>
                <th className="text-right p-2.5 font-medium text-muted-foreground">Skipped</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map((r, i) => (
                <tr key={i} className={r.error ? "bg-destructive/5" : ""}>
                  <td className="p-2.5 text-xs text-muted-foreground max-w-[180px] truncate" title={r.fileName}>
                    {r.error && <FileX className="h-3.5 w-3.5 inline mr-1 text-destructive" />}
                    {r.fileName}
                  </td>
                  <td className="p-2.5 font-mono">···{r.accountNumber}</td>
                  {r.error ? (
                    <td colSpan={3} className="p-2.5 text-destructive text-xs" title={r.error}>
                      {r.error}
                    </td>
                  ) : (
                    <>
                      <td className="p-2.5 text-right">{r.parsed}</td>
                      <td className="p-2.5 text-right font-medium text-green-700 dark:text-green-400">
                        {r.inserted}
                      </td>
                      <td className="p-2.5 text-right text-muted-foreground">
                        {r.parsed - (r.inserted ?? 0)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UploadButton;
