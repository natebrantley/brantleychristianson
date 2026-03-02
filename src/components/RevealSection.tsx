'use client';

import { useReveal } from '@/hooks/useReveal';

export interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function RevealSection({ children, className = '' }: RevealSectionProps) {
  const { ref } = useReveal();
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`reveal-item ${className}`.trim()}>
      {children}
    </div>
  );
}
