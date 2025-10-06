"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useCache, globalCache, cacheUtils } from "@/lib/cache/clientCache";
import { usePrefetchOnHover, usePrefetchOnVisible } from "./usePrefetch";

// Enhanced data fetching hook with optimizations
export interface UseOptimizedDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: number | boolean;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  select?: (data: T) => any;
  placeholderData?: T;
  keepPreviousData?: boolean;
}

export function useOptimizedData<T>({
  key,
  fetcher,
  enabled = true,
  staleTime = 30000, // 30 seconds
  cacheTime = 300000, // 5 minutes
  refetchOnWindowFocus = true,
  refetchOnReconnect = true,
  retry = 3,
  retryDelay = 1000,
  onSuccess,
  onError,
  select,
  placeholderData,
  keepPreviousData = false,
}: UseOptimizedDataOptions<T>) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRefetching, setIsRefetching] = useState(false);
  const previousDataRef = useRef<T | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    data: rawData,
    isLoading,
    isStale,
    error,
    refetch: baseRefetch,
    invalidate,
  } = useCache({
    key,
    fetcher: useCallback(async () => {
      try {
        const result = await fetcher();
        setRetryCount(0); // Reset retry count on success
        return result;
      } catch (err) {
        if (retry && retryCount < (typeof retry === "number" ? retry : 3)) {
          setRetryCount((prev) => prev + 1);

          // Schedule retry with exponential backoff
          const delay = retryDelay * Math.pow(2, retryCount);
          retryTimeoutRef.current = setTimeout(() => {
            baseRefetch();
          }, delay);

          throw err;
        }
        throw err;
      }
    }, [fetcher, retry, retryCount, retryDelay, baseRefetch]),
    enabled,
    ttl: cacheTime,
    staleTime,
    onSuccess,
    onError,
  });

  // Apply data selector if provided
  const data = useMemo(() => {
    if (rawData && select) {
      return select(rawData);
    }
    return rawData;
  }, [rawData, select]);

  // Keep previous data if requested
  const finalData = useMemo(() => {
    if (data !== null) {
      previousDataRef.current = data;
      return data;
    }

    if (keepPreviousData && previousDataRef.current !== null) {
      return previousDataRef.current;
    }

    return placeholderData || data;
  }, [data, keepPreviousData, placeholderData]);

  // Enhanced refetch with loading state
  const refetch = useCallback(async () => {
    setIsRefetching(true);
    try {
      await baseRefetch();
    } finally {
      setIsRefetching(false);
    }
  }, [baseRefetch]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      if (isStale) {
        refetch();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnWindowFocus, enabled, isStale, refetch]);

  // Network reconnect refetch
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return;

    const handleOnline = () => {
      if (error) {
        refetch();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refetchOnReconnect, enabled, error, refetch]);

  // Cleanup retry timeout
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    data: finalData,
    isLoading: isLoading || (retryCount > 0 && !error),
    isRefetching,
    isStale,
    error,
    refetch,
    invalidate,
    retryCount,
  };
}

// Hook for optimized list data with pagination
export interface UseOptimizedListOptions<T> {
  baseKey: string;
  fetcher: (
    page: number,
    pageSize: number,
    filters?: any
  ) => Promise<{
    items: T[];
    total: number;
    hasMore: boolean;
  }>;
  pageSize?: number;
  filters?: any;
  enabled?: boolean;
  keepPreviousData?: boolean;
}

export function useOptimizedList<T>({
  baseKey,
  fetcher,
  pageSize = 20,
  filters = {},
  enabled = true,
  keepPreviousData = true,
}: UseOptimizedListOptions<T>) {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const key = useMemo(
    () =>
      `${baseKey}:page:${page}:size:${pageSize}:filters:${JSON.stringify(
        filters
      )}`,
    [baseKey, page, pageSize, filters]
  );

  const { data, isLoading, error, refetch } = useOptimizedData({
    key,
    fetcher: () => fetcher(page, pageSize, filters),
    enabled,
    keepPreviousData,
    staleTime: 60000, // 1 minute for list data
  });

  // Update items when data changes
  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllItems(data.items);
      } else {
        setAllItems((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.hasMore);
    }
  }, [data, page]);

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    setAllItems([]);
    setHasMore(true);
  }, [JSON.stringify(filters)]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoading]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllItems([]);
    setHasMore(true);
    refetch();
  }, [refetch]);

  return {
    items: allItems,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    total: data?.total || 0,
  };
}

// Hook for optimized mutations with cache updates
export interface UseMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables
  ) => void;
  // Cache update strategies
  invalidateQueries?: string[];
  updateCache?: (data: TData, variables: TVariables) => void;
}

export function useMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  onSuccess,
  onError,
  onSettled,
  invalidateQueries = [],
  updateCache,
}: UseMutationOptions<TData, TVariables>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>();

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);

        // Update cache if strategy provided
        if (updateCache) {
          updateCache(result, variables);
        }

        // Invalidate related queries
        if (invalidateQueries.length > 0) {
          invalidateQueries.forEach((pattern) => {
            cacheUtils.invalidatePrefix(pattern);
          });
        }

        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Mutation failed");
        setError(error);
        onError?.(error, variables);
        onSettled?.(undefined, error, variables);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, onSettled, invalidateQueries, updateCache]
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
  }, []);

  return {
    mutate,
    data,
    error,
    isLoading,
    reset,
  };
}

// Hook for real-time data synchronization
export interface UseRealtimeOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  websocketUrl?: string;
  syncInterval?: number;
  enabled?: boolean;
}

export function useRealtime<T>({
  key,
  fetcher,
  websocketUrl,
  syncInterval = 30000, // 30 seconds
  enabled = true,
}: UseRealtimeOptions<T>) {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  const { data, isLoading, error, refetch, invalidate } = useOptimizedData({
    key,
    fetcher,
    enabled,
    staleTime: syncInterval / 2, // Half of sync interval
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!websocketUrl || !enabled) return;

    wsRef.current = new WebSocket(websocketUrl);

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "update" && message.key === key) {
          // Invalidate cache and refetch
          invalidate();
          refetch();
          setLastSync(new Date());
        }
      } catch (err) {
        console.warn("Failed to parse WebSocket message:", err);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [websocketUrl, enabled, key, invalidate, refetch]);

  // Periodic sync fallback
  useEffect(() => {
    if (!enabled || websocketUrl) return; // Skip if WebSocket is used

    syncIntervalRef.current = setInterval(() => {
      refetch();
      setLastSync(new Date());
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [enabled, websocketUrl, syncInterval, refetch]);

  const forceSync = useCallback(() => {
    refetch();
    setLastSync(new Date());
  }, [refetch]);

  return {
    data,
    isLoading,
    error,
    lastSync,
    forceSync,
  };
}

// Hook for optimized data with prefetching
export function useOptimizedDataWithPrefetch<T>(
  options: UseOptimizedDataOptions<T> & {
    prefetchOnHover?: boolean;
    prefetchOnVisible?: boolean;
  }
) {
  const {
    prefetchOnHover = false,
    prefetchOnVisible = false,
    ...dataOptions
  } = options;

  const dataResult = useOptimizedData(dataOptions);

  const hoverProps = usePrefetchOnHover(dataOptions.fetcher, dataOptions.key, {
    enabled: prefetchOnHover,
  });

  const visibleRef = usePrefetchOnVisible(
    dataOptions.fetcher,
    dataOptions.key,
    { enabled: prefetchOnVisible }
  );

  return {
    ...dataResult,
    hoverProps: prefetchOnHover ? hoverProps : {},
    visibleRef: prefetchOnVisible ? visibleRef : null,
  };
}
