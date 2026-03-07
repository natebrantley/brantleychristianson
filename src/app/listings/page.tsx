import type { Metadata } from 'next';
import { ListingsSearchClient } from '@/components/listings/ListingsSearchClient';
import { buildPageMetadata } from '@/config/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Search Listings',
  description:
    'Search active real estate listings in Oregon and Washington. Portland metro, SW Washington, coast. Filter by city, price, beds. BCRE.',
  path: '/listings',
  ogImageAlt: 'Search listings – BCRE',
});

export default function ListingsPage() {
  return (
    <main className="listings-page">
      <header className="listings-page__header">
        <h1 className="listings-page__title">Search Listings</h1>
        <p className="listings-page__lead">Browse active listings. Use filters to narrow your search.</p>
      </header>
      <ListingsSearchClient />
    </main>
  );
}
