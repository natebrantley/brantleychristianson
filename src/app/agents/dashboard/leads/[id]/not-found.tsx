import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { Button } from '@/components/Button';
import { assetPaths } from '@/config/theme';

/**
 * Shown when a lead detail URL is invalid or the lead is not viewable (e.g. wrong id or assigned to another agent).
 * Keeps agents on the dashboard instead of the generic "This page has moved" message.
 */
export default function LeadNotFound() {
  return (
    <main className="dashboard-page agent-dashboard">
      <Hero
        title="Lead not found"
        lead="This lead may have been removed or assigned to another agent. You can return to your leads list to continue."
        variant="short"
        imageSrc={`${assetPaths.stock}/table.jpeg`}
        imageAlt="Leads"
        priority={false}
      >
        <Button href="/agents/dashboard/leads" variant="white">
          Back to leads
        </Button>
        <Button href="/agents/dashboard" variant="outline">
          Dashboard
        </Button>
      </Hero>
    </main>
  );
}
