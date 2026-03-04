import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { lenders, getLenderBySlug } from '@/data/lenders';
import { assetPaths } from '@/config/theme';
import { SITE_NAME, absoluteUrl } from '@/config/site';
import type { Metadata } from 'next';

interface LenderPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-build static pages for every lender at build time */
export function generateStaticParams() {
  return lenders.map((lender) => ({ slug: lender.slug }));
}

export async function generateMetadata({ params }: LenderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lender = getLenderBySlug(slug);
  if (!lender) {
    return { title: `Lender | ${SITE_NAME}` };
  }
  const title = `${lender.name} | Preferred Lender`;
  const description = `${lender.name}, ${lender.title} at ${lender.company}. ${lender.bio.slice(0, 120)}…`;
  const url = `/lenders/${lender.slug}`;
  const imageUrl = absoluteUrl(lender.image);
  const images = [{ url: imageUrl, width: 600, height: 800, alt: `${lender.name}, ${lender.title}` }];
  return {
    title,
    description,
    openGraph: { url, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}

export default async function LenderProfilePage({ params }: LenderPageProps) {
  const { slug } = await params;
  const lender = getLenderBySlug(slug);

  if (!lender) {
    notFound();
  }

  return (
    <main>
      <div className="lender-hero-image" aria-hidden>
        <Image
          src={`${assetPaths.stock}/couch.jpeg`}
          alt=""
          fill
          className="lender-hero-image__img"
          priority
          sizes="100vw"
        />
      </div>

      <section
        className="section lender-detail-section"
        aria-labelledby="lender-name-heading"
      >
        <div className="container container-narrow stack--lg">
          <nav className="lender-detail-back" aria-label="Breadcrumb">
            <Link href="/lenders">← Preferred Lenders</Link>
          </nav>

          <header className="lender-detail-header stack--sm text-center">
            {lender.logo && (
              <div className="lender-detail-logo-wrap">
                <Image
                  src={lender.logo}
                  alt=""
                  width={120}
                  height={48}
                  sizes="120px"
                  className="lender-detail-logo"
                />
              </div>
            )}
            <h1 id="lender-name-heading" className="lender-detail-name">
              {lender.name}
            </h1>
            <p className="lender-detail-title">{lender.title}</p>
            <p className="lender-detail-company">{lender.company}</p>
          </header>

          <article className="lender-detail-article">
            <div className="lender-detail-primary">
              <div className="lender-detail-photo-frame">
                <Image
                  src={lender.image}
                  alt={`${lender.name}, ${lender.title}`}
                  width={280}
                  height={364}
                  sizes="(min-width: 1024px) 320px, 280px"
                  className="lender-detail-photo"
                />
              </div>
              <dl className="lender-detail-meta">
                <div className="lender-detail-meta-row">
                  <dt>NMLS</dt>
                  <dd>{lender.nmls}</dd>
                </div>
                {lender.co_nmls && (
                  <div className="lender-detail-meta-row">
                    <dt>Co. NMLS</dt>
                    <dd>{lender.co_nmls}</dd>
                  </div>
                )}
                <div className="lender-detail-meta-row">
                  <dt>Licenses</dt>
                  <dd>{lender.licenses.join(' · ')}</dd>
                </div>
              </dl>
            </div>

            <div className="lender-detail-content stack--lg">
              {lender.bio && (
                <p className="lender-detail-bio">{lender.bio}</p>
              )}

              {lender.specialties.length > 0 && (
                <div className="lender-detail-block">
                  <h2 className="lender-detail-block-title">Specialties</h2>
                  <p className="lender-detail-specialties">
                    {lender.specialties.join(', ')}
                  </p>
                </div>
              )}

              {lender.address && (
                <div className="lender-detail-block">
                  <h2 className="lender-detail-block-title">Office</h2>
                  <address
                    className="lender-detail-address"
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {lender.address}
                  </address>
                </div>
              )}

              <div className="lender-detail-block" aria-labelledby="lender-contact-heading">
                <h2 id="lender-contact-heading" className="lender-detail-block-title">
                  Get in touch
                </h2>
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
                    <Button
                      href={lender.url}
                      variant="outline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit website
                    </Button>
                  )}
                  <Button href="/lenders" variant="text">
                    View all lenders
                  </Button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
