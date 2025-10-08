// Mobile performance optimization utilities

import { useEffect, useRef, useCallback, useState } from "react";

export interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number;
  loadTime: number;
  renderTime: number;
  interactionDelay: number;
}

export interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  placeholder?: string;
}

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number;
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    loadTime: 0,
    renderTime: 0,
    interactionDelay: 0,
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationFrame = useRef<number>();

  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;

    if (now - lastTime.current >= 1000) {
      const fps = Math.round(
        (frameCount.current * 1000) / (now - lastTime.current)
      );
      setMetrics((prev) => ({ ...prev, fps }));
      frameCount.current = 0;
      lastTime.current = now;
    }

    animationFrame.current = requestAnimationFrame(measureFPS);
  }, []);

  const measureMemory = useCallback(() => {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      setMetrics((prev) => ({ ...prev, memoryUsage }));
    }
  }, []);

  const measureLoadTime = useCallback(() => {
    if ("navigation" in performance) {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      setMetrics((prev) => ({ ...prev, loadTime }));
    }
  }, []);

  const measureRenderTime = useCallback(() => {
    const paintEntries = performance.getEntriesByType("paint");
    const firstContentfulPaint = paintEntries.find(
      (entry) => entry.name === "first-contentful-paint"
    );

    if (firstContentfulPaint) {
      setMetrics((prev) => ({
        ...prev,
        renderTime: firstContentfulPaint.startTime,
      }));
    }
  }, []);

  useEffect(() => {
    measureFPS();
    measureMemory();
    measureLoadTime();
    measureRenderTime();

    const memoryInterval = setInterval(measureMemory, 5000);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      clearInterval(memoryInterval);
    };
  }, [measureFPS, measureMemory, measureLoadTime, measureRenderTime]);

  return metrics;
}

/**
 * Hook for lazy loading images and components
 */
export function useLazyLoad<T extends HTMLElement>(
  options: LazyLoadOptions = {}
) {
  const elementRef = useRef<T>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver>();

  const { threshold = 0.1, rootMargin = "50px", triggerOnce = true } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);

          if (triggerOnce) {
            observerRef.current?.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  const load = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return {
    elementRef,
    isLoaded,
    isInView,
    load,
  };
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScroll<T extends HTMLElement>(
  items: any[],
  options: VirtualScrollOptions
) {
  const containerRef = useRef<T>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    options.containerHeight
  );

  const { itemHeight, overscan = 5, threshold = 100 } = options;

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items
    .slice(startIndex, endIndex + 1)
    .map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: "absolute" as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: "100%",
      },
    }));

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    resizeObserver.observe(container);
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    scrollTop,
  };
}

/**
 * Hook for debounced values (performance optimization)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callbacks
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Hook for image optimization
 */
export function useOptimizedImage(
  src: string,
  options: {
    quality?: number;
    format?: "webp" | "avif" | "jpeg" | "png";
    sizes?: string;
    lazy?: boolean;
  } = {}
) {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { quality = 80, format = "webp", lazy = true } = options;

  useEffect(() => {
    const optimizeImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if browser supports the format
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          setOptimizedSrc(src);
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const optimized = canvas.toDataURL(`image/${format}`, quality / 100);
        setOptimizedSrc(optimized);
      } catch (err) {
        setError("Failed to optimize image");
        setOptimizedSrc(src);
      } finally {
        setIsLoading(false);
      }
    };

    if (!lazy) {
      optimizeImage();
    } else {
      setOptimizedSrc(src);
      setIsLoading(false);
    }
  }, [src, quality, format, lazy]);

  return { optimizedSrc, isLoading, error };
}

/**
 * Hook for resource preloading
 */
export function usePreload(
  resources: Array<{ href: string; as: string; type?: string }>
) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    resources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = resource.href;
      link.as = resource.as;

      if (resource.type) {
        link.type = resource.type;
      }

      document.head.appendChild(link);
      links.push(link);
    });

    return () => {
      links.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [resources]);
}

/**
 * Hook for critical resource loading
 */
export function useCriticalResources(resources: string[]) {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(
    new Set()
  );
  const [isAllLoaded, setIsAllLoaded] = useState(false);

  useEffect(() => {
    const loadResource = async (url: string) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          setLoadedResources((prev) => new Set([...prev, url]));
        }
      } catch (error) {
        console.error(`Failed to load critical resource: ${url}`, error);
      }
    };

    resources.forEach(loadResource);
  }, [resources]);

  useEffect(() => {
    setIsAllLoaded(loadedResources.size === resources.length);
  }, [loadedResources.size, resources.length]);

  return { loadedResources, isAllLoaded };
}

/**
 * Utility to optimize bundle size
 */
export function dynamicImport<T>(importFn: () => Promise<T>): Promise<T> {
  return importFn().catch((error) => {
    console.error("Dynamic import failed:", error);
    throw error;
  });
}

/**
 * Utility to measure component render time
 */
export function measureRenderTime(componentName: string) {
  return function <T extends React.ComponentType<any>>(Component: T): T {
    const MeasuredComponent = (props: any) => {
      useEffect(() => {
        const startTime = performance.now();

        return () => {
          const endTime = performance.now();
          console.log(`${componentName} render time: ${endTime - startTime}ms`);
        };
      });

      return React.createElement(Component, props);
    };

    MeasuredComponent.displayName = `Measured(${componentName})`;
    return MeasuredComponent as T;
  };
}

// Import React for the HOC
import React from "react";
