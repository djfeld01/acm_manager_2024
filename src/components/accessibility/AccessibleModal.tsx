"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useFocusGuards,
  useFocusRestore,
} from "@/lib/accessibility/focus-management";
import { generateAriaId, getAriaLabel } from "@/lib/accessibility/aria-utils";
import { ScreenReaderOnly } from "@/lib/accessibility/screen-reader";
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";
import { KEYBOARD_KEYS } from "@/lib/accessibility/constants";

export interface AccessibleModalProps {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "destructive" | "warning" | "success" | "info";
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  contentClassName?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export function AccessibleModal({
  children,
  trigger,
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  variant = "default",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  className,
  contentClassName,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: AccessibleModalProps) {
  const titleId = React.useMemo(() => generateAriaId("modal-title"), []);
  const descriptionId = React.useMemo(
    () => generateAriaId("modal-description"),
    []
  );
  const { saveFocus, restoreFocus } = useFocusRestore();
  const { containerRef } = useFocusGuards<HTMLDivElement>(open || false);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4",
  };

  const variantIcons = {
    default: null,
    destructive: AlertTriangle,
    warning: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  const variantColors = {
    default: "",
    destructive: "border-destructive/20 bg-destructive/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    success: "border-green-500/20 bg-green-500/5",
    info: "border-blue-500/20 bg-blue-500/5",
  };

  const VariantIcon = variantIcons[variant];

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      saveFocus();
    } else {
      restoreFocus();
    }
    onOpenChange?.(newOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === KEYBOARD_KEYS.ESCAPE && closeOnEscape) {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        ref={containerRef}
        className={cn(
          sizeClasses[size],
          variantColors[variant],
          contentClassName
        )}
        aria-labelledby={ariaLabelledBy || titleId}
        aria-describedby={
          ariaDescribedBy || (description ? descriptionId : undefined)
        }
        onKeyDown={handleKeyDown}
        onPointerDownOutside={
          closeOnOverlayClick ? undefined : (e) => e.preventDefault()
        }
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle
            id={titleId}
            className={cn(
              "flex items-center gap-2 text-lg font-semibold leading-none tracking-tight",
              variant === "destructive" && "text-destructive",
              variant === "warning" && "text-yellow-600",
              variant === "success" && "text-green-600",
              variant === "info" && "text-blue-600"
            )}
          >
            {VariantIcon && (
              <VariantIcon className="h-5 w-5" aria-hidden="true" />
            )}
            {title}
            <ScreenReaderOnly>
              {variant !== "default" && `, ${variant} dialog`}
            </ScreenReaderOnly>
          </DialogTitle>

          {description && (
            <DialogDescription
              id={descriptionId}
              className="text-sm text-muted-foreground"
            >
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className={cn("py-4", className)}>{children}</div>

        {showCloseButton && (
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label={getAriaLabel("CLOSE_DIALOG")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AccessibleConfirmModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export function AccessibleConfirmModal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
  className,
}: AccessibleConfirmModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onOpenChange?.(false);
    } catch (error) {
      // Error handling should be done by the parent component
      console.error("Confirm action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <AccessibleModal
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      variant={variant}
      size="sm"
      className={className}
    >
      <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading || loading}
          className="w-full sm:w-auto"
        >
          {cancelText}
        </Button>

        <Button
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={handleConfirm}
          disabled={isLoading || loading}
          className="w-full sm:w-auto"
        >
          {(isLoading || loading) && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {confirmText}
        </Button>
      </DialogFooter>

      {/* Screen reader loading announcement */}
      {(isLoading || loading) && (
        <ScreenReaderOnly>
          <div aria-live="polite">Processing request...</div>
        </ScreenReaderOnly>
      )}
    </AccessibleModal>
  );
}

interface AccessibleAlertModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  variant?: "info" | "warning" | "success" | "destructive";
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function AccessibleAlertModal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  variant = "info",
  actionText = "OK",
  onAction,
  className,
}: AccessibleAlertModalProps) {
  const handleAction = () => {
    onAction?.();
    onOpenChange?.(false);
  };

  return (
    <AccessibleModal
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      variant={variant}
      size="sm"
      className={className}
    >
      <DialogFooter>
        <Button
          onClick={handleAction}
          variant={variant === "destructive" ? "destructive" : "default"}
          className="w-full"
          autoFocus
        >
          {actionText}
        </Button>
      </DialogFooter>
    </AccessibleModal>
  );
}
