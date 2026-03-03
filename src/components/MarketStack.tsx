import Image from 'next/image';
import Link from 'next/link';

export interface MarketStackItem {
  title: string;
  description: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
}

export interface MarketStackProps {
  items: MarketStackItem[];
}

export function MarketStack({ items }: MarketStackProps) {
  return (
    <ul className="market-stack" aria-label="Markets">
      {items.map((item) => (
        <li key={item.href} className="market-stack__item">
          <Link href={item.href} className="market-stack__link">
            <span className="market-stack__media">
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 767px) 100vw, 420px"
                className="object-cover"
                loading="lazy"
              />
            </span>
            <span className="market-stack__content">
              <h3 className="market-stack__title">{item.title}</h3>
              <p className="market-stack__desc">{item.description}</p>
              <span className="market-stack__cta">View cities →</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
