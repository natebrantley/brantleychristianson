'use client';

import { useEffect, useRef, useState } from 'react';

export interface LazyYouTubeProps {
  videoId: string;
  title: string;
  className?: string;
}

export function LazyYouTube({ videoId, title, className = '' }: LazyYouTubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setShouldLoad(true);
      },
      { rootMargin: '100px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {shouldLoad ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="featured-listing__video"
          loading="lazy"
        />
      ) : (
        <div
          className="featured-listing__video featured-listing__video-placeholder"
          aria-hidden
        />
      )}
    </div>
  );
}
