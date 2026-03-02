'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Agent } from '@/data/types';

export type BrokerSort = 'name-asc' | 'name-desc' | 'title' | 'license-or' | 'license-wa';
export type BrokerFilter = 'all' | 'or' | 'wa';

function sortAgents(agents: Agent[], sort: BrokerSort): Agent[] {
  const copy = [...agents];
  switch (sort) {
    case 'name-asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title) || a.name.localeCompare(b.name));
    case 'license-or':
      return copy.sort((a, b) => {
        const aOR = a.licenses.some((l) => l.toUpperCase().startsWith('OR')) ? 1 : 0;
        const bOR = b.licenses.some((l) => l.toUpperCase().startsWith('OR')) ? 1 : 0;
        if (bOR !== aOR) return bOR - aOR;
        return a.name.localeCompare(b.name);
      });
    case 'license-wa':
      return copy.sort((a, b) => {
        const aWA = a.licenses.some((l) => l.toUpperCase().startsWith('WA')) ? 1 : 0;
        const bWA = b.licenses.some((l) => l.toUpperCase().startsWith('WA')) ? 1 : 0;
        if (bWA !== aWA) return bWA - aWA;
        return a.name.localeCompare(b.name);
      });
    default:
      return copy;
  }
}

function filterAgents(agents: Agent[], filter: BrokerFilter): Agent[] {
  if (filter === 'all') return agents;
  if (filter === 'or') return agents.filter((a) => a.licenses.some((l) => l.toUpperCase().startsWith('OR')));
  if (filter === 'wa') return agents.filter((a) => a.licenses.some((l) => l.toUpperCase().startsWith('WA')));
  return agents;
}

export interface BrokersListProps {
  agents: Agent[];
}

const SORT_OPTIONS: { value: BrokerSort; label: string }[] = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'title', label: 'Title' },
  { value: 'license-or', label: 'Oregon first' },
  { value: 'license-wa', label: 'Washington first' },
];

const FILTER_OPTIONS: { value: BrokerFilter; label: string }[] = [
  { value: 'all', label: 'All brokers' },
  { value: 'or', label: 'Oregon' },
  { value: 'wa', label: 'Washington' },
];

export function BrokersList({ agents }: BrokersListProps) {
  const [sort, setSort] = useState<BrokerSort>('name-asc');
  const [filter, setFilter] = useState<BrokerFilter>('all');

  const filtered = useMemo(() => filterAgents(agents, filter), [agents, filter]);
  const sorted = useMemo(() => sortAgents(filtered, sort), [filtered, sort]);

  return (
    <div className="brokers-page">
      <div className="brokers-toolbar">
        <div className="brokers-toolbar-group">
          <label htmlFor="broker-filter" className="brokers-toolbar-label">
            Show
          </label>
          <select
            id="broker-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as BrokerFilter)}
            className="brokers-select"
            aria-label="Filter by license state"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="brokers-toolbar-group">
          <label htmlFor="broker-sort" className="brokers-toolbar-label">
            Sort by
          </label>
          <select
            id="broker-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as BrokerSort)}
            className="brokers-select"
            aria-label="Sort brokers"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="brokers-count" aria-live="polite">
          {sorted.length} broker{sorted.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ul className="brokers-list" role="list">
        {sorted.map((agent) => (
          <li key={agent.slug}>
            <article className="broker-tile">
              <Link href={agent.url} className="broker-tile-link">
                <span className="broker-tile-image-wrap">
                  <Image
                    src={agent.image}
                    alt=""
                    width={200}
                    height={200}
                    sizes="200px"
                    className="broker-tile-img"
                    loading="lazy"
                  />
                </span>
                <div className="broker-tile-body">
                  <h2 className="broker-tile-name">{agent.name}</h2>
                  <p className="broker-tile-title">{agent.title}</p>
                  <p className="broker-tile-licenses">
                    {agent.licenses.join(' · ')}
                  </p>
                  <p className="broker-tile-cities">
                    {agent.cities.slice(0, 5).join(', ')}
                    {agent.cities.length > 5 && ` +${agent.cities.length - 5}`}
                  </p>
                  {agent.languages.length > 0 && (
                    <p className="broker-tile-languages">
                      {agent.languages.join(', ')}
                    </p>
                  )}
                </div>
              </Link>
              <div className="broker-tile-actions">
                <a href={`mailto:${agent.email}`} className="broker-tile-email">
                  Email
                </a>
                {agent.phone && (
                  <a href={`tel:${agent.phone.replace(/\D/g, '')}`} className="broker-tile-phone">
                    {agent.phone}
                  </a>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
