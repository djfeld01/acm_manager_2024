// Mobile-optimized animations and transitions

import { useEffect, useRef, useCallback, useState } from "react";

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  fillMode?: "none" | "forwards" | "backwards" | "both";
}

export interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
}

export interface TransitionConfig extends AnimationConfig {
  property?: string;
  transform?: string;
  opacity?: number;
}

const DEFAULT_ANIMATION_CONFIG: Required<AnimationConfig> = {
  duration: 300,
  easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
  delay: 0,
  fillMode: "forwards",
};

/**
 * Hook for smooth page transitions
 */
export function usePageTransition(direction: "enter" | "exit" = "enter") {
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const animate = useCallback(
    (config: TransitionConfig = {}) => {
      const element = elementRef.current;
      if (!element) return Promise.resolve();

      setIsAnimating(true);

      const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

      const keyframes =
        direction === "enter"
          ? [
              { transform: "translateX(100%)", opacity: 0 },
              { transform: "translateX(0)", opacity: 1 },
            ]
          : [
              { transform: "translateX(0)", opacity: 1 },
              { transform: "translateX(-100%)", opacity: 0 },
            ];

      const animation = element.animate(keyframes, {
        duration: animationConfig.duration,
        easing: animationConfig.easing,
        delay: animationConfig.delay,
        fill: animationConfig.fillMode,
      });

      return animation.finished.then(() => {
        setIsAnimating(false);
      });
    },
    [direction]
  );

  return { elementRef, animate, isAnimating };
}

/**
 * Hook for slide animations
 */
export function useSlideAnimation<T extends HTMLElement>(
  direction: "up" | "down" | "left" | "right" = "up"
) {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  const slideIn = useCallback(
    (config: AnimationConfig = {}) => {
      const element = elementRef.current;
      if (!element) return Promise.resolve();

      const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

      const transforms = {
        up: ["translateY(100%)", "translateY(0)"],
        down: ["translateY(-100%)", "translateY(0)"],
        left: ["translateX(100%)", "translateX(0)"],
        right: ["translateX(-100%)", "translateX(0)"],
      };

      const keyframes = [
        { transform: transforms[direction][0], opacity: 0 },
        { transform: transforms[direction][1], opacity: 1 },
      ];

      setIsVisible(true);

      const animation = element.animate(keyframes, {
        duration: animationConfig.duration,
        easing: animationConfig.easing,
        delay: animationConfig.delay,
        fill: animationConfig.fillMode,
      });

      return animation.finished;
    },
    [direction]
  );

  const slideOut = useCallback(
    (config: AnimationConfig = {}) => {
      const element = elementRef.current;
      if (!element) return Promise.resolve();

      const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

      const transforms = {
        up: ["translateY(0)", "translateY(-100%)"],
        down: ["translateY(0)", "translateY(100%)"],
        left: ["translateX(0)", "translateX(-100%)"],
        right: ["translateX(0)", "translateX(100%)"],
      };

      const keyframes = [
        { transform: transforms[direction][0], opacity: 1 },
        { transform: transforms[direction][1], opacity: 0 },
      ];

      const animation = element.animate(keyframes, {
        duration: animationConfig.duration,
        easing: animationConfig.easing,
        delay: animationConfig.delay,
        fill: animationConfig.fillMode,
      });

      return animation.finished.then(() => {
        setIsVisible(false);
      });
    },
    [direction]
  );

  return { elementRef, slideIn, slideOut, isVisible };
}

/**
 * Hook for fade animations
 */
export function useFadeAnimation<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  const fadeIn = useCallback((config: AnimationConfig = {}) => {
    const element = elementRef.current;
    if (!element) return Promise.resolve();

    const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

    const keyframes = [{ opacity: 0 }, { opacity: 1 }];

    setIsVisible(true);

    const animation = element.animate(keyframes, {
      duration: animationConfig.duration,
      easing: animationConfig.easing,
      delay: animationConfig.delay,
      fill: animationConfig.fillMode,
    });

    return animation.finished;
  }, []);

  const fadeOut = useCallback((config: AnimationConfig = {}) => {
    const element = elementRef.current;
    if (!element) return Promise.resolve();

    const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

    const keyframes = [{ opacity: 1 }, { opacity: 0 }];

    const animation = element.animate(keyframes, {
      duration: animationConfig.duration,
      easing: animationConfig.easing,
      delay: animationConfig.delay,
      fill: animationConfig.fillMode,
    });

    return animation.finished.then(() => {
      setIsVisible(false);
    });
  }, []);

  return { elementRef, fadeIn, fadeOut, isVisible };
}

/**
 * Hook for scale animations
 */
export function useScaleAnimation<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  const scaleIn = useCallback((config: AnimationConfig = {}) => {
    const element = elementRef.current;
    if (!element) return Promise.resolve();

    const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

    const keyframes = [
      { transform: "scale(0)", opacity: 0 },
      { transform: "scale(1)", opacity: 1 },
    ];

    setIsVisible(true);

    const animation = element.animate(keyframes, {
      duration: animationConfig.duration,
      easing: animationConfig.easing,
      delay: animationConfig.delay,
      fill: animationConfig.fillMode,
    });

    return animation.finished;
  }, []);

  const scaleOut = useCallback((config: AnimationConfig = {}) => {
    const element = elementRef.current;
    if (!element) return Promise.resolve();

    const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

    const keyframes = [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(0)", opacity: 0 },
    ];

    const animation = element.animate(keyframes, {
      duration: animationConfig.duration,
      easing: animationConfig.easing,
      delay: animationConfig.delay,
      fill: animationConfig.fillMode,
    });

    return animation.finished.then(() => {
      setIsVisible(false);
    });
  }, []);

  return { elementRef, scaleIn, scaleOut, isVisible };
}

/**
 * Hook for spring-based animations
 */
export function useSpringAnimation<T extends HTMLElement>(
  config: SpringConfig = {}
) {
  const elementRef = useRef<T>(null);
  const { tension = 170, friction = 26, mass = 1 } = config;

  const animate = useCallback(
    (
      from: Record<string, number>,
      to: Record<string, number>,
      onUpdate?: (values: Record<string, number>) => void
    ) => {
      const element = elementRef.current;
      if (!element) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const startTime = performance.now();
        const duration = Math.sqrt(mass / tension) * friction * 1000;

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Spring easing function
          const easeOutElastic = (t: number) => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0
              ? 0
              : t === 1
              ? 1
              : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
          };

          const easedProgress = easeOutElastic(progress);
          const currentValues: Record<string, number> = {};

          Object.keys(from).forEach((key) => {
            const fromValue = from[key];
            const toValue = to[key];
            currentValues[key] =
              fromValue + (toValue - fromValue) * easedProgress;
          });

          onUpdate?.(currentValues);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(animate);
      });
    },
    [tension, friction, mass]
  );

  return { elementRef, animate };
}

/**
 * Hook for staggered animations
 */
export function useStaggeredAnimation<T extends HTMLElement>(
  itemSelector: string,
  staggerDelay: number = 100
) {
  const containerRef = useRef<T>(null);

  const animateItems = useCallback(
    (keyframes: Keyframe[], config: AnimationConfig = {}) => {
      const container = containerRef.current;
      if (!container) return Promise.resolve();

      const items = Array.from(
        container.querySelectorAll(itemSelector)
      ) as HTMLElement[];
      const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

      const animations = items.map((item, index) => {
        return item.animate(keyframes, {
          ...animationConfig,
          delay: animationConfig.delay + index * staggerDelay,
        });
      });

      return Promise.all(animations.map((animation) => animation.finished));
    },
    [itemSelector, staggerDelay]
  );

  const fadeInStagger = useCallback(
    (config: AnimationConfig = {}) => {
      return animateItems(
        [
          { opacity: 0, transform: "translateY(20px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        config
      );
    },
    [animateItems]
  );

  const slideInStagger = useCallback(
    (
      direction: "left" | "right" | "up" | "down" = "up",
      config: AnimationConfig = {}
    ) => {
      const transforms = {
        up: ["translateY(50px)", "translateY(0)"],
        down: ["translateY(-50px)", "translateY(0)"],
        left: ["translateX(50px)", "translateX(0)"],
        right: ["translateX(-50px)", "translateX(0)"],
      };

      return animateItems(
        [
          { opacity: 0, transform: transforms[direction][0] },
          { opacity: 1, transform: transforms[direction][1] },
        ],
        config
      );
    },
    [animateItems]
  );

  return { containerRef, animateItems, fadeInStagger, slideInStagger };
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation<T extends HTMLElement>(
  threshold: number = 0.1,
  rootMargin: string = "0px"
) {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasAnimated]);

  return { elementRef, isVisible, hasAnimated };
}

/**
 * Utility to create CSS keyframe animations
 */
export function createKeyframeAnimation(
  name: string,
  keyframes: Record<string, Record<string, string | number>>
): string {
  const keyframeRules = Object.entries(keyframes)
    .map(([percentage, styles]) => {
      const styleRules = Object.entries(styles)
        .map(([property, value]) => `${property}: ${value}`)
        .join("; ");
      return `${percentage} { ${styleRules} }`;
    })
    .join(" ");

  return `@keyframes ${name} { ${keyframeRules} }`;
}

/**
 * Utility to optimize animations for mobile
 */
export function optimizeForMobile(element: HTMLElement) {
  // Use transform and opacity for better performance
  element.style.willChange = "transform, opacity";
  element.style.backfaceVisibility = "hidden";
  element.style.perspective = "1000px";

  // Enable hardware acceleration
  element.style.transform = element.style.transform || "translateZ(0)";

  return () => {
    element.style.willChange = "";
    element.style.backfaceVisibility = "";
    element.style.perspective = "";
  };
}

/**
 * Hook for performance-optimized animations
 */
export function useOptimizedAnimation<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const cleanup = optimizeForMobile(element);
    return cleanup;
  }, []);

  return elementRef;
}
