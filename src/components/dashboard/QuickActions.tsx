"use client";

import Link from "next/link";
import { LucideIcon, ArrowRight, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GridLayout } from "@/components/layout";
import { Role } from "@/db/schema/user";
import { filterByRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  roles: Role[];
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  external?: boolean;
  disabled?: boolean;
}

interface QuickActionCardProps {
  action: QuickAction;
  className?: string;
  variant?: "default" | "compact";
}

export function QuickActionCard({
  action,
  className,
  variant = "default",
}: QuickActionCardProps) {
  const {
    label,
    description,
    href,
    onClick,
    icon: Icon,
    badge,
    external,
    disabled,
  } = action;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium leading-none">{label}</h3>
            {description && variant !== "compact" && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
          {external ? (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </>
  );

  const cardClasses = cn(
    "cursor-pointer transition-colors hover:bg-accent/50",
    disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
    className
  );

  if (disabled) {
    return (
      <Card className={cardClasses}>
        <CardContent className="p-4">{content}</CardContent>
      </Card>
    );
  }

  if (href) {
    const LinkComponent = external ? "a" : Link;
    const linkProps = external
      ? { href, target: "_blank", rel: "noopener noreferrer" }
      : { href };

    return (
      <Card className={cardClasses}>
        <LinkComponent {...linkProps} className="block">
          <CardContent className="p-4">{content}</CardContent>
        </LinkComponent>
      </Card>
    );
  }

  return (
    <Card className={cardClasses} onClick={onClick}>
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  );
}

interface QuickActionsGridProps {
  actions: QuickAction[];
  userRole: Role;
  title?: string;
  description?: string;
  className?: string;
  cols?: 1 | 2 | 3;
  colsMd?: 1 | 2 | 3;
  colsLg?: 1 | 2 | 3;
  variant?: "default" | "compact";
  maxActions?: number;
}

export function QuickActionsGrid({
  actions,
  userRole,
  title = "Quick Actions",
  description,
  className,
  cols = 1,
  colsMd = 2,
  colsLg = 3,
  variant = "default",
  maxActions,
}: QuickActionsGridProps) {
  // Filter actions by user role
  const filteredActions = filterByRole(actions, userRole);

  // Limit actions if maxActions is specified
  const displayActions = maxActions
    ? filteredActions.slice(0, maxActions)
    : filteredActions;

  if (displayActions.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">No quick actions available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      <GridLayout cols={cols} colsMd={colsMd} colsLg={colsLg} gap="md">
        {displayActions.map((action) => (
          <QuickActionCard key={action.id} action={action} variant={variant} />
        ))}
      </GridLayout>
    </div>
  );
}

// Specialized quick action components

interface QuickActionsBarProps {
  actions: QuickAction[];
  userRole: Role;
  className?: string;
  maxActions?: number;
}

export function QuickActionsBar({
  actions,
  userRole,
  className,
  maxActions = 4,
}: QuickActionsBarProps) {
  const filteredActions = filterByRole(actions, userRole).slice(0, maxActions);

  if (filteredActions.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filteredActions.map((action) => {
        const { label, href, onClick, icon: Icon, disabled, external } = action;

        if (disabled) {
          return (
            <Button key={action.id} variant="outline" disabled>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          );
        }

        if (href) {
          const LinkComponent = external ? "a" : Link;
          const linkProps = external
            ? { href, target: "_blank", rel: "noopener noreferrer" }
            : { href };

          return (
            <Button key={action.id} variant="outline" asChild>
              <LinkComponent {...linkProps}>
                <Icon className="mr-2 h-4 w-4" />
                {label}
                {external && <ExternalLink className="ml-2 h-3 w-3" />}
              </LinkComponent>
            </Button>
          );
        }

        return (
          <Button key={action.id} variant="outline" onClick={onClick}>
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}

interface FeaturedActionProps {
  action: QuickAction;
  className?: string;
}

export function FeaturedAction({ action, className }: FeaturedActionProps) {
  const {
    label,
    description,
    href,
    onClick,
    icon: Icon,
    badge,
    external,
    disabled,
  } = action;

  const content = (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-base">{label}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
          {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button className="w-full" disabled={disabled}>
          {label}
          {external ? (
            <ExternalLink className="ml-2 h-4 w-4" />
          ) : (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return content;
  }

  if (href) {
    const LinkComponent = external ? "a" : Link;
    const linkProps = external
      ? { href, target: "_blank", rel: "noopener noreferrer" }
      : { href };

    return <LinkComponent {...linkProps}>{content}</LinkComponent>;
  }

  return (
    <div onClick={onClick} className="cursor-pointer">
      {content}
    </div>
  );
}
