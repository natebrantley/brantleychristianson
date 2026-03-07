'use client';

import { useEffect } from 'react';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main>
      <div role="alert" aria-live="assertive">
        <Hero
          title="Something went wrong."
          lead="An unexpected error occurred. You can try again, or head back to the home page."
        variant="short"
        imageSrc={`${assetPaths.stock}/couch.jpeg`}
        imageAlt="BCRE — return to home"
        priority={false}
      >
        <Button href="/" variant="white">
          Back to home
        </Button>
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
      </Hero>
      </div>
    </main>
  );
}

