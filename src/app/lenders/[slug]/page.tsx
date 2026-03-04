import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { lenders, getLenderBySlug } from '@/data/lenders';
import { assetPaths } from '@/config/theme';
import type { Metadata } from 'next';

interface LenderPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return lenders.map((lender) => ({ slug: lender.slug }));
}

export async function generateMetadata({ params }: LenderPageProps): Promise<Metadata> {
  const lender = getLenderBySlug(params.slug);
  if (!lender) {
    return { title: 'Lender | Brantley Christianson Real Estate' };
  }
  const title = `${lender.name} | Preferred Lender`;
  const description = `${lender.name}, ${lender.title} at ${lender.company}. ${lender.bio.slice(0, 120)}…`;
  const url = `/lenders/${lender.slug}`;
  return {
    title,
    description,
    openGraph: { url, title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function LenderProfilePage({ params }: LenderPageProps) {
  const lender = getLenderBySlug(params.slug);

  if (!lender) {
    notFound();
  }

  return (
    <main>
      <div className="lender-hero-image">
        <Image
          src={`${assetPaths.stock}/couch.jpeg`}
          alt=""
          fill
          className="lender-hero-image__img"
          priority
          sizes="100vw"
        />
      </div>

      <section className="section lender-detail-section" aria-labelledby="lender-name-heading">
        <div className="container container-narrow stack--lg">
          <header className="stack--sm text-center">
            <h1 id="lender-name-heading" className="lender-detail-name">
              {lender.name}
            </h1>
            <p className="lender-detail-title">{lender.title}</p>
            <p className="lender-detail-company">{lender.company}</p>
          </header>

          <article className="stack--lg">
            <div className="stack--md text-center">
              <div
                style={{
                  display: 'inline-block',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid rgba(var(--color-accent-rgb), 0.25)',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={lender.image}
                  alt={lender.name}
                  width={280}
                  height={364}
                  sizes="280px"
                  style={{ display: 'block', objectFit: 'cover' }}
                />
              </div>
              <p className="lender-detail-meta">
                <span className="lender-detail-meta-line">
                  <strong>NMLS:</strong> {lender.nmls}
                </span>
                {lender.co_nmls && (
                  <span className="lender-detail-meta-line">
                    <strong>Co. NMLS:</strong> {lender.co_nmls}
                  </span>
                )}
                <span className="lender-detail-meta-line">
                  <strong>Licenses:</strong> {lender.licenses.join(' · ')}
                </span>
              </p>
            </div>

            {lender.bio && (
              <p className="lender-detail-bio">{lender.bio}</p>
            )}

            {lender.specialties.length > 0 && (
              <p className="lender-detail-specialties">
                <strong>Specialties:</strong> {lender.specialties.join(', ')}
              </p>
            )}

            {lender.address && (
              <p className="lender-detail-address">
                <strong>Address:</strong>
                <br />
                <span style={{ whiteSpace: 'pre-line' }}>{lender.address}</span>
              </p>
            )}

            <div className="lender-detail-actions">
              <Button href={`mailto:${lender.email}`} variant="primary">
                Email {lender.name}
              </Button>
              {lender.phone && (
                <Button
                  href={`tel:${lender.phone.replace(/\D/g, '')}`}
                  variant="outline"
                >
                  Call {lender.phone}
                </Button>
              )}
              {lender.url && (
                <Button href={lender.url} variant="outline" target="_blank" rel="noopener noreferrer">
                  Visit website
                </Button>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
