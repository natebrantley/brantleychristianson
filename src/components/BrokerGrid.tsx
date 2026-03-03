'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Agent } from '@/data/types';

export interface BrokerGridProps {
  agents: Agent[];
  maxItems?: number;
  showAllHref?: string;
  /** When true, use larger headshot dimensions (e.g. for main index "Our Brokers" section) */
  largeHeadshots?: boolean;
}

const HEADSHOT_SMALL = { width: 200, height: 200, sizes: '(max-width: 767px) 152px, 200px' } as const;
const HEADSHOT_LARGE = { width: 224, height: 224, sizes: '(max-width: 767px) 176px, 224px' } as const;

export function BrokerGrid({
  agents,
  maxItems = 8,
  showAllHref = '/brokers',
  largeHeadshots = false,
}: BrokerGridProps) {
  const display = maxItems > 0 ? agents.slice(0, maxItems) : agents;
  const img = largeHeadshots ? HEADSHOT_LARGE : HEADSHOT_SMALL;

  return (
    <div className="broker-grid-wrap">
      <ul className="broker-grid" role="list">
        {display.map((agent) => (
          <li key={agent.slug}>
            <Link href={agent.url} className="broker-card" role="listitem">
              <span className="broker-card-image-wrap">
                <Image
                  src={agent.image}
                  alt=""
                  width={img.width}
                  height={img.height}
                  sizes={img.sizes}
                  className="broker-card-img"
                  loading="lazy"
                />
              </span>
              <span className="broker-card-name">{agent.name}</span>
              <span className="broker-card-title">{agent.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      {maxItems > 0 && agents.length > maxItems && (
        <p className="broker-grid-cta">
          <Link href={showAllHref} className="button button--outline">
            View all brokers
          </Link>
        </p>
      )}
    </div>
  );
}
