'use client';

import { useState, useCallback, useEffect } from 'react';

const NO_SCROLL_CLASS = 'no-scroll';

/**
 * Tracks scroll position; when past threshold, adds .is-scrolled to header.
 * Used for header background transition.
 */
export function useScrollState(thresholdPx: number = 60): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const check = () => setIsScrolled(window.scrollY > thresholdPx);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [thresholdPx]);

  return isScrolled;
}

/**
 * Mobile nav open/close + body no-scroll lock (replaces bcre-engine no-scroll state).
 */
export function useNavToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add(NO_SCROLL_CLASS);
    } else {
      document.body.classList.remove(NO_SCROLL_CLASS);
    }
    return () => document.body.classList.remove(NO_SCROLL_CLASS);
  }, [isOpen]);

  return { isOpen, toggle, close };
}
