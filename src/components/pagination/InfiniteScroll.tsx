"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  error?: string | null;
  threshold?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  onRetry?: () => void;
}

export function InfiniteScroll<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoading,
  error,
  threshold = 200,
  className,
  loadingComponent,
  errorComponent,
  endComponent,
  getItemKey,
  onRetry,
}: InfiniteScrollProps<T>) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer
  useEffect(() => {
    const currentLoadingRef = loadingRef.current;

    if (!currentLoadingRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
      },
      {
        root: null, // Use viewport as root, or find scrollable parent
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observerRef.current.observe(currentLoadingRef);

    return () => {
      if (observerRef.current && currentLoadingRef) {
        observerRef.current.unobserve(currentLoadingRef);
      }
    };
  }, [threshold]);

  // Load more when intersecting
  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading && !error) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, error, loadMore]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      loadMore();
    }
  }, [onRetry, loadMore]);

  const defaultLoadingComponent = (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span className="text-sm text-muted-foreground">
        Loading more items...
      </span>
    </div>
  );

  const defaultErrorComponent = (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="flex items-center text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="text-sm">{error || "Failed to load more items"}</span>
      </div>
      <Button variant="outline" size="sm" onClick={handleRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );

  const defaultEndComponent = (
    <div className="flex items-center justify-center py-8">
      <span className="text-sm text-muted-foreground">
        No more items to load
      </span>
    </div>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Render items */}
      {items.map((item, index) => {
        const key = getItemKey ? getItemKey(item, index) : `item-${index}`;
        return <div key={key}>{renderItem(item, index)}</div>;
      })}

      {/* Loading/Error/End indicator */}
      <div ref={loadingRef}>
        {error
          ? errorComponent || defaultErrorComponent
          : isLoading
          ? loadingComponent || defaultLoadingComponent
          : !hasMore
          ? endComponent || defaultEndComponent
          : null}
      </div>
    </div>
  );
}

// Hook for infinite scroll state management
export interface UseInfiniteScrollOptions<T> {
  fetchData: (
    page: number,
    pageSize: number
  ) => Promise<{
    items: T[];
    hasMore: boolean;
    total?: number;
  }>;
  pageSize?: number;
  initialData?: T[];
  enabled?: boolean;
}

export interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  total?: number;
}

export function useInfiniteScroll<T>({
  fetchData,
  pageSize = 20,
  initialData = [],
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState<number | undefined>();

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchData(currentPage, pageSize);

      setItems((prevItems) => [...prevItems, ...result.items]);
      setHasMore(result.hasMore);
      setCurrentPage((prev) => prev + 1);

      if (result.total !== undefined) {
        setTotal(result.total);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, currentPage, pageSize, isLoading, hasMore, enabled]);

  const refresh = useCallback(async () => {
    setItems([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    setTotal(undefined);
  }, []);

  const retry = useCallback(async () => {
    setError(null);
    await loadMore();
  }, [loadMore]);

  // Load initial data
  useEffect(() => {
    if (enabled && items.length === 0 && !isLoading && hasMore) {
      loadMore();
    }
  }, [enabled, items.length, isLoading, hasMore, loadMore]);

  return {
    items,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    retry,
    total,
  };
}

// Infinite scroll with virtual scrolling for performance
export interface VirtualInfiniteScrollProps<T> {
  fetchData: (
    page: number,
    pageSize: number
  ) => Promise<{
    items: T[];
    hasMore: boolean;
  }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  height: number;
  pageSize?: number;
  threshold?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualInfiniteScroll<T>({
  fetchData,
  renderItem,
  itemHeight,
  height,
  pageSize = 50,
  threshold = 5,
  className,
  getItemKey,
}: VirtualInfiniteScrollProps<T>) {
  const { items, isLoading, error, hasMore, loadMore, retry } =
    useInfiniteScroll({
      fetchData,
      pageSize,
    });

  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const itemsPerView = Math.ceil(height / itemHeight);
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - threshold
  );
  const endIndex = Math.min(
    items.length - 1,
    startIndex + itemsPerView + threshold * 2
  );
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Load more when approaching end
  useEffect(() => {
    const remainingItems = items.length - endIndex;
    if (remainingItems < pageSize / 2 && hasMore && !isLoading && !error) {
      loadMore();
    }
  }, [endIndex, items.length, pageSize, hasMore, isLoading, error, loadMore]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight + (isLoading ? itemHeight : 0);
  const offsetY = startIndex * itemHeight;

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
              : `virtual-item-${actualIndex}`;

            return (
              <div key={key} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div
              style={{ height: itemHeight }}
              className="flex items-center justify-center"
            >
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          )}

          {/* Error indicator */}
          {error && (
            <div
              style={{ height: itemHeight }}
              className="flex items-center justify-center"
            >
              <Button variant="outline" size="sm" onClick={retry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
