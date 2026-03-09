"use client";

import { useState, useEffect } from "react";
import { Pin, PinOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TriviaQuestion } from "../page";

const STORAGE_KEY = "trivia-pinned";

export function TriviaClient({ questions }: { questions: TriviaQuestion[] }) {
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPinned(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  function togglePin(id: string) {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const pinnedQuestions = questions.filter((q) => pinned.has(q.id));
    const rows = [
      ["#", "Question", "Answer", "Detail"],
      ...pinnedQuestions.map((q, i) => [
        String(i + 1),
        q.question,
        q.answer,
        q.detail ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trivia-questions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const sorted = [
    ...questions.filter((q) => pinned.has(q.id)),
    ...questions.filter((q) => !pinned.has(q.id)),
  ];

  const pinnedCount = pinned.size;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pinnedCount === 0
            ? "Pin questions to build your game list"
            : `${pinnedCount} question${pinnedCount !== 1 ? "s" : ""} pinned`}
        </p>
        {pinnedCount > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export Pinned to CSV
          </Button>
        )}
      </div>

      {/* Question cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((q) => {
          const isPinned = pinned.has(q.id);
          const isRevealed = revealed.has(q.id);
          return (
            <div
              key={q.id}
              className={`border rounded-lg p-4 space-y-3 transition-colors ${
                isPinned
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-snug">{q.question}</p>
                <button
                  onClick={() => togglePin(q.id)}
                  className={`shrink-0 mt-0.5 transition-colors ${
                    isPinned
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={isPinned ? "Unpin" : "Pin"}
                >
                  {isPinned ? (
                    <Pin className="h-4 w-4 fill-primary" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div>
                {isRevealed ? (
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-primary">{q.answer}</p>
                    {q.detail && (
                      <p className="text-xs text-muted-foreground">{q.detail}</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => toggleReveal(q.id)}
                    className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Reveal answer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
