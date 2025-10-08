"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/lib/mobile/gestures";
import { useDeviceInfo } from "@/lib/mobile/device-detection";
import { RefreshCw, ArrowDown } from "lucide-react";

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false,
  refreshingText = "Refreshing...",
  pullText = "Pull to refresh",
  releaseText = "Release to refresh",
}: PullToRefreshProps) {
  const { isTouchDevice } = useDeviceInfo();

  const { elementRef, isRefreshing, pullDistance, isTriggered } =
    usePullToRefresh<HTMLDivElement>(onRefresh, threshold);

  if (!isTouchDevice || disabled) {
    return <div className={className}>{children}</div>;
  }

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div ref={elementRef} className={cn("relative overflow-hidden", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out",
          "bg-background/95 backdrop-blur border-b",
          pullDistance > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: Math.min(pullDistance, threshold + 20),
          transform: `translateY(${Math.min(
            pullDistance - threshold - 20,
            0
          )}px)`,
        }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{refreshingText}</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="h-4 w-4 transition-transform duration-200"
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              />
              <span>{isTriggered ? releaseText : pullText}</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${
            isRefreshing ? threshold : Math.min(pullDistance, threshold)
          }px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export interface RefreshableListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onRefresh: () => Promise<void>;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  emptyText?: string;
  refreshThreshold?: number;
}

export function RefreshableList<T>({
  items,
  renderItem,
  onRefresh,
  keyExtractor,
  className,
  itemClassName,
  emptyText = "No items found",
  refreshThreshold = 80,
}: RefreshableListProps<T>) {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      threshold={refreshThreshold}
      className={className}
    >
      <div className="space-y-2 p-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          items.map((item, index) => (
            <div key={keyExtractor(item, index)} className={itemClassName}>
              {renderItem(item, index)}
            </div>
          ))
        )}
      </div>
    </PullToRefresh>
  );
}
