import { redirect } from 'next/navigation';

/**
 * Legacy URL: 2026 Portland Condo Guide moved to Premium.
 * Redirect so existing links and SEO consolidate on /premium/portland-condo-guide.
 */
export default function LegacyPortlandCondoGuidePage() {
  redirect('/premium/portland-condo-guide');
}
