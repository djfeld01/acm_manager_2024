"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 12;
export type GridGap = "none" | "sm" | "md" | "lg" | "xl";

interface GridLayoutProps {
  children: ReactNode;
  cols?: GridCols;
  colsMd?: GridCols;
  colsLg?: GridCols;
  gap?: GridGap;
  className?: string;
  autoRows?: "auto" | "min" | "max" | "fr";
}

const colsClasses: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
};

const colsMdClasses: Record<GridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  12: "md:grid-cols-12",
};

const colsLgClasses: Record<GridCols, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  12: "lg:grid-cols-12",
};

const gapClasses: Record<GridGap, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const autoRowsClasses = {
  auto: "auto-rows-auto",
  min: "auto-rows-min",
  max: "auto-rows-max",
  fr: "auto-rows-fr",
};

export default function GridLayout({
  children,
  cols = 1,
  colsMd,
  colsLg,
  gap = "md",
  className,
  autoRows = "auto",
}: GridLayoutProps) {
  return (
    <div
      className={cn(
        "grid",
        colsClasses[cols],
        colsMd && colsMdClasses[colsMd],
        colsLg && colsLgClasses[colsLg],
        gapClasses[gap],
        autoRowsClasses[autoRows],
        className
      )}
    >
      {children}
    </div>
  );
}
