import type { Metadata } from 'next';
import { ListingsSearchClient } from '@/components/listings/ListingsSearchClient';
import { SITE_NAME } from '@/config/site';

export const metadata: Metadata = {
  title: 'Search Listings',
  description: `Search active real estate listings. ${SITE_NAME}.`,
};

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
