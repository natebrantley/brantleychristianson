'use client';

/**
 * Recent activity timeline for a lead: created, last login, site activity, profile updated.
 * Uses existing lead data only (no lead_activities table).
 */

export type LeadRecentActivityData = {
  created_at?: string | null;
  updated_at?: string | null;
  last_login?: string | null;
  property_views?: number | null;
  property_inquiries?: number | null;
  clerk_id?: string | null;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(iso);
  } catch {
    return '—';
  }
}

type ActivityItem = { label: string; date: string; sortKey: number };

export function LeadRecentActivity({ lead }: { lead: LeadRecentActivityData }) {
  const items: ActivityItem[] = [];

  if (lead.created_at) {
    items.push({
      label: 'Lead created',
      date: formatDate(lead.created_at),
      sortKey: new Date(lead.created_at).getTime(),
    });
  }

  if (lead.clerk_id && lead.last_login) {
    items.push({
      label: 'Last signed in',
      date: formatRelative(lead.last_login),
      sortKey: new Date(lead.last_login).getTime(),
    });
  }

  const views = lead.property_views ?? 0;
  const inquiries = lead.property_inquiries ?? 0;
  if (views > 0 || inquiries > 0) {
    const parts = [];
    if (views > 0) parts.push(`${views} listing${views !== 1 ? 's' : ''} viewed`);
    if (inquiries > 0) parts.push(`${inquiries} inquiry${inquiries !== 1 ? 'ies' : ''}`);
    items.push({
      label: parts.join(', '),
      date: 'Site activity',
      sortKey: 0,
    });
  }

  if (lead.updated_at && lead.updated_at !== lead.created_at) {
    items.push({
      label: 'Profile updated',
      date: formatRelative(lead.updated_at),
      sortKey: new Date(lead.updated_at).getTime(),
    });
  }

  items.sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));
  const limited = items.slice(0, 10);

  if (limited.length === 0) {
    return (
      <section className="lead-detail__section" aria-labelledby="recent-activity-heading">
        <h2 id="recent-activity-heading" className="lead-detail__section-title">
          Recent activity
        </h2>
        <p className="lead-recent-activity__empty">No activity yet.</p>
      </section>
    );
  }

  return (
    <section className="lead-detail__section" aria-labelledby="recent-activity-heading">
      <h2 id="recent-activity-heading" className="lead-detail__section-title">
        Recent activity
      </h2>
      <ul className="lead-recent-activity">
        {limited.map((item, i) => (
          <li key={i} className="lead-recent-activity__item">
            <span className="lead-recent-activity__label">{item.label}</span>
            <span className="lead-recent-activity__date">{item.date}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
