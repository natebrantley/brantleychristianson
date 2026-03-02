'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface HubItem {
  title: string;
  description?: string;
  href: string;
  imageSrc: string;
  imageAlt?: string;
}

export interface IntelligenceHubsProps {
  hubs: HubItem[];
}

export function IntelligenceHubs({ hubs }: IntelligenceHubsProps) {
  return (
    <div className="intelligence-hubs" role="list">
      {hubs.map((hub) => (
        <Link
          key={hub.href}
          href={hub.href}
          className="hub-card"
          role="listitem"
          style={{ aspectRatio: '4/3' }}
        >
          <Image
            src={hub.imageSrc}
            alt={hub.imageAlt ?? hub.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            loading="lazy"
          />
          <div className="hub-card-content">
            <h3 className="hub-card-title">{hub.title}</h3>
            {hub.description && <p className="hub-card-desc">{hub.description}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
