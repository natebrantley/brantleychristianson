'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Agent } from '@/data/types';

export interface BrokerGridProps {
  agents: Agent[];
  maxItems?: number;
  showAllHref?: string;
}

export function BrokerGrid({ agents, maxItems = 8, showAllHref = '/brokers' }: BrokerGridProps) {
  const display = maxItems > 0 ? agents.slice(0, maxItems) : agents;

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
                  width={120}
                  height={120}
                  sizes="120px"
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
