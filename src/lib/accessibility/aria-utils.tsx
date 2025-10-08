// ARIA utilities for enhanced accessibility

import React from "react";
import { ARIA_LABELS } from "./constants";

/**
 * Generate unique IDs for ARIA relationships
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create ARIA attributes for form fields
 */
export interface AriaFormFieldProps {
  id: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string[];
  labelledBy?: string[];
}

export function createAriaFormFieldProps({
  id,
  required = false,
  invalid = false,
  describedBy = [],
  labelledBy = [],
}: AriaFormFieldProps) {
  const props: Record<string, any> = {
    id,
    "aria-required": required,
    "aria-invalid": invalid,
  };

  if (describedBy.length > 0) {
    props["aria-describedby"] = describedBy.join(" ");
  }

  if (labelledBy.length > 0) {
    props["aria-labelledby"] = labelledBy.join(" ");
  }

  return props;
}

/**
 * Create ARIA attributes for expandable/collapsible elements
 */
export interface AriaExpandableProps {
  expanded: boolean;
  controls?: string;
  label?: string;
}

export function createAriaExpandableProps({
  expanded,
  controls,
  label,
}: AriaExpandableProps) {
  const props: Record<string, any> = {
    "aria-expanded": expanded,
  };

  if (controls) {
    props["aria-controls"] = controls;
  }

  if (label) {
    props["aria-label"] = label;
  }

  return props;
}

/**
 * Create ARIA attributes for navigation elements
 */
export interface AriaNavigationProps {
  current?: boolean | "page" | "step" | "location" | "date" | "time";
  label?: string;
  level?: number;
}

export function createAriaNavigationProps({
  current,
  label,
  level,
}: AriaNavigationProps) {
  const props: Record<string, any> = {};

  if (current !== undefined) {
    props["aria-current"] = current === true ? "page" : current;
  }

  if (label) {
    props["aria-label"] = label;
  }

  if (level) {
    props["aria-level"] = level;
  }

  return props;
}

/**
 * Create ARIA attributes for interactive elements
 */
export interface AriaInteractiveProps {
  pressed?: boolean;
  selected?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  hasPopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
}

export function createAriaInteractiveProps({
  pressed,
  selected,
  disabled,
  label,
  description,
  hasPopup,
}: AriaInteractiveProps) {
  const props: Record<string, any> = {};

  if (pressed !== undefined) {
    props["aria-pressed"] = pressed;
  }

  if (selected !== undefined) {
    props["aria-selected"] = selected;
  }

  if (disabled !== undefined) {
    props["aria-disabled"] = disabled;
  }

  if (label) {
    props["aria-label"] = label;
  }

  if (description) {
    props["aria-description"] = description;
  }

  if (hasPopup !== undefined) {
    props["aria-haspopup"] = hasPopup === true ? "menu" : hasPopup;
  }

  return props;
}

/**
 * Create ARIA attributes for live regions
 */
export interface AriaLiveRegionProps {
  polite?: boolean;
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all" | "additions text";
  label?: string;
}

export function createAriaLiveRegionProps({
  polite = true,
  atomic = false,
  relevant = "additions text",
  label,
}: AriaLiveRegionProps) {
  const props: Record<string, any> = {
    "aria-live": polite ? "polite" : "assertive",
    "aria-atomic": atomic,
    "aria-relevant": relevant,
  };

  if (label) {
    props["aria-label"] = label;
  }

  return props;
}

/**
 * Create ARIA attributes for data tables
 */
export interface AriaTableProps {
  rowCount?: number;
  columnCount?: number;
  label?: string;
  description?: string;
}

export function createAriaTableProps({
  rowCount,
  columnCount,
  label,
  description,
}: AriaTableProps) {
  const props: Record<string, any> = {
    role: "table",
  };

  if (rowCount !== undefined) {
    props["aria-rowcount"] = rowCount;
  }

  if (columnCount !== undefined) {
    props["aria-colcount"] = columnCount;
  }

  if (label) {
    props["aria-label"] = label;
  }

  if (description) {
    props["aria-describedby"] = description;
  }

  return props;
}

/**
 * Create ARIA attributes for progress indicators
 */
export interface AriaProgressProps {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  valueText?: string;
}

export function createAriaProgressProps({
  value,
  min = 0,
  max = 100,
  label,
  valueText,
}: AriaProgressProps) {
  const props: Record<string, any> = {
    role: "progressbar",
    "aria-valuemin": min,
    "aria-valuemax": max,
  };

  if (value !== undefined) {
    props["aria-valuenow"] = value;
  }

  if (label) {
    props["aria-label"] = label;
  }

  if (valueText) {
    props["aria-valuetext"] = valueText;
  }

  return props;
}

/**
 * Get appropriate ARIA label for common UI elements
 */
export function getAriaLabel(key: keyof typeof ARIA_LABELS): string {
  return ARIA_LABELS[key];
}

/**
 * Create screen reader only text
 */
export function createScreenReaderText(text: string): React.ReactNode {
  return React.createElement("span", { className: "sr-only" }, text);
}

/**
 * Announce text to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
