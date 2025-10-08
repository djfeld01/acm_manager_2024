"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  usePageTransition,
  useSlideAnimation,
  useFadeAnimation,
  useScaleAnimation,
  useStaggeredAnimation,
  useScrollAnimation,
} from "@/lib/mobile/animations";

export interface PageTransitionProps {
  children: React.ReactNode;
  direction?: "enter" | "exit";
  className?: string;
  duration?: number;
}

export function PageTransition({
  children,
  direction = "enter",
  className,
  duration = 300,
}: PageTransitionProps) {
  const { elementRef, animate, isAnimating } = usePageTransition(direction);

  React.useEffect(() => {
    animate({ duration });
  }, [animate, duration]);

  return (
    <div
      ref={elementRef}
      className={cn("w-full", isAnimating && "pointer-events-none", className)}
    >
      {children}
    </div>
  );
}

export interface SlideInProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  trigger?: boolean;
  className?: string;
  duration?: number;
  delay?: number;
}

export function SlideIn({
  children,
  direction = "up",
  trigger = true,
  className,
  duration = 300,
  delay = 0,
}: SlideInProps) {
  const { elementRef, slideIn, isVisible } =
    useSlideAnimation<HTMLDivElement>(direction);

  React.useEffect(() => {
    if (trigger) {
      slideIn({ duration, delay });
    }
  }, [trigger, slideIn, duration, delay]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface FadeInProps {
  children: React.ReactNode;
  trigger?: boolean;
  className?: string;
  duration?: number;
  delay?: number;
}

export function FadeIn({
  children,
  trigger = true,
  className,
  duration = 300,
  delay = 0,
}: FadeInProps) {
  const { elementRef, fadeIn, isVisible } = useFadeAnimation<HTMLDivElement>();

  React.useEffect(() => {
    if (trigger) {
      fadeIn({ duration, delay });
    }
  }, [trigger, fadeIn, duration, delay]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface ScaleInProps {
  children: React.ReactNode;
  trigger?: boolean;
  className?: string;
  duration?: number;
  delay?: number;
}

export function ScaleIn({
  children,
  trigger = true,
  className,
  duration = 300,
  delay = 0,
}: ScaleInProps) {
  const { elementRef, scaleIn, isVisible } =
    useScaleAnimation<HTMLDivElement>();

  React.useEffect(() => {
    if (trigger) {
      scaleIn({ duration, delay });
    }
  }, [trigger, scaleIn, duration, delay]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "transition-all duration-300",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface StaggeredListProps {
  children: React.ReactNode;
  itemSelector?: string;
  staggerDelay?: number;
  animationType?: "fade" | "slide";
  slideDirection?: "up" | "down" | "left" | "right";
  trigger?: boolean;
  className?: string;
  duration?: number;
}

export function StaggeredList({
  children,
  itemSelector = ".stagger-item",
  staggerDelay = 100,
  animationType = "fade",
  slideDirection = "up",
  trigger = true,
  className,
  duration = 300,
}: StaggeredListProps) {
  const { containerRef, fadeInStagger, slideInStagger } =
    useStaggeredAnimation<HTMLDivElement>(itemSelector, staggerDelay);

  React.useEffect(() => {
    if (trigger) {
      if (animationType === "fade") {
        fadeInStagger({ duration });
      } else {
        slideInStagger(slideDirection, { duration });
      }
    }
  }, [
    trigger,
    animationType,
    slideDirection,
    fadeInStagger,
    slideInStagger,
    duration,
  ]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export interface ScrollRevealProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  animationType?: "fade" | "slide" | "scale";
  slideDirection?: "up" | "down" | "left" | "right";
  className?: string;
  duration?: number;
}

export function ScrollReveal({
  children,
  threshold = 0.1,
  rootMargin = "0px",
  animationType = "fade",
  slideDirection = "up",
  className,
  duration = 600,
}: ScrollRevealProps) {
  const { elementRef, isVisible } = useScrollAnimation<HTMLDivElement>(
    threshold,
    rootMargin
  );

  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-600 ease-out";

    if (!isVisible) {
      switch (animationType) {
        case "slide":
          const slideClasses = {
            up: "translate-y-8 opacity-0",
            down: "translate-y-[-2rem] opacity-0",
            left: "translate-x-8 opacity-0",
            right: "translate-x-[-2rem] opacity-0",
          };
          return `${baseClasses} ${slideClasses[slideDirection]}`;
        case "scale":
          return `${baseClasses} scale-95 opacity-0`;
        default:
          return `${baseClasses} opacity-0`;
      }
    }

    return `${baseClasses} translate-y-0 translate-x-0 scale-100 opacity-100`;
  };

  return (
    <div
      ref={elementRef}
      className={cn(getAnimationClasses(), className)}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

export interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  intensity?: "light" | "medium" | "strong";
}

export function Pulse({
  children,
  active = true,
  className,
  intensity = "medium",
}: PulseProps) {
  const intensityClasses = {
    light: "animate-pulse opacity-75",
    medium: "animate-pulse opacity-60",
    strong: "animate-pulse opacity-50",
  };

  return (
    <div className={cn(active && intensityClasses[intensity], className)}>
      {children}
    </div>
  );
}

export interface BounceProps {
  children: React.ReactNode;
  trigger?: boolean;
  className?: string;
  duration?: number;
}

export function Bounce({
  children,
  trigger = false,
  className,
  duration = 1000,
}: BounceProps) {
  return (
    <div
      className={cn(
        "transition-transform",
        trigger && "animate-bounce",
        className
      )}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

export interface ShakeProps {
  children: React.ReactNode;
  trigger?: boolean;
  className?: string;
  intensity?: "light" | "medium" | "strong";
}

export function Shake({
  children,
  trigger = false,
  className,
  intensity = "medium",
}: ShakeProps) {
  const shakeClasses = {
    light: "animate-pulse",
    medium: "animate-bounce",
    strong: "animate-ping",
  };

  return (
    <div
      className={cn(
        "transition-transform",
        trigger && shakeClasses[intensity],
        className
      )}
    >
      {children}
    </div>
  );
}

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

export interface ProgressBarProps {
  progress: number;
  className?: string;
  animated?: boolean;
  color?: "primary" | "secondary" | "success" | "warning" | "destructive";
}

export function ProgressBar({
  progress,
  className,
  animated = true,
  color = "primary",
}: ProgressBarProps) {
  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-destructive",
  };

  return (
    <div className={cn("w-full bg-muted rounded-full h-2", className)}>
      <div
        className={cn(
          "h-2 rounded-full transition-all duration-300 ease-out",
          colorClasses[color],
          animated && "animate-pulse"
        )}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
