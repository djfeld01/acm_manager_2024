"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "chart-direction-newest-first";

export function useChartDirection() {
  const [newestFirst, setNewestFirst] = useState(true);

  // Hydrate from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setNewestFirst(stored === "true");
    }
  }, []);

  function toggle() {
    setNewestFirst((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return { newestFirst, toggle };
}
