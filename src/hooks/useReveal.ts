'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_OPTIONS: IntersectionObserverInit = {
  rootMargin: '0px 0px -80px 0px',
  threshold: 0.1,
};

/**
 * Intersection observer for reveal-item animations (replaces bcre-engine.js reveal logic).
 * Options are stabilized so passing a new object reference from parent does not reconnect the observer.
 */
export function useReveal(options: Partial<IntersectionObserverInit> = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const rootMargin = options.rootMargin ?? DEFAULT_OPTIONS.rootMargin;
  const threshold = options.threshold ?? DEFAULT_OPTIONS.threshold;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          el.classList.add('is-visible');
        }
      },
      { ...DEFAULT_OPTIONS, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, isVisible };
}
