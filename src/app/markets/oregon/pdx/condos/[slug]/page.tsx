import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { CondoMapSection } from '@/components/CondoMapSection';
import { WalkScoreSection } from '@/components/WalkScoreSection';
import { ConsultationForm } from '@/components/ConsultationForm';
import { CondoImageWithFallback } from '@/components/CondoImageWithFallback';
import { RMLSDisclaimer } from '@/components/rmls/RMLSDisclaimer';
import { CONDO_FALLBACK_IMAGE } from '@/config/theme';
import { SITE_NAME, defaultOgImage } from '@/config/site';
import {
  getCondoBySlug,
  getCondoSlugs,
  getCondosInNeighborhood,
} from '@/data/portland-condo-guide';
import type { PortlandCondoEntry } from '@/data/portland-condo-guide-types';
import { CONDITION_COLOR_LEGEND } from '@/data/portland-condo-guide-types';
import type { Metadata } from 'next';

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n);
}

function formatPricePerSqFt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCondoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const condo = getCondoBySlug(slug);
  if (!condo) {
    return { title: `Portland Condos | ${SITE_NAME}` };
  }
  const title = `${condo.name} Portland Condos | ${condo.neighborhood}`;
  const description = `${condo.name} at ${condo.address}. ${condo.neighborhood}. Median price ${formatPrice(condo.medianPrice)}, HOA $${condo.averageMonthlyHoa}/mo. ${condo.stories} stories, built ${condo.yearBuilt}. Rent cap: ${condo.rentCap}. Portland condo guide data.`;
  const url = `/markets/oregon/pdx/condos/${slug}`;
  const socialTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    openGraph: { url, title: socialTitle, description, images: [defaultOgImage(`${condo.name} – Portland condo`)], },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [defaultOgImage(`${condo.name} – Portland condo`).url] },
  };
}

function MarketIndicator({ colorCode }: { colorCode: PortlandCondoEntry['colorCode'] }) {
  const label =
    colorCode === 'GREEN'
      ? 'Stronger financial position'
      : colorCode === 'YELLOW'
        ? 'Moderate cost'
        : 'Higher cost / special assessment';
  return (
    <span
      className={`condo-detail-indicator condo-detail-indicator--${colorCode.toLowerCase()}`}
      title={CONDITION_COLOR_LEGEND[colorCode]}
    >
      <span className="condo-detail-indicator-dot" aria-hidden />
      {label}
    </span>
  );
}

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="condo-detail-stat">
      <dt className="condo-detail-stat-label">{label}</dt>
      <dd className="condo-detail-stat-value">
        {value}
        {sub != null && sub !== '' && (
          <span className="condo-detail-stat-sub">{sub}</span>
        )}
      </dd>
    </div>
  );
}

function OurTake({ condo }: { condo: PortlandCondoEntry }) {
  const isGreen = condo.colorCode === 'GREEN';
  const isRed = condo.colorCode === 'RED';

  let headline: string;
  let body: string;

  if (isGreen) {
    headline = 'Balanced costs with stronger financial footing.';
    body =
      'Based on HOA, taxes, and our value ratios, this building skews toward a stronger long-term financial position relative to peers. It can be a good fit for buyers who care about predictable carrying costs.';
  } else if (isRed) {
    headline = 'Higher carrying costs to weigh carefully.';
    body =
      'HOA, taxes, or special assessments are in a higher-cost band here. For the right buyer the amenities or location may justify the premium, but it is important to model monthly costs and risk over time.';
  } else {
    headline = 'Moderate costs with tradeoffs to consider.';
    body =
      'This building sits in the middle of the pack on ongoing costs. The decision often comes down to how you value the specific location, floor plans, and amenities versus nearby alternatives.';
  }

  return (
    <div className="condo-detail-block condo-detail-ourtake">
      <h3 className="condo-detail-block-title">Our take</h3>
      <p className="condo-detail-ourtake-headline">{headline}</p>
      <p className="condo-detail-ourtake-body">
        {body} If you&apos;re considering {condo.name}, we recommend comparing it to a short list of
        nearby buildings with different HOA levels and amenity mixes.
      </p>
    </div>
  );
}

export default async function CondoBuildingPage({ params }: PageProps) {
  const { slug } = await params;
  const condo = getCondoBySlug(slug);
  if (!condo) notFound();

  const canonicalUrl = `https://brantleychristianson.com/markets/oregon/pdx/condos/${slug}`;

  const condoLd = {
    '@context': 'https://schema.org',
    '@type': ['Residence', 'Condominium'],
    name: condo.name,
    description: `${condo.name} condominium building in ${condo.neighborhood}, Portland, Oregon.`,
    url: canonicalUrl,
    image: condo.image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: condo.address,
      addressLocality: 'Portland',
      addressRegion: 'OR',
      addressCountry: 'US',
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Median price', value: condo.medianPrice },
      {
        '@type': 'PropertyValue',
        name: 'Average monthly HOA',
        value: condo.averageMonthlyHoa,
      },
      { '@type': 'PropertyValue', name: 'Year built', value: condo.yearBuilt },
      { '@type': 'PropertyValue', name: 'Rent cap', value: condo.rentCap },
    ],
    aggregateOffer: {
      '@type': 'AggregateOffer',
      lowPrice: condo.lowestPrice,
      highPrice: condo.highestPrice,
      priceCurrency: 'USD',
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Markets',
        item: 'https://brantleychristianson.com/markets',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Oregon',
        item: 'https://brantleychristianson.com/markets/oregon',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Portland',
        item: 'https://brantleychristianson.com/markets/oregon/multnomah/portland',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Condo Guide',
        item: 'https://brantleychristianson.com/resources/portland-condo-guide',
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: condo.name,
        item: canonicalUrl,
      },
    ],
  };

  const sameNeighborhood = getCondosInNeighborhood(condo.categoryId, condo.id);
  const guideHref = '/resources/portland-condo-guide';
  const stateHref = '/markets/oregon';
  const pdxHref = '/markets/oregon/multnomah/portland';

  return (
    <main className="condo-detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(condoLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Hero
        title={condo.name}
        lead={`${condo.neighborhood} · ${condo.address}`}
        variant="condo"
        imageSrc={condo.image || CONDO_FALLBACK_IMAGE}
        imageFallbackSrc={CONDO_FALLBACK_IMAGE}
        imageAlt={condo.name}
        priority
      >
          <Button href="#request-assistance" variant="white">
            Request assistance
          </Button>
          <Button href={guideHref} variant="white">
            Back to condo guide
          </Button>
      </Hero>

      {/* Breadcrumb */}
      <section className="section condo-detail-breadcrumb" aria-label="Breadcrumb">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li>
                <Link href="/markets">Markets</Link>
              </li>
              <li>
                <Link href={stateHref}>Oregon</Link>
              </li>
              <li>
                <Link href={pdxHref}>Portland</Link>
              </li>
              <li>
                <Link href={guideHref}>Condo Guide</Link>
              </li>
              <li aria-current="page">{condo.name}</li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Key stats strip */}
      <section className="condo-detail-strip" aria-labelledby="condo-key-stats">
        <div className="container">
          <h2 id="condo-key-stats" className="sr-only">
            Key stats
          </h2>
          <div className="condo-detail-strip-inner">
            <div className="condo-detail-strip-main">
              <div className="condo-detail-price">
                <span className="condo-detail-price-median">
                  {formatPrice(condo.medianPrice)}
                </span>
                <span className="condo-detail-price-label">Median sale price</span>
              </div>
              <div className="condo-detail-strip-meta">
                <span className="condo-detail-strip-item">
                  ${condo.averageMonthlyHoa.toLocaleString()}/mo HOA
                </span>
                <span className="condo-detail-strip-sep" aria-hidden>
                  ·
                </span>
                <span className="condo-detail-strip-item">
                  Built {condo.yearBuilt}
                </span>
                <span className="condo-detail-strip-sep" aria-hidden>
                  ·
                </span>
                <span className="condo-detail-strip-item">
                  {condo.stories} {condo.stories === 1 ? 'story' : 'stories'}
                </span>
                <MarketIndicator colorCode={condo.colorCode} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content: two columns on desktop */}
      <section className="section" aria-labelledby="condo-overview">
        <div className="container">
          <div className="condo-detail-layout">
            <div className="condo-detail-main">
              <header className="stack--md" id="condo-overview">
                <h2 className="section-title">{condo.name} overview</h2>
                <p className="section-lead">
                  {condo.name} is a {condo.stories}-story condominium building at{' '}
                  {condo.address} in {condo.neighborhood}. Data below reflects
                  recent market activity and building policies from our 2026
                  Portland condo guide.
                </p>
              </header>

              {/* Price range */}
              <div className="condo-detail-block">
                <h3 className="condo-detail-block-title">Price range</h3>
                <dl className="condo-detail-stats-grid">
                  <StatBlock label="Lowest sale" value={formatPrice(condo.lowestPrice)} />
                  <StatBlock
                    label="Median sale"
                    value={formatPrice(condo.medianPrice)}
                    sub=" (typical)"
                  />
                  <StatBlock label="Highest sale" value={formatPrice(condo.highestPrice)} />
                  <StatBlock
                    label="Price per sq ft"
                    value={formatPricePerSqFt(condo.avgPricePerSqFt)}
                  />
                </dl>
              </div>

              {/* Market activity */}
              <div className="condo-detail-block">
                <h3 className="condo-detail-block-title">Market activity</h3>
                <dl className="condo-detail-stats-grid">
                  <StatBlock
                    label="Active listings"
                    value={condo.activeListings}
                  />
                  <StatBlock
                    label="Total transactions (dataset)"
                    value={condo.totalTransactions}
                  />
                  <StatBlock
                    label="Median days on market"
                    value={condo.medianDaysOnMarket}
                    sub=" days"
                  />
                </dl>
              </div>

              {/* Building & policies */}
              <div className="condo-detail-block">
                <h3 className="condo-detail-block-title">Building & policies</h3>
                <dl className="condo-detail-policies">
                  <StatBlock
                    label="Rent cap"
                    value={condo.rentCap}
                  />
                  <StatBlock
                    label="Short-term rental"
                    value={condo.shortTermRental}
                  />
                  <StatBlock
                    label="Concierge"
                    value={condo.concierge}
                  />
                  <StatBlock
                    label="Parking"
                    value={condo.parking}
                  />
                  <StatBlock
                    label="Special assessment"
                    value={condo.specialAssessment}
                  />
                </dl>
              </div>

              {/* Amenities */}
              {condo.amenities.length > 0 && (
                <div className="condo-detail-block">
                  <h3 className="condo-detail-block-title">Amenities</h3>
                  <ul className="condo-detail-amenities" role="list">
                    {condo.amenities.map((a) => (
                      <li key={a} className="condo-detail-amenity">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Value ratios (for informed buyers) */}
              <div className="condo-detail-block condo-detail-ratios">
                <h3 className="condo-detail-block-title">Value context</h3>
                <p className="condo-detail-ratio-intro">
                  How HOA and taxes compare to sale price. Lower ratios can mean
                  relatively lower ongoing costs per dollar of value.
                </p>
                <dl className="condo-detail-stats-grid">
                  <StatBlock
                    label="Tax / price ratio"
                    value={condo.taxPriceRatio.toFixed(2)}
                  />
                  <StatBlock
                    label="HOA / price ratio"
                    value={condo.hoaPriceRatio.toFixed(2)}
                  />
                </dl>
              </div>

              {/* Our expert view */}
              <OurTake condo={condo} />

              {/* Location & map */}
              <div className="condo-detail-block">
                <CondoMapSection address={condo.address} buildingName={condo.name} />
              </div>

              {/* Walk Score */}
              <div className="condo-detail-block">
                <WalkScoreSection address={condo.address} buildingName={condo.name} />
              </div>
            </div>

            {/* Sidebar: quick facts card */}
            <aside className="condo-detail-sidebar" aria-label="Quick facts">
              <div className="condo-detail-card">
                <div className="condo-detail-card-image-wrap">
                  <CondoImageWithFallback
                    src={condo.image}
                    alt={`${condo.name} building`}
                    width={400}
                    height={250}
                    className="condo-detail-card-img"
                    sizes="(min-width: 1024px) 380px, 100vw"
                  />
                  <span
                    className={`condo-detail-indicator condo-detail-indicator--${condo.colorCode.toLowerCase()} condo-detail-indicator--badge`}
                    title={CONDITION_COLOR_LEGEND[condo.colorCode]}
                  >
                    <span className="condo-detail-indicator-dot" aria-hidden />
                  </span>
                </div>
                <div className="condo-detail-card-body">
                  <p className="condo-detail-card-address">{condo.address}</p>
                  <p className="condo-detail-card-neighborhood">{condo.neighborhood}</p>
                  <dl className="condo-detail-card-dl">
                    <dt>Year built</dt>
                    <dd>{condo.yearBuilt}</dd>
                    <dt>Stories</dt>
                    <dd>{condo.stories}</dd>
                    <dt>Median price</dt>
                    <dd>{formatPrice(condo.medianPrice)}</dd>
                    <dt>HOA (avg)</dt>
                    <dd>${condo.averageMonthlyHoa.toLocaleString()}/mo</dd>
                  </dl>
                  <Button href="/contact" variant="primary" className="condo-detail-cta">
                    Contact a broker
                  </Button>
                  <p className="condo-detail-card-back">
                    <Link href={guideHref} className="button button--text">
                      ← All Portland condos
                    </Link>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* More in this neighborhood */}
      {sameNeighborhood.length > 0 && (
        <section
          className="section section--alt"
          aria-labelledby="more-condos-heading"
        >
          <div className="container">
            <h2 id="more-condos-heading" className="section-title">
              More condos in {condo.neighborhood}
            </h2>
            <p className="section-lead">
              Compare other buildings in the same neighborhood.
            </p>
            <ul className="condo-guide-grid condo-detail-related" role="list">
              {sameNeighborhood.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <article className="condo-guide-card">
                    <Link href={c.url} className="condo-guide-card-link">
                      <span className="condo-guide-card-image-wrap">
                        <CondoImageWithFallback
                          src={c.image}
                          alt={`${c.name} condo building`}
                          width={400}
                          height={250}
                          className="condo-guide-card-img"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                        <span
                          className={`condo-guide-color condo-guide-color--${c.colorCode.toLowerCase()}`}
                          title={CONDITION_COLOR_LEGEND[c.colorCode]}
                        />
                      </span>
                      <div className="condo-guide-card-body">
                        <h3 className="condo-guide-card-name">{c.name}</h3>
                        <p className="condo-guide-card-address">{c.address}</p>
                        <dl className="condo-guide-card-stats">
                          <dt>Median</dt>
                          <dd>{formatPrice(c.medianPrice)}</dd>
                          <dt>HOA</dt>
                          <dd>${c.averageMonthlyHoa}/mo</dd>
                          <dt>Built</dt>
                          <dd>{c.yearBuilt}</dd>
                          <dt>Rent cap</dt>
                          <dd>{c.rentCap}</dd>
                        </dl>
                        {c.amenities.length > 0 && (
                          <p className="condo-guide-card-amenities">
                            {c.amenities.slice(0, 3).join(' · ')}
                            {c.amenities.length > 3 && ` +${c.amenities.length - 3}`}
                          </p>
                        )}
                      </div>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
            <p className="text-center stack--md">
              <Button href={guideHref} variant="outline">
                View full 2026 Portland Condo Guide
              </Button>
            </p>
          </div>
        </section>
      )}

      {/* Request assistance */}
      <section
        id="request-assistance"
        className="section section--alt"
        aria-labelledby="request-assistance-heading"
      >
        <div className="container container-narrow stack--xl">
          <header className="stack--md text-center mx-auto">
            <p className="section-tag">Get help</p>
            <h2 id="request-assistance-heading" className="section-title">
              Request assistance
            </h2>
            <p className="section-lead mx-auto">
              Interested in buying or selling at {condo.name}? A BCRE broker who works this
              neighborhood will follow up (typically within one business day) to unpack the data,
              compare nearby buildings, and talk through next steps.
            </p>
          </header>
          <div className="consultation-form-wrap">
            <ConsultationForm
              initialMessage={`I'm considering ${condo.name} at ${condo.address}, ${condo.neighborhood}. Please help me evaluate this building and 2–3 comparable options, and let me know what I should be thinking about as a buyer or seller.`}
              submitLabel="Request assistance"
              source="condo-detail"
              market="portland-or"
              buildingName={condo.name}
              buildingSlug={slug}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--cta" aria-label="Get in touch">
        <div className="container text-center stack--md">
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Interested in {condo.name}?
          </h2>
          <p className="section-lead mx-auto" style={{ marginBottom: '1.5rem' }}>
            Our brokers know Portland condos. Request assistance above or get in touch for a conversation.
          </p>
          <Button href="#request-assistance" variant="white">
            Request assistance
          </Button>
        </div>
      </section>

      {/* RMLS IDX/VOW compliance: disclaimer at bottom of property/listings content */}
      <section className="section" aria-label="Listing data disclaimer">
        <div className="container container-narrow">
          <RMLSDisclaimer brokerageName={SITE_NAME} />
        </div>
      </section>
    </main>
  );
}
