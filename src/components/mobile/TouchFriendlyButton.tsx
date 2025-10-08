"use client";

import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTouchEnhancement, hapticFeedback } from "@/lib/mobile/touch";
import { useDeviceInfo } from "@/lib/mobile/device-detection";

export interface TouchFriendlyButtonProps extends ButtonProps {
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  minTouchTarget?: number;
  touchPadding?: number;
}

export const TouchFriendlyButton = React.forwardRef<
  HTMLButtonElement,
  TouchFriendlyButtonProps
>(
  (
    {
      children,
      className,
      onClick,
      hapticFeedback: enableHaptic = true,
      rippleEffect = true,
      minTouchTarget = 44,
      touchPadding = 8,
      ...props
    },
    ref
  ) => {
    const { isTouchDevice } = useDeviceInfo();

    const touchRef = useTouchEnhancement<HTMLButtonElement>({
      minSize: minTouchTarget,
      padding: touchPadding,
      ripple: rippleEffect && isTouchDevice,
      feedback: {
        haptic: enableHaptic && isTouchDevice,
        visual: rippleEffect,
        audio: false,
      },
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableHaptic && isTouchDevice) {
        hapticFeedback("light");
      }
      onClick?.(e);
    };

    // Use external ref if provided, otherwise use touch ref
    const buttonRef = ref || touchRef;

    return (
      <Button
        ref={buttonRef}
        className={cn(
          // Ensure minimum touch target size
          isTouchDevice &&
            `min-h-[${minTouchTarget}px] min-w-[${minTouchTarget}px]`,
          // Touch-friendly styles
          isTouchDevice && "touch-manipulation select-none",
          // Enhanced focus styles for touch
          "focus:ring-2 focus:ring-offset-2 focus:ring-primary",
          // Prevent text selection on touch
          "user-select-none",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TouchFriendlyButton.displayName = "TouchFriendlyButton";

export interface FloatingActionButtonProps extends TouchFriendlyButtonProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  offset?: number;
}

export function FloatingActionButton({
  children,
  className,
  position = "bottom-right",
  offset = 16,
  ...props
}: FloatingActionButtonProps) {
  const positionClasses = {
    "bottom-right": `fixed bottom-${offset} right-${offset}`,
    "bottom-left": `fixed bottom-${offset} left-${offset}`,
    "top-right": `fixed top-${offset} right-${offset}`,
    "top-left": `fixed top-${offset} left-${offset}`,
  };

  return (
    <TouchFriendlyButton
      className={cn(
        "rounded-full shadow-lg z-50",
        "h-14 w-14 p-0",
        positionClasses[position],
        className
      )}
      {...props}
    >
      {children}
    </TouchFriendlyButton>
  );
}
