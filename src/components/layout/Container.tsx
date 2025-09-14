"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ContainerSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "full";

interface ContainerProps {
  children: ReactNode;
  size?: ContainerSize;
  className?: string;
  centered?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "px-2 py-2",
  md: "px-4 py-4",
  lg: "px-6 py-6",
  xl: "px-8 py-8",
};

export default function Container({
  children,
  size = "full",
  className,
  centered = true,
  padding = "md",
}: ContainerProps) {
  return (
    <div
      className={cn(
        "w-full",
        sizeClasses[size],
        centered && "mx-auto",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
