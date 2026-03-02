import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';

export default function NotFound() {
  return (
    <main>
      <Hero
        title="We couldn't find that page."
        lead="The page you were looking for may have moved or no longer exists. Here are some helpful places to continue your search."
        variant="short"
        priority={false}
      >
        <Button href="/markets" variant="white">
          Explore markets
        </Button>
        <Button href="/resources/portland-condo-guide" variant="outline">
          Portland condo guide
        </Button>
      </Hero>

      <section className="section" aria-labelledby="not-found-links-heading">
        <div className="container container-narrow stack--md">
          <h2 id="not-found-links-heading" className="section-title">
            Keep exploring BCRE
          </h2>
          <p className="section-lead">
            Choose a path that matches what you&apos;re trying to do.
          </p>
          <ul role="list" className="stack--sm">
            <li>
              <Link href="/markets">Browse all markets</Link>
            </li>
            <li>
              <Link href="/resources/portland-condo-guide">Use the Portland condo guide</Link>
            </li>
            <li>
              <Link href="/contact">Request a tailored consultation</Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

