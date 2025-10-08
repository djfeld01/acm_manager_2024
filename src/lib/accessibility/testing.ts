// Accessibility testing utilities

import { FOCUS_SELECTORS, CONTRAST_RATIOS } from "./constants";

/**
 * Check if an element meets accessibility requirements
 */
export interface AccessibilityCheckResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

export function checkElementAccessibility(
  element: HTMLElement
): AccessibilityCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check for missing alt text on images
  if (element.tagName === "IMG") {
    const img = element as HTMLImageElement;
    if (
      !img.alt &&
      !img.getAttribute("aria-label") &&
      img.getAttribute("aria-hidden") !== "true"
    ) {
      issues.push("Image missing alt text or aria-label");
    }
  }

  // Check for missing labels on form controls
  if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) {
    const input = element as HTMLInputElement;
    const hasLabel =
      document.querySelector(`label[for="${input.id}"]`) !== null;
    const hasAriaLabel = input.getAttribute("aria-label") !== null;
    const hasAriaLabelledBy = input.getAttribute("aria-labelledby") !== null;

    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push("Form control missing accessible label");
    }
  }

  // Check for missing focus indicators
  const computedStyle = window.getComputedStyle(element);
  if (element.matches(FOCUS_SELECTORS.INTERACTIVE_ELEMENTS)) {
    // This is a basic check - in practice, you'd need to simulate focus
    if (
      computedStyle.outline === "none" &&
      !computedStyle.boxShadow.includes("inset")
    ) {
      warnings.push("Interactive element may be missing focus indicator");
    }
  }

  // Check for sufficient color contrast (basic check)
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;
  if (backgroundColor !== "rgba(0, 0, 0, 0)" && color !== "rgba(0, 0, 0, 0)") {
    // This is a simplified check - real contrast checking requires color parsing
    warnings.push("Color contrast should be verified manually");
  }

  // Check for minimum touch target size on mobile
  const rect = element.getBoundingClientRect();
  if (element.matches(FOCUS_SELECTORS.INTERACTIVE_ELEMENTS)) {
    if (rect.width < 44 || rect.height < 44) {
      warnings.push(
        "Interactive element may be too small for touch (minimum 44x44px recommended)"
      );
    }
  }

  // Check for proper heading hierarchy
  if (element.tagName.match(/^H[1-6]$/)) {
    const headingLevel = parseInt(element.tagName.charAt(1));
    const previousHeadings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).filter(
      (h) =>
        h.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING
    );

    if (previousHeadings.length > 0) {
      const lastHeading = previousHeadings[previousHeadings.length - 1];
      const lastLevel = parseInt(lastHeading.tagName.charAt(1));

      if (headingLevel > lastLevel + 1) {
        warnings.push(
          `Heading level ${headingLevel} skips levels (previous was ${lastLevel})`
        );
      }
    } else if (headingLevel !== 1) {
      warnings.push("First heading should be h1");
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Check accessibility of an entire page or container
 */
export function checkPageAccessibility(
  container: HTMLElement = document.body
): AccessibilityCheckResult {
  const allIssues: string[] = [];
  const allWarnings: string[] = [];

  // Check all elements
  const elements = container.querySelectorAll("*");
  elements.forEach((element) => {
    const result = checkElementAccessibility(element as HTMLElement);
    allIssues.push(...result.issues);
    allWarnings.push(...result.warnings);
  });

  // Check for page-level issues

  // Check for missing page title
  if (!document.title || document.title.trim() === "") {
    allIssues.push("Page missing title");
  }

  // Check for missing main landmark
  if (!container.querySelector('main, [role="main"]')) {
    allIssues.push("Page missing main landmark");
  }

  // Check for missing skip links
  if (!document.querySelector('a[href^="#"]')) {
    allWarnings.push("Page may benefit from skip links");
  }

  // Check for proper document language
  if (!document.documentElement.lang) {
    allIssues.push("Document missing lang attribute");
  }

  // Remove duplicates
  const uniqueIssues = [...new Set(allIssues)];
  const uniqueWarnings = [...new Set(allWarnings)];

  return {
    passed: uniqueIssues.length === 0,
    issues: uniqueIssues,
    warnings: uniqueWarnings,
  };
}

/**
 * Test keyboard navigation
 */
export function testKeyboardNavigation(
  container: HTMLElement = document.body
): AccessibilityCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  const focusableElements = Array.from(
    container.querySelectorAll(FOCUS_SELECTORS.FOCUSABLE_ELEMENTS)
  ) as HTMLElement[];

  if (focusableElements.length === 0) {
    warnings.push("No focusable elements found");
    return { passed: true, issues, warnings };
  }

  // Check if elements can receive focus
  focusableElements.forEach((element, index) => {
    try {
      element.focus();
      if (document.activeElement !== element) {
        issues.push(
          `Element at index ${index} (${element.tagName}) cannot receive focus`
        );
      }
    } catch (error) {
      issues.push(`Error focusing element at index ${index}: ${error}`);
    }
  });

  // Check for focus traps in modals/dialogs
  const modals = container.querySelectorAll(
    '[role="dialog"], [role="alertdialog"]'
  );
  modals.forEach((modal) => {
    const modalFocusable = Array.from(
      modal.querySelectorAll(FOCUS_SELECTORS.FOCUSABLE_ELEMENTS)
    ) as HTMLElement[];

    if (modalFocusable.length === 0) {
      warnings.push("Modal/dialog contains no focusable elements");
    }
  });

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Test screen reader compatibility
 */
export function testScreenReaderCompatibility(
  container: HTMLElement = document.body
): AccessibilityCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check for proper ARIA usage
  const elementsWithAria = container.querySelectorAll(
    "[aria-label], [aria-labelledby], [aria-describedby], [role]"
  );

  elementsWithAria.forEach((element) => {
    const ariaLabelledBy = element.getAttribute("aria-labelledby");
    if (ariaLabelledBy) {
      const referencedIds = ariaLabelledBy.split(" ");
      referencedIds.forEach((id) => {
        if (!document.getElementById(id)) {
          issues.push(`aria-labelledby references non-existent ID: ${id}`);
        }
      });
    }

    const ariaDescribedBy = element.getAttribute("aria-describedby");
    if (ariaDescribedBy) {
      const referencedIds = ariaDescribedBy.split(" ");
      referencedIds.forEach((id) => {
        if (!document.getElementById(id)) {
          issues.push(`aria-describedby references non-existent ID: ${id}`);
        }
      });
    }
  });

  // Check for live regions
  const liveRegions = container.querySelectorAll("[aria-live]");
  if (liveRegions.length === 0) {
    warnings.push(
      "No live regions found - consider adding for dynamic content updates"
    );
  }

  // Check for proper table structure
  const tables = container.querySelectorAll("table");
  tables.forEach((table) => {
    const headers = table.querySelectorAll("th");
    const cells = table.querySelectorAll("td");

    if (headers.length === 0 && cells.length > 0) {
      issues.push("Table missing header cells (th elements)");
    }

    if (
      !table.querySelector("caption") &&
      !table.getAttribute("aria-label") &&
      !table.getAttribute("aria-labelledby")
    ) {
      warnings.push("Table missing caption or accessible name");
    }
  });

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Generate accessibility report
 */
export interface AccessibilityReport {
  overall: AccessibilityCheckResult;
  keyboard: AccessibilityCheckResult;
  screenReader: AccessibilityCheckResult;
  summary: {
    totalIssues: number;
    totalWarnings: number;
    passed: boolean;
  };
}

export function generateAccessibilityReport(
  container: HTMLElement = document.body
): AccessibilityReport {
  const overall = checkPageAccessibility(container);
  const keyboard = testKeyboardNavigation(container);
  const screenReader = testScreenReaderCompatibility(container);

  const totalIssues =
    overall.issues.length + keyboard.issues.length + screenReader.issues.length;
  const totalWarnings =
    overall.warnings.length +
    keyboard.warnings.length +
    screenReader.warnings.length;

  return {
    overall,
    keyboard,
    screenReader,
    summary: {
      totalIssues,
      totalWarnings,
      passed: totalIssues === 0,
    },
  };
}

/**
 * Log accessibility report to console
 */
export function logAccessibilityReport(
  container: HTMLElement = document.body
): void {
  const report = generateAccessibilityReport(container);

  console.group("🔍 Accessibility Report");

  if (report.summary.passed) {
    console.log("✅ No accessibility issues found!");
  } else {
    console.log(
      `❌ Found ${report.summary.totalIssues} issues and ${report.summary.totalWarnings} warnings`
    );
  }

  if (report.overall.issues.length > 0) {
    console.group("🚨 Overall Issues");
    report.overall.issues.forEach((issue) => console.error(issue));
    console.groupEnd();
  }

  if (report.keyboard.issues.length > 0) {
    console.group("⌨️ Keyboard Navigation Issues");
    report.keyboard.issues.forEach((issue) => console.error(issue));
    console.groupEnd();
  }

  if (report.screenReader.issues.length > 0) {
    console.group("🔊 Screen Reader Issues");
    report.screenReader.issues.forEach((issue) => console.error(issue));
    console.groupEnd();
  }

  if (
    report.overall.warnings.length > 0 ||
    report.keyboard.warnings.length > 0 ||
    report.screenReader.warnings.length > 0
  ) {
    console.group("⚠️ Warnings");
    [
      ...report.overall.warnings,
      ...report.keyboard.warnings,
      ...report.screenReader.warnings,
    ].forEach((warning) => console.warn(warning));
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Hook for running accessibility tests in development
 */
export function useAccessibilityTesting(
  enabled: boolean = process.env.NODE_ENV === "development"
) {
  React.useEffect(() => {
    if (!enabled) return;

    const runTests = () => {
      setTimeout(() => {
        logAccessibilityReport();
      }, 1000); // Wait for page to fully render
    };

    // Run tests on mount and when DOM changes
    runTests();

    const observer = new MutationObserver(() => {
      runTests();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [enabled]);
}

// Import React for the hook
import React from "react";
