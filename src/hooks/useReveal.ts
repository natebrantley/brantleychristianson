'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_OPTIONS: IntersectionObserverInit = {
  rootMargin: '0px 0px -80px 0px',
  threshold: 0.1,
};

/**
 * Intersection observer for reveal-item animations (replaces bcre-engine.js reveal logic).
 */
export function useReveal(options: Partial<IntersectionObserverInit> = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      { ...DEFAULT_OPTIONS, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return { ref, isVisible };
}
