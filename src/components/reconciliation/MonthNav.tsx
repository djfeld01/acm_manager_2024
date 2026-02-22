"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthNavProps {
  month: number;
  year: number;
}

export function MonthNav({ month, year }: MonthNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    router.push(`${pathname}?month=${m}&year=${y}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-primary-foreground min-w-36 text-center">
        {MONTHS[month - 1]} {year}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(1)}
        className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
