/**
 * Lead Pulse: warmth indicator based on activity, login, and saved favorites/searches.
 * warm = recent (7–14 days), medium = 30 days, cold = older or none.
 */

const WARM_DAYS = 14;
const MEDIUM_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type LeadPulseLevel = 'warm' | 'medium' | 'cold';

export type LeadPulseInput = {
  last_login?: string | null;
  updated_at?: string | null;
  property_views?: number | null;
  property_inquiries?: number | null;
  created_at?: string | null;
  clerk_id?: string | null;
};

export type LeadPulseOptions = {
  lastFavoriteAt?: string | null;
  lastSavedSearchAt?: string | null;
};

function daysAgo(iso: string | null | undefined): number | null {
  if (!iso) return null;
  try {
    const ms = Date.now() - new Date(iso).getTime();
    return ms / MS_PER_DAY;
  } catch {
    return null;
  }
}

export function getLeadPulse(
  lead: LeadPulseInput,
  options?: LeadPulseOptions
): LeadPulseLevel {
  const now = Date.now();
  let latestActivityDays: number | null = null;

  const consider = (iso: string | null | undefined) => {
    const d = daysAgo(iso);
    if (d != null && d >= 0) {
      if (latestActivityDays == null || d < latestActivityDays) {
        latestActivityDays = d;
      }
    }
  };

  consider(lead.last_login);
  consider(lead.updated_at);
  consider(lead.created_at);
  if (options?.lastFavoriteAt) consider(options.lastFavoriteAt);
  if (options?.lastSavedSearchAt) consider(options.lastSavedSearchAt);

  // If they have recent property views/inquiries we don't have a timestamp per event,
  // so we only use updated_at/last_login/favorites/saved_searches. Optionally treat
  // created_at as "activity" for brand-new leads (within WARM_DAYS) so they show warm.
  if (latestActivityDays == null && lead.created_at) {
    const createdDays = daysAgo(lead.created_at);
    if (createdDays != null && createdDays >= 0 && createdDays <= WARM_DAYS) {
      latestActivityDays = createdDays;
    }
  }

  if (latestActivityDays == null) return 'cold';
  if (latestActivityDays <= WARM_DAYS) return 'warm';
  if (latestActivityDays <= MEDIUM_DAYS) return 'medium';
  return 'cold';
}

export function getLeadPulseLabel(level: LeadPulseLevel): string {
  switch (level) {
    case 'warm':
      return 'Active recently';
    case 'medium':
      return 'Some activity in last 30 days';
    case 'cold':
      return 'No recent activity';
    default:
      return 'No recent activity';
  }
}
