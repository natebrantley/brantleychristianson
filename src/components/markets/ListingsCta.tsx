import Link from 'next/link';

export interface ListingsCtaProps {
  /** Display text: "View listings in {areaName}" */
  areaName: string;
  /** Optional city for pre-filled search; builds /listings?city=... */
  city?: string;
  /** Optional full href override (e.g. for multiple cities); if set, city is ignored */
  href?: string;
  variant?: 'primary' | 'white' | 'outline';
  className?: string;
}

export function ListingsCta({
  areaName,
  city,
  href,
  variant = 'outline',
  className = '',
}: ListingsCtaProps) {
  const to = href ?? (city ? `/listings?${new URLSearchParams({ city }).toString()}` : '/listings');
  return (
    <Link
      href={to}
      className={`button button--${variant} ${className}`.trim()}
      aria-label={`View active listings in ${areaName}`}
    >
      View listings in {areaName}
    </Link>
  );
}
