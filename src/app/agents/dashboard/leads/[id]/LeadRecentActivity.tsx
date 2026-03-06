'use client';

/**
 * Recent activity timeline for a lead: created, last login, site activity, profile updated.
 * Uses existing lead data only (no lead_activities table). Simplified leads with no activity fields show "No activity yet."
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

/** Accepts any object; reads optional activity fields. Safe to pass simplified lead (no activity = empty list). */
export function LeadRecentActivity({ lead }: { lead: Partial<LeadRecentActivityData> | Record<string, unknown> }) {
  const l = lead as Partial<LeadRecentActivityData>;
  const items: ActivityItem[] = [];

  if (l.created_at) {
    items.push({
      label: 'Lead created',
      date: formatDate(l.created_at),
      sortKey: new Date(l.created_at).getTime(),
    });
  }

  if (l.clerk_id && l.last_login) {
    items.push({
      label: 'Last signed in',
      date: formatRelative(l.last_login),
      sortKey: new Date(l.last_login).getTime(),
    });
  }

  const views = l.property_views ?? 0;
  const inquiries = l.property_inquiries ?? 0;
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

  if (l.updated_at && l.updated_at !== l.created_at) {
    items.push({
      label: 'Profile updated',
      date: formatRelative(l.updated_at),
      sortKey: new Date(l.updated_at).getTime(),
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
          <li key={`${item.label}-${item.date}-${i}`} className="lead-recent-activity__item">
            <span className="lead-recent-activity__label">{item.label}</span>
            <span className="lead-recent-activity__date">{item.date}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
