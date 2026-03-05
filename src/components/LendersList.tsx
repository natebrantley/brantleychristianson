import Image from 'next/image';
import Link from 'next/link';
import type { Lender } from '@/data/types';

export interface LendersListProps {
  lenders: Lender[];
}

export function LendersList({ lenders }: LendersListProps) {
  if (lenders.length === 0) {
    return (
      <div className="lenders-empty" role="status">
        <p className="lenders-empty-title">No preferred lenders listed</p>
        <p className="lenders-empty-desc">Check back soon for our trusted lending partners.</p>
      </div>
    );
  }

  return (
    <ul className="lenders-list" role="list">
      {lenders.map((lender) => (
        <li key={lender.slug}>
          <article className="lender-tile">
            <Link
              href={`/lenders/${lender.slug}`}
              className="lender-tile-link"
              aria-label={`View profile for ${lender.name}`}
            >
              <span className="lender-tile-image-wrap">
                <Image
                  src={lender.image}
                  alt={`${lender.name}, ${lender.title}`}
                  width={200}
                  height={260}
                  sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                  className="lender-tile-img"
                  loading="lazy"
                />
              </span>
              <div className="lender-tile-body">
                <h2 className="lender-tile-name">{lender.name}</h2>
                <p className="lender-tile-title">{lender.title}</p>
                <p className="lender-tile-company">{lender.company}</p>
                <p className="lender-tile-nmls">{lender.nmls}</p>
                <p className="lender-tile-licenses">
                  {lender.licenses.join(' · ')}
                </p>
                {lender.specialties.length > 0 && (
                  <p className="lender-tile-specialties">
                    {lender.specialties.join(', ')}
                  </p>
                )}
              </div>
            </Link>
            <div className="lender-tile-actions">
              <a
                href={`mailto:${lender.email}`}
                className="lender-tile-email"
                aria-label={`Email ${lender.name}`}
              >
                Email
              </a>
              {lender.phone && (
                <a
                  href={`tel:${lender.phone.replace(/\D/g, '')}`}
                  className="lender-tile-phone"
                  aria-label={`Call ${lender.name} at ${lender.phone}`}
                >
                  {lender.phone}
                </a>
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
