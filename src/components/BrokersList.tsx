'use client';

import { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Agent } from '@/data/types';
import { getBrokerCities, getBrokerLanguages } from '@/data/agents';

export type BrokerSort = 'name-asc' | 'name-desc';

const SORT_OPTIONS: { value: BrokerSort; label: string }[] = [
  { value: 'name-asc', label: 'Name (A to Z)' },
  { value: 'name-desc', label: 'Name (Z to A)' },
];

function getLastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : name;
}

function compareByLastName(a: Agent, b: Agent, direction: 1 | -1): number {
  const aLast = getLastName(a.name);
  const bLast = getLastName(b.name);
  const cmp = aLast.localeCompare(bLast);
  if (cmp !== 0) return direction * cmp;
  return direction * a.name.localeCompare(b.name);
}

function formatLicense(license: string) {
  const match = license.match(/^(OR|WA)\b(.*)$/i);
  if (!match) return license;
  const [, state, rest] = match;
  return (
    <>
      <span className="broker-tile-license-state">{state.toUpperCase()}</span>
      {rest}
    </>
  );
}

function formatLanguage(language: string): string {
  const lower = language.toLowerCase();
  switch (lower) {
    case 'mandarin':
      return '中文（普通话）';
    case 'cantonese':
      return '粵語';
    default:
      return language;
  }
}

function sortAgents(agents: Agent[], sort: BrokerSort): Agent[] {
  const copy = [...agents];
  switch (sort) {
    case 'name-asc':
      return copy.sort((a, b) => compareByLastName(a, b, 1));
    case 'name-desc':
      return copy.sort((a, b) => compareByLastName(a, b, -1));
    default:
      return copy;
  }
}

function filterByLicense(agents: Agent[], license: string): Agent[] {
  if (!license || license === 'all') return agents;
  return agents.filter((a) =>
    a.licenses.some((l) => l.toUpperCase().startsWith(license.toUpperCase()))
  );
}

function filterByCity(agents: Agent[], city: string): Agent[] {
  if (!city || city === 'all') return agents;
  return agents.filter((a) =>
    a.cities.some((c) => c.toLowerCase() === city.toLowerCase())
  );
}

function filterByLanguage(agents: Agent[], language: string): Agent[] {
  if (!language || language === 'all') return agents;
  return agents.filter((a) =>
    a.languages.some((l) => l.toLowerCase() === language.toLowerCase())
  );
}

export interface BrokersListProps {
  agents: Agent[];
}

export function BrokersList({ agents }: BrokersListProps) {
  const searchParams = useSearchParams();
  const cities = useMemo(() => getBrokerCities(), []);
  const languages = useMemo(() => getBrokerLanguages(), []);

  const [sort, setSort] = useState<BrokerSort>(() => {
    const s = searchParams.get('sort');
    return (SORT_OPTIONS.some((o) => o.value === s) ? s : 'name-asc') as BrokerSort;
  });
  const [license, setLicense] = useState<string>(() => searchParams.get('license') || 'all');
  const [city, setCity] = useState<string>(() => searchParams.get('city') || 'all');
  const [language, setLanguage] = useState<string>(() => searchParams.get('lang') || 'all');

  const updateUrl = useCallback(
    (updates: { sort?: string; license?: string; city?: string; lang?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.sort !== undefined) {
        if (updates.sort === 'name-asc') params.delete('sort');
        else params.set('sort', updates.sort);
      }
      if (updates.license !== undefined) {
        if (updates.license === 'all') params.delete('license');
        else params.set('license', updates.license);
      }
      if (updates.city !== undefined) {
        if (updates.city === 'all') params.delete('city');
        else params.set('city', updates.city);
      }
      if (updates.lang !== undefined) {
        if (updates.lang === 'all') params.delete('lang');
        else params.set('lang', updates.lang);
      }
      window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    },
    [searchParams]
  );

  const handleSort = (value: string) => {
    const v = value as BrokerSort;
    setSort(v);
    updateUrl({ sort: v });
  };
  const handleLicense = (value: string) => {
    setLicense(value);
    updateUrl({ license: value });
  };
  const handleCity = (value: string) => {
    setCity(value);
    updateUrl({ city: value });
  };
  const handleLanguage = (value: string) => {
    setLanguage(value);
    updateUrl({ lang: value });
  };

  const clearFilters = useCallback(() => {
    setLicense('all');
    setCity('all');
    setLanguage('all');
    setSort('name-asc');
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const filtered = useMemo(() => {
    let list = filterByLicense(agents, license);
    list = filterByCity(list, city);
    list = filterByLanguage(list, language);
    return list;
  }, [agents, license, city, language]);

  const sorted = useMemo(() => sortAgents(filtered, sort), [filtered, sort]);

  const hasActiveFilters = license !== 'all' || city !== 'all' || language !== 'all';

  return (
    <div className="brokers-page">
      <div className="brokers-toolbar" role="search" aria-label="Filter and sort brokers">
        <div className="brokers-toolbar-row brokers-toolbar-filters">
          <div className="brokers-toolbar-group">
            <label htmlFor="broker-license" className="brokers-toolbar-label">
              Location
            </label>
            <select
              id="broker-license"
              value={license}
              onChange={(e) => handleLicense(e.target.value)}
              className="brokers-select"
              aria-label="Filter by license state (Oregon or Washington)"
            >
              <option value="all">All states</option>
              <option value="or">Oregon</option>
              <option value="wa">Washington</option>
            </select>
          </div>
          <div className="brokers-toolbar-group">
            <label htmlFor="broker-city" className="brokers-toolbar-label">
              City
            </label>
            <select
              id="broker-city"
              value={city}
              onChange={(e) => handleCity(e.target.value)}
              className="brokers-select brokers-select--city"
              aria-label="Filter by city"
            >
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="brokers-toolbar-group">
            <label htmlFor="broker-language" className="brokers-toolbar-label">
              Language
            </label>
            <select
              id="broker-language"
              value={language}
              onChange={(e) => handleLanguage(e.target.value)}
              className="brokers-select"
              aria-label="Filter by language"
            >
              <option value="all">All languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
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
              onChange={(e) => handleSort(e.target.value)}
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
          {hasActiveFilters && (
            <div className="brokers-toolbar-group brokers-toolbar-clear">
              <button
                type="button"
                onClick={clearFilters}
                className="brokers-clear-btn"
                aria-label="Clear all filters"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        <p className="brokers-count" aria-live="polite">
          {sorted.length} broker{sorted.length !== 1 ? 's' : ''}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="brokers-empty" role="status">
          <p className="brokers-empty-title">No brokers match your filters</p>
          <p className="brokers-empty-desc">
            Try changing location, city, or language, or clear all filters.
          </p>
          <button type="button" onClick={clearFilters} className="button button--outline">
            Clear filters
          </button>
        </div>
      ) : (
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
                      {agent.licenses.map((license, index) => (
                        <span key={license} className="broker-tile-license">
                          {formatLicense(license)}
                          {index < agent.licenses.length - 1 && (
                            <span className="broker-tile-license-separator"> · </span>
                          )}
                        </span>
                      ))}
                    </p>
                    {agent.languages.length > 0 && (
                      <p className="broker-tile-languages">
                        {agent.languages.map(formatLanguage).join(', ')}
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
      )}
    </div>
  );
}
