"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number, item: T) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  height: number;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  height,
  overscan = 5,
  className,
  onScroll,
  getItemKey,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const getItemHeightValue = useCallback(
    (index: number, item: T): number => {
      return typeof itemHeight === "function"
        ? itemHeight(index, item)
        : itemHeight;
    },
    [itemHeight]
  );

  // Calculate total height and item positions
  const { totalHeight, itemPositions } = React.useMemo(() => {
    let totalHeight = 0;
    const positions: number[] = [];

    for (let i = 0; i < items.length; i++) {
      positions[i] = totalHeight;
      totalHeight += getItemHeightValue(i, items[i]);
    }

    return { totalHeight, itemPositions: positions };
  }, [items, getItemHeightValue]);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = React.useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }

    // Find start index
    let startIndex = 0;
    for (let i = 0; i < itemPositions.length; i++) {
      if (itemPositions[i] + getItemHeightValue(i, items[i]) > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    let endIndex = items.length - 1;
    const viewportBottom = scrollTop + height;
    for (let i = startIndex; i < itemPositions.length; i++) {
      if (itemPositions[i] > viewportBottom) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    const visibleItems = items.slice(startIndex, endIndex + 1);

    return { startIndex, endIndex, visibleItems };
  }, [items, itemPositions, scrollTop, height, overscan, getItemHeightValue]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // Get offset for the first visible item
  const offsetY = startIndex > 0 ? itemPositions[startIndex] : 0;

  return (
    <div
      ref={scrollElementRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = getItemKey
              ? getItemKey(item, actualIndex)
              : actualIndex;

            return (
              <div
                key={key}
                style={{ height: getItemHeightValue(actualIndex, item) }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Virtual Grid Component
export interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  width: number;
  height: number;
  gap?: number;
  overscan?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  renderItem,
  width,
  height,
  gap = 0,
  overscan = 5,
  className,
  getItemKey,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions
  const columnsPerRow = Math.floor((width + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const totalHeight = totalRows * (itemHeight + gap) - gap;

  // Calculate visible range
  const { startRow, endRow, visibleItems } = React.useMemo(() => {
    if (items.length === 0) {
      return { startRow: 0, endRow: 0, visibleItems: [] };
    }

    const rowHeight = itemHeight + gap;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + height) / rowHeight) + overscan
    );

    const startIndex = startRow * columnsPerRow;
    const endIndex = Math.min(
      items.length - 1,
      (endRow + 1) * columnsPerRow - 1
    );
    const visibleItems = items.slice(startIndex, endIndex + 1);

    return { startRow, endRow, visibleItems };
  }, [
    items,
    scrollTop,
    height,
    itemHeight,
    gap,
    columnsPerRow,
    totalRows,
    overscan,
  ]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const offsetY = startRow * (itemHeight + gap);

  return (
    <div
      ref={scrollElementRef}
      className={cn("overflow-auto", className)}
      style={{ width, height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${columnsPerRow}, ${itemWidth}px)`,
            gap: `${gap}px`,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startRow * columnsPerRow + index;
            const key = getItemKey
              ? getItemKey(item, actualIndex)
              : actualIndex;

            return <div key={key}>{renderItem(item, actualIndex)}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

// Hook for virtual scrolling
export interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
}

export interface UseVirtualScrollReturn {
  scrollTop: number;
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  setScrollTop: (scrollTop: number) => void;
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const [scrollTop, setScrollTop] = useState(0);

  const getItemHeightValue = useCallback(
    (index: number): number => {
      return typeof itemHeight === "function" ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // Calculate item positions and total height
  const { totalHeight, itemPositions } = React.useMemo(() => {
    let totalHeight = 0;
    const positions: number[] = [];

    for (let i = 0; i < itemCount; i++) {
      positions[i] = totalHeight;
      totalHeight += getItemHeightValue(i);
    }

    return { totalHeight, itemPositions: positions };
  }, [itemCount, getItemHeightValue]);

  // Calculate visible range
  const { startIndex, endIndex } = React.useMemo(() => {
    if (itemCount === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    // Find start index
    let startIndex = 0;
    for (let i = 0; i < itemPositions.length; i++) {
      if (itemPositions[i] + getItemHeightValue(i) > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    let endIndex = itemCount - 1;
    const viewportBottom = scrollTop + containerHeight;
    for (let i = startIndex; i < itemPositions.length; i++) {
      if (itemPositions[i] > viewportBottom) {
        endIndex = Math.min(itemCount - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [
    itemCount,
    itemPositions,
    scrollTop,
    containerHeight,
    overscan,
    getItemHeightValue,
  ]);

  const offsetY = startIndex > 0 ? itemPositions[startIndex] : 0;

  const scrollToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < itemCount) {
        setScrollTop(itemPositions[index]);
      }
    },
    [itemCount, itemPositions]
  );

  return {
    scrollTop,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    setScrollTop,
    scrollToIndex,
  };
}
