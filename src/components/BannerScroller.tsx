"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function BannerScroller({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, [update]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  }

  return (
    <div className="relative flex items-center">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className={cn(
          "absolute left-0 z-10 h-full px-1 flex items-center bg-gradient-to-r from-background/95 to-transparent transition-opacity",
          canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Scrollable list */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar px-5">
        {children}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className={cn(
          "absolute right-0 z-10 h-full px-1 flex items-center bg-gradient-to-l from-background/95 to-transparent transition-opacity",
          canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
