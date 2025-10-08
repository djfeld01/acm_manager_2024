// Mobile-specific testing utilities

import { DeviceInfo } from "./device-detection";

export interface MobileTouchTest {
  element: HTMLElement;
  minSize: number;
  actualSize: { width: number; height: number };
  passed: boolean;
  issues: string[];
}

export interface MobileGestureTest {
  element: HTMLElement;
  gestures: string[];
  supported: boolean;
  issues: string[];
}

export interface MobilePerformanceTest {
  fps: number;
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  passed: boolean;
  issues: string[];
}

export interface MobileAccessibilityTest {
  touchTargets: MobileTouchTest[];
  gestures: MobileGestureTest[];
  performance: MobilePerformanceTest;
  overall: {
    passed: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

/**
 * Test touch target sizes for mobile accessibility
 */
export function testTouchTargets(
  container: HTMLElement = document.body
): MobileTouchTest[] {
  const interactiveElements = Array.from(
    container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex="0"]'
    )
  ) as HTMLElement[];

  const minTouchSize = 44; // WCAG recommended minimum
  const results: MobileTouchTest[] = [];

  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    // Include padding in size calculation
    const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
    const paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0;
    const paddingRight = parseInt(computedStyle.paddingRight, 10) || 0;

    const actualWidth = rect.width + paddingLeft + paddingRight;
    const actualHeight = rect.height + paddingTop + paddingBottom;

    const issues: string[] = [];

    if (actualWidth < minTouchSize) {
      issues.push(`Width ${actualWidth}px is below minimum ${minTouchSize}px`);
    }

    if (actualHeight < minTouchSize) {
      issues.push(
        `Height ${actualHeight}px is below minimum ${minTouchSize}px`
      );
    }

    // Check spacing between elements
    const siblings = Array.from(
      element.parentElement?.children || []
    ) as HTMLElement[];
    const elementIndex = siblings.indexOf(element);

    if (elementIndex > 0) {
      const prevSibling = siblings[elementIndex - 1];
      const prevRect = prevSibling.getBoundingClientRect();
      const spacing = rect.top - (prevRect.top + prevRect.height);

      if (spacing < 8) {
        issues.push(
          `Insufficient spacing (${spacing}px) from previous element`
        );
      }
    }

    results.push({
      element,
      minSize: minTouchSize,
      actualSize: { width: actualWidth, height: actualHeight },
      passed: issues.length === 0,
      issues,
    });
  });

  return results;
}

/**
 * Test gesture support on elements
 */
export function testGestureSupport(
  container: HTMLElement = document.body
): MobileGestureTest[] {
  const gestureElements = Array.from(
    container.querySelectorAll(
      "[data-swipe], [data-pinch], [data-longpress], .swipeable, .pinchable"
    )
  ) as HTMLElement[];

  const results: MobileGestureTest[] = [];

  gestureElements.forEach((element) => {
    const issues: string[] = [];
    const gestures: string[] = [];

    // Check for swipe gesture support
    if (element.dataset.swipe || element.classList.contains("swipeable")) {
      gestures.push("swipe");

      // Check if touch events are properly handled
      const hasTouch =
        element.ontouchstart !== undefined ||
        element.ontouchmove !== undefined ||
        element.ontouchend !== undefined;

      if (!hasTouch) {
        issues.push("Swipe gesture declared but no touch event handlers found");
      }
    }

    // Check for pinch gesture support
    if (element.dataset.pinch || element.classList.contains("pinchable")) {
      gestures.push("pinch");

      const style = window.getComputedStyle(element);
      if (
        style.touchAction !== "none" &&
        style.touchAction !== "manipulation"
      ) {
        issues.push(
          "Pinch gesture may conflict with browser default touch actions"
        );
      }
    }

    // Check for long press support
    if (element.dataset.longpress) {
      gestures.push("longpress");
    }

    results.push({
      element,
      gestures,
      supported: issues.length === 0,
      issues,
    });
  });

  return results;
}

/**
 * Test mobile performance metrics
 */
export function testMobilePerformance(): Promise<MobilePerformanceTest> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let frameCount = 0;
    let lastTime = startTime;
    const issues: string[] = [];

    // Measure FPS
    const measureFPS = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));

        // Get other performance metrics
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        const loadTime = navigation
          ? navigation.loadEventEnd - navigation.fetchStart
          : 0;

        const paintEntries = performance.getEntriesByType("paint");
        const fcp = paintEntries.find(
          (entry) => entry.name === "first-contentful-paint"
        );
        const renderTime = fcp ? fcp.startTime : 0;

        let memoryUsage: number | undefined;
        if ("memory" in performance) {
          const memory = (performance as any).memory;
          memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        }

        // Evaluate performance
        if (fps < 30) {
          issues.push(`Low FPS: ${fps} (should be ≥30)`);
        }

        if (loadTime > 3000) {
          issues.push(`Slow load time: ${loadTime}ms (should be <3000ms)`);
        }

        if (renderTime > 1000) {
          issues.push(`Slow render time: ${renderTime}ms (should be <1000ms)`);
        }

        if (memoryUsage && memoryUsage > 50) {
          issues.push(`High memory usage: ${memoryUsage}MB (should be <50MB)`);
        }

        resolve({
          fps,
          loadTime,
          renderTime,
          memoryUsage,
          passed: issues.length === 0,
          issues,
        });

        return;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  });
}

/**
 * Comprehensive mobile accessibility test
 */
export async function testMobileAccessibility(
  container: HTMLElement = document.body
): Promise<MobileAccessibilityTest> {
  const touchTargets = testTouchTargets(container);
  const gestures = testGestureSupport(container);
  const performance = await testMobilePerformance();

  const touchTargetIssues = touchTargets.filter((test) => !test.passed).length;
  const gestureIssues = gestures.filter((test) => !test.supported).length;
  const performanceIssues = performance.passed ? 0 : 1;

  const totalTests = touchTargets.length + gestures.length + 1;
  const passedTests =
    touchTargets.filter((test) => test.passed).length +
    gestures.filter((test) => test.supported).length +
    (performance.passed ? 1 : 0);

  const score = Math.round((passedTests / totalTests) * 100);

  const allIssues: string[] = [
    ...touchTargets.flatMap((test) => test.issues),
    ...gestures.flatMap((test) => test.issues),
    ...performance.issues,
  ];

  const recommendations: string[] = [];

  if (touchTargetIssues > 0) {
    recommendations.push("Increase touch target sizes to at least 44x44px");
    recommendations.push("Add adequate spacing between interactive elements");
  }

  if (gestureIssues > 0) {
    recommendations.push(
      "Implement proper touch event handlers for gesture elements"
    );
    recommendations.push("Set appropriate touch-action CSS properties");
  }

  if (!performance.passed) {
    recommendations.push("Optimize performance for mobile devices");
    recommendations.push("Reduce memory usage and improve rendering speed");
  }

  return {
    touchTargets,
    gestures,
    performance,
    overall: {
      passed: allIssues.length === 0,
      score,
      issues: allIssues,
      recommendations,
    },
  };
}

/**
 * Test device-specific features
 */
export function testDeviceFeatures(deviceInfo: DeviceInfo): {
  supported: string[];
  unsupported: string[];
  recommendations: string[];
} {
  const supported: string[] = [];
  const unsupported: string[] = [];
  const recommendations: string[] = [];

  // Test touch support
  if (deviceInfo.isTouchDevice) {
    supported.push("Touch input");
  } else {
    unsupported.push("Touch input");
    recommendations.push(
      "Ensure mouse/keyboard alternatives for touch gestures"
    );
  }

  // Test vibration
  if ("vibrate" in navigator) {
    supported.push("Haptic feedback");
  } else {
    unsupported.push("Haptic feedback");
  }

  // Test orientation
  if ("orientation" in screen) {
    supported.push("Orientation detection");
  } else {
    unsupported.push("Orientation detection");
  }

  // Test network information
  if ("connection" in navigator) {
    supported.push("Network information");
  } else {
    unsupported.push("Network information");
    recommendations.push("Implement fallback for network status detection");
  }

  // Test service worker
  if ("serviceWorker" in navigator) {
    supported.push("Service Worker (PWA support)");
  } else {
    unsupported.push("Service Worker");
    recommendations.push("PWA features will not be available");
  }

  // Test web share
  if ("share" in navigator) {
    supported.push("Web Share API");
  } else {
    unsupported.push("Web Share API");
    recommendations.push("Implement fallback sharing options");
  }

  return { supported, unsupported, recommendations };
}

/**
 * Generate mobile test report
 */
export async function generateMobileTestReport(
  container: HTMLElement = document.body
): Promise<string> {
  const accessibilityTest = await testMobileAccessibility(container);
  const deviceInfo = {
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    isTouchDevice: "ontouchstart" in window,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isStandalone: window.matchMedia("(display-mode: standalone)").matches,
    orientation: (window.innerHeight > window.innerWidth
      ? "portrait"
      : "landscape") as "portrait" | "landscape",
    screenSize: "md" as const,
    pixelRatio: window.devicePixelRatio || 1,
  };

  const deviceFeatures = testDeviceFeatures(deviceInfo);

  const report = `
# Mobile Accessibility Test Report

## Overall Score: ${accessibilityTest.overall.score}%
**Status:** ${accessibilityTest.overall.passed ? "✅ PASSED" : "❌ FAILED"}

## Touch Target Tests
- **Total Elements:** ${accessibilityTest.touchTargets.length}
- **Passed:** ${accessibilityTest.touchTargets.filter((t) => t.passed).length}
- **Failed:** ${accessibilityTest.touchTargets.filter((t) => !t.passed).length}

### Issues:
${
  accessibilityTest.touchTargets
    .filter((t) => !t.passed)
    .map((t) => `- ${t.element.tagName}: ${t.issues.join(", ")}`)
    .join("\n") || "None"
}

## Gesture Support Tests
- **Total Elements:** ${accessibilityTest.gestures.length}
- **Supported:** ${accessibilityTest.gestures.filter((g) => g.supported).length}
- **Unsupported:** ${
    accessibilityTest.gestures.filter((g) => !g.supported).length
  }

### Issues:
${
  accessibilityTest.gestures
    .filter((g) => !g.supported)
    .map((g) => `- ${g.element.tagName}: ${g.issues.join(", ")}`)
    .join("\n") || "None"
}

## Performance Tests
- **FPS:** ${accessibilityTest.performance.fps}
- **Load Time:** ${accessibilityTest.performance.loadTime}ms
- **Render Time:** ${accessibilityTest.performance.renderTime}ms
- **Memory Usage:** ${accessibilityTest.performance.memoryUsage || "N/A"}MB
- **Status:** ${
    accessibilityTest.performance.passed ? "✅ PASSED" : "❌ FAILED"
  }

### Issues:
${
  accessibilityTest.performance.issues
    .map((issue) => `- ${issue}`)
    .join("\n") || "None"
}

## Device Features
### Supported:
${deviceFeatures.supported.map((feature) => `- ✅ ${feature}`).join("\n")}

### Unsupported:
${deviceFeatures.unsupported.map((feature) => `- ❌ ${feature}`).join("\n")}

## Recommendations
${accessibilityTest.overall.recommendations
  .concat(deviceFeatures.recommendations)
  .map((rec) => `- ${rec}`)
  .join("\n")}

---
*Report generated on ${new Date().toLocaleString()}*
  `;

  return report;
}

/**
 * Log mobile test report to console
 */
export async function logMobileTestReport(
  container: HTMLElement = document.body
): Promise<void> {
  const report = await generateMobileTestReport(container);
  console.group("📱 Mobile Accessibility Test Report");
  console.log(report);
  console.groupEnd();
}
