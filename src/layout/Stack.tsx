'use client';

import type { StackGap } from '@/config/theme';

export interface StackProps {
  gap?: StackGap;
  as?: 'div' | 'section' | 'article' | 'nav';
  className?: string;
  children: React.ReactNode;
}

/**
 * Lobotomized Owl vertical spacing: [class*=stack--] > * + *
 * Reusable layout component for consistent vertical rhythm.
 */
export function Stack({ gap = 'md', as: Component = 'div', className = '', children }: StackProps) {
  const stackClass = `stack--${gap}`;
  const fullClass = [stackClass, className].filter(Boolean).join(' ');
  return <Component className={fullClass}>{children}</Component>;
}
