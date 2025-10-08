"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSwipeGesture, SwipeGesture } from "@/lib/mobile/gestures";
import { useSlideAnimation } from "@/lib/mobile/animations";
import { hapticFeedback } from "@/lib/mobile/touch";
import { useDeviceInfo } from "@/lib/mobile/device-detection";

export interface SwipeAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color: "primary" | "secondary" | "destructive" | "success" | "warning";
  action: () => void;
}

export interface SwipeableCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  swipeThreshold?: number;
  onSwipe?: (direction: "left" | "right", actions: SwipeAction[]) => void;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  className,
  leftActions = [],
  rightActions = [],
  swipeThreshold = 80,
  onSwipe,
  disabled = false,
  ...props
}: SwipeableCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedSide, setRevealedSide] = useState<"left" | "right" | null>(
    null
  );
  const { isTouchDevice } = useDeviceInfo();
  const { elementRef: slideRef } = useSlideAnimation();

  const handleSwipe = (gesture: SwipeGesture) => {
    if (disabled || !isTouchDevice) return;

    const { direction, distance } = gesture;

    if (
      (direction === "left" && rightActions.length > 0) ||
      (direction === "right" && leftActions.length > 0)
    ) {
      if (distance >= swipeThreshold) {
        hapticFeedback("medium");
        setIsRevealed(true);
        setRevealedSide(direction === "left" ? "right" : "left");
        setSwipeOffset(direction === "left" ? -120 : 120);

        const actions = direction === "left" ? rightActions : leftActions;
        onSwipe?.(direction, actions);
      }
    }
  };

  const swipeRef = useSwipeGesture<HTMLDivElement>(handleSwipe, {
    swipeThreshold: 30,
    swipeVelocityThreshold: 0.2,
    preventScroll: false,
  });

  const resetSwipe = () => {
    setSwipeOffset(0);
    setIsRevealed(false);
    setRevealedSide(null);
  };

  const executeAction = (action: SwipeAction) => {
    hapticFeedback("light");
    action.action();
    resetSwipe();
  };

  const getActionColor = (color: SwipeAction["color"]) => {
    const colors = {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      success: "bg-green-500 text-white",
      warning: "bg-yellow-500 text-white",
    };
    return colors[color];
  };

  if (!isTouchDevice) {
    return (
      <Card className={className} {...props}>
        {children}
      </Card>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 h-full flex">
          {leftActions.map((action, index) => (
            <button
              key={action.id}
              className={cn(
                "flex items-center justify-center px-4 min-w-[80px] transition-all duration-200",
                getActionColor(action.color),
                isRevealed && revealedSide === "left"
                  ? "opacity-100"
                  : "opacity-0"
              )}
              onClick={() => executeAction(action)}
              style={{
                transform: `translateX(${Math.max(0, swipeOffset - 120)}px)`,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 h-full flex">
          {rightActions.map((action, index) => (
            <button
              key={action.id}
              className={cn(
                "flex items-center justify-center px-4 min-w-[80px] transition-all duration-200",
                getActionColor(action.color),
                isRevealed && revealedSide === "right"
                  ? "opacity-100"
                  : "opacity-0"
              )}
              onClick={() => executeAction(action)}
              style={{
                transform: `translateX(${Math.min(0, swipeOffset + 120)}px)`,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main Card */}
      <Card
        ref={swipeRef}
        className={cn(
          "transition-transform duration-200 ease-out",
          "touch-pan-y", // Allow vertical scrolling
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
        onClick={isRevealed ? resetSwipe : undefined}
        {...props}
      >
        {children}
      </Card>

      {/* Overlay for closing */}
      {isRevealed && (
        <div
          className="absolute inset-0 bg-transparent z-10"
          onClick={resetSwipe}
        />
      )}
    </div>
  );
}

export interface SwipeableListProps {
  items: Array<{
    id: string;
    content: React.ReactNode;
    leftActions?: SwipeAction[];
    rightActions?: SwipeAction[];
  }>;
  className?: string;
  itemClassName?: string;
  onSwipe?: (
    itemId: string,
    direction: "left" | "right",
    actions: SwipeAction[]
  ) => void;
}

export function SwipeableList({
  items,
  className,
  itemClassName,
  onSwipe,
}: SwipeableListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <SwipeableCard
          key={item.id}
          className={itemClassName}
          leftActions={item.leftActions}
          rightActions={item.rightActions}
          onSwipe={(direction, actions) =>
            onSwipe?.(item.id, direction, actions)
          }
        >
          {item.content}
        </SwipeableCard>
      ))}
    </div>
  );
}
