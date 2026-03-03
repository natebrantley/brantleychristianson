import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';

export default function NotFound() {
  return (
    <main>
      <Hero
        title="This page has moved—and so have we."
        lead="If you landed here by clicking a link in an older email from us, thank you for reaching out. We’ve upgraded our platform, and some links from our previous system no longer work. We appreciate your patience as we roll out full functionality."
        variant="short"
        imageSrc={`${assetPaths.stock}/couch.jpeg`}
        imageAlt=""
        priority={false}
      >
        <Button href="/contact" variant="white">
          Get in touch
        </Button>
        <Button href="/" variant="outline">
          Back to home
        </Button>
      </Hero>

      <section className="section section--alt" aria-labelledby="not-found-help-heading">
        <div className="container container-narrow stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">We’re here to help</p>
            <h2 id="not-found-help-heading" className="section-title">
              Here’s where you can go from here
            </h2>
            <p className="section-lead mx-auto">
              Our new site is live and we’re still bringing everything over. In the meantime, you can
              explore our markets, request a consultation, or head back to the homepage. We’re
              grateful for your patience.
            </p>
          </header>
          <ul role="list" className="stack--md not-found-links">
            <li>
              <Link href="/contact" className="not-found-link--primary">
                Request a consultation →
              </Link>
            </li>
            <li>
              <Link href="/markets" className="not-found-link--secondary">
                Browse markets →
              </Link>
            </li>
            <li>
              <Link href="/" className="not-found-link--text">
                Back to homepage
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
