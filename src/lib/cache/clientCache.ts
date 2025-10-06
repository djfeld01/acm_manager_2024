"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Cache entry interface
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  stale: boolean;
}

// Cache configuration
export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  staleTime?: number; // Time before data becomes stale
  maxSize?: number; // Maximum number of entries
  persist?: boolean; // Whether to persist to localStorage
  keyPrefix?: string; // Prefix for localStorage keys
}

// Default cache configuration
const DEFAULT_CONFIG: Required<CacheConfig> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleTime: 30 * 1000, // 30 seconds
  maxSize: 100,
  persist: false,
  keyPrefix: "cache:",
};

// In-memory cache implementation
class ClientCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: Required<CacheConfig>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();

    if (this.config.persist && typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  // Get data from cache
  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromStorage(key);
      return null;
    }

    // Mark as stale if needed
    if (now > entry.timestamp + this.config.staleTime) {
      entry.stale = true;
    }

    return entry as CacheEntry<T>;
  }

  // Set data in cache
  set<T>(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl ?? this.config.ttl;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      stale: false,
    };

    // Enforce max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);

    if (this.config.persist) {
      this.saveToStorage(key, entry);
    }
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Delete entry from cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted && this.config.persist) {
      this.removeFromStorage(key);
    }
    return deleted;
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
    if (this.config.persist && typeof window !== "undefined") {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.config.keyPrefix)
      );
      keys.forEach((key) => localStorage.removeItem(key));
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let staleCount = 0;
    let expiredCount = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      } else if (entry.stale) {
        staleCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      staleCount,
      expiredCount,
      hitRate: this.getHitRate(),
    };
  }

  // Invalidate entries matching pattern
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  // Private methods
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.delete(key));
  }

  private saveToStorage<T>(key: string, entry: CacheEntry<T>): void {
    if (typeof window === "undefined") return;

    try {
      const storageKey = this.config.keyPrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  private removeFromStorage(key: string): void {
    if (typeof window === "undefined") return;

    try {
      const storageKey = this.config.keyPrefix + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.config.keyPrefix)
      );

      for (const storageKey of keys) {
        const key = storageKey.replace(this.config.keyPrefix, "");
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const entry = JSON.parse(stored);
          const now = Date.now();

          // Only load if not expired
          if (now <= entry.expiresAt) {
            this.cache.set(key, entry);
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
    }
  }

  private hitRate = 0;
  private hits = 0;
  private misses = 0;

  private getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  // Destroy cache and cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instances
const globalCache = new ClientCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  staleTime: 30 * 1000, // 30 seconds
  maxSize: 100,
  persist: true,
  keyPrefix: "app-cache:",
});

const queryCache = new ClientCache({
  ttl: 2 * 60 * 1000, // 2 minutes
  staleTime: 15 * 1000, // 15 seconds
  maxSize: 50,
  persist: false,
  keyPrefix: "query-cache:",
});

// Hook for using cache
export interface UseCacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  staleTime?: number;
  enabled?: boolean;
  cache?: ClientCache;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseCacheReturn<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

export function useCache<T>({
  key,
  fetcher,
  ttl,
  staleTime,
  enabled = true,
  cache = globalCache,
  onSuccess,
  onError,
}: UseCacheOptions<T>): UseCacheReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);

  // Update fetcher ref
  fetcherRef.current = fetcher;

  const fetchData = useCallback(
    async (force = false) => {
      if (!enabled) return;

      // Check cache first
      const cached = cache.get<T>(key);
      if (cached && !force) {
        setData(cached.data);
        setIsStale(cached.stale);
        setError(null);

        // If stale, fetch in background
        if (cached.stale) {
          fetchData(true);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetcherRef.current();
        cache.set(key, result, ttl);
        setData(result);
        setIsStale(false);
        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Fetch failed");
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [key, enabled, cache, ttl, onSuccess, onError]
  );

  const invalidate = useCallback(() => {
    cache.delete(key);
    setData(null);
    setIsStale(false);
  }, [key, cache]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    isStale,
    error,
    refetch: () => fetchData(true),
    invalidate,
  };
}

// Prefetch utility
export function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; cache?: ClientCache } = {}
): Promise<void> {
  const { ttl, cache = globalCache } = options;

  // Don't prefetch if already cached and not stale
  const cached = cache.get<T>(key);
  if (cached && !cached.stale) {
    return Promise.resolve();
  }

  return fetcher().then((data) => {
    cache.set(key, data, ttl);
  });
}

// Cache invalidation utilities
export const cacheUtils = {
  // Invalidate all cache entries
  invalidateAll: () => {
    globalCache.clear();
    queryCache.clear();
  },

  // Invalidate by pattern
  invalidatePattern: (pattern: RegExp) => {
    globalCache.invalidatePattern(pattern);
    queryCache.invalidatePattern(pattern);
  },

  // Invalidate by key prefix
  invalidatePrefix: (prefix: string) => {
    const pattern = new RegExp(`^${prefix}`);
    return cacheUtils.invalidatePattern(pattern);
  },

  // Get cache statistics
  getStats: () => ({
    global: globalCache.getStats(),
    query: queryCache.getStats(),
  }),

  // Prefetch multiple items
  prefetchAll: async <T>(
    items: Array<{ key: string; fetcher: () => Promise<T> }>,
    options?: { ttl?: number; cache?: ClientCache }
  ) => {
    await Promise.allSettled(
      items.map((item) => prefetch(item.key, item.fetcher, options))
    );
  },
};

export { globalCache, queryCache };
