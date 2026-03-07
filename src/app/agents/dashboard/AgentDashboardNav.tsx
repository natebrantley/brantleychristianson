'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AgentDashboardNav() {
  const pathname = usePathname();
  const onLeads = pathname?.startsWith('/agents/dashboard/leads') ?? false;
  const onDashboard = pathname === '/agents/dashboard';

  return (
    <nav className="crm-nav" aria-label="Dashboard sections">
      <div className="crm-nav__inner">
        <Link
          href="/agents/dashboard"
          className={`crm-nav__link ${onDashboard ? 'crm-nav__link--current' : ''}`}
        >
          Dashboard
        </Link>
        <Link
          href="/agents/dashboard/leads"
          className={`crm-nav__link ${onLeads ? 'crm-nav__link--current' : ''}`}
        >
          Leads
        </Link>
      </div>
    </nav>
  );
}
