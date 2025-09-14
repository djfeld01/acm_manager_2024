"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PageAction {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean;
}

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: PageAction[];
  className?: string;
  contentClassName?: string;
  showSeparator?: boolean;
}

export default function PageWrapper({
  children,
  title,
  description,
  badge,
  actions = [],
  className,
  contentClassName,
  showSeparator = true,
}: PageWrapperProps) {
  const hasHeader = title || description || badge || actions.length > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {hasHeader && (
        <>
          <div className="space-y-4">
            {(title || badge || actions.length > 0) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {title && (
                    <h1 className="text-2xl font-bold tracking-tight">
                      {title}
                    </h1>
                  )}
                  {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
                </div>

                {actions.length > 0 && (
                  <div className="flex items-center gap-2">
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant}
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {description && (
              <p className="text-muted-foreground max-w-2xl">{description}</p>
            )}
          </div>

          {showSeparator && <Separator />}
        </>
      )}

      <div className={cn("", contentClassName)}>{children}</div>
    </div>
  );
}
